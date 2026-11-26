use serde::{Deserialize, Serialize};
use std::sync::Mutex;
use std::{
    fs,
    path::{Path, PathBuf},
};
use tauri::{AppHandle, Manager};

use crate::fs_utils::{atomic_write, normalize_stored_path, strip_utf8_bom};

pub(crate) const SETTINGS_FILE: &str = "settings.json";
pub(crate) fn default_mistake_log_min_mistakes() -> u32 {
    1
}

pub(crate) fn default_mistake_log_min_flags() -> u32 {
    1
}

pub(crate) fn default_mistake_log_max_correctness_percentage() -> u32 {
    100
}

pub(crate) fn default_ui_font_size() -> u32 {
    100
}

pub(crate) fn default_knowledge_link_shortcut_key() -> String {
    "mod+l".to_string()
}

pub(crate) fn default_knowledge_new_note_shortcut_key() -> String {
    "mod+n".to_string()
}

pub(crate) fn default_zoom_in_shortcut_key() -> String {
    "mod+=".to_string()
}

pub(crate) fn default_zoom_out_shortcut_key() -> String {
    "mod+-".to_string()
}

pub(crate) fn default_toggle_sidebar_shortcut_key() -> String {
    "mod+b".to_string()
}

pub(crate) fn normalize_keybind(raw: &str) -> Result<String, String> {
    let trimmed = raw.trim().to_lowercase();
    if trimmed.is_empty() {
        return Err("Shortcut is required.".to_string());
    }

    if !trimmed.contains('+') {
        if trimmed.len() == 1
            && trimmed
                .chars()
                .next()
                .is_some_and(|c| c.is_ascii_alphabetic())
        {
            return Ok(format!("mod+{}", trimmed));
        }
        return Err("Shortcut format is invalid.".to_string());
    }

    let parts: Vec<&str> = trimmed.split('+').filter(|part| !part.is_empty()).collect();
    if parts.is_empty() {
        return Err("Shortcut format is invalid.".to_string());
    }

    let key = parts[parts.len() - 1];
    if key.is_empty() {
        return Err("Shortcut must include a key.".to_string());
    }

    let has_modifier = parts[..parts.len() - 1]
        .iter()
        .any(|part| matches!(*part, "mod" | "ctrl" | "meta" | "alt" | "shift"));
    if !has_modifier {
        return Err("Shortcut must include at least one modifier.".to_string());
    }

    Ok(parts.join("+"))
}

pub(crate) const UI_FONT_SIZE_MIN: u32 = 75;
pub(crate) const UI_FONT_SIZE_MAX: u32 = 150;

pub(crate) fn clamp_ui_font_size(value: u32) -> u32 {
    value.clamp(UI_FONT_SIZE_MIN, UI_FONT_SIZE_MAX)
}

pub(crate) fn normalize_ui_font_size_raw(value: &str) -> u32 {
    match value {
        "small" => 88,
        "default" => 100,
        "large" => 113,
        "extra-large" => 125,
        _ => value.parse::<u32>().map(clamp_ui_font_size).unwrap_or(100),
    }
}

pub(crate) fn validate_ui_font_size(value: u32) -> Result<(), String> {
    if (UI_FONT_SIZE_MIN..=UI_FONT_SIZE_MAX).contains(&value) {
        Ok(())
    } else {
        Err(format!(
            "Font size must be between {UI_FONT_SIZE_MIN} and {UI_FONT_SIZE_MAX} percent."
        ))
    }
}

pub(crate) fn deserialize_ui_font_size<'de, D>(deserializer: D) -> Result<u32, D::Error>
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

#[derive(Debug, Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
pub(crate) struct Settings {
    pub(crate) working_directory: Option<String>,
    #[serde(default)]
    pub(crate) profile_name: String,
    #[serde(default)]
    pub(crate) shuffle_questions: bool,
    #[serde(default)]
    pub(crate) shuffle_options: bool,
    #[serde(default, alias = "shuffleMode", skip_serializing)]
    pub(crate) legacy_shuffle_mode: Option<bool>,
    #[serde(default = "default_mistake_log_min_mistakes")]
    pub(crate) mistake_log_min_mistakes: u32,
    #[serde(default = "default_mistake_log_min_flags")]
    pub(crate) mistake_log_min_flags: u32,
    #[serde(default = "default_mistake_log_max_correctness_percentage")]
    pub(crate) mistake_log_max_correctness_percentage: u32,
    #[serde(
        default = "default_ui_font_size",
        deserialize_with = "deserialize_ui_font_size"
    )]
    pub(crate) ui_font_size: u32,
    #[serde(default = "default_knowledge_link_shortcut_key")]
    pub(crate) knowledge_link_shortcut_key: String,
    #[serde(default = "default_knowledge_new_note_shortcut_key")]
    pub(crate) knowledge_new_note_shortcut_key: String,
    #[serde(default = "default_zoom_in_shortcut_key")]
    pub(crate) zoom_in_shortcut_key: String,
    #[serde(default = "default_zoom_out_shortcut_key")]
    pub(crate) zoom_out_shortcut_key: String,
    #[serde(default = "default_toggle_sidebar_shortcut_key")]
    pub(crate) toggle_sidebar_shortcut_key: String,
    #[serde(default)]
    pub(crate) quizhub_enabled: bool,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub(crate) quizhub_base_url: Option<String>,
    /// App / QuizHub / welcome-sample locale (`en`, `es`, `zh`). Empty until the user chooses.
    #[serde(default)]
    pub(crate) app_locale: String,
    /// `None` means the field was never written (pre-wizard installs). Resolved in `get_settings`.
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub(crate) onboarding_completed: Option<bool>,
}

