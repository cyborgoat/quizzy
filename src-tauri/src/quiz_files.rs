use serde::{Deserialize, Serialize};
use std::{
    collections::HashMap,
    fs,
    path::{Path, PathBuf},
};
use tauri::AppHandle;

use crate::fs_utils::{
    atomic_write, configured_directory, is_json_extension, open_directory_in_file_manager,
    read_library_files, read_text_file, resolve_quiz_path, QuizFile,
};
use crate::{goals_storage, quiz_archive};

#[tauri::command]
pub(crate) async fn read_working_directory(
    app: AppHandle,
    known_versions: Option<HashMap<String, String>>,
) -> Result<Vec<QuizFile>, String> {
    crate::app_data_commands::run_blocking(move || {
        let directory = configured_directory(&app)?;
        read_library_files(
            &directory,
            "working directory",
            is_json_extension,
            &known_versions.unwrap_or_default(),
        )
    })
    .await
}

/// Validates an import source and returns its file name and raw bytes.
fn read_import_source(source: &Path) -> Result<(String, Vec<u8>), String> {
    if !source.is_file() {
        return Err("Select an existing quiz file.".to_string());
    }
    if !source
        .extension()
        .and_then(|value| value.to_str())
        .is_some_and(is_json_extension)
    {
        return Err("Quiz files must use the .json extension.".to_string());
    }

    let file_name = source
        .file_name()
        .and_then(|value| value.to_str())
        .filter(|value| !value.is_empty())
        .ok_or_else(|| "The selected quiz file name is invalid.".to_string())?
        .to_string();
    let contents = fs::read(source)
        .map_err(|error| format!("Unable to read the selected quiz file: {error}"))?;
    serde_json::from_slice::<serde_json::Value>(&contents)
        .map_err(|error| format!("The selected quiz file is not valid JSON: {error}"))?;
    Ok((file_name, contents))
}

#[tauri::command]
pub(crate) fn import_quiz_file(app: AppHandle, source_path: String) -> Result<String, String> {
    let (file_name, contents) = read_import_source(&PathBuf::from(source_path))?;
    let destination = configured_directory(&app)?.join(&file_name);
    atomic_write(&destination, &contents, false)?;
    Ok(file_name)
}

pub(crate) const SAMPLE_QUIZZES: [(&str, &str); 4] = [
    (
        "css-basics.json",
        include_str!("../../sample-quizzes/css-basics.json"),
    ),
    (
        "javascript-basics.json",
        include_str!("../../sample-quizzes/javascript-basics.json"),
    ),
    (
        "react-basics.json",
        include_str!("../../sample-quizzes/react-basics.json"),
    ),
    (
        "markdown-showcase.json",
        include_str!("../../sample-quizzes/markdown-showcase.json"),
    ),
];

#[derive(Serialize)]
pub(crate) struct AddSampleQuizzesResult {
    added: Vec<String>,
    skipped: Vec<String>,
}

fn write_missing_samples(directory: &Path) -> Result<AddSampleQuizzesResult, String> {
    let mut added = Vec::new();
    let mut skipped = Vec::new();
    for (file_name, contents) in SAMPLE_QUIZZES {
        let destination = directory.join(file_name);
        if destination.exists() {
            skipped.push(file_name.to_string());
            continue;
        }
        atomic_write(&destination, contents.as_bytes(), false)?;
        added.push(file_name.to_string());
    }
    Ok(AddSampleQuizzesResult { added, skipped })
}

#[tauri::command]
pub(crate) fn add_sample_quizzes(app: AppHandle) -> Result<AddSampleQuizzesResult, String> {
    write_missing_samples(&configured_directory(&app)?)
}

#[tauri::command]
pub(crate) fn list_archived_quiz_ids(app: AppHandle) -> Result<Vec<String>, String> {
    quiz_archive::list_archived_quiz_ids(&app)
}

#[tauri::command]
pub(crate) fn set_quiz_archived(
    app: AppHandle,
    quiz_id: String,
    archived: bool,
) -> Result<(), String> {
    quiz_archive::set_quiz_archived(&app, &quiz_id, archived)
}

#[tauri::command]
pub(crate) fn list_favorite_quiz_ids(app: AppHandle) -> Result<Vec<String>, String> {
    quiz_archive::list_favorite_quiz_ids(&app)
}

#[tauri::command]
pub(crate) fn set_quiz_favorite(
    app: AppHandle,
    quiz_id: String,
    favorite: bool,
) -> Result<(), String> {
    quiz_archive::set_quiz_favorite(&app, &quiz_id, favorite)
}

