use serde::{Deserialize, Serialize};
use std::{
    collections::HashMap,
    path::{Path, PathBuf},
};
use tauri::{AppHandle, Manager};

use crate::goals_storage::{GoalAttempt, QuestionResult, SubmittedAnswer};

const MISTAKE_INDEX_FILE: &str = "mistake-index.json";
const MISTAKE_INDEX_VERSION: u32 = 1;

#[derive(Debug, Clone, Serialize, Deserialize)]
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

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct MistakeIndex {
    pub version: u32,
    pub scored_attempt_count: u32,
    pub entries: Vec<MistakeIndexEntry>,
}

#[derive(Default)]
struct MutableEntry {
    quiz_id: String,
    quiz_title: String,
    question_id: String,
    prompt: String,
    mistake_count: u32,
    flagged_count: u32,
    total_attempts: u32,
    last_mistaken_at: Option<String>,
    last_flagged_at: Option<String>,
    last_prompt_at: String,
    last_incorrect_answer: Option<SubmittedAnswer>,
    last_incorrect_options: Option<Vec<String>>,
}

pub fn mistake_index_path(app: &AppHandle) -> Result<PathBuf, String> {
    let directory = app
        .path()
        .app_config_dir()
        .map_err(|error| format!("Unable to locate the app configuration directory: {error}"))?;
    Ok(directory.join(MISTAKE_INDEX_FILE))
}

fn read_index(path: &Path) -> Result<MistakeIndex, String> {
    let contents = std::fs::read_to_string(path)
        .map_err(|error| format!("Unable to read {}: {error}", path.display()))?;
    serde_json::from_str(&contents)
        .map_err(|error| format!("{} is invalid: {error}", path.display()))
}

fn write_index(path: &Path, index: &MistakeIndex) -> Result<(), String> {
    let contents = serde_json::to_vec_pretty(index)
        .map_err(|error| format!("Unable to serialize {}: {error}", path.display()))?;
    super::atomic_write(path, &contents, true)
}

fn entry_key(quiz_id: &str, question_id: &str) -> String {
    format!("{quiz_id}:{question_id}")
}

fn is_flagged(result: &QuestionResult) -> bool {
    result.flagged.unwrap_or(false)
}

