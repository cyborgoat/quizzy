use std::{
    collections::HashSet,
    fs,
    io::{ErrorKind, Write},
    path::{Path, PathBuf},
};

use super::{is_safe_id, local_file_name, HubKind, LocalContext};
use crate::{fs_utils::atomic_write, goals_storage, quiz_archive};
use serde_json::Value;

/// Unlike a hash lookup, distinguish a missing file from unreadable files and directories.
pub(super) fn read_target(path: &Path) -> Result<Option<Vec<u8>>, String> {
    match fs::symlink_metadata(path) {
        Err(error) if error.kind() == ErrorKind::NotFound => Ok(None),
        Ok(metadata) if metadata.is_file() => fs::read(path).map(Some).map_err(|e| e.to_string()),
        Ok(_) => Err(format!("{} is not a regular file.", path.display())),
        Err(error) => Err(error.to_string()),
    }
}

fn scalar(value: &str) -> &str {
    let value = value.trim();
    value
        .strip_prefix('"')
        .and_then(|s| s.strip_suffix('"'))
        .or_else(|| value.strip_prefix('\'').and_then(|s| s.strip_suffix('\'')))
        .unwrap_or(value)
}

fn note_parts(text: &str) -> Option<(&str, &str, &str)> {
    let text = text.trim_start_matches('\u{feff}');
    let start = text.find('\n')? + 1;
    if text[..start].trim_end() != "---" {
        return None;
    }
    let mut end = start;
    for line in text[start..].split_inclusive('\n') {
        if line.trim_end() == "---" {
            return Some((&text[..start], &text[start..end], &text[end..]));
        }
        end += line.len();
    }
    None
}

fn note_field<'a>(header: &'a str, key: &str) -> Option<&'a str> {
    header
        .lines()
        .filter_map(|line| line.split_once(':'))
        .filter(|(field, _)| field.trim() == key)
        .map(|(_, value)| scalar(value))
        .last()
        .filter(|value| !value.is_empty())
}

pub(super) fn content_id(kind: HubKind, bytes: &[u8]) -> Option<String> {
    let text = std::str::from_utf8(bytes)
        .ok()?
        .trim_start_matches('\u{feff}');
    match kind {
        HubKind::Quiz => {
            let quiz: serde_json::Value = serde_json::from_str(text).ok()?;
            quiz.get("id")?
                .as_str()
                .map(str::trim)
                .filter(|id| !id.is_empty())
                .map(str::to_string)
        }
        HubKind::Note => note_field(note_parts(text)?.1, "id").map(str::to_string),
    }
}

fn rewrite_note(text: &str, old_id: &str, new_id: &str, change_links: bool) -> Option<String> {
    let (start, header, end) = note_parts(text)?;
    let mut result = String::from(start);
    let mut links = false;
    for line in header.split_inclusive('\n') {
        let field = line.trim_start().trim_start_matches("- ");
        if let Some((key, value)) = field.split_once(':') {
            let key = key.trim();
            if !line.starts_with(char::is_whitespace) && !line.starts_with('-') {
                links = key == "linkedQuizQuestions";
            }
            if scalar(value) == old_id
                && ((!change_links && key == "id") || (change_links && links && key == "quizId"))
            {
                result.push_str(&line[..line.find(':')? + 1]);
                result.push(' ');
                result.push_str(new_id);
                result.push_str(if line.ends_with("\r\n") { "\r\n" } else { "\n" });
                continue;
            }
        }
        result.push_str(line);
    }
    result.push_str(end);
    Some(result)
}

fn has_text(value: &Value) -> bool {
    value.as_str().is_some_and(|text| !text.trim().is_empty())
}

