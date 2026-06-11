use serde::{Deserialize, Serialize};
use std::{
    collections::HashSet,
    fs,
    path::{Path, PathBuf},
};
use tauri::{AppHandle, Manager};

pub const GOALS_DIR: &str = "goals";
pub const GOAL_META_FILE: &str = "goal.json";
const LEGACY_GOALS_FILE: &str = "goals.json";
const ATTEMPTS_DIR: &str = "attempts";
const ATTEMPTS_INDEX_FILE: &str = "index.json";

#[derive(Debug, Clone, PartialEq, Deserialize, Serialize)]
#[serde(tag = "type")]
pub enum SubmittedAnswer {
    #[serde(rename = "single_choice")]
    SingleChoice {
        #[serde(rename = "selectedIndex")]
        selected_index: u32,
    },
    #[serde(rename = "multiple_choice")]
    MultipleChoice {
        #[serde(rename = "selectedIndices")]
        selected_indices: Vec<u32>,
    },
    #[serde(rename = "true_false")]
    TrueFalse {
        #[serde(rename = "selectedAnswer")]
        selected_answer: bool,
    },
}

#[derive(Debug, Clone, Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct QuestionResult {
    pub question_id: String,
    pub prompt: String,
    pub correct: bool,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub answer: Option<SubmittedAnswer>,
    #[serde(skip_serializing_if = "Option::is_none", default)]
    pub options: Option<Vec<String>>,
    #[serde(skip_serializing_if = "Option::is_none", default)]
    pub flagged: Option<bool>,
}

#[derive(Debug, Clone, Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct GoalAttempt {
    pub id: String,
    pub taken_at: String,
    pub score: u32,
    pub total: u32,
    pub percentage: u32,
    pub question_results: Vec<QuestionResult>,
}

#[derive(Debug, Clone, PartialEq, Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct AttemptSummary {
    pub id: String,
    pub taken_at: String,
    pub score: u32,
    pub total: u32,
    pub percentage: u32,
    pub incorrect_count: u32,
}

#[derive(Debug, Clone, Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct GoalMeta {
    pub id: String,
    pub quiz_id: String,
    pub quiz_title: String,
    pub description: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub target_score: Option<u32>,
    pub created_at: String,
    pub completed: bool,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub completed_at: Option<String>,
}

#[derive(Debug, Clone, Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct GoalListItem {
    #[serde(flatten)]
    pub meta: GoalMeta,
    pub attempts: Vec<AttemptSummary>,
}

#[derive(Debug, Clone, Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
struct LegacyGoal {
    id: String,
    quiz_id: String,
    quiz_title: String,
    description: String,
    #[serde(default)]
    target_score: Option<u32>,
    created_at: String,
    completed: bool,
    #[serde(default)]
    completed_at: Option<String>,
    #[serde(default)]
    attempts: Vec<GoalAttempt>,
}

impl LegacyGoal {
    fn meta(&self) -> GoalMeta {
        GoalMeta {
            id: self.id.clone(),
            quiz_id: self.quiz_id.clone(),
            quiz_title: self.quiz_title.clone(),
            description: self.description.clone(),
            target_score: self.target_score,
            created_at: self.created_at.clone(),
            completed: self.completed,
            completed_at: self.completed_at.clone(),
        }
    }
}

pub fn goals_storage_root(app: &AppHandle) -> Result<PathBuf, String> {
    goals_root(app)
}

fn goals_root(app: &AppHandle) -> Result<PathBuf, String> {
    let directory = app
        .path()
        .app_config_dir()
        .map_err(|error| format!("Unable to locate the app configuration directory: {error}"))?;
    fs::create_dir_all(&directory)
        .map_err(|error| format!("Unable to create the app configuration directory: {error}"))?;
    Ok(directory.join(GOALS_DIR))
}

