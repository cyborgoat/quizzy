use serde::{Deserialize, Serialize};
use std::{
    fs,
    path::{Path, PathBuf},
};
use tauri::{AppHandle, Manager};

const GOALS_DIR: &str = "goals";
const LEGACY_GOALS_FILE: &str = "goals.json";
const GOAL_META_FILE: &str = "goal.json";
const ATTEMPTS_DIR: &str = "attempts";
const ATTEMPTS_INDEX_FILE: &str = "index.json";

#[derive(Debug, Clone, Deserialize, Serialize)]
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

#[derive(Debug, Clone, Deserialize, Serialize)]
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
    #[serde(skip_serializing_if = "Option::is_none")]
    pub deadline: Option<String>,
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
    #[serde(default)]
    deadline: Option<String>,
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
            deadline: self.deadline.clone(),
            created_at: self.created_at.clone(),
            completed: self.completed,
            completed_at: self.completed_at.clone(),
        }
    }
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

fn migrate_legacy_goals(app: &AppHandle) -> Result<(), String> {
    let legacy_path = legacy_goals_path(app)?;
    if !legacy_path.exists() {
        return Ok(());
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
        .map_err(|error| format!("Unable to archive legacy goals.json: {error}"))
}

pub fn list_goals(app: &AppHandle) -> Result<Vec<GoalListItem>, String> {
    migrate_legacy_goals(app)?;
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
    migrate_legacy_goals(app)?;
    let root = goals_root(app)?;
    let goal_dir = goal_directory(&root, &meta.id)?;
    fs::create_dir_all(&goal_dir)
        .map_err(|error| format!("Unable to create {}: {error}", goal_dir.display()))?;
    fs::create_dir_all(attempts_directory(&goal_dir))
        .map_err(|error| format!("Unable to create attempts directory: {error}"))?;
    write_goal_meta(&goal_dir, &meta)
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

#[cfg(test)]
mod tests {
    use super::{attempt_summary, AttemptSummary, GoalAttempt, QuestionResult};

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
                    flagged: None,
                },
                QuestionResult {
                    question_id: "q-2".into(),
                    prompt: "Two".into(),
                    correct: false,
                    answer: None,
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
}