impl Default for Settings {
    fn default() -> Self {
        Self {
            working_directory: None,
            profile_name: String::new(),
            shuffle_questions: false,
            shuffle_options: false,
            legacy_shuffle_mode: None,
            mistake_log_min_mistakes: default_mistake_log_min_mistakes(),
            mistake_log_min_flags: default_mistake_log_min_flags(),
            mistake_log_max_correctness_percentage: default_mistake_log_max_correctness_percentage(),
            ui_font_size: default_ui_font_size(),
            knowledge_link_shortcut_key: default_knowledge_link_shortcut_key(),
            knowledge_new_note_shortcut_key: default_knowledge_new_note_shortcut_key(),
            zoom_in_shortcut_key: default_zoom_in_shortcut_key(),
            zoom_out_shortcut_key: default_zoom_out_shortcut_key(),
            toggle_sidebar_shortcut_key: default_toggle_sidebar_shortcut_key(),
            quizhub_enabled: false,
            quizhub_base_url: None,
            app_locale: String::new(),
            onboarding_completed: None,
        }
    }
}

fn ensure_shortcut_defaults(settings: &mut Settings) {
    if settings.knowledge_link_shortcut_key.trim().is_empty() {
        settings.knowledge_link_shortcut_key = default_knowledge_link_shortcut_key();
    }
    if settings.knowledge_new_note_shortcut_key.trim().is_empty() {
        settings.knowledge_new_note_shortcut_key = default_knowledge_new_note_shortcut_key();
    }
    if settings.zoom_in_shortcut_key.trim().is_empty() {
        settings.zoom_in_shortcut_key = default_zoom_in_shortcut_key();
    }
    if settings.zoom_out_shortcut_key.trim().is_empty() {
        settings.zoom_out_shortcut_key = default_zoom_out_shortcut_key();
    }
    if settings.toggle_sidebar_shortcut_key.trim().is_empty() {
        settings.toggle_sidebar_shortcut_key = default_toggle_sidebar_shortcut_key();
    }
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub(crate) struct AppSettings {
    working_directory: Option<String>,
    working_directory_available: bool,
    profile_name: String,
    shuffle_questions: bool,
    shuffle_options: bool,
    mistake_log_min_mistakes: u32,
    mistake_log_min_flags: u32,
    mistake_log_max_correctness_percentage: u32,
    ui_font_size: u32,
    knowledge_link_shortcut_key: String,
    knowledge_new_note_shortcut_key: String,
    zoom_in_shortcut_key: String,
    zoom_out_shortcut_key: String,
    toggle_sidebar_shortcut_key: String,
    quizhub_enabled: bool,
    quizhub_base_url: String,
    app_locale: String,
    onboarding_completed: bool,
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
pub(crate) struct SaveSettingsRequest {
    working_directory: Option<String>,
    profile_name: Option<String>,
    shuffle_questions: Option<bool>,
    shuffle_options: Option<bool>,
    mistake_log_min_mistakes: Option<u32>,
    mistake_log_min_flags: Option<u32>,
    mistake_log_max_correctness_percentage: Option<u32>,
    ui_font_size: Option<u32>,
    knowledge_link_shortcut_key: Option<String>,
    knowledge_new_note_shortcut_key: Option<String>,
    zoom_in_shortcut_key: Option<String>,
    zoom_out_shortcut_key: Option<String>,
    toggle_sidebar_shortcut_key: Option<String>,
    quizhub_enabled: Option<bool>,
    quizhub_base_url: Option<String>,
    app_locale: Option<String>,
    onboarding_completed: Option<bool>,
}

pub(crate) fn settings_path(app: &AppHandle) -> Result<PathBuf, String> {
    let directory = app
        .path()
        .app_config_dir()
        .map_err(|error| format!("Unable to locate the app configuration directory: {error}"))?;
    fs::create_dir_all(&directory)
        .map_err(|error| format!("Unable to create the app configuration directory: {error}"))?;
    Ok(directory.join(SETTINGS_FILE))
}

pub(crate) fn read_settings(app: &AppHandle) -> Result<Settings, String> {
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
    ensure_shortcut_defaults(&mut settings);

    Ok(settings)
}

pub(crate) fn write_settings(app: &AppHandle, settings: &Settings) -> Result<(), String> {
    let path = settings_path(app)?;
    let contents = serde_json::to_vec_pretty(settings)
        .map_err(|error| format!("Unable to serialize Quizzy settings: {error}"))?;
    atomic_write(&path, &contents, true)
}

#[tauri::command]
pub(crate) fn get_settings(app: AppHandle) -> Result<AppSettings, String> {
    let settings = read_settings(&app)?;
    let quizhub_base_url = crate::hub_sync::effective_base_url(&settings);
    let working_directory_available = settings
        .working_directory
        .as_ref()
        .map(|path| Path::new(path).is_dir())
        .unwrap_or(false);
    // Legacy installs already had a working directory before the wizard existed.
    let onboarding_completed = settings
        .onboarding_completed
        .unwrap_or_else(|| settings.working_directory.is_some());
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
        knowledge_link_shortcut_key: settings.knowledge_link_shortcut_key.clone(),
        knowledge_new_note_shortcut_key: settings.knowledge_new_note_shortcut_key.clone(),
        zoom_in_shortcut_key: settings.zoom_in_shortcut_key.clone(),
        zoom_out_shortcut_key: settings.zoom_out_shortcut_key.clone(),
        toggle_sidebar_shortcut_key: settings.toggle_sidebar_shortcut_key.clone(),
        quizhub_enabled: settings.quizhub_enabled,
        quizhub_base_url,
        app_locale: settings.app_locale,
        onboarding_completed,
    })
}