fn legacy_goals_path(app: &AppHandle) -> Result<PathBuf, String> {
    let directory = app
        .path()
        .app_config_dir()
        .map_err(|error| format!("Unable to locate the app configuration directory: {error}"))?;
    Ok(directory.join(LEGACY_GOALS_FILE))
}

pub fn validate_storage_id(id: &str) -> Result<(), String> {
    if id.is_empty()
        || id.contains('/')
        || id.contains('\\')
        || id.contains("..")
        || id.contains('\0')
    {
        return Err("The goal or attempt id is invalid.".to_string());
    }
    Ok(())
}

fn goal_directory(root: &Path, goal_id: &str) -> Result<PathBuf, String> {
    validate_storage_id(goal_id)?;
    Ok(root.join(goal_id))
}

fn attempts_directory(goal_dir: &Path) -> PathBuf {
    goal_dir.join(ATTEMPTS_DIR)
}

fn read_json<T: for<'de> Deserialize<'de>>(path: &Path) -> Result<T, String> {
    let contents = fs::read_to_string(path)
        .map_err(|error| format!("Unable to read {}: {error}", path.display()))?;
    serde_json::from_str(&contents)
        .map_err(|error| format!("{} is invalid: {error}", path.display()))
}

fn write_json<T: Serialize + ?Sized>(path: &Path, value: &T) -> Result<(), String> {
    if let Some(parent) = path.parent() {
        fs::create_dir_all(parent)
            .map_err(|error| format!("Unable to create {}: {error}", parent.display()))?;
    }
    let contents = serde_json::to_vec_pretty(value)
        .map_err(|error| format!("Unable to serialize {}: {error}", path.display()))?;
    super::atomic_write(path, &contents, true)
}

fn attempt_summary(attempt: &GoalAttempt) -> AttemptSummary {
    AttemptSummary {
        id: attempt.id.clone(),
        taken_at: attempt.taken_at.clone(),
        score: attempt.score,
        total: attempt.total,
        percentage: attempt.percentage,
        incorrect_count: attempt
            .question_results
            .iter()
            .filter(|result| !result.correct)
            .count() as u32,
    }
}

fn read_attempt_summaries(goal_dir: &Path) -> Result<Vec<AttemptSummary>, String> {
    let index_path = attempts_directory(goal_dir).join(ATTEMPTS_INDEX_FILE);
    if !index_path.exists() {
        return Ok(Vec::new());
    }
    read_json(&index_path)
}

fn write_attempt_summaries(goal_dir: &Path, summaries: &[AttemptSummary]) -> Result<(), String> {
    let index_path = attempts_directory(goal_dir).join(ATTEMPTS_INDEX_FILE);
    write_json(&index_path, summaries)
}

fn write_goal_meta(goal_dir: &Path, meta: &GoalMeta) -> Result<(), String> {
    write_json(&goal_dir.join(GOAL_META_FILE), meta)
}

fn read_goal_meta(goal_dir: &Path) -> Result<GoalMeta, String> {
    read_json(&goal_dir.join(GOAL_META_FILE))
}

fn ensure_unique_quiz_goal(root: &Path, meta: &GoalMeta) -> Result<(), String> {
    if !root.exists() {
        return Ok(());
    }

    for entry in
        fs::read_dir(root).map_err(|error| format!("Unable to read goals directory: {error}"))?
    {
        let entry =
            entry.map_err(|error| format!("Unable to inspect a goals directory entry: {error}"))?;
        if !entry
            .file_type()
            .map_err(|error| error.to_string())?
            .is_dir()
        {
            continue;
        }

        let existing_path = entry.path().join(GOAL_META_FILE);
        if !existing_path.exists() {
            continue;
        }
        let existing: GoalMeta = read_json(&existing_path)?;
        if existing.quiz_id == meta.quiz_id && existing.id != meta.id {
            return Err(format!(
                "The quiz \"{}\" already has a goal.",
                meta.quiz_title
            ));
        }
    }

    Ok(())
}

