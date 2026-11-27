//! QuizHub: discover editions, browse their manifests, and download selected quizzes and notes
//! into the working directory. Provenance of downloaded files is kept in `quizhub-lock.json` in
//! the app config directory, keyed by working directory, so local edits are never overwritten.

#[path = "hub_install.rs"]
mod hub_install;
use hub_install::{
    apply_changes, read_target, rename_candidate, rename_changes, suggested_name, FileChange,
};

use serde::{de::DeserializeOwned, Deserialize, Serialize};
use std::{
    collections::{BTreeMap, HashMap},
    fs,
    path::{Path, PathBuf},
    sync::{Arc, Mutex as MapMutex},
    time::{Duration, SystemTime, UNIX_EPOCH},
};
use tauri::{async_runtime::Mutex, AppHandle, Manager, State};

use crate::{
    app_data_commands::run_blocking,
    fs_utils::{
        atomic_write, canonical_directory, directory_from_settings, knowledge_base_for,
        normalize_stored_path, resolve_knowledge_path, resolve_quiz_path, sha256_hex,
    },
    settings::{read_settings, Settings},
};

/// Injected at build time from `QUIZHUB_DEFAULT_BASE_URL` (env or repo-root `.env`).
pub(crate) const DEFAULT_BASE_URL: &str = env!("QUIZHUB_DEFAULT_BASE_URL");
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
    let directory = base.join(".").map_err(|error| error.to_string())?;
    if !url.as_str().starts_with(directory.as_str()) {
        return Err(format!(
            "Refusing remote path outside the hub: \"{relative}\"."
        ));
    }
    Ok(url)
}

