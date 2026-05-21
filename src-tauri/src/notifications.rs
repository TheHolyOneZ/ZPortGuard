use tauri::AppHandle;
use tauri_plugin_notification::NotificationExt;

pub fn notify_conflict(app: &AppHandle, port: u16, process_name: &str, pid: u32) {
    let body = format!(
        "Port {} grabbed by {} (PID {})",
        port, process_name, pid
    );
    let _ = app
        .notification()
        .builder()
        .title("ZPortGuard — Port Conflict")
        .body(&body)
        .show();
}

pub fn notify_auto_fixed(app: &AppHandle, port: u16, process_name: &str) {
    let body = format!("Killed '{}' and freed port {}", process_name, port);
    let _ = app
        .notification()
        .builder()
        .title("ZPortGuard — Port Freed")
        .body(&body)
        .show();
}
