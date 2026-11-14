//! Quizhub: browse a remote catalog (`manifest.json`) and download selected quizzes and notes
//! into the working directory. Provenance of downloaded files is kept in `quizhub-lock.json` in
//! the app config directory, keyed by working directory, so local edits are never overwritten.

use serde::{Deserialize, Serialize};
use sha2::{Digest, Sha256};
use std::{
    collections::{BTreeMap, HashMap},
    fs,
    path::{Path, PathBuf},
    sync::Mutex,
    time::{Duration, SystemTime, UNIX_EPOCH},
};
use tauri::{AppHandle, Manager, State};

use crate::{
    app_data_commands::run_blocking,
    fs_utils::{
        atomic_write, configured_directory, knowledge_base_directory, normalize_stored_path,
        resolve_knowledge_path, resolve_quiz_path,
    },
    settings::{read_settings, Settings},
};

pub(crate) const DEFAULT_BASE_URL: &str = "https://cyborgoat.github.io/quizhub/";
const SUPPORTED_SCHEMA_VERSION: u32 = 1;
const LOCK_FILE: &str = "quizhub-lock.json";
const LOCK_VERSION: u32 = 1;
const MAX_ITEM_BYTES: u64 = 5 * 1024 * 1024;
const MAX_MANIFEST_BYTES: usize = 10 * 1024 * 1024;
const REQUEST_TIMEOUT: Duration = Duration::from_secs(30);

// ---------------------------------------------------------------------------
// Base URL

pub(crate) fn normalize_base_url(raw: &str) -> Result<String, String> {
    let mut url = reqwest::Url::parse(raw.trim())
        .map_err(|_| "Quizhub URL must be a valid http(s) URL.".to_string())?;
    if !matches!(url.scheme(), "http" | "https") || url.host_str().is_none() {
        return Err("Quizhub URL must be a valid http(s) URL.".to_string());
    }
    url.set_query(None);
    url.set_fragment(None);
    let mut value = url.to_string();
    if !value.ends_with('/') {
        value.push('/');
    }
    Ok(value)
}

pub(crate) fn effective_base_url(settings: &Settings) -> String {
    settings
        .quizhub_base_url
        .clone()
        .unwrap_or_else(|| DEFAULT_BASE_URL.to_string())
}

/// Resolves a manifest-relative path against the base URL, refusing anything that escapes it.
fn resolve_remote_url(base_url: &str, relative: &str) -> Result<reqwest::Url, String> {
    if relative.is_empty()
        || relative.starts_with('/')
        || relative.contains('\\')
        || relative.contains("://")
        || relative
            .split('/')
            .any(|segment| segment == ".." || segment == ".")
    {
        return Err(format!("Refusing unsafe remote path \"{relative}\"."));
    }
    let base = reqwest::Url::parse(base_url).map_err(|error| error.to_string())?;
    let url = base
        .join(relative)
        .map_err(|error| format!("Invalid remote path \"{relative}\": {error}"))?;
    if !url.as_str().starts_with(base.as_str()) {
        return Err(format!(
            "Refusing remote path outside the hub: \"{relative}\"."
        ));
    }
    Ok(url)
}

// ---------------------------------------------------------------------------
// Manifest (schemaVersion 1). Unknown fields are ignored.

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
struct Manifest {
    schema_version: u32,
    #[serde(default)]
    generated_at: Option<String>,
    #[serde(default)]
    categories: Vec<ManifestCategory>,
    #[serde(default)]
    items: Vec<ManifestItem>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
struct ManifestCategory {
    id: String,
    title: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
struct ManifestItem {
    kind: String,
    id: String,
    category: String,
    title: String,
    #[serde(default)]
    tags: Vec<String>,
    path: String,
    sha256: String,
    size: u64,
    #[serde(default)]
    updated: Option<String>,
}

fn parse_manifest(bytes: &[u8]) -> Result<Manifest, String> {
    let manifest: Manifest = serde_json::from_slice(bytes)
        .map_err(|error| format!("The quizhub manifest is invalid: {error}"))?;
    if manifest.schema_version > SUPPORTED_SCHEMA_VERSION {
        return Err(format!(
            "The quizhub manifest uses schema version {}, but this version of Quizzy supports up to {}. Update Quizzy to sync.",
            manifest.schema_version, SUPPORTED_SCHEMA_VERSION
        ));
    }
    Ok(manifest)
}

// ---------------------------------------------------------------------------
// Item kinds and local file names

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub(crate) enum HubKind {
    Quiz,
    Note,
}

impl HubKind {
    fn parse(value: &str) -> Option<Self> {
        match value {
            "quiz" => Some(Self::Quiz),
            "note" => Some(Self::Note),
            _ => None,
        }
    }

    fn as_str(self) -> &'static str {
        match self {
            Self::Quiz => "quiz",
            Self::Note => "note",
        }
    }

    fn extension(self) -> &'static str {
        match self {
            Self::Quiz => "json",
            Self::Note => "md",
        }
    }
}

fn is_safe_id(id: &str) -> bool {
    !id.is_empty()
        && id.len() <= 128
        && !id.starts_with('.')
        && id
            .chars()
            .all(|c| c.is_ascii_alphanumeric() || c == '-' || c == '_' || c == '.')
}

