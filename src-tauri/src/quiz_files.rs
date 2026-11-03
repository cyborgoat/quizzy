use serde::{Deserialize, Serialize};
use std::{fs, path::PathBuf};
use tauri::AppHandle;

use crate::fs_utils::{
    atomic_write, configured_directory, is_json_extension, open_directory_in_file_manager,
    read_library_files, read_text_file, resolve_quiz_path, QuizFile,
};
use crate::{goals_storage, mistake_index, quiz_archive};

#[tauri::command]
pub(crate) fn read_working_directory(app: AppHandle) -> Result<Vec<QuizFile>, String> {
    let directory = configured_directory(&app)?;
    read_library_files(&directory, "working directory", is_json_extension)
}

#[tauri::command]
pub(crate) fn import_quiz_file(app: AppHandle, source_path: String) -> Result<String, String> {
    let source = PathBuf::from(source_path);
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
        .ok_or_else(|| "The selected quiz file name is invalid.".to_string())?;
    let contents = fs::read(&source)
        .map_err(|error| format!("Unable to read the selected quiz file: {error}"))?;
    serde_json::from_slice::<serde_json::Value>(&contents)
        .map_err(|error| format!("The selected quiz file is not valid JSON: {error}"))?;

    let destination = configured_directory(&app)?.join(file_name);
    atomic_write(&destination, &contents, false)?;
    Ok(file_name.to_string())
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

#[tauri::command]
pub(crate) fn add_sample_quizzes(app: AppHandle) -> Result<AddSampleQuizzesResult, String> {
    let directory = configured_directory(&app)?;
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
    if let Err(error) = mistake_index::remove_quiz_entries(&app, &identity.id) {
        cleanup_errors.push(error);
    }
    if let Err(error) = quiz_archive::set_quiz_archived(&app, &identity.id, false) {
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
