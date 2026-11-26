use serde::{Deserialize, Serialize};
use std::{
    collections::{BTreeMap, BTreeSet},
    fs,
    path::{Path, PathBuf},
    sync::Mutex,
};
use tauri::{AppHandle, Manager};

const ARCHIVE_REGISTRY_FILE: &str = "quiz-archive.json";
const ARCHIVE_REGISTRY_VERSION: u32 = 1;
pub(crate) static REGISTRY_WRITE_LOCK: Mutex<()> = Mutex::new(());

fn registry_version() -> u32 {
    ARCHIVE_REGISTRY_VERSION
}

#[derive(Debug, Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
struct ArchiveRegistry {
    #[serde(default = "registry_version")]
    version: u32,
    #[serde(default)]
    directories: BTreeMap<String, BTreeSet<String>>,
    #[serde(default)]
    favorites: BTreeMap<String, BTreeSet<String>>,
    #[serde(default)]
    knowledge_views: BTreeMap<String, BTreeMap<String, u32>>,
}

impl Default for ArchiveRegistry {
    fn default() -> Self {
        Self {
            version: ARCHIVE_REGISTRY_VERSION,
            directories: BTreeMap::new(),
            favorites: BTreeMap::new(),
            knowledge_views: BTreeMap::new(),
        }
    }
}

fn registry_path(app: &AppHandle) -> Result<PathBuf, String> {
    let directory = app
        .path()
        .app_config_dir()
        .map_err(|error| format!("Unable to locate the app configuration directory: {error}"))?;
    fs::create_dir_all(&directory)
        .map_err(|error| format!("Unable to create the app configuration directory: {error}"))?;
    Ok(directory.join(ARCHIVE_REGISTRY_FILE))
}

fn read_registry(app: &AppHandle) -> Result<ArchiveRegistry, String> {
    let path = registry_path(app)?;
    if !path.exists() {
        return Ok(ArchiveRegistry::default());
    }
    let contents = fs::read_to_string(&path)
        .map_err(|error| format!("Unable to read the quiz archive registry: {error}"))?;
    let registry: ArchiveRegistry = serde_json::from_str(&contents)
        .map_err(|error| format!("The quiz archive registry is invalid: {error}"))?;
    if registry.version != ARCHIVE_REGISTRY_VERSION {
        return Err(format!(
            "Unsupported quiz archive registry version {}.",
            registry.version
        ));
    }
    Ok(registry)
}

fn write_registry(app: &AppHandle, registry: &ArchiveRegistry) -> Result<(), String> {
    let contents = serde_json::to_vec_pretty(registry)
        .map_err(|error| format!("Unable to serialize the quiz archive registry: {error}"))?;
    crate::fs_utils::atomic_write(&registry_path(app)?, &contents, true)
}

fn update_entry(
    directories: &mut BTreeMap<String, BTreeSet<String>>,
    directory_key: &str,
    quiz_id: &str,
    archived: bool,
) {
    if archived {
        directories
            .entry(directory_key.to_string())
            .or_default()
            .insert(quiz_id.to_string());
        return;
    }

    if let Some(ids) = directories.get_mut(directory_key) {
        ids.remove(quiz_id);
        if ids.is_empty() {
            directories.remove(directory_key);
        }
    }
}

pub fn list_archived_quiz_ids(app: &AppHandle, directory_key: &str) -> Result<Vec<String>, String> {
    let registry = read_registry(app)?;
    Ok(registry
        .directories
        .get(directory_key)
        .map(|ids| ids.iter().cloned().collect())
        .unwrap_or_default())
}

pub fn set_quiz_archived(
    app: &AppHandle,
    directory_key: &str,
    quiz_id: &str,
    archived: bool,
) -> Result<(), String> {
    if quiz_id.trim().is_empty() {
        return Err("The quiz ID is required.".to_string());
    }
    let _guard = REGISTRY_WRITE_LOCK
        .lock()
        .map_err(|_| "The library registry is unavailable.")?;
    let mut registry = read_registry(app)?;
    update_entry(&mut registry.directories, directory_key, quiz_id, archived);
    write_registry(app, &registry)
}