fn persist_attempt(goal_dir: &Path, attempt: &GoalAttempt) -> Result<(), String> {
    validate_storage_id(&attempt.id)?;
    let attempt_path = attempts_directory(goal_dir).join(format!("{}.json", attempt.id));
    write_json(&attempt_path, attempt)?;

    let mut summaries = read_attempt_summaries(goal_dir)?;
    let summary = attempt_summary(attempt);
    if let Some(existing) = summaries.iter_mut().find(|item| item.id == attempt.id) {
        *existing = summary;
    } else {
        summaries.push(summary);
    }
    summaries.sort_by(|left, right| left.taken_at.cmp(&right.taken_at));
    write_attempt_summaries(goal_dir, &summaries)
}

pub struct RepairAttemptSummariesResult {
    pub rebuilt: bool,
    pub entries_added: u32,
    pub entries_removed: u32,
    pub relative_index_path: String,
}

pub fn repair_attempt_summaries(
    goals_root: &Path,
    goal_dir: &Path,
) -> Result<RepairAttemptSummariesResult, String> {
    let goal_id = goal_dir
        .file_name()
        .and_then(|value| value.to_str())
        .ok_or_else(|| "The goal directory name is invalid.".to_string())?;
    let relative_index_path = format!("{GOALS_DIR}/{goal_id}/{ATTEMPTS_DIR}/{ATTEMPTS_INDEX_FILE}");
    let attempts_dir = attempts_directory(goal_dir);

    let current = read_attempt_summaries(goal_dir)?;
    let current_ids: HashSet<String> = current.iter().map(|summary| summary.id.clone()).collect();

    let mut rebuilt_summaries = Vec::new();
    let mut disk_ids = HashSet::new();

    if attempts_dir.exists() {
        for entry in fs::read_dir(&attempts_dir)
            .map_err(|error| format!("Unable to read {}: {error}", attempts_dir.display()))?
        {
            let entry = entry.map_err(|error| {
                format!("Unable to inspect an attempts directory entry: {error}")
            })?;
            let path = entry.path();
            if !path.is_file() {
                continue;
            }
            let Some(file_name) = path.file_name().and_then(|value| value.to_str()) else {
                continue;
            };
            if file_name == ATTEMPTS_INDEX_FILE || !file_name.ends_with(".json") {
                continue;
            }
            let Some(attempt_id) = file_name.strip_suffix(".json") else {
                continue;
            };
            if validate_storage_id(attempt_id).is_err() {
                continue;
            }
            let attempt: GoalAttempt = match read_json(&path) {
                Ok(value) => value,
                Err(_) => continue,
            };
            if attempt.id != attempt_id {
                continue;
            }
            disk_ids.insert(attempt_id.to_string());
            rebuilt_summaries.push(attempt_summary(&attempt));
        }
    }

    rebuilt_summaries.sort_by(|left, right| left.taken_at.cmp(&right.taken_at));

    let entries_added = disk_ids.difference(&current_ids).count() as u32;
    let entries_removed = current_ids.difference(&disk_ids).count() as u32;
    let rebuilt = current != rebuilt_summaries;

    if rebuilt {
        if !attempts_dir.exists() {
            fs::create_dir_all(&attempts_dir)
                .map_err(|error| format!("Unable to create {}: {error}", attempts_dir.display()))?;
        }
        write_attempt_summaries(goal_dir, &rebuilt_summaries)?;
    }

    let _ = goals_root;
    Ok(RepairAttemptSummariesResult {
        rebuilt,
        entries_added,
        entries_removed,
        relative_index_path,
    })
}

pub fn update_goal_quiz_title(goal_dir: &Path, new_title: &str) -> Result<bool, String> {
    let mut meta = read_goal_meta(goal_dir)?;
    if meta.quiz_title == new_title {
        return Ok(false);
    }
    meta.quiz_title = new_title.to_string();
    write_goal_meta(goal_dir, &meta)?;
    Ok(true)
}