fn local_file_name(kind: HubKind, id: &str) -> Result<String, String> {
    if !is_safe_id(id) {
        return Err(format!("Refusing unsafe item id \"{id}\"."));
    }
    Ok(format!("{id}.{}", kind.extension()))
}

fn lock_key(kind: HubKind, id: &str) -> String {
    format!("{}/{id}", kind.as_str())
}

struct LocalDirs {
    quizzes: PathBuf,
    notes: PathBuf,
}

impl LocalDirs {
    fn from_app(app: &AppHandle) -> Result<Self, String> {
        Ok(Self {
            quizzes: configured_directory(app)?,
            notes: knowledge_base_directory(app)?,
        })
    }

    fn path_for(&self, kind: HubKind, file_name: &str) -> Result<PathBuf, String> {
        match kind {
            HubKind::Quiz => resolve_quiz_path(&self.quizzes, file_name),
            HubKind::Note => resolve_knowledge_path(&self.notes, file_name),
        }
    }
}

// ---------------------------------------------------------------------------
// Lock file

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
struct LockEntry {
    kind: HubKind,
    id: String,
    category: String,
    title: String,
    file_name: String,
    sha256: String,
    #[serde(default)]
    remote_updated: Option<String>,
    installed_at: u64,
    base_url: String,
}

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
struct HubLock {
    version: u32,
    /// Working directory -> (`<kind>/<id>` -> entry).
    #[serde(default)]
    workspaces: BTreeMap<String, BTreeMap<String, LockEntry>>,
}

impl Default for HubLock {
    fn default() -> Self {
        Self {
            version: LOCK_VERSION,
            workspaces: BTreeMap::new(),
        }
    }
}

fn lock_path(app: &AppHandle) -> Result<PathBuf, String> {
    let directory = app
        .path()
        .app_config_dir()
        .map_err(|error| format!("Unable to locate the app configuration directory: {error}"))?;
    fs::create_dir_all(&directory)
        .map_err(|error| format!("Unable to create the app configuration directory: {error}"))?;
    Ok(directory.join(LOCK_FILE))
}

fn read_lock_file(path: &Path) -> Result<HubLock, String> {
    if !path.exists() {
        return Ok(HubLock::default());
    }
    let contents = fs::read_to_string(path)
        .map_err(|error| format!("Unable to read the quizhub lock file: {error}"))?;
    let lock: HubLock = serde_json::from_str(&contents)
        .map_err(|error| format!("The quizhub lock file is invalid: {error}"))?;
    if lock.version != LOCK_VERSION {
        return Err(format!(
            "Unsupported quizhub lock file version {}.",
            lock.version
        ));
    }
    Ok(lock)
}

fn write_lock_file(path: &Path, lock: &HubLock) -> Result<(), String> {
    let contents = serde_json::to_vec_pretty(lock)
        .map_err(|error| format!("Unable to serialize the quizhub lock file: {error}"))?;
    atomic_write(path, &contents, true)
}

fn workspace_key(app: &AppHandle) -> Result<String, String> {
    let directory = configured_directory(app)?;
    let canonical = directory
        .canonicalize()
        .map_err(|error| format!("Unable to resolve the working directory: {error}"))?;
    Ok(normalize_stored_path(canonical))
}

// ---------------------------------------------------------------------------
// Hashing and item state

fn sha256_hex(bytes: &[u8]) -> String {
    Sha256::digest(bytes)
        .iter()
        .map(|byte| format!("{byte:02x}"))
        .collect()
}

fn local_sha256(path: &Path) -> Option<String> {
    fs::read(path).ok().map(|bytes| sha256_hex(&bytes))
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize)]
#[serde(rename_all = "camelCase")]
pub(crate) enum HubItemState {
    /// Not downloaded; no local file with that name.
    Available,
    /// A local file with the same name exists that Quizzy did not download from quizhub.
    NameTaken,
    /// Downloaded and identical to the remote version.
    Installed,
    /// Downloaded, unchanged locally, and the remote version is newer.
    UpdateAvailable,
    /// Downloaded, then edited locally. Never overwritten without an explicit request.
    ModifiedLocally,
    /// Downloaded, but no longer published by the hub.
    RemovedRemotely,
}

/// Pure state calculation. Hashes are lowercase hex; `None` means absent.
fn compute_state(remote: Option<&str>, lock: Option<&str>, local: Option<&str>) -> HubItemState {
    match (remote, lock, local) {
        (None, _, _) => HubItemState::RemovedRemotely,
        (Some(_), None, None) => HubItemState::Available,
        (Some(_), None, Some(_)) => HubItemState::NameTaken,
        // Installed once, but the user deleted the file: offer it again.
        (Some(_), Some(_), None) => HubItemState::Available,
        (Some(remote), Some(lock), Some(local)) => {
            if local == remote {
                HubItemState::Installed
            } else if local != lock {
                HubItemState::ModifiedLocally
            } else {
                HubItemState::UpdateAvailable
            }
        }
    }
}

// ---------------------------------------------------------------------------
// HTTP and in-memory manifest cache