pub fn list_favorite_quiz_ids(app: &AppHandle, directory_key: &str) -> Result<Vec<String>, String> {
    let registry = read_registry(app)?;
    Ok(registry
        .favorites
        .get(directory_key)
        .map(|ids| ids.iter().cloned().collect())
        .unwrap_or_default())
}

pub fn set_quiz_favorite(
    app: &AppHandle,
    directory_key: &str,
    quiz_id: &str,
    favorite: bool,
) -> Result<(), String> {
    if quiz_id.trim().is_empty() {
        return Err("The quiz ID is required.".to_string());
    }
    let _guard = REGISTRY_WRITE_LOCK
        .lock()
        .map_err(|_| "The library registry is unavailable.")?;
    let mut registry = read_registry(app)?;
    update_entry(&mut registry.favorites, directory_key, quiz_id, favorite);
    write_registry(app, &registry)
}

fn increment_view(
    views: &mut BTreeMap<String, BTreeMap<String, u32>>,
    directory_key: &str,
    note_id: &str,
) -> u32 {
    let count = views
        .entry(directory_key.to_string())
        .or_default()
        .entry(note_id.to_string())
        .or_insert(0);
    *count = count.saturating_add(1);
    *count
}

pub fn list_knowledge_view_counts(
    app: &AppHandle,
    directory_key: &str,
) -> Result<BTreeMap<String, u32>, String> {
    let registry = read_registry(app)?;
    Ok(registry
        .knowledge_views
        .get(directory_key)
        .cloned()
        .unwrap_or_default())
}

pub fn record_knowledge_view(
    app: &AppHandle,
    directory_key: &str,
    note_id: &str,
) -> Result<u32, String> {
    if note_id.trim().is_empty() {
        return Err("The knowledge note ID is required.".to_string());
    }
    let _guard = REGISTRY_WRITE_LOCK
        .lock()
        .map_err(|_| "The library registry is unavailable.")?;
    let mut registry = read_registry(app)?;
    let count = increment_view(&mut registry.knowledge_views, directory_key, note_id);
    write_registry(app, &registry)?;
    Ok(count)
}

/// Clears archives, favorites, and knowledge view counts for one working directory.
pub(crate) fn clear_directory_metadata(
    app: &AppHandle,
    directory_key: &str,
) -> Result<bool, String> {
    let _guard = REGISTRY_WRITE_LOCK
        .lock()
        .map_err(|_| "The library registry is unavailable.")?;
    let mut registry = read_registry(app)?;
    let removed_archives = registry.directories.remove(directory_key).is_some();
    let removed_favorites = registry.favorites.remove(directory_key).is_some();
    let removed_views = registry.knowledge_views.remove(directory_key).is_some();
    let changed = removed_archives || removed_favorites || removed_views;
    if !changed {
        return Ok(false);
    }
    if registry.directories.is_empty()
        && registry.favorites.is_empty()
        && registry.knowledge_views.is_empty()
    {
        let path = registry_path(app)?;
        if path.exists() {
            fs::remove_file(&path).map_err(|error| {
                format!("Unable to remove the quiz archive registry: {error}")
            })?;
        }
    } else {
        write_registry(app, &registry)?;
    }
    Ok(true)
}

/// Removes the entire archive/favorites/views registry.
pub(crate) fn clear_all_metadata(app: &AppHandle) -> Result<bool, String> {
    let _guard = REGISTRY_WRITE_LOCK
        .lock()
        .map_err(|_| "The library registry is unavailable.")?;
    let path = registry_path(app)?;
    if !path.exists() {
        return Ok(false);
    }
    fs::remove_file(&path)
        .map_err(|error| format!("Unable to remove the quiz archive registry: {error}"))?;
    Ok(true)
}

