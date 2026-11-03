use tauri::{AppHandle, Manager};

mod app_data_commands;
mod data_sync;
mod fs_utils;
mod goals_storage;
mod knowledge_files;
mod mistake_index;
mod quiz_archive;
mod quiz_files;
mod settings;

pub(crate) use settings::read_settings_for_sync;

fn focus_main_window(app: &AppHandle) {
    if let Some(window) = app.get_webview_window("main") {
        let _ = window.unminimize();
        let _ = window.show();
        let _ = window.set_focus();
    }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let mut builder = tauri::Builder::default();

    #[cfg(desktop)]
    {
        builder = builder.plugin(tauri_plugin_single_instance::init(|app, _args, _cwd| {
            focus_main_window(&app);
        }));
    }

    builder
        .plugin(tauri_plugin_dialog::init())
        .invoke_handler(tauri::generate_handler![
            settings::get_settings,
            settings::save_settings,
            quiz_files::read_working_directory,
            quiz_files::import_quiz_file,
            quiz_files::add_sample_quizzes,
            quiz_files::list_archived_quiz_ids,
            quiz_files::set_quiz_archived,
            quiz_files::delete_quiz_file,
            knowledge_files::read_knowledge_directory,
            knowledge_files::write_knowledge_file,
            knowledge_files::delete_knowledge_file,
            quiz_files::open_quiz_folder,
            knowledge_files::open_knowledge_folder,
            app_data_commands::list_goals,
            app_data_commands::upsert_goal,
            app_data_commands::delete_goal,
            app_data_commands::save_goal_attempt,
            app_data_commands::get_goal_attempt,
            app_data_commands::delete_goal_attempt,
            app_data_commands::get_mistake_index,
            app_data_commands::synchronize_app_data
        ])
        .build(tauri::generate_context!())
        .expect("error while building Quizzy")
        .run(|app_handle, event| {
            #[cfg(target_os = "macos")]
            if let tauri::RunEvent::Reopen { .. } = event {
                focus_main_window(app_handle);
            }
        });
}