pub fn goal_meta_relative_path(goal_id: &str) -> String {
    format!("{GOALS_DIR}/{goal_id}/{GOAL_META_FILE}")
}

pub fn migrate_legacy_goals_for_sync(app: &AppHandle) -> Result<bool, String> {
    migrate_legacy_goals(app)
}

fn migrate_legacy_goals(app: &AppHandle) -> Result<bool, String> {
    let legacy_path = legacy_goals_path(app)?;
    if !legacy_path.exists() {
        return Ok(false);
    }

    let legacy_goals: Vec<LegacyGoal> = read_json(&legacy_path)?;
    let root = goals_root(app)?;

    for legacy_goal in legacy_goals {
        let goal_dir = goal_directory(&root, &legacy_goal.id)?;
        if goal_dir.exists() {
            continue;
        }
        fs::create_dir_all(&goal_dir)
            .map_err(|error| format!("Unable to create {}: {error}", goal_dir.display()))?;
        write_goal_meta(&goal_dir, &legacy_goal.meta())?;
        for attempt in legacy_goal.attempts {
            persist_attempt(&goal_dir, &attempt)?;
        }
    }

    let backup_path = legacy_path.with_extension("json.bak");
    if backup_path.exists() {
        fs::remove_file(&backup_path)
            .map_err(|error| format!("Unable to remove an existing goals backup file: {error}"))?;
    }
    fs::rename(&legacy_path, &backup_path)
        .map_err(|error| format!("Unable to archive legacy goals.json: {error}"))?;
    Ok(true)
}

pub fn list_goals(app: &AppHandle) -> Result<Vec<GoalListItem>, String> {
    let _ = migrate_legacy_goals(app)?;
    let root = goals_root(app)?;
    if !root.exists() {
        return Ok(Vec::new());
    }

    let mut goals = Vec::new();
    for entry in
        fs::read_dir(&root).map_err(|error| format!("Unable to read goals directory: {error}"))?
    {
        let entry =
            entry.map_err(|error| format!("Unable to inspect a goals directory entry: {error}"))?;
        if !entry
            .file_type()
            .map_err(|error| error.to_string())?
            .is_dir()
        {
            continue;
        }

        let goal_dir = entry.path();
        let meta_path = goal_dir.join(GOAL_META_FILE);
        if !meta_path.exists() {
            continue;
        }

        let meta = read_goal_meta(&goal_dir)?;
        let attempts = read_attempt_summaries(&goal_dir)?;
        goals.push(GoalListItem { meta, attempts });
    }

    goals.sort_by(|left, right| left.meta.created_at.cmp(&right.meta.created_at));
    Ok(goals)
}

pub fn upsert_goal(app: &AppHandle, meta: GoalMeta) -> Result<(), String> {
    let _ = migrate_legacy_goals(app)?;
    let root = goals_root(app)?;
    ensure_unique_quiz_goal(&root, &meta)?;
    let goal_dir = goal_directory(&root, &meta.id)?;
    fs::create_dir_all(&goal_dir)
        .map_err(|error| format!("Unable to create {}: {error}", goal_dir.display()))?;
    fs::create_dir_all(attempts_directory(&goal_dir))
        .map_err(|error| format!("Unable to create attempts directory: {error}"))?;
    write_goal_meta(&goal_dir, &meta)
}

pub fn goal_quiz_id(app: &AppHandle, goal_id: &str) -> Result<Option<String>, String> {
    validate_storage_id(goal_id)?;
    let goal_dir = goal_directory(&goals_root(app)?, goal_id)?;
    if !goal_dir.exists() {
        return Ok(None);
    }
    Ok(Some(read_goal_meta(&goal_dir)?.quiz_id))
}

