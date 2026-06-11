use serde::{Deserialize, Serialize};
use std::{
    fs,
    path::{Path, PathBuf},
    process::Command,
};
use tauri::{AppHandle, Manager};

mod goals_storage;

use goals_storage::{GoalAttempt, GoalListItem, GoalMeta};

const SETTINGS_FILE: &str = "settings.json";
const KNOWLEDGE_BASE_FOLDER: &str = "knowledge-base";

fn default_mistake_log_min_mistakes() -> u32 {
    1
}

fn default_mistake_log_min_flags() -> u32 {
    1
}

fn default_mistake_log_max_correctness_percentage() -> u32 {
    100
}

fn default_ui_font_size() -> u32 {
    100
}

fn default_ui_density() -> String {
    "default".to_string()
}

const UI_FONT_SIZE_MIN: u32 = 75;
const UI_FONT_SIZE_MAX: u32 = 150;

fn clamp_ui_font_size(value: u32) -> u32 {
    value.clamp(UI_FONT_SIZE_MIN, UI_FONT_SIZE_MAX)
}

fn normalize_ui_font_size_raw(value: &str) -> u32 {
    match value {
        "small" => 88,
        "default" => 100,
        "large" => 113,
        "extra-large" => 125,
        _ => value.parse::<u32>().map(clamp_ui_font_size).unwrap_or(100),
    }
}

fn validate_ui_font_size(value: u32) -> Result<(), String> {
    if (UI_FONT_SIZE_MIN..=UI_FONT_SIZE_MAX).contains(&value) {
        Ok(())
    } else {
        Err(format!(
            "Font size must be between {UI_FONT_SIZE_MIN} and {UI_FONT_SIZE_MAX} percent."
        ))
    }
}

fn deserialize_ui_font_size<'de, D>(deserializer: D) -> Result<u32, D::Error>
where
    D: serde::Deserializer<'de>,
{
    use serde::de::{self, Visitor};
    use std::fmt;

    struct UiFontSizeVisitor;

    impl<'de> Visitor<'de> for UiFontSizeVisitor {
        type Value = u32;

        fn expecting(&self, formatter: &mut fmt::Formatter) -> fmt::Result {
            formatter.write_str("a font size percentage or legacy label")
        }

        fn visit_u64<E>(self, value: u64) -> Result<u32, E>
        where
            E: de::Error,
        {
            Ok(clamp_ui_font_size(value as u32))
        }

        fn visit_i64<E>(self, value: i64) -> Result<u32, E>
        where
            E: de::Error,
        {
            if value < 0 {
                return Ok(100);
            }
            Ok(clamp_ui_font_size(value as u32))
        }

        fn visit_str<E>(self, value: &str) -> Result<u32, E>
        where
            E: de::Error,
        {
            Ok(normalize_ui_font_size_raw(value))
        }
    }

    deserializer.deserialize_any(UiFontSizeVisitor)
}

fn validate_ui_density(value: &str) -> Result<(), String> {
    match value {
        "default" | "comfortable" | "spacious" => Ok(()),
        _ => Err("Layout density must be default, comfortable, or spacious.".to_string()),
    }
}

#[derive(Debug, Default, Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
struct Settings {
    working_directory: Option<String>,
    #[serde(default)]
    profile_name: String,
    #[serde(default)]
    shuffle_questions: bool,
    #[serde(default)]
    shuffle_options: bool,
    #[serde(default, alias = "shuffleMode", skip_serializing)]
    legacy_shuffle_mode: Option<bool>,
    #[serde(default = "default_mistake_log_min_mistakes")]
    mistake_log_min_mistakes: u32,
    #[serde(default = "default_mistake_log_min_flags")]
    mistake_log_min_flags: u32,
    #[serde(default = "default_mistake_log_max_correctness_percentage")]
    mistake_log_max_correctness_percentage: u32,
    #[serde(
        default = "default_ui_font_size",
        deserialize_with = "deserialize_ui_font_size"
    )]
    ui_font_size: u32,
    #[serde(default = "default_ui_density")]
    ui_density: String,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
struct AppSettings {
    working_directory: Option<String>,
    working_directory_available: bool,
    profile_name: String,
    shuffle_questions: bool,
    shuffle_options: bool,
    mistake_log_min_mistakes: u32,
    mistake_log_min_flags: u32,
    mistake_log_max_correctness_percentage: u32,
    ui_font_size: u32,
    ui_density: String,
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
struct SaveSettingsRequest {
    working_directory: Option<String>,
    profile_name: Option<String>,
    shuffle_questions: Option<bool>,
    shuffle_options: Option<bool>,
    #[serde(alias = "shuffleMode")]
    legacy_shuffle_mode: Option<bool>,
    mistake_log_min_mistakes: Option<u32>,
    mistake_log_min_flags: Option<u32>,
    mistake_log_max_correctness_percentage: Option<u32>,
    ui_font_size: Option<u32>,
    ui_density: Option<String>,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
struct QuizFile {
    file_name: String,
    contents: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    read_error: Option<String>,
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
    let mut settings: Settings = serde_json::from_str(&strip_utf8_bom(contents))
        .map_err(|error| format!("Quizzy settings are invalid: {error}"))?;