fn normalize_app_locale(raw: &str) -> Result<String, String> {
    match raw.trim().to_ascii_lowercase().as_str() {
        "en" => Ok("en".to_string()),
        "es" => Ok("es".to_string()),
        "zh" => Ok("zh".to_string()),
        other => Err(format!("Unsupported language \"{other}\". Use en, es, or zh.")),
    }
}

static SETTINGS_WRITE_LOCK: Mutex<()> = Mutex::new(());

pub(crate) fn update_settings(
    app: &AppHandle,
    update: impl FnOnce(&mut Settings) -> Result<(), String>,
) -> Result<(), String> {
    let _guard = SETTINGS_WRITE_LOCK
        .lock()
        .map_err(|_| "Settings are unavailable.")?;
    let mut settings = read_settings(app)?;
    update(&mut settings)?;
    write_settings(app, &settings)
}

#[tauri::command]
pub(crate) fn save_settings(app: AppHandle, request: SaveSettingsRequest) -> Result<(), String> {
    update_settings(&app, |settings| apply_settings(settings, request))
}

fn apply_settings(settings: &mut Settings, request: SaveSettingsRequest) -> Result<(), String> {
    // Partial saves (locale, directory, …) still load Settings::default() when no file exists.
    // Fill shortcut defaults before uniqueness checks so empty strings do not collide.
    ensure_shortcut_defaults(settings);

    if let Some(profile_name) = request.profile_name {
        settings.profile_name = profile_name;
    }

    if let Some(shuffle_questions) = request.shuffle_questions {
        settings.shuffle_questions = shuffle_questions;
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

    let updating_shortcuts = request.knowledge_link_shortcut_key.is_some()
        || request.knowledge_new_note_shortcut_key.is_some()
        || request.zoom_in_shortcut_key.is_some()
        || request.zoom_out_shortcut_key.is_some()
        || request.toggle_sidebar_shortcut_key.is_some();

    if let Some(link_key) = request.knowledge_link_shortcut_key {
        settings.knowledge_link_shortcut_key = normalize_keybind(&link_key)?;
    }

    if let Some(new_note_key) = request.knowledge_new_note_shortcut_key {
        settings.knowledge_new_note_shortcut_key = normalize_keybind(&new_note_key)?;
    }

    if let Some(zoom_in_key) = request.zoom_in_shortcut_key {
        settings.zoom_in_shortcut_key = normalize_keybind(&zoom_in_key)?;
    }

    if let Some(zoom_out_key) = request.zoom_out_shortcut_key {
        settings.zoom_out_shortcut_key = normalize_keybind(&zoom_out_key)?;
    }

    if let Some(toggle_sidebar_key) = request.toggle_sidebar_shortcut_key {
        settings.toggle_sidebar_shortcut_key = normalize_keybind(&toggle_sidebar_key)?;
    }

    if updating_shortcuts {
        let shortcut_values = [
            settings.knowledge_link_shortcut_key.as_str(),
            settings.knowledge_new_note_shortcut_key.as_str(),
            settings.zoom_in_shortcut_key.as_str(),
            settings.zoom_out_shortcut_key.as_str(),
            settings.toggle_sidebar_shortcut_key.as_str(),
        ];
        for (index, value) in shortcut_values.iter().enumerate() {
            if shortcut_values[..index].contains(value) || shortcut_values[index + 1..].contains(value)
            {
                return Err("Shortcuts must be unique.".to_string());
            }
        }
    }

    if let Some(quizhub_enabled) = request.quizhub_enabled {
        settings.quizhub_enabled = quizhub_enabled;
    }

    if let Some(base_url) = request.quizhub_base_url {
        let trimmed = base_url.trim();
        settings.quizhub_base_url = if trimmed.is_empty() {
            None
        } else {
            Some(crate::hub_sync::normalize_base_url(trimmed)?)
        };
    }

    if let Some(app_locale) = request.app_locale {
        settings.app_locale = normalize_app_locale(&app_locale)?;
    }

    if let Some(onboarding_completed) = request.onboarding_completed {
        settings.onboarding_completed = Some(onboarding_completed);
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

    Ok(())
}

#[cfg(test)]
mod tests {
    use super::{
        apply_settings, ensure_shortcut_defaults, normalize_keybind, SaveSettingsRequest, Settings,
    };

    #[test]
    fn default_settings_have_unique_shortcuts() {
        let settings = Settings::default();
        let keys = [
            settings.knowledge_link_shortcut_key.as_str(),
            settings.knowledge_new_note_shortcut_key.as_str(),
            settings.zoom_in_shortcut_key.as_str(),
            settings.zoom_out_shortcut_key.as_str(),
            settings.toggle_sidebar_shortcut_key.as_str(),
        ];
        for key in keys {
            assert!(!key.is_empty());
            assert_eq!(keys.iter().filter(|candidate| **candidate == key).count(), 1);
        }
    }

    #[test]
    fn saving_locale_on_fresh_settings_does_not_require_shortcut_fields() {
        let mut settings = Settings {
            knowledge_link_shortcut_key: String::new(),
            knowledge_new_note_shortcut_key: String::new(),
            zoom_in_shortcut_key: String::new(),
            zoom_out_shortcut_key: String::new(),
            toggle_sidebar_shortcut_key: String::new(),
            ..Settings::default()
        };
        apply_settings(
            &mut settings,
            SaveSettingsRequest {
                working_directory: None,
                profile_name: None,
                shuffle_questions: None,
                shuffle_options: None,
                mistake_log_min_mistakes: None,
                mistake_log_min_flags: None,
                mistake_log_max_correctness_percentage: None,
                ui_font_size: None,
                knowledge_link_shortcut_key: None,
                knowledge_new_note_shortcut_key: None,
                zoom_in_shortcut_key: None,
                zoom_out_shortcut_key: None,
                toggle_sidebar_shortcut_key: None,
                quizhub_enabled: None,
                quizhub_base_url: None,
                app_locale: Some("zh".to_string()),
                onboarding_completed: None,
            },
        )
        .expect("locale save");
        assert_eq!(settings.app_locale, "zh");
        apply_settings(
            &mut settings,
            SaveSettingsRequest {
                working_directory: None,
                profile_name: None,
                shuffle_questions: None,
                shuffle_options: None,
                mistake_log_min_mistakes: None,
                mistake_log_min_flags: None,
                mistake_log_max_correctness_percentage: None,
                ui_font_size: None,
                knowledge_link_shortcut_key: None,
                knowledge_new_note_shortcut_key: None,
                zoom_in_shortcut_key: None,
                zoom_out_shortcut_key: None,
                toggle_sidebar_shortcut_key: None,
                quizhub_enabled: None,
                quizhub_base_url: None,
                app_locale: Some("es".to_string()),
                onboarding_completed: None,
            },
        )
        .expect("spanish locale save");
        assert_eq!(settings.app_locale, "es");
        ensure_shortcut_defaults(&mut settings);
        assert_eq!(settings.knowledge_link_shortcut_key, "mod+l");
    }

    #[test]
    fn normalize_keybind_accepts_legacy_single_letter_shortcuts() {
        assert_eq!(normalize_keybind("l").expect("normalize"), "mod+l");
    }

    #[test]
    fn normalize_keybind_rejects_invalid_formats() {
        assert!(normalize_keybind("").is_err());
        assert!(normalize_keybind("notvalid").is_err());
    }

    #[test]
    fn normalize_keybind_preserves_full_shortcuts() {
        assert_eq!(
            normalize_keybind("mod+shift+k").expect("normalize"),
            "mod+shift+k"
        );
    }
}