#[derive(Clone, Serialize, Deserialize)]
struct CachedManifest {
    base_url: String,
    etag: Option<String>,
    #[serde(default)]
    checked_at: u64,
    manifest: Manifest,
}

#[derive(Default)]
pub(crate) struct HubState {
    cache: Mutex<Option<CachedManifest>>,
}

fn http_client() -> Result<reqwest::Client, String> {
    reqwest::Client::builder()
        .timeout(REQUEST_TIMEOUT)
        .user_agent(concat!("Quizzy/", env!("CARGO_PKG_VERSION")))
        .build()
        .map_err(|error| format!("Unable to start the network client: {error}"))
}

async fn fetch_manifest(
    client: &reqwest::Client,
    state: &HubState,
    base_url: &str,
    force: bool,
) -> Result<Manifest, String> {
    let cached_etag = {
        let cache = state
            .cache
            .lock()
            .map_err(|_| "Hub cache is unavailable.")?;
        let entry = cache.as_ref().filter(|entry| entry.base_url == base_url);
        if !force {
            if let Some(entry) = entry {
                return Ok(entry.manifest.clone());
            }
        }
        entry.and_then(|entry| entry.etag.clone())
    };
    let url = resolve_remote_url(base_url, "manifest.json")?;
    let mut request = client.get(url.clone());
    if let Some(etag) = &cached_etag {
        request = request.header(reqwest::header::IF_NONE_MATCH, etag);
    }
    let response = request
        .send()
        .await
        .map_err(|error| format!("Unable to reach quizhub at {url}: {error}"))?;

    if response.status() == reqwest::StatusCode::NOT_MODIFIED {
        let mut cache = state
            .cache
            .lock()
            .map_err(|_| "Hub cache is unavailable.")?;
        if let Some(entry) = cache.as_mut().filter(|entry| entry.base_url == base_url) {
            entry.checked_at = now_secs();
            return Ok(entry.manifest.clone());
        }
    }
    if !response.status().is_success() {
        return Err(format!(
            "Quizhub returned HTTP {} for {url}.",
            response.status().as_u16()
        ));
    }
    let etag = response
        .headers()
        .get(reqwest::header::ETAG)
        .and_then(|value| value.to_str().ok())
        .map(str::to_string);
    let bytes = response
        .bytes()
        .await
        .map_err(|error| format!("Unable to download the quizhub manifest: {error}"))?;
    if bytes.len() > MAX_MANIFEST_BYTES {
        return Err("The quizhub manifest is too large.".to_string());
    }
    let manifest = parse_manifest(&bytes)?;
    let mut cache = state
        .cache
        .lock()
        .map_err(|_| "Hub cache is unavailable.")?;
    *cache = Some(CachedManifest {
        base_url: base_url.to_string(),
        etag,
        checked_at: now_secs(),
        manifest: manifest.clone(),
    });
    Ok(manifest)
}

async fn download_item(
    client: &reqwest::Client,
    base_url: &str,
    item: &ManifestItem,
) -> Result<Vec<u8>, String> {
    if item.size > MAX_ITEM_BYTES {
        return Err(format!(
            "{} is larger than the {MAX_ITEM_BYTES}-byte limit.",
            item.path
        ));
    }
    let url = resolve_remote_url(base_url, &item.path)?;
    let response = client
        .get(url.clone())
        .send()
        .await
        .map_err(|error| format!("Unable to download {url}: {error}"))?;
    if !response.status().is_success() {
        return Err(format!(
            "Quizhub returned HTTP {} for {url}.",
            response.status().as_u16()
        ));
    }
    let bytes = response
        .bytes()
        .await
        .map_err(|error| format!("Unable to download {url}: {error}"))?;
    verify_download(item, &bytes)?;
    Ok(bytes.to_vec())
}

fn verify_download(item: &ManifestItem, bytes: &[u8]) -> Result<(), String> {
    if bytes.len() as u64 != item.size {
        return Err(format!(
            "{}: expected {} bytes but received {}.",
            item.path,
            item.size,
            bytes.len()
        ));
    }
    if sha256_hex(bytes) != item.sha256.to_ascii_lowercase() {
        return Err(format!(
            "{}: checksum does not match the manifest.",
            item.path
        ));
    }
    Ok(())
}

