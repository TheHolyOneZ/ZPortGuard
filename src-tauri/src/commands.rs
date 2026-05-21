use crate::{config, monitor::{FrontendLogEvent, MonitorPaused}, port_scanner, process_manager};
use std::sync::atomic::Ordering;
use tauri::{AppHandle, Emitter, State};

#[tauri::command]
pub fn get_port_status(ports: Vec<u16>) -> Vec<port_scanner::PortEntry> {
    port_scanner::scan_ports(&ports)
}

#[tauri::command]
pub fn kill_port(port: u16, app: AppHandle) -> Result<String, String> {
    match port_scanner::get_port_entry(port) {
        Some(entry) => {
            if let Some(pid) = entry.pid {
                match process_manager::kill_process(pid) {
                    Ok(_) => {
                        let _ = app.emit(
                            "log-event",
                            FrontendLogEvent {
                                ts: chrono::Utc::now().to_rfc3339(),
                                port,
                                pid: Some(pid),
                                process_name: entry.process_name.clone(),
                                process_path: entry.process_path.clone(),
                                action: "user_killed".into(),
                                protocol: match entry.protocol {
                                    port_scanner::Protocol::Udp => "udp".into(),
                                    _ => "tcp".into(),
                                },
                            },
                        );
                        Ok(format!("Killed PID {} on port {}", pid, port))
                    }
                    Err(e) => Err(e.to_string()),
                }
            } else {
                Err(format!("Could not resolve PID for port {}", port))
            }
        }
        None => Ok(format!("Port {} is already free", port)),
    }
}

#[tauri::command]
pub fn get_settings() -> config::Settings {
    config::load()
}


#[tauri::command]
pub fn update_settings(settings: config::Settings) -> Result<(), String> {
    if settings.profiles.is_empty() {
        return Err("Cannot save settings with no profiles — at least one profile is required".into());
    }
    if !settings.profiles.iter().any(|p| p.id == settings.active_profile) {
        return Err(format!(
            "active_profile '{}' does not match any profile id",
            settings.active_profile
        ));
    }
    config::save(&settings).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn add_port(
    port: u16,
    label: Option<String>,
    protocol: Option<config::PortProtocol>,
) -> Result<config::Settings, String> {
    let mut settings = config::load();
    if !settings.ports.iter().any(|p| p.port == port) {
        settings.ports.push(config::PortConfig {
            port,
            label,
            project_name: None,
            project_path: None,
            protocol: protocol.unwrap_or(config::PortProtocol::Tcp),
        });
        config::save(&settings).map_err(|e| e.to_string())?;
    }
    Ok(settings)
}

#[tauri::command]
pub fn remove_port(port: u16) -> Result<config::Settings, String> {
    let mut settings = config::load();
    settings.ports.retain(|p| p.port != port);
    config::save(&settings).map_err(|e| e.to_string())?;
    Ok(settings)
}


#[tauri::command]
pub fn set_active_profile(profile_id: String) -> Result<config::Settings, String> {
    let mut settings = config::load();
    if !settings.profiles.iter().any(|p| p.id == profile_id) {
        return Err(format!("Profile '{}' not found", profile_id));
    }
    settings.active_profile = profile_id;
    config::save(&settings).map_err(|e| e.to_string())?;
    Ok(settings)
}

#[tauri::command]
pub fn get_active_ports() -> Vec<u16> {
    let settings = config::load();
    config::active_ports(&settings)
}

#[tauri::command]
pub fn update_port_project(
    port: u16,
    project_name: Option<String>,
    project_path: Option<String>,
) -> Result<config::Settings, String> {
    let mut settings = config::load();
    if let Some(p) = settings.ports.iter_mut().find(|p| p.port == port) {
        p.project_name = project_name;
        p.project_path = project_path;
    }
    config::save(&settings).map_err(|e| e.to_string())?;
    Ok(settings)
}

#[tauri::command]
pub fn update_port_protocol(
    port: u16,
    protocol: config::PortProtocol,
) -> Result<config::Settings, String> {
    let mut settings = config::load();
    if let Some(p) = settings.ports.iter_mut().find(|p| p.port == port) {
        p.protocol = protocol;
    }
    config::save(&settings).map_err(|e| e.to_string())?;
    Ok(settings)
}

#[tauri::command]
pub fn scan_all_active_ports() -> Vec<port_scanner::PortEntry> {
    port_scanner::scan_all_active()
}

#[tauri::command]
pub fn pause_monitor(state: State<'_, MonitorPaused>) {
    state.0.store(true, Ordering::Relaxed);
}

#[tauri::command]
pub fn resume_monitor(state: State<'_, MonitorPaused>) {
    state.0.store(false, Ordering::Relaxed);
}

#[tauri::command]
pub fn is_monitor_paused(state: State<'_, MonitorPaused>) -> bool {
    state.0.load(Ordering::Relaxed)
}


#[tauri::command]
pub fn log_user_dismissed(port: u16, pid: u32, protocol: String, app: AppHandle) {
    let _ = app.emit(
        "log-event",
        FrontendLogEvent {
            ts: chrono::Utc::now().to_rfc3339(),
            port,
            pid: Some(pid),
            process_name: None,
            process_path: None,
            action: "dismissed".into(),
            protocol,
        },
    );
}


#[tauri::command]
pub fn debug_spawn_port_holder(port: u16, protocol: Option<String>) -> Result<u32, String> {
    let proto = protocol.as_deref().unwrap_or("tcp");
    let script = if proto == "udp" {
        format!(
            "import socket,time; s=socket.socket(socket.AF_INET,socket.SOCK_DGRAM); \
             s.setsockopt(socket.SOL_SOCKET,socket.SO_REUSEADDR,1); \
             s.bind(('127.0.0.1',{})); time.sleep(30)",
            port
        )
    } else {
        format!(
            "import socket,time; s=socket.socket(socket.AF_INET,socket.SOCK_STREAM); \
             s.setsockopt(socket.SOL_SOCKET,socket.SO_REUSEADDR,1); \
             s.bind(('127.0.0.1',{})); s.listen(1); time.sleep(30)",
            port
        )
    };
    std::process::Command::new("python3")
        .args(["-c", &script])
        .spawn()
        .map(|child| child.id())
        .map_err(|e| format!("Failed to spawn python3: {e}. Is python3 installed?"))
}


#[tauri::command]
pub fn debug_emit_log_event(app: AppHandle) {
    let _ = app.emit(
        "log-event",
        FrontendLogEvent {
            ts: chrono::Utc::now().to_rfc3339(),
            port: 19999,
            pid: Some(99999),
            process_name: Some("debug-proc".into()),
            process_path: None,
            action: "conflict_detected".into(),
            protocol: "tcp".into(),
        },
    );
}