pub fn load_goal_attempts(app: &AppHandle, goal_id: &str) -> Result<Vec<GoalAttempt>, String> {
    validate_storage_id(goal_id)?;
    let goal_dir = goal_directory(&goals_root(app)?, goal_id)?;
    if !goal_dir.join(GOAL_META_FILE).exists() {
        return Err(format!("Goal {goal_id} was not found."));
    }

    let summaries = read_attempt_summaries(&goal_dir)?;
    let mut attempts = Vec::with_capacity(summaries.len());
    for summary in summaries {
        let attempt_path = attempts_directory(&goal_dir).join(format!("{}.json", summary.id));
        if !attempt_path.exists() {
            continue;
        }
        attempts.push(read_json(&attempt_path)?);
    }
    Ok(attempts)
}

pub fn delete_goal(app: &AppHandle, goal_id: String) -> Result<(), String> {
    validate_storage_id(&goal_id)?;
    let goal_dir = goal_directory(&goals_root(app)?, &goal_id)?;
    if !goal_dir.exists() {
        return Ok(());
    }
    fs::remove_dir_all(&goal_dir)
        .map_err(|error| format!("Unable to delete goal {}: {error}", goal_id))
}

pub fn save_goal_attempt(
    app: &AppHandle,
    goal_id: String,
    attempt: GoalAttempt,
) -> Result<(), String> {
    validate_storage_id(&goal_id)?;
    let goal_dir = goal_directory(&goals_root(app)?, &goal_id)?;
    if !goal_dir.join(GOAL_META_FILE).exists() {
        return Err(format!("Goal {goal_id} was not found."));
    }
    fs::create_dir_all(attempts_directory(&goal_dir))
        .map_err(|error| format!("Unable to create attempts directory: {error}"))?;
    persist_attempt(&goal_dir, &attempt)
}

pub fn get_goal_attempt(
    app: &AppHandle,
    goal_id: String,
    attempt_id: String,
) -> Result<GoalAttempt, String> {
    validate_storage_id(&goal_id)?;
    validate_storage_id(&attempt_id)?;
    let goal_dir = goal_directory(&goals_root(app)?, &goal_id)?;
    let attempt_path = attempts_directory(&goal_dir).join(format!("{attempt_id}.json"));
    if !attempt_path.exists() {
        return Err(format!("Attempt {attempt_id} was not found."));
    }
    read_json(&attempt_path)
}

pub fn delete_goal_attempt(
    app: &AppHandle,
    goal_id: String,
    attempt_id: String,
) -> Result<(), String> {
    validate_storage_id(&goal_id)?;
    validate_storage_id(&attempt_id)?;
    let goal_dir = goal_directory(&goals_root(app)?, &goal_id)?;
    if !goal_dir.join(GOAL_META_FILE).exists() {
        return Err(format!("Goal {goal_id} was not found."));
    }
    delete_attempt_from_goal_dir(&goal_dir, &attempt_id)
}

fn delete_attempt_from_goal_dir(goal_dir: &Path, attempt_id: &str) -> Result<(), String> {
    validate_storage_id(attempt_id)?;

    let attempt_path = attempts_directory(goal_dir).join(format!("{attempt_id}.json"));
    if attempt_path.exists() {
        fs::remove_file(&attempt_path).map_err(|error| {
            format!(
                "Unable to delete attempt {}: {error}",
                attempt_path.display()
            )
        })?;
    }

    let mut summaries = read_attempt_summaries(goal_dir)?;
    let original_len = summaries.len();
    summaries.retain(|summary| summary.id != attempt_id);
    if summaries.len() != original_len {
        write_attempt_summaries(goal_dir, &summaries)?;
    }

    Ok(())
}

#[cfg(test)]
mod tests {
    use super::{
        attempt_summary, attempts_directory, delete_attempt_from_goal_dir, ensure_unique_quiz_goal,
        persist_attempt, read_attempt_summaries, repair_attempt_summaries, update_goal_quiz_title,
        write_goal_meta, AttemptSummary, GoalAttempt, GoalMeta, QuestionResult,
    };
    use std::fs;