pub(crate) fn rename_registry_update(
    config: &Path,
    directory_key: &str,
    quiz: bool,
    old_id: &str,
    new_id: &str,
) -> Result<Option<(PathBuf, Vec<u8>, Vec<u8>)>, String> {
    let path = config.join(ARCHIVE_REGISTRY_FILE);
    let before = match fs::read(&path) {
        Err(error) if error.kind() == std::io::ErrorKind::NotFound => return Ok(None),
        result => result.map_err(|e| e.to_string())?,
    };
    let mut registry: ArchiveRegistry =
        serde_json::from_slice(&before).map_err(|e| e.to_string())?;
    if registry.version != ARCHIVE_REGISTRY_VERSION {
        return Err("The library registry version is unsupported.".into());
    }
    let mut changed = false;
    if quiz {
        for index in [&mut registry.directories, &mut registry.favorites] {
            if let Some(ids) = index.get_mut(directory_key) {
                if ids.contains(new_id) {
                    return Err("Library state already uses that quiz ID.".into());
                }
                if ids.remove(old_id) {
                    ids.insert(new_id.to_string());
                    changed = true;
                }
            }
        }
    } else if let Some(views) = registry.knowledge_views.get_mut(directory_key) {
        if views.contains_key(new_id) {
            return Err("Library state already uses that note ID.".into());
        }
        if let Some(count) = views.remove(old_id) {
            views.insert(new_id.to_string(), count);
            changed = true;
        }
    }
    if changed {
        let after = serde_json::to_vec_pretty(&registry).map_err(|e| e.to_string())?;
        return Ok(Some((path, before, after)));
    }
    Ok(None)
}

#[cfg(test)]
mod tests {
    use super::{increment_view, update_entry, ArchiveRegistry};

    #[test]
    fn knowledge_views_count_per_directory_and_support_existing_registries() {
        let mut registry: ArchiveRegistry =
            serde_json::from_str(r#"{"version":1,"favorites":{"/a":["q"]}}"#).unwrap();
        assert!(registry.knowledge_views.is_empty());
        assert_eq!(increment_view(&mut registry.knowledge_views, "/a", "n1"), 1);
        assert_eq!(increment_view(&mut registry.knowledge_views, "/a", "n1"), 2);
        assert_eq!(increment_view(&mut registry.knowledge_views, "/b", "n1"), 1);
        let loaded: ArchiveRegistry =
            serde_json::from_str(&serde_json::to_string(&registry).unwrap()).unwrap();
        assert_eq!(loaded.knowledge_views["/a"]["n1"], 2);
        assert_eq!(loaded.knowledge_views["/b"]["n1"], 1);
        assert!(loaded.favorites["/a"].contains("q"));
    }

    #[test]
    fn favorites_preserve_archives_and_support_existing_registries() {
        let mut registry: ArchiveRegistry =
            serde_json::from_str(r#"{"version":1,"directories":{"/a":["archived"]}}"#).unwrap();
        assert!(registry.favorites.is_empty());
        update_entry(&mut registry.favorites, "/a", "quiz-1", true);
        update_entry(&mut registry.favorites, "/b", "quiz-1", true);
        update_entry(&mut registry.favorites, "/a", "quiz-1", false);
        let loaded: ArchiveRegistry =
            serde_json::from_str(&serde_json::to_string(&registry).unwrap()).unwrap();
        assert!(!loaded.favorites.contains_key("/a"));
        assert!(loaded.favorites["/b"].contains("quiz-1"));
        assert!(loaded.directories["/a"].contains("archived"));
    }

    #[test]
    fn archive_entries_are_scoped_by_directory() {
        let mut registry = ArchiveRegistry::default();
        update_entry(&mut registry.directories, "/quizzes/a", "quiz-1", true);
        update_entry(&mut registry.directories, "/quizzes/b", "quiz-2", true);

        assert!(registry.directories["/quizzes/a"].contains("quiz-1"));
        assert!(!registry.directories["/quizzes/a"].contains("quiz-2"));
        assert!(registry.directories["/quizzes/b"].contains("quiz-2"));
    }

    #[test]
    fn restoring_the_last_quiz_removes_the_directory_entry() {
        let mut registry = ArchiveRegistry::default();
        update_entry(&mut registry.directories, "/quizzes", "quiz-1", true);
        update_entry(&mut registry.directories, "/quizzes", "quiz-1", false);

        assert!(!registry.directories.contains_key("/quizzes"));
    }
}
