use serde::Deserialize;
use std::{
    collections::{HashMap, HashSet},
    fs,
    path::Path,
};
use tauri::AppHandle;

use crate::{
    goals_storage::{
        goal_meta_relative_path, goals_storage_root, list_goals, migrate_legacy_goals_for_sync,
        repair_attempt_summaries, update_goal_quiz_title, GOAL_META_FILE,
    },
    mistake_index::{mistake_index_relative_path, rebuild_all, write_index_for_sync},
};

const MAX_SYNC_CHANGES: usize = 20;
const KNOWLEDGE_BASE_FOLDER: &str = "knowledge-base";

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SyncChange {
    pub kind: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub path: Option<String>,
    pub detail: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SyncWarning {
    pub kind: String,
    pub detail: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SyncReport {
    pub quizzes_scanned: u32,
    pub knowledge_notes_scanned: u32,
    pub goals_checked: u32,
    pub app_config_files_written: u32,
    pub attempt_indexes_rebuilt: u32,
    pub attempt_index_entries_added: u32,
    pub attempt_index_entries_removed: u32,
    pub goal_titles_updated: u32,
    pub mistake_index_rebuilt: bool,
    pub mistake_index_entries: u32,
    pub legacy_goals_migrated: bool,
    pub changes: Vec<SyncChange>,
    pub changes_truncated: bool,
    pub warnings: Vec<SyncWarning>,
}

use serde::Serialize;

#[derive(Debug, Deserialize)]
struct QuizCatalogEntry {
    id: String,
    title: String,
}

fn is_json_extension(extension: &str) -> bool {
    extension.eq_ignore_ascii_case("json")
}

fn is_md_extension(extension: &str) -> bool {
    extension.eq_ignore_ascii_case("md")
}

fn push_change(report: &mut SyncReport, kind: &str, path: Option<String>, detail: String) {
    if report.changes.len() < MAX_SYNC_CHANGES {
        report.changes.push(SyncChange {
            kind: kind.to_string(),
            path,
            detail,
        });
    } else {
        report.changes_truncated = true;
    }
}

fn count_knowledge_notes(directory: &Path) -> u32 {
    let knowledge_dir = directory.join(KNOWLEDGE_BASE_FOLDER);
    if !knowledge_dir.exists() {
        return 0;
    }
    let Ok(entries) = fs::read_dir(&knowledge_dir) else {
        return 0;
    };
    entries
        .filter_map(Result::ok)
        .filter(|entry| {
            entry.path().is_file()
                && entry
                    .path()
                    .extension()
                    .and_then(|value| value.to_str())
                    .is_some_and(is_md_extension)
        })
        .count() as u32
}

fn load_quiz_catalog(directory: &Path) -> (u32, HashMap<String, String>) {
    let mut catalog = HashMap::new();
    let Ok(entries) = fs::read_dir(directory) else {
        return (0, catalog);
    };

    let mut scanned = 0u32;
    for entry in entries.filter_map(Result::ok) {
        let path = entry.path();
        if !path.is_file()
            || path
                .extension()
                .and_then(|value| value.to_str())
                .is_none_or(|extension| !is_json_extension(extension))
        {
            continue;
        }
        scanned += 1;
        let Ok(contents) = fs::read_to_string(&path) else {
            continue;
        };
        let contents = contents.strip_prefix('\u{feff}').unwrap_or(&contents);
        let Ok(entry) = serde_json::from_str::<QuizCatalogEntry>(contents) else {
            continue;
        };
        if !entry.id.is_empty() && !entry.title.is_empty() {
            catalog.insert(entry.id, entry.title);
        }
    }

    (scanned, catalog)
}

fn working_directory_from_settings(app: &AppHandle) -> Option<std::path::PathBuf> {
    let settings = crate::read_settings_for_sync(app).ok()?;
    let path = settings.working_directory?;
    let directory = std::path::PathBuf::from(path);
    if directory.is_dir() {
        Some(directory)
    } else {
        None
    }
}

pub fn synchronize_app_data(app: &AppHandle) -> Result<SyncReport, String> {
    let mut report = SyncReport {
        quizzes_scanned: 0,
        knowledge_notes_scanned: 0,
        goals_checked: 0,
        app_config_files_written: 0,
        attempt_indexes_rebuilt: 0,
        attempt_index_entries_added: 0,
        attempt_index_entries_removed: 0,
        goal_titles_updated: 0,
        mistake_index_rebuilt: false,
        mistake_index_entries: 0,
        legacy_goals_migrated: false,
        changes: Vec::new(),
        changes_truncated: false,
        warnings: Vec::new(),
    };

    let mut written_paths = HashSet::new();

    report.legacy_goals_migrated = migrate_legacy_goals_for_sync(app)?;
    if report.legacy_goals_migrated {
        push_change(
            &mut report,
            "legacy_goals_migrated",
            Some("goals.json".to_string()),
            "Archived legacy goals.json and migrated goals into per-goal storage.".to_string(),
        );
        written_paths.insert("goals.json.bak".to_string());
    }

    let quiz_catalog = match working_directory_from_settings(app) {
        Some(directory) => {
            let (scanned, catalog) = load_quiz_catalog(&directory);
            report.quizzes_scanned = scanned;
            report.knowledge_notes_scanned = count_knowledge_notes(&directory);
            catalog
        }
        None => {
            report.warnings.push(SyncWarning {
                kind: "working_directory_unavailable".to_string(),
                detail:
                    "Working directory unavailable — quiz and knowledge folders were not rescanned."
                        .to_string(),
            });
            HashMap::new()
        }
    };

    let goals_root = goals_storage_root(app)?;
    let goals = list_goals(app)?;
    report.goals_checked = goals.len() as u32;

    for goal in goals {
        let goal_dir = goals_root.join(&goal.meta.id);
        if !goal_dir.join(GOAL_META_FILE).exists() {
            continue;
        }

        let repair = repair_attempt_summaries(&goals_root, &goal_dir)?;
        report.attempt_index_entries_added += repair.entries_added;
        report.attempt_index_entries_removed += repair.entries_removed;

        if repair.rebuilt {
            report.attempt_indexes_rebuilt += 1;
            written_paths.insert(repair.relative_index_path.clone());
            let mut detail = String::new();
            if repair.entries_added > 0 {
                detail.push_str(&format!(
                    "Added {} attempt summar{}",
                    repair.entries_added,
                    if repair.entries_added == 1 {
                        "y"
                    } else {
                        "ies"
                    }
                ));
            }
            if repair.entries_removed > 0 {
                if !detail.is_empty() {
                    detail.push_str(", ");
                }
                detail.push_str(&format!(
                    "removed {} orphan entr{}",
                    repair.entries_removed,
                    if repair.entries_removed == 1 {
                        "y"
                    } else {
                        "ies"
                    }
                ));
            }
            if detail.is_empty() {
                detail = "Rebuilt attempt summary index.".to_string();
            }
            push_change(
                &mut report,
                "attempt_index_rebuilt",
                Some(repair.relative_index_path),
                detail,
            );
        }

        if let Some(title) = quiz_catalog.get(&goal.meta.quiz_id) {
            if update_goal_quiz_title(&goal_dir, title)? {
                report.goal_titles_updated += 1;
                let relative_path = goal_meta_relative_path(&goal.meta.id);
                written_paths.insert(relative_path.clone());
                push_change(
                    &mut report,
                    "goal_title_updated",
                    Some(relative_path),
                    format!("Updated quiz title to \"{title}\"."),
                );
            }
        } else if !quiz_catalog.is_empty() || report.quizzes_scanned > 0 {
            report.warnings.push(SyncWarning {
                kind: "goal_quiz_missing".to_string(),
                detail: format!(
                    "Goal for \"{}\" (quiz {}, {} attempt{}) — quiz file not found in the working directory.",
                    goal.meta.quiz_title,
                    goal.meta.quiz_id,
                    goal.attempts.len(),
                    if goal.attempts.len() == 1 { "" } else { "s" }
                ),
            });
        }
    }

    let rebuilt_index = rebuild_all(app)?;
    let mistake_entry_count = rebuilt_index.entries.len() as u32;
    report.mistake_index_entries = mistake_entry_count;
    let previous_index = crate::mistake_index::read_existing_index(app)?;
    let mistake_changed = previous_index.as_ref() != Some(&rebuilt_index);
    if mistake_changed {
        write_index_for_sync(app, &rebuilt_index)?;
        report.mistake_index_rebuilt = true;
        let mistake_path = mistake_index_relative_path().to_string();
        written_paths.insert(mistake_path.clone());
        push_change(
            &mut report,
            "mistake_index_rebuilt",
            Some(mistake_path),
            format!(
                "Rebuilt Mistake Log index ({} question{} tracked).",
                mistake_entry_count,
                if mistake_entry_count == 1 { "" } else { "s" }
            ),
        );
    }

    report.app_config_files_written = written_paths.len() as u32;
    Ok(report)
}