fn valid_quiz(quiz: &Value) -> bool {
    let Some(questions) = quiz["questions"]
        .as_array()
        .filter(|items| !items.is_empty())
    else {
        return false;
    };
    if !has_text(&quiz["title"])
        || quiz
            .get("description")
            .is_some_and(|value| !has_text(value))
        || quiz.get("tags").is_some_and(|tags| {
            !tags
                .as_array()
                .is_some_and(|tags| tags.iter().all(has_text))
        })
    {
        return false;
    }
    let mut ids = HashSet::new();
    questions.iter().all(|question| {
        let Some(id) = question["id"]
            .as_str()
            .map(str::trim)
            .filter(|id| !id.is_empty())
        else {
            return false;
        };
        if !ids.insert(id)
            || !has_text(&question["prompt"])
            || question
                .get("explanation")
                .is_some_and(|value| !has_text(value))
        {
            return false;
        }
        if question["type"] == "true_false" {
            return question["answer"].is_boolean();
        }
        let Some(options) = question["options"]
            .as_array()
            .filter(|options| options.len() >= 2 && options.iter().all(has_text))
        else {
            return false;
        };
        let in_range = |index: &Value| index.as_u64().filter(|index| *index < options.len() as u64);
        match question["type"].as_str() {
            Some("single_choice") => in_range(&question["answerIndex"]).is_some(),
            Some("multiple_choice") => {
                question["answerIndices"].as_array().is_some_and(|indices| {
                    let mut seen = HashSet::new();
                    !indices.is_empty()
                        && indices
                            .iter()
                            .all(|index| in_range(index).is_some_and(|i| seen.insert(i)))
                })
            }
            _ => false,
        }
    })
}

fn renamed_contents(kind: HubKind, bytes: &[u8], old_id: &str, new_id: &str) -> Option<Vec<u8>> {
    let text = std::str::from_utf8(bytes)
        .ok()?
        .trim_start_matches('\u{feff}');
    match kind {
        HubKind::Quiz => {
            let mut quiz: serde_json::Value = serde_json::from_str(text).ok()?;
            if !valid_quiz(&quiz) {
                return None;
            }
            quiz["id"] = new_id.into();
            let mut bytes = serde_json::to_vec_pretty(&quiz).ok()?;
            bytes.push(b'\n');
            Some(bytes)
        }
        HubKind::Note => {
            let header = note_parts(text)?.1;
            for key in ["title", "createdAt", "updatedAt"] {
                note_field(header, key)?;
            }
            rewrite_note(text, old_id, new_id, false).map(String::into_bytes)
        }
    }
}

pub(super) fn rename_candidate(kind: HubKind, bytes: &[u8]) -> bool {
    content_id(kind, bytes)
        .is_some_and(|id| renamed_contents(kind, bytes, &id, "local-copy").is_some())
}

pub(super) fn suggested_name(path: &Path) -> String {
    let stem = path.file_stem().unwrap_or_default().to_string_lossy();
    let extension = path.extension().unwrap_or_default().to_string_lossy();
    for number in 1.. {
        let suffix = if number == 1 {
            "-local".into()
        } else {
            format!("-local-{number}")
        };
        let stem = &stem[..stem.len().min(128 - suffix.len())];
        let name = format!("{stem}{suffix}.{extension}");
        if !path.with_file_name(&name).exists() {
            return name;
        }
    }
    unreachable!()
}

pub(super) struct FileChange {
    pub path: PathBuf,
    pub before: Option<Vec<u8>>,
    pub after: Vec<u8>,
}

impl FileChange {
    pub fn replace(path: PathBuf, before: Vec<u8>, after: Vec<u8>) -> Self {
        Self {
            path,
            before: Some(before),
            after,
        }
    }
}

fn write_new(path: &Path, bytes: &[u8]) -> Result<(), String> {
    let mut file = fs::OpenOptions::new()
        .write(true)
        .create_new(true)
        .open(path)
        .map_err(|error| error.to_string())?;
    if let Err(error) = file.write_all(bytes) {
        drop(file);
        let _ = fs::remove_file(path);
        return Err(error.to_string());
    }
    Ok(())
}

pub(super) fn apply_changes(changes: &[FileChange]) -> Result<(), String> {
    let mut applied: Vec<&FileChange> = Vec::new();
    for change in changes {
        let mut attempted_write = false;
        let result = (|| {
            if read_target(&change.path)? != change.before {
                return Err(format!(
                    "{} changed during installation.",
                    change.path.display()
                ));
            }
            attempted_write = true;
            if change.before.is_some() {
                atomic_write(&change.path, &change.after, true)
            } else {
                write_new(&change.path, &change.after)
            }
        })();
        if let Err(error) = result {
            // A failed write can report an error after replacement, e.g. while cleaning its backup.
            if attempted_write
                && change.before.is_some()
                && read_target(&change.path).ok().flatten().as_ref() == Some(&change.after)
            {
                applied.push(change);
            }
            let mut rollback_errors = Vec::new();
            for undo in applied.into_iter().rev() {
                let restore = match &undo.before {
                    Some(bytes) => atomic_write(&undo.path, bytes, true),
                    None => fs::remove_file(&undo.path).map_err(|e| e.to_string()),
                };
                if let Err(cause) = restore {
                    rollback_errors.push(format!("{}: {cause}", undo.path.display()));
                }
            }
            if !rollback_errors.is_empty() {
                return Err(format!(
                    "{error} Rollback failed for {}",
                    rollback_errors.join(", ")
                ));
            }
            return Err(error);
        }
        applied.push(change);
    }
    Ok(())
}

