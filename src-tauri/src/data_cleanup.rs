//! One-time removal of files left behind by older Quizzy data formats.
//!
//! A `data-version` marker in the app config directory records which format the folder was last
//! cleaned for, so the cleanup runs once per format bump instead of on every launch. Only files the
//! app itself created and no longer uses are removed, by explicit name. Goals, attempts, quizzes
//! and knowledge notes are never touched.

use std::{
    fs,
    path::{Path, PathBuf},
};
use tauri::{AppHandle, Manager};

use crate::goals_storage::GOALS_DIR;

/// Bump when a release stops using another file, and add that file to `DEPRECATED_FILES`.
const DATA_VERSION: u32 = 2;
const DATA_VERSION_FILE: &str = "data-version";

/// Files in the config directory that no current release reads or writes.
const DEPRECATED_FILES: &[&str] = &["mistake-index.json", "goals.json.bak"];

fn is_stray_temp_file(name: &str) -> bool {
    name.starts_with(".quizzy-") && (name.ends_with(".tmp") || name.ends_with(".backup"))
}

fn remove_stray_temp_files(directory: &Path) {
    let Ok(entries) = fs::read_dir(directory) else {
        return;
    };
    for entry in entries.filter_map(Result::ok) {
        let path = entry.path();
        let is_temp = path.is_file()
            && path
                .file_name()
                .and_then(|name| name.to_str())
                .is_some_and(is_stray_temp_file);
        if is_temp {
            let _ = fs::remove_file(path);
        }
    }
}

fn goal_directories(config_dir: &Path) -> Vec<PathBuf> {
    let Ok(entries) = fs::read_dir(config_dir.join(GOALS_DIR)) else {
        return Vec::new();
    };
    entries
        .filter_map(Result::ok)
        .map(|entry| entry.path())
        .filter(|path| path.is_dir())
        .collect()
}

fn read_marker(config_dir: &Path) -> Option<u32> {
    fs::read_to_string(config_dir.join(DATA_VERSION_FILE))
        .ok()?
        .trim()
        .parse()
        .ok()
}

/// Removes deprecated files, then records the data version. Returns true if the cleanup ran.
/// Failures to delete individual files are ignored; the marker is only written once the whole pass
/// has run, so an interrupted cleanup is retried on the next launch.
pub fn cleanup_config_dir(config_dir: &Path) -> bool {
    if !config_dir.is_dir() || read_marker(config_dir) == Some(DATA_VERSION) {
        return false;
    }

    for name in DEPRECATED_FILES {
        let path = config_dir.join(name);
        if path.is_file() {
            let _ = fs::remove_file(path);
        }
    }

    remove_stray_temp_files(config_dir);
    for goal_dir in goal_directories(config_dir) {
        remove_stray_temp_files(&goal_dir);
        remove_stray_temp_files(&goal_dir.join("attempts"));
    }

    let _ = fs::write(config_dir.join(DATA_VERSION_FILE), DATA_VERSION.to_string());
    true
}

/// Spawns the cleanup on a background thread so it never delays startup.
pub fn spawn_cleanup(app: &AppHandle) {
    let Ok(config_dir) = app.path().app_config_dir() else {
        return;
    };
    std::thread::spawn(move || {
        cleanup_config_dir(&config_dir);
    });
}

#[cfg(test)]
mod tests {
    use super::{cleanup_config_dir, DATA_VERSION, DATA_VERSION_FILE};
    use std::fs;

    #[test]
    fn removes_deprecated_files_once_and_keeps_user_data() {
        let temp = std::env::temp_dir().join(format!("quizzy-cleanup-test-{}", std::process::id()));
        let _ = fs::remove_dir_all(&temp);
        let attempts = temp.join("goals/goal-1/attempts");
        fs::create_dir_all(&attempts).unwrap();

        fs::write(temp.join("mistake-index.json"), "{}").unwrap();
        fs::write(temp.join("goals.json.bak"), "[]").unwrap();
        fs::write(temp.join(".quizzy-settings.json.tmp"), "").unwrap();
        fs::write(attempts.join(".quizzy-a1.json.backup"), "").unwrap();
        fs::write(temp.join("settings.json"), "{}").unwrap();
        fs::write(temp.join("goals/goal-1/goal.json"), "{}").unwrap();
        fs::write(attempts.join("a1.json"), "{}").unwrap();
        fs::write(temp.join("goals/goal-1/mistakes.json"), "{}").unwrap();

        assert!(cleanup_config_dir(&temp));

        assert!(!temp.join("mistake-index.json").exists());
        assert!(!temp.join("goals.json.bak").exists());
        assert!(!temp.join(".quizzy-settings.json.tmp").exists());
        assert!(!attempts.join(".quizzy-a1.json.backup").exists());
        assert!(temp.join("settings.json").exists());
        assert!(temp.join("goals/goal-1/goal.json").exists());
        assert!(attempts.join("a1.json").exists());
        assert!(temp.join("goals/goal-1/mistakes.json").exists());
        assert_eq!(
            fs::read_to_string(temp.join(DATA_VERSION_FILE)).unwrap(),
            DATA_VERSION.to_string()
        );

        // Second run is a no-op because the marker is current.
        fs::write(temp.join("mistake-index.json"), "{}").unwrap();
        assert!(!cleanup_config_dir(&temp));
        assert!(temp.join("mistake-index.json").exists());

        let _ = fs::remove_dir_all(&temp);
    }
}
