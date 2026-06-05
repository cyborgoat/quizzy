use serde::{Deserialize, Serialize};
use std::{
    fs,
    path::{Path, PathBuf},
};
use tauri::{AppHandle, Manager};

const SETTINGS_FILE: &str = "settings.json";

#[derive(Debug, Default, Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
struct Settings {
    working_directory: Option<String>,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
struct WorkingDirectoryState {
    path: Option<String>,
    available: bool,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
struct QuizFile {
    file_name: String,
    contents: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    read_error: Option<String>,
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
struct WriteImportedQuizRequest {
    file_name: String,
    contents: String,
    overwrite: bool,
    remove_file_name: Option<String>,
}

fn settings_path(app: &AppHandle) -> Result<PathBuf, String> {
    let directory = app
        .path()
        .app_config_dir()
        .map_err(|error| format!("Unable to locate the app configuration directory: {error}"))?;
    fs::create_dir_all(&directory)
        .map_err(|error| format!("Unable to create the app configuration directory: {error}"))?;
    Ok(directory.join(SETTINGS_FILE))
}

fn read_settings(app: &AppHandle) -> Result<Settings, String> {
    let path = settings_path(app)?;
    if !path.exists() {
        return Ok(Settings::default());
    }
    let contents = fs::read_to_string(path)
        .map_err(|error| format!("Unable to read Quizzy settings: {error}"))?;
    serde_json::from_str(&contents).map_err(|error| format!("Quizzy settings are invalid: {error}"))
}

fn write_settings(app: &AppHandle, settings: &Settings) -> Result<(), String> {
    let path = settings_path(app)?;
    let contents = serde_json::to_vec_pretty(settings)
        .map_err(|error| format!("Unable to serialize Quizzy settings: {error}"))?;
    atomic_write(&path, &contents, true)
}

fn configured_directory(app: &AppHandle) -> Result<PathBuf, String> {
    let settings = read_settings(app)?;
    let path = settings
        .working_directory
        .ok_or_else(|| "No working directory has been configured.".to_string())?;
    let directory = PathBuf::from(path);
    if !directory.is_dir() {
        return Err("The configured working directory is unavailable.".to_string());
    }
    Ok(directory)
}

fn validate_json_file_name(file_name: &str) -> Result<(), String> {
    let path = Path::new(file_name);
    if path.components().count() != 1
        || path.file_name().and_then(|value| value.to_str()) != Some(file_name)
    {
        return Err("The destination filename is invalid.".to_string());
    }
    if path.extension().and_then(|value| value.to_str()) != Some("json") {
        return Err("Quiz files must use the .json extension.".to_string());
    }
    Ok(())
}

fn atomic_write(path: &Path, contents: &[u8], overwrite: bool) -> Result<(), String> {
    if path.exists() && !overwrite {
        return Err(format!("{} already exists.", path.display()));
    }
    let parent = path
        .parent()
        .ok_or_else(|| "The destination has no parent directory.".to_string())?;
    fs::create_dir_all(parent)
        .map_err(|error| format!("Unable to create destination directory: {error}"))?;
    let temp_path = parent.join(format!(
        ".quizzy-{}.tmp",
        path.file_name()
            .and_then(|value| value.to_str())
            .unwrap_or("import")
    ));
    fs::write(&temp_path, contents)
        .map_err(|error| format!("Unable to write temporary quiz file: {error}"))?;
    if overwrite && path.exists() {
        let backup_path = parent.join(format!(
            ".quizzy-{}.backup",
            path.file_name()
                .and_then(|value| value.to_str())
                .unwrap_or("import")
        ));
        if backup_path.exists() {
            fs::remove_file(&backup_path)
                .map_err(|error| format!("Unable to clear an old backup file: {error}"))?;
        }
        fs::rename(path, &backup_path).map_err(|error| {
            format!("Unable to prepare the existing file for replacement: {error}")
        })?;
        if let Err(error) = fs::rename(&temp_path, path) {
            let _ = fs::rename(&backup_path, path);
            return Err(format!("Unable to finish replacing the quiz file: {error}"));
        }
        fs::remove_file(backup_path).map_err(|error| {
            format!("The quiz was replaced, but its temporary backup could not be removed: {error}")
        })?;
        return Ok(());
    }
    fs::rename(&temp_path, path)
        .map_err(|error| format!("Unable to finish writing quiz file: {error}"))
}

#[tauri::command]
fn get_working_directory(app: AppHandle) -> Result<WorkingDirectoryState, String> {
    let settings = read_settings(&app)?;
    let available = settings
        .working_directory
        .as_ref()
        .map(|path| Path::new(path).is_dir())
        .unwrap_or(false);
    Ok(WorkingDirectoryState {
        path: settings.working_directory,
        available,
    })
}

#[tauri::command]
fn set_working_directory(app: AppHandle, path: String) -> Result<(), String> {
    let directory = PathBuf::from(&path);
    if !directory.is_dir() {
        return Err("Select an existing directory.".to_string());
    }
    let canonical = directory
        .canonicalize()
        .map_err(|error| format!("Unable to access the selected directory: {error}"))?;
    write_settings(
        &app,
        &Settings {
            working_directory: Some(canonical.to_string_lossy().into_owned()),
        },
    )
}

#[tauri::command]
fn read_working_directory(app: AppHandle) -> Result<Vec<QuizFile>, String> {
    let directory = configured_directory(&app)?;
    let mut files = Vec::new();
    for entry in fs::read_dir(&directory)
        .map_err(|error| format!("Unable to read the working directory: {error}"))?
    {
        let entry =
            entry.map_err(|error| format!("Unable to inspect a directory entry: {error}"))?;
        let path = entry.path();
        if !path.is_file() || path.extension().and_then(|value| value.to_str()) != Some("json") {
            continue;
        }
        let file_name = entry.file_name().to_string_lossy().into_owned();
        match fs::read_to_string(&path) {
            Ok(contents) => files.push(QuizFile {
                file_name,
                contents,
                read_error: None,
            }),
            Err(error) => files.push(QuizFile {
                file_name,
                contents: String::new(),
                read_error: Some(error.to_string()),
            }),
        }
    }
    files.sort_by(|left, right| left.file_name.cmp(&right.file_name));
    Ok(files)
}

#[tauri::command]
fn read_import_files(paths: Vec<String>) -> Result<Vec<QuizFile>, String> {
    let mut files = Vec::new();
    for raw_path in paths {
        let path = PathBuf::from(&raw_path);
        if !path.is_file() || path.extension().and_then(|value| value.to_str()) != Some("json") {
            return Err(format!("{} is not a JSON file.", path.display()));
        }
        let file_name = path
            .file_name()
            .and_then(|value| value.to_str())
            .ok_or_else(|| format!("{} has an invalid filename.", path.display()))?
            .to_string();
        let contents = fs::read_to_string(&path)
            .map_err(|error| format!("Unable to read {}: {error}", path.display()))?;
        files.push(QuizFile {
            file_name,
            contents,
            read_error: None,
        });
    }
    Ok(files)
}

#[tauri::command]
fn write_imported_quiz(app: AppHandle, request: WriteImportedQuizRequest) -> Result<(), String> {
    validate_json_file_name(&request.file_name)?;
    let directory = configured_directory(&app)?;
    let destination = directory.join(&request.file_name);
    atomic_write(&destination, request.contents.as_bytes(), request.overwrite)?;

    if let Some(remove_file_name) = request.remove_file_name {
        validate_json_file_name(&remove_file_name)?;
        if remove_file_name != request.file_name {
            let old_path = directory.join(remove_file_name);
            if old_path.exists() {
                fs::remove_file(old_path).map_err(|error| {
                    format!(
                        "The new quiz was saved, but the old file could not be removed: {error}"
                    )
                })?;
            }
        }
    }
    Ok(())
}

#[tauri::command]
fn delete_quiz_file(app: AppHandle, file_name: String) -> Result<(), String> {
    validate_json_file_name(&file_name)?;
    let path = configured_directory(&app)?.join(file_name);
    if !path.exists() {
        return Ok(());
    }
    fs::remove_file(path).map_err(|error| format!("Unable to delete the quiz file: {error}"))
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .invoke_handler(tauri::generate_handler![
            get_working_directory,
            set_working_directory,
            read_working_directory,
            read_import_files,
            write_imported_quiz,
            delete_quiz_file
        ])
        .run(tauri::generate_context!())
        .expect("error while running Quizzy");
}

#[cfg(test)]
mod tests {
    use super::{atomic_write, validate_json_file_name};
    use std::{fs, path::PathBuf};

    fn test_directory(name: &str) -> PathBuf {
        std::env::temp_dir().join(format!("quizzy-{name}-{}", std::process::id()))
    }

    #[test]
    fn rejects_traversal_and_non_json_destinations() {
        assert!(validate_json_file_name("../quiz.json").is_err());
        assert!(validate_json_file_name("nested/quiz.json").is_err());
        assert!(validate_json_file_name("quiz.txt").is_err());
        assert!(validate_json_file_name("quiz.json").is_ok());
    }

    #[test]
    fn atomic_write_requires_explicit_replacement() {
        let directory = test_directory("atomic-write");
        let path = directory.join("quiz.json");
        fs::create_dir_all(&directory).expect("create test directory");

        atomic_write(&path, b"first", false).expect("write initial file");
        assert!(atomic_write(&path, b"second", false).is_err());
        atomic_write(&path, b"second", true).expect("replace file");
        assert_eq!(
            fs::read_to_string(&path).expect("read replaced file"),
            "second"
        );

        fs::remove_dir_all(directory).expect("remove test directory");
    }
}
