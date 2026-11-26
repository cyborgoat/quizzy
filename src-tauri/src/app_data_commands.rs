use std::path::PathBuf;
use tauri::AppHandle;

use crate::data_sync::{self, SyncReport};
use crate::fs_utils::checked_directory;
use crate::goals_storage::{self, GoalAttempt, GoalListItem, GoalMeta};
use crate::mistake_index::{self, MistakeIndex};

/// Runs blocking file work off the main thread so the webview stays responsive.
pub(crate) async fn run_blocking<T, F>(work: F) -> Result<T, String>
where
    T: Send + 'static,
    F: FnOnce() -> Result<T, String> + Send + 'static,
{
    tauri::async_runtime::spawn_blocking(work)
        .await
        .map_err(|error| format!("Background task failed: {error}"))?
}

fn study_root(app: &AppHandle, working_directory: &str) -> Result<PathBuf, String> {
    checked_directory(app, working_directory)?;
    goals_storage::goals_storage_root(app, working_directory)
}

#[tauri::command]
pub(crate) async fn list_goals(
    app: AppHandle,
    working_directory: String,
) -> Result<Vec<GoalListItem>, String> {
    run_blocking(move || goals_storage::list_goals(&study_root(&app, &working_directory)?)).await
}

#[tauri::command]
pub(crate) async fn upsert_goal(
    app: AppHandle,
    working_directory: String,
    goal: GoalMeta,
) -> Result<(), String> {
    // Mistake shards read the quiz id and title from the goal, so no index update is needed here.
    run_blocking(move || goals_storage::upsert_goal(&study_root(&app, &working_directory)?, goal))
        .await
}

#[tauri::command]
pub(crate) async fn delete_goal(
    app: AppHandle,
    working_directory: String,
    goal_id: String,
) -> Result<(), String> {
    // The goal's mistake shard lives in its directory and is removed with it.
    run_blocking(move || {
        goals_storage::delete_goal(&study_root(&app, &working_directory)?, goal_id)
    })
    .await
}

#[tauri::command]
pub(crate) async fn save_goal_attempt(
    app: AppHandle,
    working_directory: String,
    goal_id: String,
    attempt: GoalAttempt,
) -> Result<(), String> {
    run_blocking(move || {
        let root = study_root(&app, &working_directory)?;
        goals_storage::save_goal_attempt(&root, goal_id.clone(), attempt.clone())?;
        mistake_index::record_attempt(&root, &goal_id, &attempt)
    })
    .await
}

#[tauri::command]
pub(crate) async fn get_goal_attempt(
    app: AppHandle,
    working_directory: String,
    goal_id: String,
    attempt_id: String,
) -> Result<GoalAttempt, String> {
    run_blocking(move || {
        goals_storage::get_goal_attempt(&study_root(&app, &working_directory)?, goal_id, attempt_id)
    })
    .await
}

#[tauri::command]
pub(crate) async fn delete_goal_attempt(
    app: AppHandle,
    working_directory: String,
    goal_id: String,
    attempt_id: String,
) -> Result<(), String> {
    run_blocking(move || {
        let root = study_root(&app, &working_directory)?;
        goals_storage::delete_goal_attempt(&root, goal_id.clone(), attempt_id)?;
        mistake_index::rebuild_for_goal(&root, &goal_id)
    })
    .await
}

#[tauri::command]
pub(crate) async fn get_mistake_index(
    app: AppHandle,
    working_directory: String,
) -> Result<MistakeIndex, String> {
    run_blocking(move || mistake_index::get_mistake_index(&study_root(&app, &working_directory)?))
        .await
}

#[tauri::command]
pub(crate) async fn synchronize_app_data(app: AppHandle) -> Result<SyncReport, String> {
    run_blocking(move || data_sync::synchronize_app_data(&app)).await
}
