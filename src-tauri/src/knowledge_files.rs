use serde::Deserialize;
use std::{collections::HashMap, fs};
use tauri::AppHandle;

use crate::fs_utils::{
    atomic_write, checked_directory, is_md_extension, knowledge_base_directory, knowledge_base_for,
    open_directory_in_file_manager, read_library_files, resolve_knowledge_path, QuizFile,
};

#[tauri::command]
pub(crate) async fn read_knowledge_directory(
    app: AppHandle,
    working_directory: String,
    known_versions: Option<HashMap<String, String>>,
) -> Result<Vec<QuizFile>, String> {
    crate::app_data_commands::run_blocking(move || {
        let directory = knowledge_base_for(&checked_directory(&app, &working_directory)?)?;
        read_library_files(
            &directory,
            "knowledge-base folder",
            is_md_extension,
            &known_versions.unwrap_or_default(),
        )
    })
    .await
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
pub(crate) struct WriteKnowledgeFileRequest {
    file_name: String,
    contents: String,
    overwrite: bool,
}

#[tauri::command]
pub(crate) fn write_knowledge_file(
    app: AppHandle,
    working_directory: String,
    request: WriteKnowledgeFileRequest,
) -> Result<(), String> {
    let directory = knowledge_base_for(&checked_directory(&app, &working_directory)?)?;
    let path = resolve_knowledge_path(&directory, &request.file_name)?;
    atomic_write(&path, request.contents.as_bytes(), request.overwrite)
}

#[tauri::command]
pub(crate) fn delete_knowledge_file(
    app: AppHandle,
    working_directory: String,
    file_name: String,
) -> Result<(), String> {
    let directory = knowledge_base_for(&checked_directory(&app, &working_directory)?)?;
    let path = resolve_knowledge_path(&directory, &file_name)?;
    if !path.exists() {
        return Err(format!("{} does not exist.", path.display()));
    }
    fs::remove_file(&path).map_err(|error| format!("Unable to delete {}: {error}", path.display()))
}

#[tauri::command]
pub(crate) async fn list_knowledge_view_counts(
    app: AppHandle,
    working_directory: String,
) -> Result<HashMap<String, u32>, String> {
    crate::app_data_commands::run_blocking(move || {
        checked_directory(&app, &working_directory)?;
        crate::quiz_archive::list_knowledge_view_counts(&app, &working_directory)
            .map(|counts| counts.into_iter().collect())
    })
    .await
}

#[tauri::command]
pub(crate) async fn record_knowledge_view(
    app: AppHandle,
    working_directory: String,
    note_id: String,
) -> Result<u32, String> {
    crate::app_data_commands::run_blocking(move || {
        checked_directory(&app, &working_directory)?;
        crate::quiz_archive::record_knowledge_view(&app, &working_directory, &note_id)
    })
    .await
}

#[tauri::command]
pub(crate) fn open_knowledge_folder(app: AppHandle) -> Result<(), String> {
    open_directory_in_file_manager(knowledge_base_directory(&app)?, "knowledge-base folder")
}
