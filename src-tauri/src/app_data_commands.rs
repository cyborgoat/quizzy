use tauri::AppHandle;

use crate::data_sync::{self, SyncReport};
use crate::goals_storage::{self, GoalAttempt, GoalListItem, GoalMeta};
use crate::mistake_index::{self, MistakeIndex};

#[tauri::command]
pub(crate) fn list_goals(app: AppHandle) -> Result<Vec<GoalListItem>, String> {
    goals_storage::list_goals(&app)
}

#[tauri::command]
pub(crate) fn upsert_goal(app: AppHandle, goal: GoalMeta) -> Result<(), String> {
    let goal_id = goal.id.clone();
    goals_storage::upsert_goal(&app, goal)?;
    mistake_index::rebuild_for_goal(&app, &goal_id)
}

#[tauri::command]
pub(crate) fn delete_goal(app: AppHandle, goal_id: String) -> Result<(), String> {
    let quiz_id = goals_storage::goal_quiz_id(&app, &goal_id)?;
    goals_storage::delete_goal(&app, goal_id)?;
    if let Some(quiz_id) = quiz_id {
        mistake_index::remove_quiz_entries(&app, &quiz_id)?;
    }
    Ok(())
}

#[tauri::command]
pub(crate) fn save_goal_attempt(
    app: AppHandle,
    goal_id: String,
    attempt: GoalAttempt,
) -> Result<(), String> {
    goals_storage::save_goal_attempt(&app, goal_id.clone(), attempt)?;
    mistake_index::rebuild_for_goal(&app, &goal_id)
}

#[tauri::command]
pub(crate) fn get_goal_attempt(
    app: AppHandle,
    goal_id: String,
    attempt_id: String,
) -> Result<GoalAttempt, String> {
    goals_storage::get_goal_attempt(&app, goal_id, attempt_id)
}

#[tauri::command]
pub(crate) fn delete_goal_attempt(
    app: AppHandle,
    goal_id: String,
    attempt_id: String,
) -> Result<(), String> {
    goals_storage::delete_goal_attempt(&app, goal_id.clone(), attempt_id)?;
    mistake_index::rebuild_for_goal(&app, &goal_id)
}

#[tauri::command]
pub(crate) fn get_mistake_index(app: AppHandle) -> Result<MistakeIndex, String> {
    mistake_index::get_mistake_index(&app)
}

#[tauri::command]
pub(crate) fn synchronize_app_data(app: AppHandle) -> Result<SyncReport, String> {
    data_sync::synchronize_app_data(&app)
}
