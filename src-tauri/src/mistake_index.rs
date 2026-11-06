//! Mistake Log aggregates, sharded per goal.
//!
//! Each goal stores its own `goals/<goalId>/mistakes.json` (compact JSON). Saving an attempt folds
//! only that attempt into the goal's shard, deleting an attempt or a goal touches only that goal's
//! shard, and staleness is detected per shard by comparing its `attemptCount` with the length of the
//! goal's `attempts/index.json`. `get_mistake_index` concatenates the shards for the UI.

use serde::{Deserialize, Serialize};
use std::{
    collections::HashMap,
    path::{Path, PathBuf},
};
use tauri::{AppHandle, Manager};

use crate::goals_storage::{GoalAttempt, QuestionResult, SubmittedAnswer, GOALS_DIR};

const MISTAKE_SHARD_FILE: &str = "mistakes.json";
const LEGACY_MISTAKE_INDEX_FILE: &str = "mistake-index.json";
const MISTAKE_INDEX_VERSION: u32 = 2;

/// One row of the Mistake Log as sent to the UI.
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct MistakeIndexEntry {
    pub quiz_id: String,
    pub quiz_title: String,
    pub question_id: String,
    pub prompt: String,
    pub mistake_count: u32,
    pub flagged_count: u32,
    pub total_attempts: u32,
    pub correct_count: u32,
    pub correctness_percentage: u32,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub last_mistaken_at: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub last_flagged_at: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub last_incorrect_answer: Option<SubmittedAnswer>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub last_incorrect_options: Option<Vec<String>>,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct MistakeIndex {
    pub version: u32,
    pub scored_attempt_count: u32,
    pub entries: Vec<MistakeIndexEntry>,
}

/// Stored per-question aggregate. Quiz id/title come from the goal, derived counts are computed on
/// read, so only the raw counters are persisted.
#[derive(Debug, Clone, Default, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
struct ShardEntry {
    question_id: String,
    prompt: String,
    mistake_count: u32,
    flagged_count: u32,
    total_attempts: u32,
    #[serde(skip_serializing_if = "Option::is_none", default)]
    last_mistaken_at: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none", default)]
    last_flagged_at: Option<String>,
    last_prompt_at: String,
    #[serde(skip_serializing_if = "Option::is_none", default)]
    last_incorrect_answer: Option<SubmittedAnswer>,
    #[serde(skip_serializing_if = "Option::is_none", default)]
    last_incorrect_options: Option<Vec<String>>,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
struct MistakeShard {
    version: u32,
    attempt_count: u32,
    entries: Vec<ShardEntry>,
}

fn shard_path(goal_dir: &Path) -> PathBuf {
    goal_dir.join(MISTAKE_SHARD_FILE)
}

fn shard_relative_path(goal_id: &str) -> String {
    format!("{GOALS_DIR}/{goal_id}/{MISTAKE_SHARD_FILE}")
}

/// Reads a shard. A missing, unreadable, or outdated shard is treated as absent so callers rebuild
/// it from the attempt files.
fn read_shard(goal_dir: &Path) -> Option<MistakeShard> {
    let contents = std::fs::read(shard_path(goal_dir)).ok()?;
    let shard: MistakeShard = serde_json::from_slice(&contents).ok()?;
    (shard.version == MISTAKE_INDEX_VERSION).then_some(shard)
}

fn write_shard(goal_dir: &Path, shard: &MistakeShard) -> Result<(), String> {
    let path = shard_path(goal_dir);
    let contents = serde_json::to_vec(shard)
        .map_err(|error| format!("Unable to serialize {}: {error}", path.display()))?;
    crate::fs_utils::atomic_write(&path, &contents, true)
}

fn is_flagged(result: &QuestionResult) -> bool {
    result.flagged.unwrap_or(false)
}

fn apply_question_result(row: &mut ShardEntry, result: &QuestionResult, taken_at: &str) {
    row.total_attempts += 1;

    if taken_at >= row.last_prompt_at.as_str() {
        row.prompt = result.prompt.clone();
        row.last_prompt_at = taken_at.to_string();
    }

    if !result.correct {
        row.mistake_count += 1;
        if row
            .last_mistaken_at
            .as_ref()
            .is_none_or(|last| taken_at > last.as_str())
        {
            row.last_mistaken_at = Some(taken_at.to_string());
            row.last_incorrect_answer = result.answer.clone();
            row.last_incorrect_options = result.options.clone();
        }
    }

    if is_flagged(result) {
        row.flagged_count += 1;
        if row
            .last_flagged_at
            .as_ref()
            .is_none_or(|last| taken_at > last.as_str())
        {
            row.last_flagged_at = Some(taken_at.to_string());
        }
    }
}

fn fold_attempt(rows: &mut HashMap<String, ShardEntry>, attempt: &GoalAttempt) {
    for result in &attempt.question_results {
        let row = rows
            .entry(result.question_id.clone())
            .or_insert_with(|| ShardEntry {
                question_id: result.question_id.clone(),
                prompt: result.prompt.clone(),
                last_prompt_at: attempt.taken_at.clone(),
                ..Default::default()
            });
        apply_question_result(row, result, &attempt.taken_at);
    }
}

fn rows_into_entries(rows: HashMap<String, ShardEntry>) -> Vec<ShardEntry> {
    let mut entries: Vec<ShardEntry> = rows.into_values().collect();
    entries.sort_by(|left, right| left.question_id.cmp(&right.question_id));
    entries
}

fn aggregate_attempts(attempts: &[GoalAttempt]) -> Vec<ShardEntry> {
    let mut rows = HashMap::new();
    for attempt in attempts {
        fold_attempt(&mut rows, attempt);
    }
    rows_into_entries(rows)
}

fn build_shard(attempts: &[GoalAttempt], attempt_count: u32) -> MistakeShard {
    MistakeShard {
        version: MISTAKE_INDEX_VERSION,
        attempt_count,
        entries: aggregate_attempts(attempts),
    }
}

fn finish_entry(row: ShardEntry, quiz_id: &str, quiz_title: &str) -> MistakeIndexEntry {
    let correct_count = row.total_attempts.saturating_sub(row.mistake_count);
    let correctness_percentage = if row.total_attempts > 0 {
        ((correct_count as f64 / row.total_attempts as f64) * 100.0).round() as u32
    } else {
        0
    };

    MistakeIndexEntry {
        quiz_id: quiz_id.to_string(),
        quiz_title: quiz_title.to_string(),
        question_id: row.question_id,
        prompt: row.prompt,
        mistake_count: row.mistake_count,
        flagged_count: row.flagged_count,
        total_attempts: row.total_attempts,
        correct_count,
        correctness_percentage,
        last_mistaken_at: row.last_mistaken_at,
        last_flagged_at: row.last_flagged_at,
        last_incorrect_answer: row.last_incorrect_answer,
        last_incorrect_options: row.last_incorrect_options,
    }
}

fn shard_is_fresh(shard: &MistakeShard, expected_attempt_count: u32) -> bool {
    shard.version == MISTAKE_INDEX_VERSION && shard.attempt_count == expected_attempt_count
}

fn attempt_count_for(goal_dir: &Path) -> Result<u32, String> {
    Ok(crate::goals_storage::read_attempt_summaries(goal_dir)?.len() as u32)
}

/// Re-aggregates one goal from its attempt files and writes its shard.
pub fn rebuild_for_goal(app: &AppHandle, goal_id: &str) -> Result<(), String> {
    let goal_dir = crate::goals_storage::goal_directory_path(app, goal_id)?;
    let attempts = crate::goals_storage::load_goal_attempts(app, goal_id)?;
    let shard = build_shard(&attempts, attempt_count_for(&goal_dir)?);
    write_shard(&goal_dir, &shard)
}

/// Folds one freshly saved attempt into the goal's shard. Call after the attempt is persisted.
/// Falls back to a full rebuild of that goal when the shard is missing or out of step.
pub fn record_attempt(
    app: &AppHandle,
    goal_id: &str,
    attempt: &GoalAttempt,
) -> Result<(), String> {
    let goal_dir = crate::goals_storage::goal_directory_path(app, goal_id)?;
    let attempt_count = attempt_count_for(&goal_dir)?;

    match read_shard(&goal_dir) {
        Some(shard) if shard.attempt_count + 1 == attempt_count => {
            let mut rows: HashMap<String, ShardEntry> = shard
                .entries
                .into_iter()
                .map(|entry| (entry.question_id.clone(), entry))
                .collect();
            fold_attempt(&mut rows, attempt);
            write_shard(
                &goal_dir,
                &MistakeShard {
                    version: MISTAKE_INDEX_VERSION,
                    attempt_count,
                    entries: rows_into_entries(rows),
                },
            )
        }
        _ => rebuild_for_goal(app, goal_id),
    }
}

fn remove_legacy_index(app: &AppHandle) -> bool {
    let Ok(directory) = app.path().app_config_dir() else {
        return false;
    };
    let legacy = directory.join(LEGACY_MISTAKE_INDEX_FILE);
    legacy.exists() && std::fs::remove_file(legacy).is_ok()
}

fn flatten(
    goals: &[crate::goals_storage::GoalListItem],
    shards: Vec<MistakeShard>,
) -> MistakeIndex {
    let scored_attempt_count = goals.iter().map(|goal| goal.attempts.len() as u32).sum();
    let mut entries = Vec::new();
    for (goal, shard) in goals.iter().zip(shards) {
        for row in shard.entries {
            entries.push(finish_entry(row, &goal.meta.quiz_id, &goal.meta.quiz_title));
        }
    }
    MistakeIndex {
        version: MISTAKE_INDEX_VERSION,
        scored_attempt_count,
        entries,
    }
}

/// Reads every goal's shard, rebuilding the stale or missing ones. Returns the index and the
/// goal-relative paths of shards that were (re)written.
fn collect_shards(
    app: &AppHandle,
    force: bool,
) -> Result<(MistakeIndex, Vec<String>), String> {
    let goals = crate::goals_storage::list_goals(app)?;
    let mut shards = Vec::with_capacity(goals.len());
    let mut written = Vec::new();

    for goal in &goals {
        let goal_dir = crate::goals_storage::goal_directory_path(app, &goal.meta.id)?;
        let expected = goal.attempts.len() as u32;
        let existing = read_shard(&goal_dir);

        if !force {
            if let Some(shard) = existing.as_ref().filter(|s| shard_is_fresh(s, expected)) {
                shards.push(shard.clone());
                continue;
            }
        }

        let attempts = crate::goals_storage::load_goal_attempts(app, &goal.meta.id)?;
        let rebuilt = build_shard(&attempts, expected);
        if existing.as_ref() != Some(&rebuilt) {
            write_shard(&goal_dir, &rebuilt)?;
            written.push(shard_relative_path(&goal.meta.id));
        }
        shards.push(rebuilt);
    }

    Ok((flatten(&goals, shards), written))
}

/// Rebuilds every shard from the attempt files (used by Synchronize). Returns the index and the
/// relative paths of files that changed, including a removed legacy `mistake-index.json`.
pub fn rebuild_all(app: &AppHandle) -> Result<(MistakeIndex, Vec<String>), String> {
    let (index, mut written) = collect_shards(app, true)?;
    if remove_legacy_index(app) {
        written.push(LEGACY_MISTAKE_INDEX_FILE.to_string());
    }
    Ok((index, written))
}

pub fn get_mistake_index(app: &AppHandle) -> Result<MistakeIndex, String> {
    Ok(collect_shards(app, false)?.0)
}

#[cfg(test)]
mod tests {
    use super::{
        aggregate_attempts, apply_question_result, fold_attempt, finish_entry, rows_into_entries,
        shard_is_fresh, MistakeShard, ShardEntry, MISTAKE_INDEX_VERSION,
    };
    use crate::goals_storage::{GoalAttempt, QuestionResult, SubmittedAnswer};
    use std::collections::HashMap;

    fn result(id: &str, prompt: &str, correct: bool, flagged: Option<bool>) -> QuestionResult {
        QuestionResult {
            question_id: id.into(),
            prompt: prompt.into(),
            correct,
            answer: None,
            options: None,
            flagged,
        }
    }

    fn attempts() -> Vec<GoalAttempt> {
        vec![
            GoalAttempt {
                id: "a1".into(),
                taken_at: "2026-01-01T10:00:00.000Z".into(),
                score: 1,
                total: 2,
                percentage: 50,
                question_results: vec![
                    result("q1", "Question 1", false, Some(true)),
                    result("q2", "Question 2", true, None),
                ],
            },
            GoalAttempt {
                id: "a2".into(),
                taken_at: "2026-01-02T10:00:00.000Z".into(),
                score: 0,
                total: 2,
                percentage: 0,
                question_results: vec![
                    result("q1", "Question 1 updated", false, None),
                    result("q2", "Question 2", false, None),
                ],
            },
        ]
    }

    #[test]
    fn detects_stale_shard_by_version_or_attempt_count() {
        let fresh = MistakeShard {
            version: MISTAKE_INDEX_VERSION,
            attempt_count: 2,
            entries: Vec::new(),
        };
        assert!(shard_is_fresh(&fresh, 2));
        assert!(!shard_is_fresh(&fresh, 3));

        let outdated = MistakeShard {
            version: MISTAKE_INDEX_VERSION - 1,
            ..fresh
        };
        assert!(!shard_is_fresh(&outdated, 2));
    }

    #[test]
    fn aggregates_mistakes_per_question_across_attempts() {
        let entries = aggregate_attempts(&attempts());
        let finish = |id: &str| {
            let row = entries.iter().find(|e| e.question_id == id).unwrap();
            finish_entry(row.clone(), "quiz-1", "Quiz One")
        };
        let q1 = finish("q1");
        let q2 = finish("q2");

        assert_eq!(q1.quiz_id, "quiz-1");
        assert_eq!(q1.quiz_title, "Quiz One");
        assert_eq!(q1.mistake_count, 2);
        assert_eq!(q1.flagged_count, 1);
        assert_eq!(q1.total_attempts, 2);
        assert_eq!(q1.correctness_percentage, 0);
        assert_eq!(q1.prompt, "Question 1 updated");
        assert_eq!(
            q1.last_mistaken_at.as_deref(),
            Some("2026-01-02T10:00:00.000Z")
        );

        assert_eq!(q2.mistake_count, 1);
        assert_eq!(q2.flagged_count, 0);
        assert_eq!(q2.total_attempts, 2);
        assert_eq!(q2.correctness_percentage, 50);
    }

    #[test]
    fn folding_one_attempt_matches_a_full_rebuild() {
        let all = attempts();
        let mut rows: HashMap<String, ShardEntry> = aggregate_attempts(&all[..1])
            .into_iter()
            .map(|entry| (entry.question_id.clone(), entry))
            .collect();
        fold_attempt(&mut rows, &all[1]);

        assert_eq!(rows_into_entries(rows), aggregate_attempts(&all));
    }

    #[test]
    fn keeps_latest_incorrect_answer_and_options() {
        let mut row = ShardEntry {
            question_id: "q1".into(),
            prompt: "Question".into(),
            last_prompt_at: "2026-01-01T10:00:00.000Z".into(),
            ..Default::default()
        };

        apply_question_result(
            &mut row,
            &QuestionResult {
                answer: Some(SubmittedAnswer::SingleChoice { selected_index: 0 }),
                options: Some(vec!["C".into(), "A".into(), "B".into()]),
                ..result("q1", "Question", false, None)
            },
            "2026-01-01T10:00:00.000Z",
        );
        apply_question_result(
            &mut row,
            &QuestionResult {
                answer: Some(SubmittedAnswer::SingleChoice { selected_index: 1 }),
                options: Some(vec!["B".into(), "C".into(), "A".into()]),
                ..result("q1", "Question", false, None)
            },
            "2026-01-02T10:00:00.000Z",
        );

        let entry = finish_entry(row, "quiz-1", "Quiz");
        assert_eq!(
            entry.last_incorrect_answer,
            Some(SubmittedAnswer::SingleChoice { selected_index: 1 })
        );
        assert_eq!(
            entry.last_incorrect_options,
            Some(vec!["B".into(), "C".into(), "A".into()])
        );
    }
}
