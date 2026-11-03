use serde::Deserialize;
use std::{collections::HashMap, fs};
use tauri::AppHandle;

use crate::fs_utils::{
    atomic_write, is_md_extension, knowledge_base_directory, open_directory_in_file_manager,
    read_library_files, resolve_knowledge_path, QuizFile,
};

#[tauri::command]
pub(crate) fn read_knowledge_directory(
    app: AppHandle,
    known_versions: Option<HashMap<String, String>>,
) -> Result<Vec<QuizFile>, String> {
    let directory = knowledge_base_directory(&app)?;
    read_library_files(
        &directory,
        "knowledge-base folder",
        is_md_extension,
        &known_versions.unwrap_or_default(),
    )
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
    request: WriteKnowledgeFileRequest,
) -> Result<(), String> {
    let directory = knowledge_base_directory(&app)?;
    let path = resolve_knowledge_path(&directory, &request.file_name)?;
    atomic_write(&path, request.contents.as_bytes(), request.overwrite)
}

#[tauri::command]
pub(crate) fn delete_knowledge_file(app: AppHandle, file_name: String) -> Result<(), String> {
    let directory = knowledge_base_directory(&app)?;
    let path = resolve_knowledge_path(&directory, &file_name)?;
    if !path.exists() {
        return Err(format!("{} does not exist.", path.display()));
    }
    fs::remove_file(&path).map_err(|error| format!("Unable to delete {}: {error}", path.display()))
}

#[tauri::command]
pub(crate) fn open_knowledge_folder(app: AppHandle) -> Result<(), String> {
    open_directory_in_file_manager(knowledge_base_directory(&app)?, "knowledge-base folder")
}