    if settings.legacy_shuffle_mode == Some(true)
        && !settings.shuffle_questions
        && !settings.shuffle_options
    {
        settings.shuffle_questions = true;
    }

    Ok(settings)
}

fn is_json_extension(extension: &str) -> bool {
    extension.eq_ignore_ascii_case("json")
}

fn is_md_extension(extension: &str) -> bool {
    extension.eq_ignore_ascii_case("md")
}

fn is_safe_knowledge_file_name(file_name: &str) -> bool {
    let path = Path::new(file_name);
    let Some(stem) = path.file_stem().and_then(|value| value.to_str()) else {
        return false;
    };
    if stem.is_empty() {
        return false;
    }
    if !path
        .extension()
        .and_then(|value| value.to_str())
        .is_some_and(is_md_extension)
    {
        return false;
    }
    stem.chars().all(|character| {
        character.is_alphanumeric() || character == '.' || character == '_' || character == '-'
    })
}

fn knowledge_base_directory(app: &AppHandle) -> Result<PathBuf, String> {
    let root = configured_directory(app)?;
    let path = root.join(KNOWLEDGE_BASE_FOLDER);
    if !path.exists() {
        fs::create_dir_all(&path)
            .map_err(|error| format!("Unable to create the knowledge-base folder: {error}"))?;
    }
    Ok(path)
}

fn resolve_knowledge_path(directory: &Path, file_name: &str) -> Result<PathBuf, String> {
    if !is_safe_knowledge_file_name(file_name) {
        return Err("Knowledge file names must use only letters, numbers, dots, underscores, or hyphens and end with .md.".to_string());
    }
    let path = directory.join(file_name);
    if !path.starts_with(directory) {
        return Err("Knowledge file path is invalid.".to_string());
    }
    Ok(path)
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
            .unwrap_or("settings")
    ));
    fs::write(&temp_path, contents)
        .map_err(|error| format!("Unable to write temporary quiz file: {error}"))?;
    if overwrite && path.exists() {
        let backup_path = parent.join(format!(
            ".quizzy-{}.backup",
            path.file_name()
                .and_then(|value| value.to_str())
                .unwrap_or("settings")
        ));
        if backup_path.exists() {
            fs::remove_file(&backup_path)
                .map_err(|error| format!("Unable to clear an old backup file: {error}"))?;
        }
        fs::rename(path, &backup_path)
            .map_err(|error| format!("Unable to prepare the existing file for update: {error}"))?;
        if let Err(error) = fs::rename(&temp_path, path) {
            let _ = fs::rename(&backup_path, path);
            return Err(format!("Unable to finish updating the file: {error}"));
        }
        fs::remove_file(backup_path).map_err(|error| {
            format!("The file was updated, but its temporary backup could not be removed: {error}")
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
        shuffle_questions: settings.shuffle_questions,
        shuffle_options: settings.shuffle_options,
        mistake_log_min_mistakes: settings.mistake_log_min_mistakes,
        mistake_log_min_flags: settings.mistake_log_min_flags,
        mistake_log_max_correctness_percentage: settings.mistake_log_max_correctness_percentage,
        ui_font_size: settings.ui_font_size,
        ui_density: settings.ui_density,
    })
}

#[tauri::command]
fn save_settings(app: AppHandle, request: SaveSettingsRequest) -> Result<(), String> {
    let mut settings = read_settings(&app)?;

    if let Some(profile_name) = request.profile_name {
        settings.profile_name = profile_name;
    }

    if let Some(shuffle_questions) = request.shuffle_questions {
        settings.shuffle_questions = shuffle_questions;
    } else if let Some(legacy_shuffle_mode) = request.legacy_shuffle_mode {
        settings.shuffle_questions = legacy_shuffle_mode;
    }

    if let Some(shuffle_options) = request.shuffle_options {
        settings.shuffle_options = shuffle_options;
    }

    if let Some(min_mistakes) = request.mistake_log_min_mistakes {
        if min_mistakes < 1 {
            return Err("Minimum mistakes per question must be at least 1.".to_string());
        }
        settings.mistake_log_min_mistakes = min_mistakes;
    }

    if let Some(min_flags) = request.mistake_log_min_flags {
        if min_flags < 1 {
            return Err("Minimum flags per question must be at least 1.".to_string());
        }
        settings.mistake_log_min_flags = min_flags;
    }

    if let Some(max_correctness) = request.mistake_log_max_correctness_percentage {
        if max_correctness > 100 {
            return Err("Maximum correctness percentage must be between 0 and 100.".to_string());
        }
        settings.mistake_log_max_correctness_percentage = max_correctness;
    }

    if let Some(font_size) = request.ui_font_size {
        validate_ui_font_size(font_size)?;
        settings.ui_font_size = font_size;
    }

    if let Some(density) = request.ui_density {
        validate_ui_density(&density)?;
        settings.ui_density = density;
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
fn read_knowledge_directory(app: AppHandle) -> Result<Vec<QuizFile>, String> {
    let directory = knowledge_base_directory(&app)?;
    let mut files = Vec::new();
    for entry in fs::read_dir(&directory)
        .map_err(|error| format!("Unable to read the knowledge-base folder: {error}"))?
    {
        let entry =
            entry.map_err(|error| format!("Unable to inspect a directory entry: {error}"))?;
        let path = entry.path();
        if !path.is_file()
            || path
                .extension()
                .and_then(|value| value.to_str())
                .is_none_or(|extension| !is_md_extension(extension))
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

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
struct WriteKnowledgeFileRequest {
    file_name: String,
    contents: String,
    overwrite: bool,
}

#[tauri::command]
fn write_knowledge_file(app: AppHandle, request: WriteKnowledgeFileRequest) -> Result<(), String> {
    let directory = knowledge_base_directory(&app)?;
    let path = resolve_knowledge_path(&directory, &request.file_name)?;
    atomic_write(&path, request.contents.as_bytes(), request.overwrite)
}

#[tauri::command]
fn delete_knowledge_file(app: AppHandle, file_name: String) -> Result<(), String> {
    let directory = knowledge_base_directory(&app)?;
    let path = resolve_knowledge_path(&directory, &file_name)?;
    if !path.exists() {
        return Err(format!("{} does not exist.", path.display()));
    }
    fs::remove_file(&path).map_err(|error| format!("Unable to delete {}: {error}", path.display()))
}

fn open_directory_in_file_manager(directory: PathBuf, label: &str) -> Result<(), String> {
    #[cfg(target_os = "macos")]
    let mut command = Command::new("open");
    #[cfg(target_os = "windows")]
    let mut command = Command::new("explorer");
    #[cfg(all(unix, not(target_os = "macos")))]
    let mut command = Command::new("xdg-open");

    command
        .arg(directory)
        .spawn()
        .map(|_| ())
        .map_err(|error| format!("Unable to open the {label}: {error}"))
}

#[tauri::command]
fn open_quiz_folder(app: AppHandle) -> Result<(), String> {
    open_directory_in_file_manager(configured_directory(&app)?, "quiz folder")
}

#[tauri::command]
fn open_knowledge_folder(app: AppHandle) -> Result<(), String> {
    open_directory_in_file_manager(knowledge_base_directory(&app)?, "knowledge-base folder")
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

fn focus_main_window(app: &AppHandle) {
    if let Some(window) = app.get_webview_window("main") {
        let _ = window.unminimize();
        let _ = window.show();
        let _ = window.set_focus();
    }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let mut builder = tauri::Builder::default();

    #[cfg(desktop)]
    {
        builder = builder.plugin(tauri_plugin_single_instance::init(|app, _args, _cwd| {
            focus_main_window(&app);
        }));
    }

    builder
        .plugin(tauri_plugin_dialog::init())
        .invoke_handler(tauri::generate_handler![
            get_settings,
            save_settings,
            read_working_directory,
            read_knowledge_directory,
            write_knowledge_file,
            delete_knowledge_file,
            open_quiz_folder,
            open_knowledge_folder,
            list_goals,
            upsert_goal,
            delete_goal,
            save_goal_attempt,
            get_goal_attempt,
            delete_goal_attempt
        ])
        .build(tauri::generate_context!())
        .expect("error while building Quizzy")
        .run(|app_handle, event| {
            #[cfg(target_os = "macos")]
            if let tauri::RunEvent::Reopen { .. } = event {
                focus_main_window(app_handle);
            }
        });
}

#[cfg(test)]
mod tests {
    use super::{
        atomic_write, is_json_extension, resolve_knowledge_path, strip_utf8_bom,
        KNOWLEDGE_BASE_FOLDER,
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

    #[test]
    fn resolve_knowledge_path_targets_knowledge_base_subfolder() {
        let root = test_directory("knowledge-path");
        let knowledge_base = root.join(KNOWLEDGE_BASE_FOLDER);
        fs::create_dir_all(&knowledge_base).expect("create knowledge base directory");

        let path = resolve_knowledge_path(&knowledge_base, "note-one.md").expect("resolve path");
        assert_eq!(path, knowledge_base.join("note-one.md"));

        fs::remove_dir_all(root).expect("remove test directory");
    }
}
