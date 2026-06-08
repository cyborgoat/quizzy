use serde::{Deserialize, Serialize};
use std::{
    fs,
    path::{Path, PathBuf},
};
use tauri::{AppHandle, Manager};

mod goals_storage;

use goals_storage::{GoalAttempt, GoalListItem, GoalMeta};

const SETTINGS_FILE: &str = "settings.json";

fn default_mistake_log_min_mistakes() -> u32 {
    1
}

fn default_mistake_log_max_correctness_percentage() -> u32 {
    100
}

#[derive(Debug, Default, Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
struct Settings {
    working_directory: Option<String>,
    #[serde(default)]
    profile_name: String,
    #[serde(default)]
    shuffle_mode: bool,
    #[serde(default = "default_mistake_log_min_mistakes")]
    mistake_log_min_mistakes: u32,
    #[serde(default = "default_mistake_log_max_correctness_percentage")]
    mistake_log_max_correctness_percentage: u32,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
struct AppSettings {
    working_directory: Option<String>,
    working_directory_available: bool,
    profile_name: String,
    shuffle_mode: bool,
    mistake_log_min_mistakes: u32,
    mistake_log_max_correctness_percentage: u32,
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
struct SaveSettingsRequest {
    working_directory: Option<String>,
    profile_name: Option<String>,
    shuffle_mode: Option<bool>,
    mistake_log_min_mistakes: Option<u32>,
    mistake_log_max_correctness_percentage: Option<u32>,
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
    serde_json::from_str(&strip_utf8_bom(contents))
        .map_err(|error| format!("Quizzy settings are invalid: {error}"))
}

fn is_json_extension(extension: &str) -> bool {
    extension.eq_ignore_ascii_case("json")
}

fn strip_utf8_bom(contents: String) -> String {
    contents
        .strip_prefix('\u{feff}')
        .unwrap_or(&contents)
        .to_string()
}

fn normalize_stored_path(path: PathBuf) -> String {
    let stored = path.to_string_lossy().into_owned();
    #[cfg(windows)]
    {
        if let Some(stripped) = stored.strip_prefix(r"\\?\") {
            return stripped.to_string();
        }
    }
    stored
}

fn validate_portable_file_stem(stem: &str) -> Result<(), String> {
    const INVALID_CHARS: &[char] = &['<', '>', ':', '"', '/', '\\', '|', '?', '*'];
    if stem
        .chars()
        .any(|character| INVALID_CHARS.contains(&character))
    {
        return Err(
            "The filename contains characters that are not supported on all platforms.".to_string(),
        );
    }
    if stem.ends_with('.') || stem.ends_with(' ') {
        return Err("Filenames cannot end with a dot or space.".to_string());
    }
    validate_windows_reserved_name(stem)
}

fn validate_windows_reserved_name(stem: &str) -> Result<(), String> {
    #[cfg(windows)]
    {
        let upper = stem.to_ascii_uppercase();
        let base = upper.split('.').next().unwrap_or(&upper);
        const RESERVED: &[&str] = &[
            "CON", "PRN", "AUX", "NUL", "COM1", "COM2", "COM3", "COM4", "COM5", "COM6", "COM7",
            "COM8", "COM9", "LPT1", "LPT2", "LPT3", "LPT4", "LPT5", "LPT6", "LPT7", "LPT8", "LPT9",
        ];
        if RESERVED.contains(&base) {
            return Err(format!(
                "\"{stem}\" is a reserved filename on Windows and cannot be used."
            ));
        }
    }
    #[cfg(not(windows))]
    let _ = stem;
    Ok(())
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
    if path
        .extension()
        .and_then(|value| value.to_str())
        .is_none_or(|extension| !is_json_extension(extension))
    {
        return Err("Quiz files must use the .json extension.".to_string());
    }
    let stem = path
        .file_stem()
        .and_then(|value| value.to_str())
        .ok_or_else(|| "The destination filename is invalid.".to_string())?;
    validate_portable_file_stem(stem)
}

fn read_text_file(path: &Path) -> Result<String, String> {
    let contents = fs::read_to_string(path)
        .map_err(|error| format!("Unable to read {}: {error}", path.display()))?;
    Ok(strip_utf8_bom(contents))
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
fn get_settings(app: AppHandle) -> Result<AppSettings, String> {
    let settings = read_settings(&app)?;
    let working_directory_available = settings
        .working_directory
        .as_ref()
        .map(|path| Path::new(path).is_dir())
        .unwrap_or(false);
    Ok(AppSettings {
        working_directory: settings.working_directory,
        working_directory_available,
        profile_name: settings.profile_name,
        shuffle_mode: settings.shuffle_mode,
        mistake_log_min_mistakes: settings.mistake_log_min_mistakes,
        mistake_log_max_correctness_percentage: settings.mistake_log_max_correctness_percentage,
    })
}

#[tauri::command]
fn save_settings(app: AppHandle, request: SaveSettingsRequest) -> Result<(), String> {
    let mut settings = read_settings(&app)?;

    if let Some(profile_name) = request.profile_name {
        settings.profile_name = profile_name;
    }

    if let Some(shuffle_mode) = request.shuffle_mode {
        settings.shuffle_mode = shuffle_mode;
    }

    if let Some(min_mistakes) = request.mistake_log_min_mistakes {
        if min_mistakes < 1 {
            return Err("Minimum mistakes per question must be at least 1.".to_string());
        }
        settings.mistake_log_min_mistakes = min_mistakes;
    }

    if let Some(max_correctness) = request.mistake_log_max_correctness_percentage {
        if max_correctness > 100 {
            return Err("Maximum correctness percentage must be between 0 and 100.".to_string());
        }
        settings.mistake_log_max_correctness_percentage = max_correctness;
    }

    if let Some(path) = request.working_directory {
        let directory = PathBuf::from(&path);
        if !directory.is_dir() {
            return Err("Select an existing directory.".to_string());
        }
        let canonical = directory
            .canonicalize()
            .map_err(|error| format!("Unable to access the selected directory: {error}"))?;
        settings.working_directory = Some(normalize_stored_path(canonical));
    }

    write_settings(&app, &settings)
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
        if !path.is_file()
            || path
                .extension()
                .and_then(|value| value.to_str())
                .is_none_or(|extension| !is_json_extension(extension))
        {
            continue;
        }
        let file_name = entry.file_name().to_string_lossy().into_owned();
        match read_text_file(&path) {
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
        if !path.is_file()
            || path
                .extension()
                .and_then(|value| value.to_str())
                .is_none_or(|extension| !is_json_extension(extension))
        {
            return Err(format!("{} is not a JSON file.", path.display()));
        }
        let file_name = path
            .file_name()
            .and_then(|value| value.to_str())
            .ok_or_else(|| format!("{} has an invalid filename.", path.display()))?
            .to_string();
        let contents = read_text_file(&path)?;
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
fn list_goals(app: AppHandle) -> Result<Vec<GoalListItem>, String> {
    goals_storage::list_goals(&app)
}

#[tauri::command]
fn upsert_goal(app: AppHandle, goal: GoalMeta) -> Result<(), String> {
    goals_storage::upsert_goal(&app, goal)
}

#[tauri::command]
fn delete_goal(app: AppHandle, goal_id: String) -> Result<(), String> {
    goals_storage::delete_goal(&app, goal_id)
}

#[tauri::command]
fn save_goal_attempt(app: AppHandle, goal_id: String, attempt: GoalAttempt) -> Result<(), String> {
    goals_storage::save_goal_attempt(&app, goal_id, attempt)
}

#[tauri::command]
fn get_goal_attempt(
    app: AppHandle,
    goal_id: String,
    attempt_id: String,
) -> Result<GoalAttempt, String> {
    goals_storage::get_goal_attempt(&app, goal_id, attempt_id)
}

#[tauri::command]
fn delete_goal_attempt(app: AppHandle, goal_id: String, attempt_id: String) -> Result<(), String> {
    goals_storage::delete_goal_attempt(&app, goal_id, attempt_id)
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
            get_settings,
            save_settings,
            read_working_directory,
            read_import_files,
            write_imported_quiz,
            delete_quiz_file,
            list_goals,
            upsert_goal,
            delete_goal,
            save_goal_attempt,
            get_goal_attempt,
            delete_goal_attempt
        ])
        .run(tauri::generate_context!())
        .expect("error while running Quizzy");
}

#[cfg(test)]
mod tests {
    use super::{
        atomic_write, is_json_extension, strip_utf8_bom, validate_json_file_name,
        validate_portable_file_stem,
    };
    use std::{fs, path::PathBuf};

    fn test_directory(name: &str) -> PathBuf {
        std::env::temp_dir().join(format!("quizzy-{name}-{}", std::process::id()))
    }

    #[test]
    fn accepts_json_extension_case_insensitively() {
        assert!(is_json_extension("json"));
        assert!(is_json_extension("JSON"));
        assert!(is_json_extension("Json"));
        assert!(!is_json_extension("txt"));
    }

    #[test]
    fn strips_utf8_bom_from_text() {
        assert_eq!(
            strip_utf8_bom("\u{feff}{\"id\":\"quiz\"}".to_string()),
            "{\"id\":\"quiz\"}"
        );
        assert_eq!(strip_utf8_bom("plain".to_string()), "plain");
    }

    #[test]
    fn rejects_traversal_and_non_json_destinations() {
        assert!(validate_json_file_name("../quiz.json").is_err());
        assert!(validate_json_file_name("nested/quiz.json").is_err());
        assert!(validate_json_file_name("quiz.txt").is_err());
        assert!(validate_json_file_name("quiz.json").is_ok());
        assert!(validate_json_file_name("quiz.JSON").is_ok());
    }

    #[test]
    fn rejects_cross_platform_invalid_filename_characters() {
        assert!(validate_json_file_name("quiz:1.json").is_err());
        assert!(validate_json_file_name("quiz?.json").is_err());
        assert!(validate_portable_file_stem("valid-name").is_ok());
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