// ---------------------------------------------------------------------------
// Catalog building (pure, testable against a directory)

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub(crate) struct HubCategory {
    id: String,
    title: String,
    quiz_count: u32,
    note_count: u32,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub(crate) struct HubItem {
    kind: HubKind,
    id: String,
    category: String,
    title: String,
    tags: Vec<String>,
    size: u64,
    #[serde(skip_serializing_if = "Option::is_none")]
    updated: Option<String>,
    file_name: String,
    state: HubItemState,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub(crate) struct HubCatalog {
    base_url: String,
    checked_at: u64,
    #[serde(skip_serializing_if = "Option::is_none")]
    generated_at: Option<String>,
    categories: Vec<HubCategory>,
    items: Vec<HubItem>,
    /// Manifest entries Quizzy could not use (unknown kind, unsafe id).
    skipped: Vec<String>,
}

fn build_catalog(
    base_url: &str,
    manifest: &Manifest,
    lock: &BTreeMap<String, LockEntry>,
    dirs: &LocalDirs,
) -> HubCatalog {
    let mut items = Vec::new();
    let mut skipped = Vec::new();
    let mut seen = std::collections::HashSet::new();
    let mut counts: HashMap<&str, (u32, u32)> = HashMap::new();

    for entry in &manifest.items {
        let Some(kind) = HubKind::parse(&entry.kind) else {
            skipped.push(format!("{} (unknown kind \"{}\")", entry.id, entry.kind));
            continue;
        };
        let Ok(file_name) = local_file_name(kind, &entry.id) else {
            skipped.push(format!("{} (unsafe id)", entry.id));
            continue;
        };
        let key = lock_key(kind, &entry.id);
        if !seen.insert(key.clone()) {
            skipped.push(format!("{} (duplicate id)", entry.id));
            continue;
        }
        let local = dirs
            .path_for(kind, &file_name)
            .ok()
            .and_then(|path| local_sha256(&path));
        let state = compute_state(
            Some(&entry.sha256.to_ascii_lowercase()),
            lock.get(&key).map(|locked| locked.sha256.as_str()),
            local.as_deref(),
        );
        let count = counts.entry(entry.category.as_str()).or_default();
        match kind {
            HubKind::Quiz => count.0 += 1,
            HubKind::Note => count.1 += 1,
        }
        items.push(HubItem {
            kind,
            id: entry.id.clone(),
            category: entry.category.clone(),
            title: entry.title.clone(),
            tags: entry.tags.clone(),
            size: entry.size,
            updated: entry.updated.clone(),
            file_name,
            state,
        });
    }

    // Downloaded items the hub no longer publishes, as long as the local file still exists.
    for (key, locked) in lock {
        if seen.contains(key) {
            continue;
        }
        let exists = dirs
            .path_for(locked.kind, &locked.file_name)
            .map(|path| path.is_file())
            .unwrap_or(false);
        if !exists {
            continue;
        }
        items.push(HubItem {
            kind: locked.kind,
            id: locked.id.clone(),
            category: locked.category.clone(),
            title: locked.title.clone(),
            tags: Vec::new(),
            size: 0,
            updated: locked.remote_updated.clone(),
            file_name: locked.file_name.clone(),
            state: HubItemState::RemovedRemotely,
        });
    }

    let categories = manifest
        .categories
        .iter()
        .map(|category| {
            let (quiz_count, note_count) = counts
                .get(category.id.as_str())
                .copied()
                .unwrap_or_default();
            HubCategory {
                id: category.id.clone(),
                title: category.title.clone(),
                quiz_count,
                note_count,
            }
        })
        .collect();

    HubCatalog {
        base_url: base_url.to_string(),
        checked_at: 0,
        generated_at: manifest.generated_at.clone(),
        categories,
        items,
        skipped,
    }
}

// ---------------------------------------------------------------------------
// Commands

fn now_secs() -> u64 {
    SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .map(|duration| duration.as_secs())
        .unwrap_or(0)
}

struct LocalContext {
    base_url: String,
    lock_path: PathBuf,
    workspace: String,
    dirs: LocalDirs,
}

fn local_context(app: &AppHandle) -> Result<LocalContext, String> {
    let settings = read_settings(app)?;
    Ok(LocalContext {
        base_url: effective_base_url(&settings),
        lock_path: lock_path(app)?,
        workspace: workspace_key(app)?,
        dirs: LocalDirs::from_app(app)?,
    })
}

// The persisted manifest is only a browsing cache; local installation state is rebuilt
// from the workspace on every catalog read. A source change uses a separate cache file.
fn manifest_cache_path(app: &AppHandle, base_url: &str) -> Result<PathBuf, String> {
    Ok(lock_path(app)?.with_file_name(format!(
        "quizhub-manifest-{}.json",
        sha256_hex(base_url.as_bytes())
    )))
}

fn restore_manifest_cache(app: &AppHandle, state: &HubState, base_url: &str) {
    let Ok(mut cache) = state.cache.lock() else {
        return;
    };
    if cache
        .as_ref()
        .is_some_and(|entry| entry.base_url == base_url)
    {
        return;
    }
    let restored = manifest_cache_path(app, base_url)
        .ok()
        .and_then(|path| fs::read(path).ok())
        .and_then(|bytes| serde_json::from_slice::<CachedManifest>(&bytes).ok())
        .filter(|entry| {
            entry.base_url == base_url && entry.manifest.schema_version <= SUPPORTED_SCHEMA_VERSION
        });
    *cache = restored;
}

fn persist_manifest_cache(app: &AppHandle, state: &HubState, base_url: &str) {
    let Ok(cache) = state.cache.lock() else {
        return;
    };
    if let Some(entry) = cache.as_ref().filter(|entry| entry.base_url == base_url) {
        if let (Ok(path), Ok(bytes)) = (
            manifest_cache_path(app, base_url),
            serde_json::to_vec(entry),
        ) {
            // Cache persistence must never prevent browsing or downloading.
            let _ = atomic_write(&path, &bytes, true);
        }
    }
}

#[tauri::command]
pub(crate) async fn hub_fetch_catalog(
    app: AppHandle,
    state: State<'_, HubState>,
    force: Option<bool>,
) -> Result<HubCatalog, String> {
    let ctx = {
        let app = app.clone();
        run_blocking(move || local_context(&app)).await?
    };
    restore_manifest_cache(&app, &state, &ctx.base_url);
    let client = http_client()?;
    let manifest = fetch_manifest(&client, &state, &ctx.base_url, force.unwrap_or(false)).await?;
    persist_manifest_cache(&app, &state, &ctx.base_url);
    let checked_at = state
        .cache
        .lock()
        .ok()
        .and_then(|cache| cache.as_ref().map(|entry| entry.checked_at))
        .unwrap_or(0);
    run_blocking(move || {
        let lock = read_lock_file(&ctx.lock_path)?;
        let entries = lock
            .workspaces
            .get(&ctx.workspace)
            .cloned()
            .unwrap_or_default();
        let mut catalog = build_catalog(&ctx.base_url, &manifest, &entries, &ctx.dirs);
        catalog.checked_at = checked_at;
        Ok(catalog)
    })
    .await
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub(crate) struct HubInstalledItem {
    kind: HubKind,
    id: String,
    file_name: String,
    category: String,
}

/// Lists downloaded items for the current working directory without touching the network,
/// so the library can mark quizhub content.
#[tauri::command]
pub(crate) async fn hub_list_installed(app: AppHandle) -> Result<Vec<HubInstalledItem>, String> {
    run_blocking(move || {
        let path = lock_path(&app)?;
        let workspace = match workspace_key(&app) {
            Ok(value) => value,
            Err(_) => return Ok(Vec::new()),
        };
        let lock = read_lock_file(&path)?;
        Ok(lock
            .workspaces
            .get(&workspace)
            .map(|entries| {
                entries
                    .values()
                    .map(|entry| HubInstalledItem {
                        kind: entry.kind,
                        id: entry.id.clone(),
                        file_name: entry.file_name.clone(),
                        category: entry.category.clone(),
                    })
                    .collect()
            })
            .unwrap_or_default())
    })
    .await
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub(crate) struct HubItemRef {
    kind: HubKind,
    id: String,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub(crate) struct HubItemOutcome {
    kind: HubKind,
    id: String,
    title: String,
    /// `added`, `updated`, `unchanged`, `skipped` or `failed`.
    result: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    detail: Option<String>,
}

#[derive(Debug, Default, Serialize)]
#[serde(rename_all = "camelCase")]
pub(crate) struct HubDownloadReport {
    added: u32,
    updated: u32,
    unchanged: u32,
    skipped: u32,
    failed: u32,
    outcomes: Vec<HubItemOutcome>,
}

impl HubDownloadReport {
    fn push(&mut self, item: &ManifestItem, kind: HubKind, result: &str, detail: Option<String>) {
        match result {
            "added" => self.added += 1,
            "updated" => self.updated += 1,
            "unchanged" => self.unchanged += 1,
            "skipped" => self.skipped += 1,
            _ => self.failed += 1,
        }
        self.outcomes.push(HubItemOutcome {
            kind,
            id: item.id.clone(),
            title: item.title.clone(),
            result: result.to_string(),
            detail,
        });
    }
}

/// Downloads the requested items. With `force`, files edited locally or local files with the same
/// name are replaced; otherwise they are skipped and reported.
#[tauri::command]
pub(crate) async fn hub_download(
    app: AppHandle,
    state: State<'_, HubState>,
    items: Vec<HubItemRef>,
    force: Option<bool>,
) -> Result<HubDownloadReport, String> {
    let force = force.unwrap_or(false);
    let ctx = {
        let app = app.clone();
        run_blocking(move || local_context(&app)).await?
    };
    restore_manifest_cache(&app, &state, &ctx.base_url);
    let client = http_client()?;
    let manifest = fetch_manifest(&client, &state, &ctx.base_url, false).await?;
    let lock = {
        let path = ctx.lock_path.clone();
        run_blocking(move || read_lock_file(&path)).await?
    };
    let workspace_entries = lock
        .workspaces
        .get(&ctx.workspace)
        .cloned()
        .unwrap_or_default();

    let mut report = HubDownloadReport::default();
    let mut new_entries: Vec<(String, Option<LockEntry>)> = Vec::new();

    for requested in &items {
        let Some(item) = manifest.items.iter().find(|candidate| {
            candidate.id == requested.id && HubKind::parse(&candidate.kind) == Some(requested.kind)
        }) else {
            report.outcomes.push(HubItemOutcome {
                kind: requested.kind,
                id: requested.id.clone(),
                title: requested.id.clone(),
                result: "failed".to_string(),
                detail: Some("No longer published by quizhub.".to_string()),
            });
            report.failed += 1;
            continue;
        };
        let kind = requested.kind;
        let file_name = match local_file_name(kind, &item.id) {
            Ok(value) => value,
            Err(error) => {
                report.push(item, kind, "failed", Some(error));
                continue;
            }
        };
        let path = match ctx.dirs.path_for(kind, &file_name) {
            Ok(value) => value,
            Err(error) => {
                report.push(item, kind, "failed", Some(error));
                continue;
            }
        };
        let key = lock_key(kind, &item.id);
        let remote_sha = item.sha256.to_ascii_lowercase();
        let lock_entry = workspace_entries.get(&key);
        let local = local_sha256(&path);
        let current = compute_state(
            Some(&remote_sha),
            lock_entry.map(|entry| entry.sha256.as_str()),
            local.as_deref(),
        );

        let lock_record = LockEntry {
            kind,
            id: item.id.clone(),
            category: item.category.clone(),
            title: item.title.clone(),
            file_name: file_name.clone(),
            sha256: remote_sha.clone(),
            remote_updated: item.updated.clone(),
            installed_at: now_secs(),
            base_url: ctx.base_url.clone(),
        };

        match current {
            HubItemState::Installed => {
                // Also adopts a local file that already matches the hub byte for byte.
                if lock_entry.map(|entry| entry.sha256.as_str()) != Some(remote_sha.as_str()) {
                    new_entries.push((key, Some(lock_record)));
                }
                report.push(item, kind, "unchanged", None);
                continue;
            }
            HubItemState::ModifiedLocally if !force => {
                report.push(
                    item,
                    kind,
                    "skipped",
                    Some("Edited locally; your version was kept.".to_string()),
                );
                continue;
            }
            HubItemState::NameTaken if !force => {
                report.push(
                    item,
                    kind,
                    "skipped",
                    Some(format!("A local file named {file_name} already exists.")),
                );
                continue;
            }
            _ => {}
        }

        match download_item(&client, &ctx.base_url, item).await {
            Ok(bytes) => {
                let target = path.clone();
                let overwrite = local.is_some();
                let written = run_blocking(move || atomic_write(&target, &bytes, overwrite)).await;
                match written {
                    Ok(()) => {
                        new_entries.push((key, Some(lock_record)));
                        let result = if local.is_some() { "updated" } else { "added" };
                        report.push(item, kind, result, None);
                    }
                    Err(error) => report.push(item, kind, "failed", Some(error)),
                }
            }
            Err(error) => report.push(item, kind, "failed", Some(error)),
        }
    }

    if !new_entries.is_empty() {
        let lock_path = ctx.lock_path.clone();
        let workspace = ctx.workspace.clone();
        run_blocking(move || update_lock(&lock_path, &workspace, new_entries)).await?;
    }

    if report.added + report.updated > 0 {
        // Refresh goal titles and the mistake index for changed quizzes. Non-fatal.
        let app = app.clone();
        let _ = run_blocking(move || crate::data_sync::synchronize_app_data(&app)).await;
    }

    Ok(report)
}

fn update_lock(
    path: &Path,
    workspace: &str,
    changes: Vec<(String, Option<LockEntry>)>,
) -> Result<(), String> {
    // Re-read so concurrent changes made since the download started are not lost.
    let mut lock = read_lock_file(path)?;
    let entries = lock.workspaces.entry(workspace.to_string()).or_default();
    for (key, entry) in changes {
        match entry {
            Some(entry) => {
                entries.insert(key, entry);
            }
            None => {
                entries.remove(&key);
            }
        }
    }
    if entries.is_empty() {
        lock.workspaces.remove(workspace);
    }
    write_lock_file(path, &lock)
}

/// Deletes a downloaded item. Refuses when the file was edited locally unless `force` is set.
/// With `keep_file`, only forgets the quizhub link and leaves the file as a local file.
#[tauri::command]
pub(crate) async fn hub_remove(
    app: AppHandle,
    item: HubItemRef,
    keep_file: Option<bool>,
    force: Option<bool>,
) -> Result<(), String> {
    run_blocking(move || {
        let ctx = local_context(&app)?;
        let lock = read_lock_file(&ctx.lock_path)?;
        let key = lock_key(item.kind, &item.id);
        let Some(entry) = lock
            .workspaces
            .get(&ctx.workspace)
            .and_then(|entries| entries.get(&key))
            .cloned()
        else {
            return Err("This item was not downloaded from quizhub.".to_string());
        };
        if !keep_file.unwrap_or(false) {
            let path = ctx.dirs.path_for(entry.kind, &entry.file_name)?;
            if let Some(local) = local_sha256(&path) {
                if local != entry.sha256 && !force.unwrap_or(false) {
                    return Err(format!(
                        "{} was edited locally. Remove it anyway, or keep it as a local file.",
                        entry.file_name
                    ));
                }
                fs::remove_file(&path)
                    .map_err(|error| format!("Unable to delete {}: {error}", entry.file_name))?;
            }
        }
        update_lock(&ctx.lock_path, &ctx.workspace, vec![(key, None)])
    })
    .await
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn persisted_manifest_is_usable_without_network() {
        let root = test_dir("manifest-cache");
        let path = root.join("manifest.json");
        let base = "https://quizhub.invalid/";
        let cached = CachedManifest {
            base_url: base.to_string(),
            etag: Some("test-etag".to_string()),
            checked_at: 123,
            manifest: Manifest {
                schema_version: 1,
                generated_at: None,
                categories: vec![],
                items: vec![item("quiz", "q", b"quiz")],
            },
        };
        atomic_write(&path, &serde_json::to_vec(&cached).unwrap(), true).unwrap();
        let restored: CachedManifest = serde_json::from_slice(&fs::read(&path).unwrap()).unwrap();
        assert_eq!(restored.checked_at, 123);
        assert_eq!(restored.etag.as_deref(), Some("test-etag"));
        let state = HubState {
            cache: Mutex::new(Some(restored)),
        };
        tauri::async_runtime::block_on(async {
            // .invalid cannot be contacted: success requires the cache-only path.
            let manifest = fetch_manifest(&http_client().unwrap(), &state, base, false)
                .await
                .unwrap();
            assert_eq!(manifest.items[0].id, "q");
        });
        let _ = fs::remove_dir_all(root);
    }

    fn test_dir(name: &str) -> PathBuf {
        let path = std::env::temp_dir().join(format!("quizzy-hub-{name}-{}", std::process::id()));
        let _ = fs::remove_dir_all(&path);
        fs::create_dir_all(path.join("knowledge-base")).unwrap();
        path
    }

    fn dirs(root: &Path) -> LocalDirs {
        LocalDirs {
            quizzes: root.to_path_buf(),
            notes: root.join("knowledge-base"),
        }
    }

    fn item(kind: &str, id: &str, contents: &[u8]) -> ManifestItem {
        ManifestItem {
            kind: kind.to_string(),
            id: id.to_string(),
            category: "ai".to_string(),
            title: format!("Title {id}"),
            tags: vec![],
            path: format!("ai/{id}"),
            sha256: sha256_hex(contents),
            size: contents.len() as u64,
            updated: None,
        }
    }

    fn lock_entry(kind: HubKind, id: &str, contents: &[u8]) -> LockEntry {
        LockEntry {
            kind,
            id: id.to_string(),
            category: "ai".to_string(),
            title: id.to_string(),
            file_name: local_file_name(kind, id).unwrap(),
            sha256: sha256_hex(contents),
            remote_updated: None,
            installed_at: 0,
            base_url: DEFAULT_BASE_URL.to_string(),
        }
    }

    #[test]
    fn state_covers_every_case() {
        use HubItemState::*;
        assert_eq!(compute_state(Some("a"), None, None), Available);
        assert_eq!(compute_state(Some("a"), None, Some("x")), NameTaken);
        assert_eq!(compute_state(Some("a"), Some("a"), Some("a")), Installed);
        assert_eq!(
            compute_state(Some("b"), Some("a"), Some("a")),
            UpdateAvailable
        );
        assert_eq!(
            compute_state(Some("b"), Some("a"), Some("x")),
            ModifiedLocally
        );
        assert_eq!(
            compute_state(Some("a"), Some("a"), Some("x")),
            ModifiedLocally
        );
        assert_eq!(compute_state(Some("b"), Some("a"), Some("b")), Installed);
        assert_eq!(compute_state(Some("a"), Some("a"), None), Available);
        assert_eq!(compute_state(None, Some("a"), Some("a")), RemovedRemotely);
    }

    #[test]
    fn rejects_newer_schema_and_ignores_unknown_fields() {
        assert!(parse_manifest(br#"{"schemaVersion":2,"items":[]}"#).is_err());
        let manifest = parse_manifest(
            br#"{"schemaVersion":1,"extra":true,"categories":[{"id":"ai","title":"AI","feed":"ai/atom.xml"}],
            "items":[{"kind":"quiz","id":"q","category":"ai","title":"Q","path":"ai/q.json","sha256":"ab","size":2,"new":1}]}"#,
        )
        .unwrap();
        assert_eq!(manifest.items.len(), 1);
    }

    #[test]
    fn verifies_size_and_checksum() {
        let entry = item("quiz", "q", b"{}");
        assert!(verify_download(&entry, b"{}").is_ok());
        assert!(verify_download(&entry, b"{ }").is_err());
        assert!(verify_download(&entry, b"[]").is_err());
    }

    #[test]
    fn rejects_unsafe_ids_and_paths() {
        assert!(local_file_name(HubKind::Quiz, "../evil").is_err());
        assert!(local_file_name(HubKind::Note, ".hidden").is_err());
        assert!(local_file_name(HubKind::Quiz, "a/b").is_err());
        assert_eq!(
            local_file_name(HubKind::Note, "ai-note").unwrap(),
            "ai-note.md"
        );
        let base = "https://example.com/hub/";
        assert!(resolve_remote_url(base, "../x.json").is_err());
        assert!(resolve_remote_url(base, "/x.json").is_err());
        assert!(resolve_remote_url(base, "https://evil.com/x.json").is_err());
        assert!(resolve_remote_url(base, "//evil.com/x.json").is_err());
        assert_eq!(
            resolve_remote_url(base, "ai/q.json").unwrap().as_str(),
            "https://example.com/hub/ai/q.json"
        );
    }

    #[test]
    fn normalizes_base_url() {
        assert_eq!(
            normalize_base_url("http://localhost:8080").unwrap(),
            "http://localhost:8080/"
        );
        assert_eq!(
            normalize_base_url("https://x.io/hub?a=1").unwrap(),
            "https://x.io/hub/"
        );
        assert!(normalize_base_url("file:///etc").is_err());
        assert!(normalize_base_url("not a url").is_err());
    }

    #[test]
    fn catalog_reflects_local_files_and_lock() {
        let root = test_dir("catalog");
        let dirs = dirs(&root);
        fs::write(root.join("fresh.json"), b"v1").unwrap();
        fs::write(root.join("stale.json"), b"v1").unwrap();
        fs::write(root.join("edited.json"), b"mine").unwrap();
        fs::write(root.join("mine.json"), b"local").unwrap();
        fs::write(root.join("knowledge-base/gone.md"), b"n").unwrap();

        let manifest = Manifest {
            schema_version: 1,
            generated_at: None,
            categories: vec![ManifestCategory {
                id: "ai".to_string(),
                title: "AI".to_string(),
            }],
            items: vec![
                item("quiz", "new", b"v1"),
                item("quiz", "fresh", b"v1"),
                item("quiz", "stale", b"v2"),
                item("quiz", "edited", b"v2"),
                item("quiz", "mine", b"remote"),
                item("video", "odd", b"x"),
            ],
        };
        let mut lock = BTreeMap::new();
        for (id, contents) in [("fresh", b"v1"), ("stale", b"v1"), ("edited", b"v1")] {
            lock.insert(
                lock_key(HubKind::Quiz, id),
                lock_entry(HubKind::Quiz, id, contents),
            );
        }
        lock.insert(
            lock_key(HubKind::Note, "gone"),
            lock_entry(HubKind::Note, "gone", b"n"),
        );

        let catalog = build_catalog(DEFAULT_BASE_URL, &manifest, &lock, &dirs);
        let state = |id: &str| catalog.items.iter().find(|i| i.id == id).unwrap().state;
        assert_eq!(state("new"), HubItemState::Available);
        assert_eq!(state("fresh"), HubItemState::Installed);
        assert_eq!(state("stale"), HubItemState::UpdateAvailable);
        assert_eq!(state("edited"), HubItemState::ModifiedLocally);
        assert_eq!(state("mine"), HubItemState::NameTaken);
        assert_eq!(state("gone"), HubItemState::RemovedRemotely);
        assert_eq!(catalog.skipped.len(), 1);
        assert_eq!(catalog.categories[0].quiz_count, 5);
        let _ = fs::remove_dir_all(root);
    }

    /// End-to-end against a served quizhub `dist/`:
    /// `QUIZHUB_TEST_URL=http://localhost:8080/ cargo test hub_sync -- --ignored`
    #[test]
    #[ignore]
    fn live_hub_download_flow() {
        let Ok(base) = std::env::var("QUIZHUB_TEST_URL") else {
            return;
        };
        let base = normalize_base_url(&base).unwrap();
        let root = test_dir("live");
        let dirs = dirs(&root);
        let state = HubState::default();
        tauri::async_runtime::block_on(async {
            let client = http_client().unwrap();
            let manifest = fetch_manifest(&client, &state, &base, false).await.unwrap();
            assert!(!manifest.items.is_empty());
            // An explicit refresh exercises the ETag path when the server supports it.
            fetch_manifest(&client, &state, &base, true).await.unwrap();

            let mut lock = BTreeMap::new();
            for item in &manifest.items {
                let kind = HubKind::parse(&item.kind).unwrap();
                let bytes = download_item(&client, &base, item).await.unwrap();
                let file_name = local_file_name(kind, &item.id).unwrap();
                atomic_write(&dirs.path_for(kind, &file_name).unwrap(), &bytes, false).unwrap();
                let mut entry = lock_entry(kind, &item.id, &bytes);
                entry.file_name = file_name;
                lock.insert(lock_key(kind, &item.id), entry);
            }
            let catalog = build_catalog(&base, &manifest, &lock, &dirs);
            assert!(catalog
                .items
                .iter()
                .all(|i| i.state == HubItemState::Installed));

            let first = &catalog.items[0];
            let path = dirs.path_for(first.kind, &first.file_name).unwrap();
            fs::write(&path, b"edited").unwrap();
            let catalog = build_catalog(&base, &manifest, &lock, &dirs);
            assert_eq!(catalog.items[0].state, HubItemState::ModifiedLocally);
        });
        let _ = fs::remove_dir_all(root);
    }

    #[test]
    fn lock_round_trip_and_removal() {
        let root = test_dir("lock");
        let path = root.join(LOCK_FILE);
        let entry = lock_entry(HubKind::Quiz, "q", b"x");
        update_lock(
            &path,
            "/w",
            vec![("quiz/q".to_string(), Some(entry.clone()))],
        )
        .unwrap();
        let lock = read_lock_file(&path).unwrap();
        assert_eq!(lock.workspaces["/w"]["quiz/q"], entry);
        update_lock(&path, "/w", vec![("quiz/q".to_string(), None)]).unwrap();
        assert!(read_lock_file(&path).unwrap().workspaces.is_empty());
        let _ = fs::remove_dir_all(root);
    }
}
