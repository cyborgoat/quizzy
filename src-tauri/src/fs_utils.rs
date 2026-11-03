use serde::Serialize;
use std::{
    fs,
    path::{Path, PathBuf},
    process::Command,
};
use tauri::AppHandle;

use crate::settings::read_settings;

pub(crate) const KNOWLEDGE_BASE_FOLDER: &str = "knowledge-base";

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub(crate) struct QuizFile {
    file_name: String,
    contents: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    read_error: Option<String>,
}

pub(crate) fn is_json_extension(extension: &str) -> bool {
    extension.eq_ignore_ascii_case("json")
}

pub(crate) fn is_md_extension(extension: &str) -> bool {
    extension.eq_ignore_ascii_case("md")
}

pub(crate) fn is_safe_knowledge_file_name(file_name: &str) -> bool {
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

pub(crate) fn knowledge_base_directory(app: &AppHandle) -> Result<PathBuf, String> {
    let root = configured_directory(app)?;
    let path = root.join(KNOWLEDGE_BASE_FOLDER);
    if !path.exists() {
        fs::create_dir_all(&path)
            .map_err(|error| format!("Unable to create the knowledge-base folder: {error}"))?;
    }
    Ok(path)
}

pub(crate) fn resolve_knowledge_path(directory: &Path, file_name: &str) -> Result<PathBuf, String> {
    if !is_safe_knowledge_file_name(file_name) {
        return Err("Knowledge file names must use only letters, numbers, dots, underscores, or hyphens and end with .md.".to_string());
    }
    let path = directory.join(file_name);
    if !path.starts_with(directory) {
        return Err("Knowledge file path is invalid.".to_string());
    }
    Ok(path)
}

pub(crate) fn resolve_quiz_path(directory: &Path, file_name: &str) -> Result<PathBuf, String> {
    let relative = Path::new(file_name);
    if relative.components().count() != 1
        || !relative
            .extension()
            .and_then(|value| value.to_str())
            .is_some_and(is_json_extension)
    {
        return Err("Quiz file names must be top-level JSON files.".to_string());
    }
    Ok(directory.join(relative))
}

pub(crate) fn strip_utf8_bom(contents: String) -> String {
    contents
        .strip_prefix('\u{feff}')
        .unwrap_or(&contents)
        .to_string()
}

pub(crate) fn normalize_stored_path(path: PathBuf) -> String {
    let stored = path.to_string_lossy().into_owned();
    #[cfg(windows)]
    {
        if let Some(stripped) = stored.strip_prefix(r"\\?\") {
            return stripped.to_string();
        }
    }
    stored
}

pub(crate) fn configured_directory(app: &AppHandle) -> Result<PathBuf, String> {
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

pub(crate) fn read_text_file(path: &Path) -> Result<String, String> {
    let contents = fs::read_to_string(path)
        .map_err(|error| format!("Unable to read {}: {error}", path.display()))?;
    Ok(strip_utf8_bom(contents))
}

pub(crate) fn atomic_write(path: &Path, contents: &[u8], overwrite: bool) -> Result<(), String> {
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

pub(crate) fn open_directory_in_file_manager(
    directory: PathBuf,
    label: &str,
) -> Result<(), String> {
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

/// Reads every top-level file in `directory` whose extension satisfies `matches_extension`,
/// sorted by file name. Per-file read failures are reported on the entry, not as an error.
pub(crate) fn read_library_files(
    directory: &Path,
    label: &str,
    matches_extension: fn(&str) -> bool,
) -> Result<Vec<QuizFile>, String> {
    let mut files = Vec::new();
    for entry in
        fs::read_dir(directory).map_err(|error| format!("Unable to read the {label}: {error}"))?
    {
        let entry =
            entry.map_err(|error| format!("Unable to inspect a directory entry: {error}"))?;
        let path = entry.path();
        if !path.is_file()
            || path
                .extension()
                .and_then(|value| value.to_str())
                .is_none_or(|extension| !matches_extension(extension))
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
                read_error: Some(error),
            }),
        }
    }
    files.sort_by(|left, right| left.file_name.cmp(&right.file_name));
    Ok(files)
}

#[cfg(test)]
mod tests {
    use super::{
        atomic_write, is_json_extension, resolve_knowledge_path, resolve_quiz_path, strip_utf8_bom,
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

    #[test]
    fn resolve_quiz_path_rejects_nested_or_non_json_files() {
        let root = test_directory("quiz-path");
        assert_eq!(
            resolve_quiz_path(&root, "quiz.JSON").expect("resolve quiz path"),
            root.join("quiz.JSON")
        );
        assert!(resolve_quiz_path(&root, "nested/quiz.json").is_err());
        assert!(resolve_quiz_path(&root, "../quiz.json").is_err());
        assert!(resolve_quiz_path(&root, "quiz.txt").is_err());
    }

    #[test]
    fn read_library_files_filters_by_extension_and_sorts() {
        let root = test_directory("read-library");
        fs::create_dir_all(&root).expect("create test directory");
        fs::write(root.join("b.json"), "{}").expect("write b");
        fs::write(root.join("a.json"), "\u{feff}{}").expect("write a");
        fs::write(root.join("c.txt"), "x").expect("write c");

        let files =
            super::read_library_files(&root, "test folder", is_json_extension).expect("read files");
        let names: Vec<_> = files.iter().map(|file| file.file_name.as_str()).collect();
        assert_eq!(names, ["a.json", "b.json"]);
        assert_eq!(files[0].contents, "{}");

        fs::remove_dir_all(root).expect("remove test directory");
    }
}