    #[test]
    fn attempt_summary_counts_incorrect_answers() {
        let attempt = GoalAttempt {
            id: "attempt-1".into(),
            taken_at: "2026-06-08T01:00:00.000Z".into(),
            score: 1,
            total: 2,
            percentage: 50,
            question_results: vec![
                QuestionResult {
                    question_id: "q-1".into(),
                    prompt: "One".into(),
                    correct: true,
                    answer: None,
                    options: None,
                    flagged: None,
                },
                QuestionResult {
                    question_id: "q-2".into(),
                    prompt: "Two".into(),
                    correct: false,
                    answer: None,
                    options: None,
                    flagged: None,
                },
            ],
        };

        assert_eq!(attempt_summary(&attempt).incorrect_count, 1);
    }

    #[test]
    fn attempt_summary_round_trip_json() {
        let summary = AttemptSummary {
            id: "attempt-1".into(),
            taken_at: "2026-06-08T01:00:00.000Z".into(),
            score: 4,
            total: 5,
            percentage: 80,
            incorrect_count: 1,
        };
        let json = serde_json::to_string(&summary).expect("serialize summary");
        let parsed: AttemptSummary = serde_json::from_str(&json).expect("parse summary");
        assert_eq!(parsed.id, "attempt-1");
    }

    #[test]
    fn delete_attempt_from_goal_dir_removes_file_and_index_entry() {
        let temp = std::env::temp_dir().join(format!("quizzy-goals-test-{}", std::process::id()));
        let _ = fs::remove_dir_all(&temp);
        fs::create_dir_all(&temp).expect("create temp goal dir");

        let attempt = GoalAttempt {
            id: "attempt-1".into(),
            taken_at: "2026-06-08T01:00:00.000Z".into(),
            score: 1,
            total: 1,
            percentage: 100,
            question_results: vec![],
        };
        persist_attempt(&temp, &attempt).expect("persist attempt");
        assert!(attempts_directory(&temp).join("attempt-1.json").exists());

        delete_attempt_from_goal_dir(&temp, "attempt-1").expect("delete attempt");

        assert!(!attempts_directory(&temp).join("attempt-1.json").exists());
        let summaries = read_attempt_summaries(&temp).expect("read summaries");
        assert!(summaries.is_empty());

        let _ = fs::remove_dir_all(&temp);
    }

    fn goal_meta(id: &str, quiz_id: &str) -> GoalMeta {
        GoalMeta {
            id: id.into(),
            quiz_id: quiz_id.into(),
            quiz_title: "Quiz".into(),
            description: String::new(),
            target_score: None,
            created_at: "2026-06-09T00:00:00.000Z".into(),
            completed: false,
            completed_at: None,
        }
    }

    #[test]
    fn unique_quiz_goal_allows_updating_the_same_goal() {
        let temp = std::env::temp_dir().join(format!(
            "quizzy-unique-goal-update-test-{}",
            std::process::id()
        ));
        let _ = fs::remove_dir_all(&temp);
        let goal_dir = temp.join("goal-1");
        fs::create_dir_all(&goal_dir).expect("create goal dir");
        let existing = goal_meta("goal-1", "quiz-1");
        write_goal_meta(&goal_dir, &existing).expect("write goal");

        assert!(ensure_unique_quiz_goal(&temp, &existing).is_ok());

        let _ = fs::remove_dir_all(&temp);
    }