#[derive(Deserialize)]
pub(crate) struct QuizIdentity {
    id: String,
}

#[tauri::command]
pub(crate) fn delete_quiz_file(app: AppHandle, file_name: String) -> Result<(), String> {
    let directory = configured_directory(&app)?;
    let path = resolve_quiz_path(&directory, &file_name)?;
    if !path.is_file() {
        return Err(format!("{} does not exist.", path.display()));
    }

    let contents = read_text_file(&path)?;
    let identity: QuizIdentity = serde_json::from_str(&contents)
        .map_err(|error| format!("Unable to identify the quiz before deletion: {error}"))?;
    if identity.id.trim().is_empty() {
        return Err("Unable to identify the quiz before deletion.".to_string());
    }

    fs::remove_file(&path)
        .map_err(|error| format!("Unable to delete {}: {error}", path.display()))?;

    let mut cleanup_errors = Vec::new();
    match goals_storage::list_goals(&app) {
        Ok(goals) => {
            for goal in goals {
                if goal.meta.quiz_id == identity.id {
                    if let Err(error) = goals_storage::delete_goal(&app, goal.meta.id) {
                        cleanup_errors.push(error);
                    }
                }
            }
        }
        Err(error) => cleanup_errors.push(error),
    }
    if let Err(error) = quiz_archive::set_quiz_archived(&app, &identity.id, false) {
        cleanup_errors.push(error);
    }

    if let Err(error) = quiz_archive::set_quiz_favorite(&app, &identity.id, false) {
        cleanup_errors.push(error);
    }

    if cleanup_errors.is_empty() {
        Ok(())
    } else {
        Err(format!(
            "The quiz file was deleted, but some saved data could not be removed: {}",
            cleanup_errors.join(" ")
        ))
    }
}

#[tauri::command]
pub(crate) fn open_quiz_folder(app: AppHandle) -> Result<(), String> {
    open_directory_in_file_manager(configured_directory(&app)?, "quiz folder")
}

#[cfg(test)]
mod tests {
    use super::{read_import_source, write_missing_samples, SAMPLE_QUIZZES};
    use std::{fs, path::PathBuf};

    fn test_directory(name: &str) -> PathBuf {
        let dir = std::env::temp_dir().join(format!("quizzy-qf-{name}-{}", std::process::id()));
        let _ = fs::remove_dir_all(&dir);
        fs::create_dir_all(&dir).expect("create test directory");
        dir
    }

    #[test]
    fn import_rejects_missing_non_json_and_malformed_files() {
        let dir = test_directory("import");
        assert!(read_import_source(&dir.join("missing.json")).is_err());

        fs::write(dir.join("quiz.txt"), "{}").expect("write txt");
        assert!(read_import_source(&dir.join("quiz.txt")).is_err());

        fs::write(dir.join("bad.json"), "{not json").expect("write bad");
        assert!(read_import_source(&dir.join("bad.json")).is_err());

        fs::write(dir.join("ok.JSON"), "{\"id\":\"q\"}").expect("write ok");
        let (name, contents) = read_import_source(&dir.join("ok.JSON")).expect("valid import");
        assert_eq!(name, "ok.JSON");
        assert_eq!(contents, b"{\"id\":\"q\"}");

        fs::remove_dir_all(dir).expect("cleanup");
    }

    #[test]
    fn samples_are_added_once_and_never_overwritten() {
        let dir = test_directory("samples");
        fs::write(dir.join("css-basics.json"), "custom").expect("write existing");

        let first = write_missing_samples(&dir).expect("first run");
        assert_eq!(first.added.len(), SAMPLE_QUIZZES.len() - 1);
        assert_eq!(first.skipped, ["css-basics.json"]);
        assert_eq!(
            fs::read_to_string(dir.join("css-basics.json")).expect("read"),
            "custom"
        );

        let second = write_missing_samples(&dir).expect("second run");
        assert!(second.added.is_empty());
        assert_eq!(second.skipped.len(), SAMPLE_QUIZZES.len());

        fs::remove_dir_all(dir).expect("cleanup");
    }

    #[test]
    fn bundled_samples_are_valid_json() {
        for (name, contents) in SAMPLE_QUIZZES {
            serde_json::from_str::<serde_json::Value>(contents)
                .unwrap_or_else(|error| panic!("{name} is invalid: {error}"));
        }
    }
}