// ---------------------------------------------------------------------------
// Language discovery and manifests

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
struct Locales {
    default_locale: String,
    locales: Vec<HubLocale>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
struct HubLocale {
    id: String,
    name: String,
    feed: String,
    manifest: String,
}

fn parse_locales(bytes: &[u8]) -> Result<Locales, String> {
    let locales: Locales = serde_json::from_slice(bytes)
        .map_err(|error| format!("The QuizHub language catalog is invalid: {error}"))?;
    let mut ids = std::collections::HashSet::new();
    if locales
        .locales
        .iter()
        .any(|locale| locale.id.is_empty() || !ids.insert(&locale.id))
        || !ids.contains(&locales.default_locale)
    {
        return Err(
            "The QuizHub language catalog has invalid edition IDs or a missing default."
                .to_string(),
        );
    }
    Ok(locales)
}

#[derive(Debug, Clone, Serialize, Deserialize)]
struct HubDomain {
    id: String,
    title: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
struct Manifest {
    schema_version: u32,
    #[serde(default)]
    generated_at: Option<String>,
    #[serde(default)]
    domains: Vec<HubDomain>,
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
    domain: String,
    feed: String,
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

#[derive(Clone)]
struct LocalDirs {
    quizzes: PathBuf,
    notes: PathBuf,
}

impl LocalDirs {
    fn new(quizzes: PathBuf) -> Result<Self, String> {
        let notes = knowledge_base_for(&quizzes)?;
        let canonical_notes = notes
            .canonicalize()
            .map_err(|error| format!("Unable to resolve the knowledge-base folder: {error}"))?;
        if canonical_notes.parent() != Some(quizzes.as_path()) {
            return Err(
                "The knowledge-base folder must be inside the QuizHub working directory."
                    .to_string(),
            );
        }
        Ok(Self {
            quizzes,
            notes: canonical_notes,
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
    #[serde(default)]
    locale: Option<String>,
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

/// Removes on-disk QuizHub HTTP catalog/manifest cache files. Returns how many files were deleted.
pub(crate) fn clear_disk_caches(app: &AppHandle) -> Result<usize, String> {
    let directory = app
        .path()
        .app_config_dir()
        .map_err(|error| format!("Unable to locate the app configuration directory: {error}"))?;
    if !directory.is_dir() {
        return Ok(0);
    }
    let mut removed = 0usize;
    let entries = fs::read_dir(&directory)
        .map_err(|error| format!("Unable to read the app configuration directory: {error}"))?;
    for entry in entries.filter_map(Result::ok) {
        let path = entry.path();
        let is_cache = path.is_file()
            && path
                .file_name()
                .and_then(|name| name.to_str())
                .is_some_and(|name| name.starts_with("quizhub-cache-") && name.ends_with(".json"));
        if is_cache {
            fs::remove_file(&path)
                .map_err(|error| format!("Unable to remove QuizHub cache {}: {error}", path.display()))?;
            removed += 1;
        }
    }
    Ok(removed)
}

/// Drops QuizHub install provenance for one working directory. Downloaded files are left alone.
pub(crate) fn clear_workspace_lock(app: &AppHandle, workspace: &str) -> Result<bool, String> {
    let path = lock_path(app)?;
    let mut lock = read_lock_file(&path)?;
    let removed = lock.workspaces.remove(workspace).is_some();
    if removed {
        if lock.workspaces.is_empty() {
            if path.exists() {
                fs::remove_file(&path).map_err(|error| {
                    format!("Unable to remove the quizhub lock file: {error}")
                })?;
            }
        } else {
            write_lock_file(&path, &lock)?;
        }
    }
    Ok(removed)
}

/// Removes the entire QuizHub install lock file.
pub(crate) fn clear_all_locks(app: &AppHandle) -> Result<bool, String> {
    let path = lock_path(app)?;
    if !path.exists() {
        return Ok(false);
    }
    fs::remove_file(&path)
        .map_err(|error| format!("Unable to remove the quizhub lock file: {error}"))?;
    Ok(true)
}

fn local_sha256(path: &Path) -> Option<String> {
    fs::read(path).ok().map(|bytes| sha256_hex(&bytes))
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize)]
#[serde(rename_all = "camelCase")]
pub(crate) enum HubItemState {
    Available,
    Installed,
    UpdateAvailable,
    RemovedRemotely,
}

// ---------------------------------------------------------------------------
// HTTP and in-memory manifest cache

#[derive(Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
struct CachedDocument<T> {
    url: String,
    etag: Option<String>,
    checked_at: u64,
    document: T,
}

type DocumentSlot<T> = Arc<Mutex<Option<CachedDocument<T>>>>;
type DocumentCache<T> = MapMutex<HashMap<String, DocumentSlot<T>>>;

#[derive(Default)]
pub(crate) struct HubState {
    locales: DocumentCache<Locales>,
    manifests: DocumentCache<Manifest>,
    mutations: Mutex<()>,
}

impl HubState {
    pub(crate) fn clear_document_caches(&self) -> Result<(), String> {
        self.locales
            .lock()
            .map_err(|_| "The QuizHub cache is unavailable.".to_string())?
            .clear();
        self.manifests
            .lock()
            .map_err(|_| "The QuizHub cache is unavailable.".to_string())?
            .clear();
        Ok(())
    }
}

fn http_client() -> Result<reqwest::Client, String> {
    reqwest::Client::builder()
        .timeout(REQUEST_TIMEOUT)
        .user_agent(concat!("Quizzy/", env!("CARGO_PKG_VERSION")))
        .build()
        .map_err(|error| format!("Unable to start the network client: {error}"))
}

fn cache_path(directory: &Path, url: &str) -> PathBuf {
    directory.join(format!("quizhub-cache-{}.json", sha256_hex(url.as_bytes())))
}

async fn fetch_document<T: Clone + DeserializeOwned + Serialize>(
    client: &reqwest::Client,
    cache: &DocumentCache<T>,
    directory: &Path,
    url: &reqwest::Url,
    force: bool,
    parse: fn(&[u8]) -> Result<T, String>,
) -> Result<(CachedDocument<T>, Option<String>), String> {
    let key = url.as_str();
    let slot = cache
        .lock()
        .map_err(|_| "The QuizHub cache is unavailable.")?
        .entry(key.to_string())
        .or_default()
        .clone();
    // An unrelated edition or source can load while this URL is refreshing.
    let mut slot = slot.lock().await;
    let path = cache_path(directory, key);
    let cached = slot.clone().or_else(|| {
        let bytes = fs::read(&path).ok()?;
        let entry: CachedDocument<T> = serde_json::from_slice(&bytes).ok()?;
        (entry.url == key).then_some(entry)
    });
    if let Some(entry) = &cached {
        *slot = Some(entry.clone());
        if !force {
            return Ok((entry.clone(), None));
        }
    }

    match request_document(client, url, cached.as_ref(), parse).await {
        Ok(entry) => {
            if let Ok(bytes) = serde_json::to_vec(&entry) {
                let _ = atomic_write(&path, &bytes, true);
            }
            *slot = Some(entry.clone());
            Ok((entry, None))
        }
        Err(error) => match cached {
            Some(entry) => Ok((entry, Some(error))),
            None => Err(error),
        },
    }
}

async fn request_document<T: Clone>(
    client: &reqwest::Client,
    url: &reqwest::Url,
    cached: Option<&CachedDocument<T>>,
    parse: fn(&[u8]) -> Result<T, String>,
) -> Result<CachedDocument<T>, String> {
    let mut request = client.get(url.clone());
    if let Some(etag) = cached.and_then(|entry| entry.etag.as_ref()) {
        request = request.header(reqwest::header::IF_NONE_MATCH, etag);
    }
    let response = request
        .send()
        .await
        .map_err(|error| format!("Unable to reach QuizHub at {url}: {error}"))?;
    if response.status() == reqwest::StatusCode::NOT_MODIFIED {
        let mut entry = cached
            .cloned()
            .ok_or("QuizHub returned an empty refresh without a saved copy.")?;
        entry.checked_at = now_secs();
        return Ok(entry);
    }
    if !response.status().is_success() {
        return Err(format!(
            "QuizHub returned HTTP {} for {url}.",
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
        .map_err(|error| format!("Unable to download {url}: {error}"))?;
    if bytes.len() > MAX_MANIFEST_BYTES {
        return Err("The QuizHub catalog document is too large.".to_string());
    }
    Ok(CachedDocument {
        url: url.to_string(),
        etag,
        checked_at: now_secs(),
        document: parse(&bytes)?,
    })
}

async fn download_item(
    client: &reqwest::Client,
    manifest_url: &str,
    item: &ManifestItem,
) -> Result<Vec<u8>, String> {
    if item.size > MAX_ITEM_BYTES {
        return Err(format!(
            "{} is larger than the {MAX_ITEM_BYTES}-byte limit.",
            item.path
        ));
    }
    let url = resolve_remote_url(manifest_url, &item.path)?;
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
    domain: String,
    feed: Option<String>,
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
    default_locale: String,
    locales: Vec<HubLocale>,
    active_locale: String,
    manifest_url: Option<String>,
    edition_error: Option<String>,
    refresh_error: Option<String>,
    #[serde(flatten)]
    contents: HubContents,
}

#[derive(Debug, Default, Serialize)]
#[serde(rename_all = "camelCase")]
struct HubContents {
    domains: Vec<HubDomain>,
    #[serde(skip_serializing_if = "Option::is_none")]
    generated_at: Option<String>,
    categories: Vec<HubCategory>,
    items: Vec<HubItem>,
    /// Manifest entries Quizzy could not use (unknown kind, unsafe id).
    skipped: Vec<String>,
}

fn build_catalog(
    manifest_url: &str,
    manifest: &Manifest,
    lock: &BTreeMap<String, LockEntry>,
    dirs: &LocalDirs,
) -> HubContents {
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
        let state = match lock.get(&key) {
            Some(installed)
                if dirs
                    .path_for(kind, &file_name)
                    .is_ok_and(|path| path.is_file()) =>
            {
                if installed.sha256.eq_ignore_ascii_case(&entry.sha256) {
                    HubItemState::Installed
                } else {
                    HubItemState::UpdateAvailable
                }
            }
            _ => HubItemState::Available,
        };
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
                domain: category.domain.clone(),
                feed: resolve_remote_url(manifest_url, &category.feed)
                    .ok()
                    .map(|url| url.to_string()),
                quiz_count,
                note_count,
            }
        })
        .collect();

    HubContents {
        domains: manifest.domains.clone(),
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

#[derive(Clone, Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub(crate) struct HubScope {
    working_directory: String,
    base_url: String,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub(crate) struct HubSelection {
    scope: HubScope,
    locale: String,
    manifest_url: String,
}

impl HubScope {
    fn validate(&self, settings: &Settings, workspace: &str) -> Result<(), String> {
        if self.working_directory != workspace || self.base_url != effective_base_url(settings) {
            return Err(
                "The QuizHub library or source changed. Reopen the catalog and try again."
                    .to_string(),
            );
        }
        Ok(())
    }
}

#[derive(Clone)]
struct LocalContext {
    base_url: String,
    lock_path: PathBuf,
    workspace: String,
    dirs: LocalDirs,
}

impl LocalContext {
    fn new(app: &AppHandle, scope: &HubScope) -> Result<Self, String> {
        let settings = read_settings(app)?;
        let directory = canonical_directory(&directory_from_settings(&settings)?)?;
        let workspace = normalize_stored_path(directory.clone());
        scope.validate(&settings, &workspace)?;
        Ok(Self {
            base_url: effective_base_url(&settings),
            lock_path: lock_path(app)?,
            workspace,
            dirs: LocalDirs::new(directory)?,
        })
    }

    fn cache_directory(&self) -> &Path {
        self.lock_path
            .parent()
            .expect("lock path has a config directory")
    }

    fn entries(&self, locale: Option<&str>) -> Result<BTreeMap<String, LockEntry>, String> {
        // Locale-scoped lookups match edition only. Do not require `base_url` to match the
        // current setting so remove/catalog still see installs after a QuizHub URL change.
        Ok(read_lock_file(&self.lock_path)?
            .workspaces
            .remove(&self.workspace)
            .unwrap_or_default()
            .into_iter()
            .filter(|(_, entry)| locale.is_none_or(|id| entry.locale.as_deref() == Some(id)))
            .collect())
    }
}

async fn capture_context(app: &AppHandle, scope: &HubScope) -> Result<LocalContext, String> {
    let app = app.clone();
    let scope = scope.clone();
    run_blocking(move || LocalContext::new(&app, &scope)).await
}

async fn fetch_locales(
    client: &reqwest::Client,
    state: &HubState,
    ctx: &LocalContext,
    force: bool,
) -> Result<(CachedDocument<Locales>, Option<String>), String> {
    let url = resolve_remote_url(&ctx.base_url, "locales.json")?;
    fetch_document(
        client,
        &state.locales,
        ctx.cache_directory(),
        &url,
        force,
        parse_locales,
    )
    .await
}

async fn fetch_manifest(
    client: &reqwest::Client,
    state: &HubState,
    ctx: &LocalContext,
    url: &reqwest::Url,
    force: bool,
) -> Result<(CachedDocument<Manifest>, Option<String>), String> {
    fetch_document(
        client,
        &state.manifests,
        ctx.cache_directory(),
        url,
        force,
        parse_manifest,
    )
    .await
}

fn manifest_url(base_url: &str, locales: &Locales, locale: &str) -> Result<reqwest::Url, String> {
    let edition = locales
        .locales
        .iter()
        .find(|entry| entry.id == locale)
        .ok_or_else(|| {
            format!("The configured QuizHub edition {locale:?} is unavailable from this source.")
        })?;
    resolve_remote_url(base_url, &edition.manifest)
}

async fn selected_manifest(
    client: &reqwest::Client,
    state: &HubState,
    ctx: &LocalContext,
    selection: &HubSelection,
) -> Result<Manifest, String> {
    // Always revalidate: hub paths/ids can change between catalog browses, and a stale
    // disk cache would 404 on download (e.g. locale suffix renames).
    let (catalog, _) = fetch_locales(client, state, ctx, true).await?;
    let url = manifest_url(&ctx.base_url, &catalog.document, &selection.locale)?;
    if url.as_str() != selection.manifest_url {
        return Err("The QuizHub edition moved. Refresh the catalog and try again.".to_string());
    }
    Ok(fetch_manifest(client, state, ctx, &url, true)
        .await?
        .0
        .document)
}

/// Resolves a catalog item, accepting `{id}-{locale}` when hubs rename entries to add a locale suffix.
fn manifest_item<'a>(
    manifest: &'a Manifest,
    kind: HubKind,
    id: &str,
    locale: &str,
) -> Option<&'a ManifestItem> {
    let matches = |candidate: &&ManifestItem| {
        candidate.id == id && HubKind::parse(&candidate.kind) == Some(kind)
    };
    if let Some(item) = manifest.items.iter().find(matches) {
        return Some(item);
    }
    let suffix = format!("-{locale}");
    if id.ends_with(&suffix) || locale.is_empty() {
        return None;
    }
    let aliased = format!("{id}{suffix}");
    manifest.items.iter().find(|candidate| {
        candidate.id == aliased && HubKind::parse(&candidate.kind) == Some(kind)
    })
}

#[tauri::command]
pub(crate) async fn hub_fetch_catalog(
    app: AppHandle,
    state: State<'_, HubState>,
    scope: HubScope,
    locale: Option<String>,
    force: bool,
) -> Result<HubCatalog, String> {
    let ctx = run_blocking(move || LocalContext::new(&app, &scope)).await?;
    load_catalog(&http_client()?, &state, ctx, locale, force).await
}

async fn load_catalog(
    client: &reqwest::Client,
    state: &HubState,
    ctx: LocalContext,
    locale: Option<String>,
    force: bool,
) -> Result<HubCatalog, String> {
    let (cached, discovery_error) = fetch_locales(client, state, &ctx, force).await?;
    let discovery = cached.document;
    let base_url = ctx.base_url.clone();
    let active_locale = locale
        .filter(|id| discovery.locales.iter().any(|entry| entry.id == *id))
        .unwrap_or_else(|| discovery.default_locale.clone());
    let url = manifest_url(&ctx.base_url, &discovery, &active_locale);
    let (manifest_url, contents, edition_error, refresh_error, checked_at) = match url {
        Ok(url) => match fetch_manifest(client, state, &ctx, &url, force).await {
            Ok((cached_manifest, manifest_error)) => {
                let checked_at = cached.checked_at.min(cached_manifest.checked_at);
                let manifest_url = url.to_string();
                let contents = run_blocking({
                    let manifest_url = manifest_url.clone();
                    let locale = active_locale.clone();
                    move || {
                        Ok(build_catalog(
                            &manifest_url,
                            &cached_manifest.document,
                            &ctx.entries(Some(&locale))?,
                            &ctx.dirs,
                        ))
                    }
                })
                .await?;
                (
                    Some(manifest_url),
                    contents,
                    None,
                    discovery_error.or(manifest_error),
                    checked_at,
                )
            }
            Err(error) => (
                None,
                HubContents::default(),
                Some(error),
                None,
                cached.checked_at,
            ),
        },
        Err(error) => (
            None,
            HubContents::default(),
            Some(error),
            None,
            cached.checked_at,
        ),
    };
    Ok(HubCatalog {
        base_url,
        checked_at,
        default_locale: discovery.default_locale,
        locales: discovery.locales,
        active_locale,
        manifest_url,
        edition_error,
        refresh_error,
        contents,
    })
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
pub(crate) async fn hub_list_installed(
    app: AppHandle,
    scope: HubScope,
) -> Result<Vec<HubInstalledItem>, String> {
    run_blocking(move || {
        let ctx = LocalContext::new(&app, &scope)?;
        Ok(ctx
            .entries(None)?
            .into_values()
            .map(|entry| HubInstalledItem {
                kind: entry.kind,
                id: entry.id,
                file_name: entry.file_name,
                category: entry.category,
            })
            .collect())
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
    conflicts: Vec<HubConflict>,
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

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub(crate) struct HubConflict {
    kind: HubKind,
    id: String,
    title: String,
    file_name: String,
    suggested_name: Option<String>,
    existing_sha: String,
    remote_sha: String,
    message: Option<String>,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub(crate) struct HubResolution {
    item: HubItemRef,
    existing_sha: String,
    remote_sha: String,
    renamed_file_name: Option<String>,
}

#[tauri::command]
pub(crate) async fn hub_download(
    app: AppHandle,
    state: State<'_, HubState>,
    selection: HubSelection,
    items: Vec<HubItemRef>,
    resolution: Option<HubResolution>,
) -> Result<HubDownloadReport, String> {
    let _guard = state.mutations.lock().await;
    let ctx = capture_context(&app, &selection.scope).await?;
    let report = download_into(
        &http_client()?,
        &state,
        &ctx,
        &selection,
        &items,
        resolution.as_ref(),
    )
    .await?;
    if report.added + report.updated > 0 {
        // Refresh goal titles and the mistake index for the same library. Non-fatal.
        let _ = run_blocking(move || {
            crate::data_sync::synchronize_library(&app, Some(&ctx.dirs.quizzes))
        })
        .await;
    }
    Ok(report)
}

async fn download_into(
    client: &reqwest::Client,
    state: &HubState,
    ctx: &LocalContext,
    selection: &HubSelection,
    items: &[HubItemRef],
    resolution: Option<&HubResolution>,
) -> Result<HubDownloadReport, String> {
    let manifest = selected_manifest(client, state, ctx, selection).await?;
    let mut workspace_entries = ctx.entries(Some(&selection.locale))?;

    let mut report = HubDownloadReport::default();

    for requested in items {
        let Some(item) =
            manifest_item(&manifest, requested.kind, &requested.id, &selection.locale)
        else {
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
        let existing = match read_target(&path) {
            Ok(existing) => existing,
            Err(error) => {
                report.push(item, kind, "failed", Some(error));
                continue;
            }
        };
        let local = existing.as_deref().map(sha256_hex);

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
            locale: Some(selection.locale.clone()),
        };

        // Adopting matching bytes also repairs provenance after a successful write whose
        // lock update failed.
        if local.as_deref() == Some(&remote_sha) {
            if lock_entry.map(|entry| entry.sha256.as_str()) != Some(remote_sha.as_str()) {
                save_install(ctx, &mut workspace_entries, key, lock_record).await?;
            }
            report.push(item, kind, "unchanged", None);
            continue;
        }

        let conflict = existing
            .as_ref()
            .filter(|_| lock_entry.map(|entry| &entry.sha256) != local.as_ref());
        let approved = resolution.filter(|decision| {
            decision.item.kind == kind
                && decision.item.id == item.id
                && Some(&decision.existing_sha) == local.as_ref()
                && decision.remote_sha == remote_sha
        });
        if let Some(bytes) = conflict {
            if approved.is_none() {
                report.conflicts.push(HubConflict {
                    kind,
                    id: item.id.clone(),
                    title: item.title.clone(),
                    file_name,
                    suggested_name: rename_candidate(kind, bytes).then(|| suggested_name(&path)),
                    existing_sha: local.expect("existing bytes have a hash"),
                    remote_sha,
                    message: None,
                });
                continue;
            }
        }

        let bytes = match download_item(client, &selection.manifest_url, item).await {
            Ok(bytes) => bytes,
            Err(error) => {
                report.push(item, kind, "failed", Some(error));
                continue;
            }
        };
        let overwrite = existing.is_some();
        let rename = conflict.and_then(|_| approved?.renamed_file_name.as_deref());
        let review = rename.is_some();
        let transaction_context = ctx.clone();
        let transaction_path = path.clone();
        let transaction_key = key.clone();
        let transaction_record = lock_record.clone();
        let rename = rename.map(str::to_string);
        let result = run_blocking(move || {
            let ctx = &transaction_context;
            let lock_path = &ctx.lock_path;
            // Guard archive, favorite, and view-count edits through the rename transaction.
            let _registry_guard = if review {
                Some(
                    crate::quiz_archive::REGISTRY_WRITE_LOCK
                        .lock()
                        .map_err(|_| "The library registry is unavailable.")?,
                )
            } else {
                None
            };
            let mut changes =
                if let (Some(name), Some(original)) = (rename.as_deref(), existing.as_deref()) {
                    rename_changes(ctx, kind, &transaction_path, name, original)?
                } else {
                    Vec::new()
                };
            changes.push(FileChange {
                path: transaction_path,
                before: existing,
                after: bytes,
            });
            let mut lock = read_lock_file(lock_path)?;
            lock.workspaces
                .entry(ctx.workspace.clone())
                .or_default()
                .insert(transaction_key, transaction_record);
            changes.push(FileChange {
                path: lock_path.clone(),
                before: read_target(lock_path)?,
                after: serde_json::to_vec_pretty(&lock).map_err(|e| e.to_string())?,
            });
            apply_changes(&changes)
        })
        .await;
        match result {
            Ok(()) => {
                workspace_entries.insert(key, lock_record);
                report.push(
                    item,
                    kind,
                    if overwrite { "updated" } else { "added" },
                    None,
                );
            }
            Err(error) => {
                if let Ok(Some(current)) = read_target(&path) {
                    let current_sha = sha256_hex(&current);
                    if review || Some(&current_sha) != local.as_ref() {
                        report.conflicts.push(HubConflict {
                            kind,
                            id: item.id.clone(),
                            title: item.title.clone(),
                            file_name,
                            suggested_name: rename_candidate(kind, &current)
                                .then(|| suggested_name(&path)),
                            existing_sha: current_sha,
                            remote_sha,
                            message: Some(error),
                        });
                        continue;
                    }
                }
                report.push(item, kind, "failed", Some(error));
            }
        }
    }

    Ok(report)
}

async fn save_install(
    ctx: &LocalContext,
    entries: &mut BTreeMap<String, LockEntry>,
    key: String,
    entry: LockEntry,
) -> Result<(), String> {
    let lock_path = ctx.lock_path.clone();
    let workspace = ctx.workspace.clone();
    let change = (key.clone(), Some(entry.clone()));
    run_blocking(move || update_lock(&lock_path, &workspace, vec![change])).await?;
    entries.insert(key, entry);
    Ok(())
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

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub(crate) struct HubPreview {
    kind: HubKind,
    id: String,
    title: String,
    /// Verified remote file contents as UTF-8 text. Not written to disk.
    contents: String,
}

/// Prefers the local copy when this item was downloaded from quizhub; otherwise fetches remotely.
/// Does not install or modify local files.
#[tauri::command]
pub(crate) async fn hub_preview_item(
    app: AppHandle,
    state: State<'_, HubState>,
    selection: HubSelection,
    item: HubItemRef,
) -> Result<HubPreview, String> {
    let ctx = capture_context(&app, &selection.scope).await?;
    let local_preview = {
        let item = item.clone();
        let locale = selection.locale.clone();
        run_blocking(move || {
            let preview = read_local_hub_preview(&ctx, &item, &locale)?;
            Ok((ctx, preview))
        })
        .await?
    };
    let (ctx, preview) = local_preview;
    if let Some(preview) = preview {
        return Ok(preview);
    }

    let client = http_client()?;
    let manifest = selected_manifest(&client, &state, &ctx, &selection).await?;
    let Some(entry) = manifest_item(&manifest, item.kind, &item.id, &selection.locale) else {
        return Err("This item is no longer published by quizhub.".to_string());
    };
    let bytes = download_item(&client, &selection.manifest_url, entry).await?;
    let contents = String::from_utf8(bytes).map_err(|_| {
        format!(
            "{} is not valid UTF-8 text and cannot be previewed.",
            entry.path
        )
    })?;
    Ok(HubPreview {
        kind: item.kind,
        id: entry.id.clone(),
        title: entry.title.clone(),
        contents,
    })
}

/// Returns a preview from the installed local file when this workspace still tracks the item.
fn read_local_hub_preview(
    ctx: &LocalContext,
    item: &HubItemRef,
    locale: &str,
) -> Result<Option<HubPreview>, String> {
    let file_name = match local_file_name(item.kind, &item.id) {
        Ok(value) => value,
        Err(_) => return Ok(None),
    };
    let path = match ctx.dirs.path_for(item.kind, &file_name) {
        Ok(value) => value,
        Err(_) => return Ok(None),
    };
    if !path.is_file() {
        return Ok(None);
    }

    let entries = ctx.entries(Some(locale))?;
    let key = lock_key(item.kind, &item.id);
    let Some(entry) = entries.get(&key) else {
        // Local file exists but was not installed from quizhub (e.g. nameTaken).
        return Ok(None);
    };

    let contents = fs::read_to_string(&path).map_err(|error| {
        format!(
            "Unable to read the local copy of {}: {error}",
            entry.file_name
        )
    })?;
    Ok(Some(HubPreview {
        kind: entry.kind,
        id: entry.id.clone(),
        title: entry.title.clone(),
        contents,
    }))
}

/// Deletes a downloaded item. Refuses when the file was edited locally unless `force` is set.
/// With `keep_file`, only forgets the quizhub link and leaves the file as a local file.
#[tauri::command]
pub(crate) async fn hub_remove(
    app: AppHandle,
    state: State<'_, HubState>,
    selection: HubSelection,
    item: HubItemRef,
    keep_file: Option<bool>,
    force: Option<bool>,
) -> Result<(), String> {
    let _guard = state.mutations.lock().await;
    run_blocking(move || {
        let ctx = LocalContext::new(&app, &selection.scope)?;
        let key = lock_key(item.kind, &item.id);
        let entries = ctx.entries(Some(&selection.locale))?;
        let Some(entry) = entries.get(&key) else {
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
    fn persisted_manifests_are_isolated_by_url_and_usable_without_network() {
        let root = test_dir("manifest-cache");
        let base = "https://quizhub.invalid/";
        let cache = DocumentCache::default();
        for locale in ["en", "zh"] {
            let url = resolve_remote_url(base, &format!("{locale}/manifest.json")).unwrap();
            let cached = CachedDocument {
                url: url.to_string(),
                etag: Some(format!("etag-{locale}")),
                checked_at: 123,
                document: Manifest {
                    schema_version: 1,
                    generated_at: None,
                    domains: vec![],
                    categories: vec![],
                    items: vec![item("quiz", locale, b"quiz")],
                },
            };
            atomic_write(
                &cache_path(&root, url.as_str()),
                &serde_json::to_vec(&cached).unwrap(),
                true,
            )
            .unwrap();
        }
        tauri::async_runtime::block_on(async {
            for locale in ["en", "zh", "en"] {
                let url = resolve_remote_url(base, &format!("{locale}/manifest.json")).unwrap();
                let (cached, error) = fetch_document(
                    &http_client().unwrap(),
                    &cache,
                    &root,
                    &url,
                    false,
                    parse_manifest,
                )
                .await
                .unwrap();
                assert!(error.is_none());
                assert_eq!(cached.checked_at, 123);
                assert_eq!(cached.etag, Some(format!("etag-{locale}")));
                assert_eq!(cached.document.items[0].id, locale);
            }
        });
        let _ = fs::remove_dir_all(root);
    }

    #[test]
    fn uses_discovered_manifest_path_and_reports_missing_editions() {
        let locales = parse_locales(br#"{
            "defaultLocale":"en",
            "locales":[{"id":"en","name":"English","feed":"feeds/atom.xml","manifest":"published/en/catalog.json"}]
        }"#).unwrap();
        let base = "https://example.com/quizhub/";
        let manifest = manifest_url(base, &locales, &locales.default_locale).unwrap();
        assert_eq!(
            manifest.as_str(),
            "https://example.com/quizhub/published/en/catalog.json"
        );
        assert_eq!(
            resolve_remote_url(manifest.as_str(), "ai/q.json")
                .unwrap()
                .as_str(),
            "https://example.com/quizhub/published/en/ai/q.json"
        );
        assert!(manifest_url(base, &locales, "zh")
            .unwrap_err()
            .contains("unavailable"));
        assert!(resolve_remote_url(manifest.as_str(), "%2e%2e/q.json").is_err());
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
            locale: Some("en".to_string()),
        }
    }

    #[test]
    fn rejects_newer_schema_and_ignores_unknown_fields() {
        assert!(parse_manifest(br#"{"schemaVersion":2,"items":[]}"#).is_err());
        let manifest = parse_manifest(
            br#"{"schemaVersion":1,"extra":true,"domains":[{"id":"tech","title":"Technology"}],"categories":[{"id":"ai","title":"AI","domain":"tech","feed":"ai/atom.xml"}],
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
    fn resolves_locale_suffixed_manifest_aliases() {
        let manifest = Manifest {
            schema_version: 1,
            generated_at: None,
            domains: vec![],
            categories: vec![],
            items: vec![item("note", "ai-gradient-descent-zh", b"note")],
        };
        assert_eq!(
            manifest_item(&manifest, HubKind::Note, "ai-gradient-descent-zh", "zh")
                .unwrap()
                .id,
            "ai-gradient-descent-zh"
        );
        assert_eq!(
            manifest_item(&manifest, HubKind::Note, "ai-gradient-descent", "zh")
                .unwrap()
                .id,
            "ai-gradient-descent-zh"
        );
        assert!(manifest_item(&manifest, HubKind::Note, "ai-gradient-descent", "en").is_none());
        assert!(manifest_item(&manifest, HubKind::Quiz, "ai-gradient-descent", "zh").is_none());
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
            domains: vec![HubDomain {
                id: "tech".to_string(),
                title: "Technology".to_string(),
            }],
            categories: vec![ManifestCategory {
                id: "ai".to_string(),
                title: "AI".to_string(),
                domain: "tech".to_string(),
                feed: "ai/atom.xml".to_string(),
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
        assert_eq!(state("edited"), HubItemState::UpdateAvailable);
        assert_eq!(state("mine"), HubItemState::Available);
        assert_eq!(state("gone"), HubItemState::RemovedRemotely);
        assert_eq!(catalog.skipped.len(), 1);
        assert_eq!(catalog.categories[0].quiz_count, 5);
        let _ = fs::remove_dir_all(root);
    }

    /// Exercises the native catalog and download operations against a served QuizHub build.
    /// QUIZHUB_TEST_URL=http://localhost:8080/ cargo test live_hub_download_flow -- --ignored
    #[test]
    #[ignore]
    fn live_hub_download_flow() {
        let base = normalize_base_url(&std::env::var("QUIZHUB_TEST_URL").unwrap()).unwrap();
        let root = test_dir("live");
        let state = HubState::default();
        let context = || {
            let path = root.join("library");
            fs::create_dir_all(&path).unwrap();
            let path = path.canonicalize().unwrap();
            LocalContext {
                base_url: base.clone(),
                lock_path: root.join(LOCK_FILE),
                workspace: normalize_stored_path(path.clone()),
                dirs: LocalDirs::new(path).unwrap(),
            }
        };

        tauri::async_runtime::block_on(async {
            let client = http_client().unwrap();
            let catalog = load_catalog(&client, &state, context(), None, false)
                .await
                .unwrap();
            assert_eq!(catalog.active_locale, "en");
            assert!(catalog.locales.iter().any(|locale| locale.id == "zh"));
            let mut paths = Vec::new();
            for (locale, domain, category) in [
                ("en", "Computer Science", "Artificial Intelligence"),
                ("zh", "计算机科学", "人工智能"),
            ] {
                let quiz = HubItemRef {
                    kind: HubKind::Quiz,
                    id: format!("ai-ml-basics-{locale}"),
                };
                let ctx = context();
                let catalog =
                    load_catalog(&client, &state, context(), Some(locale.to_string()), true)
                        .await
                        .unwrap();
                assert!(catalog.refresh_error.is_none());
                assert_eq!(catalog.active_locale, locale);
                assert!(catalog
                    .contents
                    .domains
                    .iter()
                    .any(|entry| entry.title == domain));
                let ai = catalog
                    .contents
                    .categories
                    .iter()
                    .find(|entry| entry.id == "ai")
                    .unwrap();
                assert_eq!(ai.title, category);
                assert_eq!(ai.domain, "computer-science");
                assert!(ai
                    .feed
                    .as_deref()
                    .unwrap()
                    .ends_with(&format!("/{locale}/ai/atom.xml")));
                let selection = HubSelection {
                    scope: HubScope {
                        working_directory: ctx.workspace.clone(),
                        base_url: base.clone(),
                    },
                    locale: locale.to_string(),
                    manifest_url: catalog.manifest_url.unwrap(),
                };
                let note = catalog
                    .contents
                    .items
                    .iter()
                    .find(|item| item.kind == HubKind::Note)
                    .unwrap();
                let refs = [
                    quiz.clone(),
                    HubItemRef {
                        kind: note.kind,
                        id: note.id.clone(),
                    },
                ];
                let manifest = selected_manifest(&client, &state, &ctx, &selection)
                    .await
                    .unwrap();
                for reference in &refs {
                    let entry = manifest
                        .items
                        .iter()
                        .find(|entry| entry.id == reference.id)
                        .unwrap();
                    let preview = download_item(&client, &selection.manifest_url, entry)
                        .await
                        .unwrap();
                    assert!(!preview.is_empty());
                }
                let report = download_into(&client, &state, &ctx, &selection, &refs, None)
                    .await
                    .unwrap();
                assert_eq!((report.added, report.failed), (2, 0));
                let path = ctx
                    .dirs
                    .path_for(quiz.kind, &format!("{}.json", quiz.id))
                    .unwrap();
                assert_eq!(ctx.entries(Some(locale)).unwrap().len(), 2);
                assert!(read_local_hub_preview(&ctx, &quiz, locale)
                    .unwrap()
                    .is_some());
                if locale == "en" {
                    fs::write(&path, b"edited").unwrap();
                    let report = download_into(&client, &state, &ctx, &selection, &refs, None)
                        .await
                        .unwrap();
                    let conflict = &report.conflicts[0];
                    assert!(conflict.suggested_name.is_none());
                    let mut decision = HubResolution {
                        item: quiz.clone(),
                        existing_sha: conflict.existing_sha.clone(),
                        remote_sha: conflict.remote_sha.clone(),
                        renamed_file_name: None,
                    };
                    fs::write(&path, b"edited again").unwrap();
                    let stale = download_into(
                        &client,
                        &state,
                        &ctx,
                        &selection,
                        &refs[..1],
                        Some(&decision),
                    )
                    .await
                    .unwrap();
                    assert_eq!(fs::read(&path).unwrap(), b"edited again");
                    decision.existing_sha = stale.conflicts[0].existing_sha.clone();
                    let overwritten = download_into(
                        &client,
                        &state,
                        &ctx,
                        &selection,
                        &refs[..1],
                        Some(&decision),
                    )
                    .await
                    .unwrap();
                    assert_eq!(overwritten.updated, 1);
                    assert_eq!(local_sha256(&path).unwrap(), decision.remote_sha);
                    fs::write(&path, b"edited").unwrap();
                } else {
                    assert_eq!(ctx.entries(None).unwrap().len(), 4);
                    let note = read_local_hub_preview(&ctx, &refs[1], locale)
                        .unwrap()
                        .unwrap();
                    assert!(note.contents.contains(&format!("quizId: {}", quiz.id)));
                    let key = lock_key(quiz.kind, &quiz.id);
                    let mut previous = ctx.entries(Some(locale)).unwrap().remove(&key).unwrap();
                    fs::write(&path, b"older translation").unwrap();
                    previous.sha256 = sha256_hex(b"older translation");
                    update_lock(&ctx.lock_path, &ctx.workspace, vec![(key, Some(previous))])
                        .unwrap();
                    let report = download_into(&client, &state, &ctx, &selection, &refs, None)
                        .await
                        .unwrap();
                    assert_eq!(report.updated, 1);
                }
                paths.push(path);
            }
            assert_eq!(fs::read(&paths[0]).unwrap(), b"edited");
            assert_ne!(fs::read(&paths[1]).unwrap(), b"edited");
            let restarted = HubState::default();
            let catalog = load_catalog(&client, &restarted, context(), Some("zh".into()), false)
                .await
                .unwrap();
            assert_eq!(catalog.active_locale, "zh");
            assert!(catalog
                .contents
                .items
                .iter()
                .any(|item| item.id == "ai-ml-basics-zh" && item.state == HubItemState::Installed));
            let fallback = load_catalog(&client, &state, context(), Some("xx".into()), false)
                .await
                .unwrap();
            assert_eq!(fallback.active_locale, "en");
        });
        let _ = fs::remove_dir_all(root);
    }

    #[test]
    fn rename_preserves_quiz_history_and_note_links_and_rolls_back_on_failure() {
        use crate::{goals_storage, mistake_index};
        let root = test_dir("rename");
        let config = root.join("config");
        fs::create_dir_all(&config).unwrap();
        let ctx = LocalContext {
            workspace: root.to_string_lossy().into_owned(),
            base_url: DEFAULT_BASE_URL.into(),
            lock_path: config.join(LOCK_FILE),
            dirs: LocalDirs::new(root.canonicalize().unwrap()).unwrap(),
        };
        let original = ctx.dirs.quizzes.join("sample.json");
        let renamed = ctx.dirs.quizzes.join("sample-local.json");
        let quiz = br#"{"id":"sample","title":"Local quiz","questions":[{"id":"question","type":"true_false","prompt":"Prompt","answer":true}]}"#;
        fs::write(&original, quiz).unwrap();
        let note = ctx.dirs.notes.join("note.md");
        let note_bytes = b"---\nid: note\ntitle: Note\ncreatedAt: 1\nupdatedAt: 2\nlinkedQuizQuestions:\n  - quizId: sample\n    questionId: question\n---\nquizId: sample\n";
        fs::write(&note, note_bytes).unwrap();
        let goals = goals_storage::library_goals_root(&config, &ctx.workspace);
        let goal: goals_storage::GoalMeta = serde_json::from_value(serde_json::json!({
            "id": "g1", "quizId": "sample", "quizTitle": "Local quiz",
            "description": "", "createdAt": "2026-01-01",
        }))
        .unwrap();
        goals_storage::upsert_goal(&goals, goal).unwrap();
        let attempt = serde_json::from_value(serde_json::json!({
            "id":"a1","takenAt":"2026-01-01","score":0,"total":1,"percentage":0,
            "questionResults":[{"questionId":"question","prompt":"Prompt","correct":false}],
        }))
        .unwrap();
        goals_storage::save_goal_attempt(&goals, "g1".into(), attempt).unwrap();
        let registry = config.join("quiz-archive.json");
        fs::write(
            &registry,
            serde_json::to_vec(&serde_json::json!({
                "directories": { &ctx.workspace: ["sample"] },
                "favorites": { &ctx.workspace: ["sample"] },
                "knowledgeViews": { &ctx.workspace: { "note": 7 } },
            }))
            .unwrap(),
        )
        .unwrap();
        let mut changes =
            rename_changes(&ctx, HubKind::Quiz, &original, "sample-local.json", quiz).unwrap();
        let failed = FileChange {
            path: root.join("missing/remote.json"),
            before: None,
            after: quiz.to_vec(),
        };
        changes.push(failed);
        assert!(apply_changes(&changes).is_err());
        assert!(!renamed.exists());
        assert_eq!(fs::read(&note).unwrap(), note_bytes);
        assert_eq!(
            goals_storage::list_goals(&goals).unwrap()[0].meta.quiz_id,
            "sample"
        );

        changes.pop();
        let remote = String::from_utf8_lossy(quiz)
            .replace("Local quiz", "Remote quiz")
            .into_bytes();
        changes.push(FileChange::replace(
            original.clone(),
            quiz.to_vec(),
            remote.clone(),
        ));
        apply_changes(&changes).unwrap();
        assert_eq!(fs::read(&original).unwrap(), remote);
        assert_eq!(
            hub_install::content_id(HubKind::Quiz, &fs::read(&renamed).unwrap()).as_deref(),
            Some("sample-local")
        );
        let note_text = fs::read_to_string(&note).unwrap();
        assert!(note_text.contains("quizId: sample-local\n    questionId: question"));
        assert!(note_text.ends_with("quizId: sample\n"));
        assert_eq!(
            goals_storage::list_goals(&goals).unwrap()[0].meta.quiz_id,
            "sample-local"
        );
        assert_eq!(
            mistake_index::get_mistake_index(&goals).unwrap().entries[0].quiz_id,
            "sample-local"
        );
        let state: serde_json::Value =
            serde_json::from_slice(&fs::read(&registry).unwrap()).unwrap();
        for field in ["directories", "favorites"] {
            assert_eq!(state[field][&ctx.workspace][0], "sample-local");
        }

        let before = fs::read(&note).unwrap();
        let changes = rename_changes(&ctx, HubKind::Note, &note, "note-local.md", &before).unwrap();
        apply_changes(&changes).unwrap();
        let note_copy = fs::read_to_string(ctx.dirs.notes.join("note-local.md")).unwrap();
        assert!(note_copy.contains("id: note-local"));
        assert!(note_copy.contains("quizId: sample-local"));
        let state: serde_json::Value =
            serde_json::from_slice(&fs::read(&registry).unwrap()).unwrap();
        assert_eq!(state["knowledgeViews"][&ctx.workspace]["note-local"], 7);
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
