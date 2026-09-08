use serde::{Deserialize, Serialize};
use std::{
    collections::{BTreeMap, BTreeSet},
    fs,
    path::PathBuf,
};
use tauri::{AppHandle, Manager};

const ARCHIVE_REGISTRY_FILE: &str = "quiz-archive.json";
const ARCHIVE_REGISTRY_VERSION: u32 = 1;

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
}

impl Default for ArchiveRegistry {
    fn default() -> Self {
        Self {
            version: ARCHIVE_REGISTRY_VERSION,
            directories: BTreeMap::new(),
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
    super::atomic_write(&registry_path(app)?, &contents, true)
}

fn current_directory_key(app: &AppHandle) -> Result<String, String> {
    let directory = super::configured_directory(app)?;
    let canonical = directory
        .canonicalize()
        .map_err(|error| format!("Unable to resolve the working directory: {error}"))?;
    Ok(super::normalize_stored_path(canonical))
}

fn update_archive_entry(
    registry: &mut ArchiveRegistry,
    directory_key: &str,
    quiz_id: &str,
    archived: bool,
) {
    if archived {
        registry
            .directories
            .entry(directory_key.to_string())
            .or_default()
            .insert(quiz_id.to_string());
        return;
    }

    if let Some(ids) = registry.directories.get_mut(directory_key) {
        ids.remove(quiz_id);
        if ids.is_empty() {
            registry.directories.remove(directory_key);
        }
    }
}

pub fn list_archived_quiz_ids(app: &AppHandle) -> Result<Vec<String>, String> {
    let registry = read_registry(app)?;
    let directory_key = current_directory_key(app)?;
    Ok(registry
        .directories
        .get(&directory_key)
        .map(|ids| ids.iter().cloned().collect())
        .unwrap_or_default())
}

pub fn set_quiz_archived(app: &AppHandle, quiz_id: &str, archived: bool) -> Result<(), String> {
    if quiz_id.trim().is_empty() {
        return Err("The quiz ID is required.".to_string());
    }
    let mut registry = read_registry(app)?;
    let directory_key = current_directory_key(app)?;
    update_archive_entry(&mut registry, &directory_key, quiz_id, archived);
    write_registry(app, &registry)
}

#[cfg(test)]
mod tests {
    use super::{update_archive_entry, ArchiveRegistry};

    #[test]
    fn archive_entries_are_scoped_by_directory() {
        let mut registry = ArchiveRegistry::default();
        update_archive_entry(&mut registry, "/quizzes/a", "quiz-1", true);
        update_archive_entry(&mut registry, "/quizzes/b", "quiz-2", true);

        assert!(registry.directories["/quizzes/a"].contains("quiz-1"));
        assert!(!registry.directories["/quizzes/a"].contains("quiz-2"));
        assert!(registry.directories["/quizzes/b"].contains("quiz-2"));
    }

    #[test]
    fn restoring_the_last_quiz_removes_the_directory_entry() {
        let mut registry = ArchiveRegistry::default();
        update_archive_entry(&mut registry, "/quizzes", "quiz-1", true);
        update_archive_entry(&mut registry, "/quizzes", "quiz-1", false);

        assert!(!registry.directories.contains_key("/quizzes"));
    }
}
