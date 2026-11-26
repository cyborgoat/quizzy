//! User-initiated reset of Quizzy app data at several scopes.
//!
//! Working-directory quiz and knowledge files are never deleted by these commands.

use serde::{Deserialize, Serialize};
use std::{fs, path::PathBuf};
use tauri::{AppHandle, Manager, State};

use crate::{
    fs_utils::{
        canonical_directory, directory_from_settings, normalize_stored_path, DATA_VERSION_FILE,
    },
    goals_storage::library_goals_root,
    hub_sync::{self, HubState},
    quiz_archive,
    settings::{read_settings, write_settings, Settings, SETTINGS_FILE},
};

const LIBRARIES_DIR: &str = "libraries";

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub(crate) enum ResetLevel {
    /// Temporary QuizHub catalog/manifest HTTP cache only.
    QuizhubCache,
    /// Goals, attempts, and mistake aggregates for the current working directory.
    StudyHistory,
    /// Study history plus favorites, archives, knowledge views, and QuizHub install records
    /// for the current working directory. Quiz and knowledge files are kept.
    LibraryMetadata,
    /// Wipe all Quizzy app-config data and return to first launch. Working-directory files stay.
    Factory,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub(crate) struct ResetReport {
    level: ResetLevel,
    cleared: Vec<&'static str>,
}

fn config_dir(app: &AppHandle) -> Result<PathBuf, String> {
    app.path()
        .app_config_dir()
        .map_err(|error| format!("Unable to locate the app configuration directory: {error}"))
}

fn current_workspace(app: &AppHandle) -> Result<String, String> {
    let directory = canonical_directory(&directory_from_settings(&read_settings(app)?)?)?;
    Ok(normalize_stored_path(directory))
}

fn remove_path_if_exists(path: &PathBuf) -> Result<bool, String> {
    if !path.exists() {
        return Ok(false);
    }
    if path.is_dir() {
        fs::remove_dir_all(path)
            .map_err(|error| format!("Unable to remove {}: {error}", path.display()))?;
    } else {
        fs::remove_file(path)
            .map_err(|error| format!("Unable to remove {}: {error}", path.display()))?;
    }
    Ok(true)
}

fn clear_study_history(app: &AppHandle, workspace: &str) -> Result<bool, String> {
    let root = library_goals_root(&config_dir(app)?, workspace);
    // Remove the goals folder; if the parent library hash folder is empty, drop it too.
    let removed = remove_path_if_exists(&root)?;
    if let Some(library_dir) = root.parent() {
        if library_dir.is_dir()
            && fs::read_dir(library_dir)
                .map(|mut entries| entries.next().is_none())
                .unwrap_or(false)
        {
            let _ = fs::remove_dir(library_dir);
        }
    }
    Ok(removed)
}

fn clear_all_study_history(app: &AppHandle) -> Result<bool, String> {
    remove_path_if_exists(&config_dir(app)?.join(LIBRARIES_DIR))
}

fn clear_quizhub_cache(app: &AppHandle, hub: &HubState) -> Result<Vec<&'static str>, String> {
    let _removed = hub_sync::clear_disk_caches(app)?;
    hub.clear_document_caches()?;
    // Always report as cleared so the UI can confirm the action completed, even when
    // the disk cache was already empty.
    Ok(vec!["quizhubCache"])
}

fn reset_quizhub_cache(app: &AppHandle, hub: &HubState) -> Result<ResetReport, String> {
    Ok(ResetReport {
        level: ResetLevel::QuizhubCache,
        cleared: clear_quizhub_cache(app, hub)?,
    })
}

fn reset_study_history(app: &AppHandle) -> Result<ResetReport, String> {
    let workspace = current_workspace(app)?;
    let _ = clear_study_history(app, &workspace)?;
    Ok(ResetReport {
        level: ResetLevel::StudyHistory,
        cleared: vec!["studyHistory"],
    })
}

fn reset_library_metadata(app: &AppHandle, hub: &HubState) -> Result<ResetReport, String> {
    let workspace = current_workspace(app)?;
    let mut cleared = Vec::new();

    let _ = clear_study_history(app, &workspace)?;
    cleared.push("studyHistory");

    let _ = quiz_archive::clear_directory_metadata(app, &workspace)?;
    cleared.push("libraryMetadata");

    let _ = hub_sync::clear_workspace_lock(app, &workspace)?;
    cleared.push("quizhubInstalls");

    // Cache is cheap to drop so the next browse is fresh after install records change.
    cleared.extend(clear_quizhub_cache(app, hub)?);

    Ok(ResetReport {
        level: ResetLevel::LibraryMetadata,
        cleared,
    })
}

fn reset_factory(app: &AppHandle, hub: &HubState) -> Result<ResetReport, String> {
    let directory = config_dir(app)?;
    let mut cleared = Vec::new();

    let _ = clear_all_study_history(app)?;
    cleared.push("studyHistory");

    let _ = quiz_archive::clear_all_metadata(app)?;
    cleared.push("libraryMetadata");

    let _ = hub_sync::clear_all_locks(app)?;
    cleared.push("quizhubInstalls");

    cleared.extend(clear_quizhub_cache(app, hub)?);

    let _ = remove_path_if_exists(&directory.join(SETTINGS_FILE))?;
    // Ensure defaults exist so subsequent reads succeed without surprising partial state.
    write_settings(app, &Settings::default())?;
    cleared.push("settings");

    let _ = remove_path_if_exists(&directory.join(DATA_VERSION_FILE))?;

    Ok(ResetReport {
        level: ResetLevel::Factory,
        cleared,
    })
}

#[tauri::command]
pub(crate) fn reset_app_data(
    app: AppHandle,
    hub: State<'_, HubState>,
    level: ResetLevel,
) -> Result<ResetReport, String> {
    match level {
        ResetLevel::QuizhubCache => reset_quizhub_cache(&app, &hub),
        ResetLevel::StudyHistory => reset_study_history(&app),
        ResetLevel::LibraryMetadata => reset_library_metadata(&app, &hub),
        ResetLevel::Factory => reset_factory(&app, &hub),
    }
}

#[cfg(test)]
mod tests {
    use super::{remove_path_if_exists, LIBRARIES_DIR};
    use std::fs;
    use std::time::{SystemTime, UNIX_EPOCH};

    fn test_dir(name: &str) -> std::path::PathBuf {
        let nanos = SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .unwrap()
            .as_nanos();
        let path = std::env::temp_dir().join(format!("quizzy-reset-{name}-{nanos}"));
        let _ = fs::remove_dir_all(&path);
        fs::create_dir_all(&path).unwrap();
        path
    }

    #[test]
    fn remove_path_deletes_files_and_directories() {
        let root = test_dir("remove");
        let file = root.join("a.txt");
        fs::write(&file, b"x").unwrap();
        assert!(remove_path_if_exists(&file).unwrap());
        assert!(!file.exists());
        assert!(!remove_path_if_exists(&file).unwrap());

        let nested = root.join(LIBRARIES_DIR).join("hash").join("goals");
        fs::create_dir_all(&nested).unwrap();
        fs::write(nested.join("goal.json"), b"{}").unwrap();
        assert!(remove_path_if_exists(&root.join(LIBRARIES_DIR)).unwrap());
        assert!(!root.join(LIBRARIES_DIR).exists());
        let _ = fs::remove_dir_all(&root);
    }
}