fn apply_question_result(row: &mut MutableEntry, result: &QuestionResult, taken_at: &str) {
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

fn aggregate_attempts(
    quiz_id: &str,
    quiz_title: &str,
    attempts: &[GoalAttempt],
) -> Vec<MistakeIndexEntry> {
    let mut rows: HashMap<String, MutableEntry> = HashMap::new();

    for attempt in attempts {
        for result in &attempt.question_results {
            let key = entry_key(quiz_id, &result.question_id);
            let row = rows.entry(key).or_insert_with(|| MutableEntry {
                quiz_id: quiz_id.to_string(),
                quiz_title: quiz_title.to_string(),
                question_id: result.question_id.clone(),
                prompt: result.prompt.clone(),
                last_prompt_at: attempt.taken_at.clone(),
                ..Default::default()
            });
            apply_question_result(row, result, &attempt.taken_at);
        }
    }

    rows.into_values().map(finish_entry).collect()
}

fn finish_entry(row: MutableEntry) -> MistakeIndexEntry {
    let correct_count = row.total_attempts.saturating_sub(row.mistake_count);
    let correctness_percentage = if row.total_attempts > 0 {
        ((correct_count as f64 / row.total_attempts as f64) * 100.0).round() as u32
    } else {
        0
    };

    MistakeIndexEntry {
        quiz_id: row.quiz_id,
        quiz_title: row.quiz_title,
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

fn scored_attempt_count(app: &AppHandle) -> Result<u32, String> {
    Ok(crate::goals_storage::list_goals(app)?
        .iter()
        .map(|goal| goal.attempts.len() as u32)
        .sum())
}

fn index_needs_rebuild(index: &MistakeIndex, expected_attempt_count: u32) -> bool {
    index.version != MISTAKE_INDEX_VERSION || index.scored_attempt_count != expected_attempt_count
}

pub fn rebuild_all(app: &AppHandle) -> Result<MistakeIndex, String> {
    let goals = crate::goals_storage::list_goals(app)?;
    let mut all_entries: Vec<MistakeIndexEntry> = Vec::new();
    let scored_attempt_count = scored_attempt_count(app)?;

    for goal in goals {
        let attempts = crate::goals_storage::load_goal_attempts(app, &goal.meta.id)?;
        let mut aggregated =
            aggregate_attempts(&goal.meta.quiz_id, &goal.meta.quiz_title, &attempts);
        all_entries.append(&mut aggregated);
    }

    Ok(MistakeIndex {
        version: MISTAKE_INDEX_VERSION,
        scored_attempt_count,
        entries: all_entries,
    })
}

pub fn rebuild_for_goal(app: &AppHandle, goal_id: &str) -> Result<(), String> {
    let goals = crate::goals_storage::list_goals(app)?;
    let goal = goals
        .iter()
        .find(|item| item.meta.id == goal_id)
        .ok_or_else(|| format!("Goal {goal_id} was not found."))?;

    let attempts = crate::goals_storage::load_goal_attempts(app, goal_id)?;
    let fresh_entries = aggregate_attempts(&goal.meta.quiz_id, &goal.meta.quiz_title, &attempts);

    let path = mistake_index_path(app)?;
    let mut index = if path.exists() {
        read_index(&path)?
    } else {
        MistakeIndex {
            version: MISTAKE_INDEX_VERSION,
            scored_attempt_count: 0,
            entries: Vec::new(),
        }
    };

    index
        .entries
        .retain(|entry| entry.quiz_id != goal.meta.quiz_id);
    index.entries.extend(fresh_entries);
    index.scored_attempt_count = scored_attempt_count(app)?;
    index.version = MISTAKE_INDEX_VERSION;

    write_index(&path, &index)
}

pub fn remove_quiz_entries(app: &AppHandle, quiz_id: &str) -> Result<(), String> {
    let path = mistake_index_path(app)?;
    if !path.exists() {
        return Ok(());
    }

    let mut index = read_index(&path)?;
    index.entries.retain(|entry| entry.quiz_id != quiz_id);
    index.scored_attempt_count = scored_attempt_count(app)?;
    write_index(&path, &index)
}

pub fn get_mistake_index(app: &AppHandle) -> Result<MistakeIndex, String> {
    let path = mistake_index_path(app)?;
    let expected_attempt_count = scored_attempt_count(app)?;

    if !path.exists() {
        let index = rebuild_all(app)?;
        write_index(&path, &index)?;
        return Ok(index);
    }

    let index = read_index(&path)?;
    if index_needs_rebuild(&index, expected_attempt_count) {
        let rebuilt = rebuild_all(app)?;
        write_index(&path, &rebuilt)?;
        return Ok(rebuilt);
    }

    Ok(index)
}

#[cfg(test)]
mod tests {
    use super::{
        aggregate_attempts, apply_question_result, finish_entry, index_needs_rebuild, MistakeIndex,
        MutableEntry, MISTAKE_INDEX_VERSION,
    };
    use crate::goals_storage::{GoalAttempt, QuestionResult, SubmittedAnswer};

    #[test]
    fn detects_stale_index_by_version_or_attempt_count() {
        let fresh = MistakeIndex {
            version: MISTAKE_INDEX_VERSION,
            scored_attempt_count: 2,
            entries: Vec::new(),
        };
        assert!(!index_needs_rebuild(&fresh, 2));
        assert!(index_needs_rebuild(&fresh, 3));

        let outdated = MistakeIndex {
            version: MISTAKE_INDEX_VERSION - 1,
            scored_attempt_count: 2,
            entries: Vec::new(),
        };
        assert!(index_needs_rebuild(&outdated, 2));
    }

    #[test]
    fn aggregates_mistakes_per_question_across_attempts() {
        let attempts = vec![
            GoalAttempt {
                id: "a1".into(),
                taken_at: "2026-01-01T10:00:00.000Z".into(),
                score: 1,
                total: 2,
                percentage: 50,
                question_results: vec![
                    QuestionResult {
                        question_id: "q1".into(),
                        prompt: "Question 1".into(),
                        correct: false,
                        answer: None,
                        options: None,
                        flagged: Some(true),
                    },
                    QuestionResult {
                        question_id: "q2".into(),
                        prompt: "Question 2".into(),
                        correct: true,
                        answer: None,
                        options: None,
                        flagged: None,
                    },
                ],
            },
            GoalAttempt {
                id: "a2".into(),
                taken_at: "2026-01-02T10:00:00.000Z".into(),
                score: 0,
                total: 2,
                percentage: 0,
                question_results: vec![
                    QuestionResult {
                        question_id: "q1".into(),
                        prompt: "Question 1 updated".into(),
                        correct: false,
                        answer: None,
                        options: None,
                        flagged: None,
                    },
                    QuestionResult {
                        question_id: "q2".into(),
                        prompt: "Question 2".into(),
                        correct: false,
                        answer: None,
                        options: None,
                        flagged: None,
                    },
                ],
            },
        ];

        let entries = aggregate_attempts("quiz-1", "Quiz One", &attempts);
        let q1 = entries
            .iter()
            .find(|entry| entry.question_id == "q1")
            .unwrap();
        let q2 = entries
            .iter()
            .find(|entry| entry.question_id == "q2")
            .unwrap();

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
    fn keeps_latest_incorrect_answer_and_options() {
        let mut row = MutableEntry {
            quiz_id: "quiz-1".into(),
            quiz_title: "Quiz".into(),
            question_id: "q1".into(),
            prompt: "Question".into(),
            last_prompt_at: "2026-01-01T10:00:00.000Z".into(),
            ..Default::default()
        };

        apply_question_result(
            &mut row,
            &QuestionResult {
                question_id: "q1".into(),
                prompt: "Question".into(),
                correct: false,
                answer: Some(SubmittedAnswer::SingleChoice { selected_index: 0 }),
                options: Some(vec!["C".into(), "A".into(), "B".into()]),
                flagged: None,
            },
            "2026-01-01T10:00:00.000Z",
        );
        apply_question_result(
            &mut row,
            &QuestionResult {
                question_id: "q1".into(),
                prompt: "Question".into(),
                correct: false,
                answer: Some(SubmittedAnswer::SingleChoice { selected_index: 1 }),
                options: Some(vec!["B".into(), "C".into(), "A".into()]),
                flagged: None,
            },
            "2026-01-02T10:00:00.000Z",
        );

        let entry = finish_entry(row);
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