pub(super) fn rename_changes(
    ctx: &LocalContext,
    kind: HubKind,
    destination: &Path,
    file_name: &str,
    existing: &[u8],
) -> Result<Vec<FileChange>, String> {
    let new_id = Path::new(file_name)
        .file_stem()
        .and_then(|stem| stem.to_str())
        .filter(|stem| is_safe_id(stem))
        .ok_or("Enter a filename using letters, numbers, dots, hyphens, or underscores.")?;
    if local_file_name(kind, new_id)? != file_name {
        return Err("Use the original file extension.".into());
    }
    let renamed = ctx.dirs.path_for(kind, file_name)?;
    if read_target(&renamed)?.is_some() {
        return Err("That filename is already in use.".into());
    }
    let old_id = content_id(kind, existing)
        .ok_or("The existing file cannot be opened as a library item.")?;
    let after = renamed_contents(kind, existing, &old_id, new_id)
        .ok_or("The existing file cannot be opened as a library item.")?;
    let parent = destination
        .parent()
        .ok_or("The destination has no parent folder.")?;
    for entry in fs::read_dir(parent).map_err(|error| error.to_string())? {
        let path = entry.map_err(|error| error.to_string())?.path();
        if path != destination
            && path
                .extension()
                .and_then(|ext| ext.to_str())
                .is_some_and(|ext| {
                    destination.extension().is_some_and(|expected| {
                        ext.eq_ignore_ascii_case(&expected.to_string_lossy())
                    })
                })
            && path.is_file()
        {
            let bytes = fs::read(path).map_err(|e| e.to_string())?;
            if content_id(kind, &bytes).as_deref() == Some(new_id) {
                return Err("Another library item already uses that ID.".into());
            }
        }
    }

    let mut changes = vec![FileChange {
        path: renamed,
        before: None,
        after,
    }];
    if kind == HubKind::Quiz {
        let root = goals_storage::library_goals_root(ctx.cache_directory(), &ctx.workspace);
        let goals = goals_storage::list_goals(&root)?;
        if goals.iter().any(|goal| goal.meta.quiz_id == new_id) {
            return Err("Study history already uses that quiz ID.".into());
        }
        for goal in goals.into_iter().filter(|goal| goal.meta.quiz_id == old_id) {
            let path = goals_storage::goal_directory_path(&root, &goal.meta.id)?
                .join(goals_storage::GOAL_META_FILE);
            let before = fs::read(&path).map_err(|e| e.to_string())?;
            let mut meta: goals_storage::GoalMeta =
                serde_json::from_slice(&before).map_err(|e| e.to_string())?;
            if meta.quiz_id != old_id {
                return Err("Study history changed during installation.".into());
            }
            meta.quiz_id = new_id.into();
            let after = serde_json::to_vec_pretty(&meta).map_err(|e| e.to_string())?;
            changes.push(FileChange::replace(path, before, after));
        }
        for entry in fs::read_dir(&ctx.dirs.notes).map_err(|e| e.to_string())? {
            let path = entry.map_err(|e| e.to_string())?.path();
            if !path
                .extension()
                .and_then(|ext| ext.to_str())
                .is_some_and(crate::fs_utils::is_md_extension)
                || !path.is_file()
            {
                continue;
            }
            let before = fs::read(&path).map_err(|e| e.to_string())?;
            if let Ok(text) = std::str::from_utf8(&before) {
                if let Some(after) = rewrite_note(text, &old_id, new_id, true) {
                    if after.as_bytes() != before {
                        changes.push(FileChange::replace(path, before, after.into_bytes()));
                    }
                }
            }
        }
    }
    if let Some((path, before, after)) = quiz_archive::rename_registry_update(
        ctx.cache_directory(),
        &ctx.workspace,
        kind == HubKind::Quiz,
        &old_id,
        new_id,
    )? {
        changes.push(FileChange::replace(path, before, after));
    }
    Ok(changes)
}
