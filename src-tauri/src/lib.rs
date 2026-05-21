mod activity_log;
pub mod cli;
mod commands;
mod config;
mod monitor;
mod notifications;
mod port_scanner;
mod process_manager;
mod tray;

use monitor::{MonitorPaused, MonitorState};
use tauri::Manager;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let monitor_state: MonitorState = monitor::new_state();
    let monitor_state_clone = monitor_state.clone();
    let monitor_paused: MonitorPaused = monitor::new_paused_state();
    let monitor_paused_arc = monitor_paused.0.clone();

    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_store::Builder::default().build())
        .plugin(tauri_plugin_notification::init())
        .plugin(tauri_plugin_autostart::init(
            tauri_plugin_autostart::MacosLauncher::LaunchAgent,
            Some(vec![]),
        ))
        .plugin(
            tauri_plugin_log::Builder::default()
                .level(log::LevelFilter::Info)
                .build(),
        )
        .plugin(activity_log::build_plugin().build())
        .plugin(tauri_plugin_window_state::Builder::default().build())
        .plugin(tauri_plugin_process::init())
        .plugin(tauri_plugin_positioner::init())
        .plugin(tauri_plugin_single_instance::init(|app, _args, _cwd| {

            if let Some(win) = app.get_webview_window("main") {
                let _ = win.show();
                let _ = win.set_focus();
            }
        }))
        .manage(monitor_state)
        .manage(monitor_paused)
        .setup(|app| {
            tray::setup_tray(&app.handle())?;


            let app_handle = app.handle().clone();
            tauri::async_runtime::spawn(async move {
                monitor::run_monitor(app_handle, monitor_state_clone, monitor_paused_arc).await;
            });


            let settings = config::load();
            if let Some(win) = app.get_webview_window("main") {
                if settings.start_minimized {
                    let _ = win.hide();
                } else {
                    let _ = win.show();
                    let _ = win.set_focus();


                    #[cfg(target_os = "linux")]
                    {
                        if let Ok(size) = win.inner_size() {
                            let _ = win.set_size(tauri::Size::Physical(
                                tauri::PhysicalSize { width: size.width + 1, height: size.height },
                            ));
                            let _ = win.set_size(tauri::Size::Physical(
                                tauri::PhysicalSize { width: size.width, height: size.height },
                            ));
                        }
                    }
                }
            }
            if let Some(win) = app.get_webview_window("tray") {
                let _ = win.hide();
            }

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            commands::get_port_status,
            commands::kill_port,
            commands::get_settings,
            commands::update_settings,
            commands::add_port,
            commands::remove_port,
            commands::set_active_profile,
            commands::get_active_ports,
            commands::update_port_project,
            commands::scan_all_active_ports,
            commands::pause_monitor,
            commands::resume_monitor,
            commands::is_monitor_paused,
            commands::update_port_protocol,
            commands::log_user_dismissed,
            commands::debug_spawn_port_holder,
            commands::debug_emit_log_event,
        ])
        .run(tauri::generate_context!())
        .expect("error while running ZPortGuard");
}