    #[test]
    fn repair_attempt_summaries_adds_missing_index_entries() {
        let temp = std::env::temp_dir().join(format!(
            "quizzy-repair-attempt-add-test-{}",
            std::process::id()
        ));
        let _ = fs::remove_dir_all(&temp);
        fs::create_dir_all(&temp).expect("create temp goal dir");

        let attempt = GoalAttempt {
            id: "attempt-1".into(),
            taken_at: "2026-06-08T01:00:00.000Z".into(),
            score: 1,
            total: 1,
            percentage: 100,
            question_results: vec![],
        };
        let attempt_path = attempts_directory(&temp).join("attempt-1.json");
        fs::create_dir_all(attempt_path.parent().unwrap()).expect("create attempts dir");
        fs::write(
            &attempt_path,
            serde_json::to_string_pretty(&attempt).expect("serialize attempt"),
        )
        .expect("write attempt");

        let result = repair_attempt_summaries(&temp, &temp).expect("repair summaries");
        assert!(result.rebuilt);
        assert_eq!(result.entries_added, 1);
        assert_eq!(result.entries_removed, 0);

        let summaries = read_attempt_summaries(&temp).expect("read summaries");
        assert_eq!(summaries.len(), 1);
        assert_eq!(summaries[0].id, "attempt-1");

        let _ = fs::remove_dir_all(&temp);
    }

    #[test]
    fn repair_attempt_summaries_removes_orphan_index_entries() {
        let temp = std::env::temp_dir().join(format!(
            "quizzy-repair-attempt-remove-test-{}",
            std::process::id()
        ));
        let _ = fs::remove_dir_all(&temp);
        fs::create_dir_all(&temp).expect("create temp goal dir");

        let summaries = vec![AttemptSummary {
            id: "missing-attempt".into(),
            taken_at: "2026-06-08T01:00:00.000Z".into(),
            score: 0,
            total: 1,
            percentage: 0,
            incorrect_count: 1,
        }];
        fs::create_dir_all(attempts_directory(&temp)).expect("create attempts dir");
        fs::write(
            attempts_directory(&temp).join("index.json"),
            serde_json::to_string_pretty(&summaries).expect("serialize summaries"),
        )
        .expect("write index");

        let result = repair_attempt_summaries(&temp, &temp).expect("repair summaries");
        assert!(result.rebuilt);
        assert_eq!(result.entries_added, 0);
        assert_eq!(result.entries_removed, 1);
        assert!(read_attempt_summaries(&temp)
            .expect("read summaries")
            .is_empty());

        let _ = fs::remove_dir_all(&temp);
    }

    #[test]
    fn update_goal_quiz_title_writes_when_changed() {
        let temp = std::env::temp_dir().join(format!(
            "quizzy-goal-title-update-test-{}",
            std::process::id()
        ));
        let _ = fs::remove_dir_all(&temp);
        let goal_dir = temp.join("goal-1");
        fs::create_dir_all(&goal_dir).expect("create goal dir");
        write_goal_meta(&goal_dir, &goal_meta("goal-1", "quiz-1")).expect("write goal");

        let updated = update_goal_quiz_title(&goal_dir, "Updated Quiz").expect("update title");
        assert!(updated);

        let meta: GoalMeta = serde_json::from_str(
            &fs::read_to_string(goal_dir.join("goal.json")).expect("read goal"),
        )
        .expect("parse goal");
        assert_eq!(meta.quiz_title, "Updated Quiz");

        let unchanged = update_goal_quiz_title(&goal_dir, "Updated Quiz").expect("update again");
        assert!(!unchanged);

        let _ = fs::remove_dir_all(&temp);
    }

    #[test]
    fn unique_quiz_goal_rejects_a_second_goal_for_the_same_quiz() {
        let temp = std::env::temp_dir().join(format!(
            "quizzy-unique-goal-create-test-{}",
            std::process::id()
        ));
        let _ = fs::remove_dir_all(&temp);
        let goal_dir = temp.join("goal-1");
        fs::create_dir_all(&goal_dir).expect("create goal dir");
        write_goal_meta(&goal_dir, &goal_meta("goal-1", "quiz-1")).expect("write goal");

        let result = ensure_unique_quiz_goal(&temp, &goal_meta("goal-2", "quiz-1"));
        assert_eq!(
            result.expect_err("duplicate goal should fail"),
            "The quiz \"Quiz\" already has a goal."
        );

        let _ = fs::remove_dir_all(&temp);
    }
}
