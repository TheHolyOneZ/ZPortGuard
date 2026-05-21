use crate::{config, notifications, port_scanner, process_manager, tray};
use regex::Regex;
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::collections::HashSet;
use std::sync::{
    atomic::{AtomicBool, Ordering},
    Arc, Mutex,
};
use tauri::{AppHandle, Emitter};
use tokio::time::{interval, Duration};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PortStatusEvent {
    pub entries: Vec<port_scanner::PortEntry>,
    pub has_conflict: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ConflictEvent {
    pub port: u16,
    pub pid: u32,
    pub process_name: String,
    pub auto_fixed: bool,
    pub protocol: String,
}


#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FrontendLogEvent {
    pub ts: String,
    pub port: u16,
    pub pid: Option<u32>,
    pub process_name: Option<String>,
    pub process_path: Option<String>,

    pub action: String,

    pub protocol: String,
}

pub type MonitorState = Arc<Mutex<bool>>;

#[derive(Clone)]
pub struct MonitorPaused(pub Arc<AtomicBool>);

pub fn new_state() -> MonitorState {
    Arc::new(Mutex::new(true))
}

pub fn new_paused_state() -> MonitorPaused {
    MonitorPaused(Arc::new(AtomicBool::new(false)))
}


fn glob_to_regex(pattern: &str) -> Regex {
    let mut re = String::from("(?i)^");
    for ch in pattern.chars() {
        match ch {
            '*' => re.push_str(".*"),
            '?' => re.push('.'),
            c => {
                for esc in regex::escape(&c.to_string()).chars() {
                    re.push(esc);
                }
            }
        }
    }
    re.push('$');
    Regex::new(&re).unwrap_or_else(|_| Regex::new("(?i)^$").unwrap())
}

fn rule_matches(
    rule: &config::RuleEntry,
    entry: &port_scanner::PortEntry,
    glob_cache: &mut HashMap<String, Regex>,
) -> bool {
    let port_ok = rule.port.is_none() || rule.port == Some(entry.port);
    if !port_ok {
        return false;
    }
    let process_name = entry.process_name.as_deref().unwrap_or("");
    match rule.match_type {
        config::MatchType::Exact => rule.process_name == process_name,
        config::MatchType::Glob => {
            let re = glob_cache
                .entry(rule.process_name.clone())
                .or_insert_with(|| glob_to_regex(&rule.process_name));
            re.is_match(process_name)
        }
        config::MatchType::Path => {
            let process_path = entry.process_path.as_deref().unwrap_or("").to_lowercase();
            process_path.contains(&rule.process_name.to_lowercase())
        }
    }
}

fn emit_log(app: &AppHandle, event: FrontendLogEvent) {
    let _ = app.emit("log-event", event);
}


fn resolve_active_profile(settings: &config::Settings) -> &config::Profile {
    settings.profiles
        .iter()
        .find(|p| p.id == settings.active_profile)
        .or_else(|| settings.profiles.first())
        .expect("settings always has at least one profile post-migration")
}

async fn tick_once(
    app: &AppHandle,
    settings: &config::Settings,
    pending_confirmations: &mut HashSet<(u16, u32)>,
    glob_cache: &mut HashMap<String, Regex>,
) {
    let profile = resolve_active_profile(settings);
    let ports = config::active_ports(settings);
    let (tcp_map, udp_map) = port_scanner::build_separate_maps();
    let mut sys = sysinfo::System::new_all();
    sys.refresh_all();


    let entries: Vec<port_scanner::PortEntry> = ports
        .iter()
        .filter_map(|&port| {
            let port_cfg = settings.ports.iter().find(|p| p.port == port);
            let cfg_proto = port_cfg
                .map(|p| &p.protocol)
                .unwrap_or(&config::PortProtocol::Tcp);

            let tcp_pid = tcp_map.get(&port).copied();
            let udp_pid = udp_map.get(&port).copied();

            let (pid, scanner_proto) = match cfg_proto {
                config::PortProtocol::Tcp => (tcp_pid, port_scanner::Protocol::Tcp),
                config::PortProtocol::Udp => (udp_pid, port_scanner::Protocol::Udp),
                config::PortProtocol::Both => {
                    if let Some(pid) = tcp_pid {
                        (Some(pid), port_scanner::Protocol::Tcp)
                    } else {
                        (udp_pid, port_scanner::Protocol::Udp)
                    }
                }
            };

            if let Some(pid_val) = pid {
                let sysinfo_pid = sysinfo::Pid::from(pid_val as usize);
                let (name, path, cwd) = sys
                    .process(sysinfo_pid)
                    .map(|p| (
                        Some(p.name().to_string_lossy().to_string()),
                        p.exe().map(|e| e.to_string_lossy().to_string()),
                        p.cwd().map(|c| c.to_string_lossy().to_string()),
                    ))
                    .unwrap_or((None, None, None));
                Some(port_scanner::PortEntry {
                    port,
                    pid: Some(pid_val),
                    process_name: name,
                    process_path: path,
                    process_cwd: cwd,
                    state: port_scanner::PortState::InUse,
                    protocol: scanner_proto,
                })
            } else {
                Some(port_scanner::PortEntry {
                    port,
                    pid: None,
                    process_name: None,
                    process_path: None,
                    process_cwd: None,
                    state: port_scanner::PortState::Clear,
                    protocol: scanner_proto,
                })
            }
        })
        .collect();

    let has_conflict = entries
        .iter()
        .any(|e| e.state == port_scanner::PortState::InUse);

    let _ = app.emit(
        "port-status-changed",
        PortStatusEvent { entries: entries.clone(), has_conflict },
    );
    tray::update_tray_tooltip(
        app,
        has_conflict,
        entries.iter().filter(|e| e.state == port_scanner::PortState::InUse).count(),
    );

    let proto_str = |p: &port_scanner::Protocol| -> String {
        match p {
            port_scanner::Protocol::Tcp => "tcp".into(),
            port_scanner::Protocol::Udp => "udp".into(),
        }
    };

    for entry in &entries {
        if entry.state != port_scanner::PortState::InUse {
            continue;
        }
        let Some(pid) = entry.pid else { continue };
        let process_name = entry.process_name.clone().unwrap_or_else(|| "unknown".into());
        let proto = proto_str(&entry.protocol);


        let whitelisted = profile.whitelist.iter().any(|r| rule_matches(r, entry, glob_cache));
        if whitelisted {
            continue;
        }

        let _ = app.emit(
            "conflict-detected",
            ConflictEvent {
                port: entry.port,
                pid,
                process_name: process_name.clone(),
                auto_fixed: false,
                protocol: proto.clone(),
            },
        );
        notifications::notify_conflict(app, entry.port, &process_name, pid);
        emit_log(
            app,
            FrontendLogEvent {
                ts: chrono::Utc::now().to_rfc3339(),
                port: entry.port,
                pid: Some(pid),
                process_name: Some(process_name.clone()),
                process_path: entry.process_path.clone(),
                action: "conflict_detected".into(),
                protocol: proto.clone(),
            },
        );


        if profile.auto_fix.enabled {
            let is_blacklisted = profile.blacklist.iter().any(|r| rule_matches(r, entry, glob_cache));
            if is_blacklisted || !profile.auto_fix.require_confirmation {
                if let Ok(()) = process_manager::kill_process(pid) {
                    pending_confirmations.remove(&(entry.port, pid));
                    let _ = app.emit(
                        "conflict-auto-fixed",
                        ConflictEvent {
                            port: entry.port,
                            pid,
                            process_name: process_name.clone(),
                            auto_fixed: true,
                            protocol: proto.clone(),
                        },
                    );
                    emit_log(
                        app,
                        FrontendLogEvent {
                            ts: chrono::Utc::now().to_rfc3339(),
                            port: entry.port,
                            pid: Some(pid),
                            process_name: Some(process_name.clone()),
                            process_path: entry.process_path.clone(),
                            action: "auto_killed".into(),
                            protocol: proto.clone(),
                        },
                    );
                    notifications::notify_auto_fixed(app, entry.port, &process_name);
                    log::info!(
                        "Auto-killed {} (PID {}) on port {}",
                        process_name,
                        pid,
                        entry.port
                    );
                }
            } else if pending_confirmations.insert((entry.port, pid)) {
                let _ = app.emit(
                    "conflict-needs-confirmation",
                    ConflictEvent {
                        port: entry.port,
                        pid,
                        process_name: process_name.clone(),
                        auto_fixed: false,
                        protocol: proto.clone(),
                    },
                );
            }
        }
    }

    let active_conflicts: HashSet<(u16, u32)> = entries
        .iter()
        .filter(|e| e.state == port_scanner::PortState::InUse)
        .filter_map(|e| e.pid.map(|pid| (e.port, pid)))
        .collect();
    pending_confirmations.retain(|key| active_conflicts.contains(key));
}

pub async fn run_monitor(app: AppHandle, state: MonitorState, paused: Arc<AtomicBool>) {
    let mut settings = config::load();
    let mut last_interval_ms = settings.polling_interval_ms;
    let mut tick = interval(Duration::from_millis(settings.polling_interval_ms));
    let mut pending_confirmations: HashSet<(u16, u32)> = HashSet::new();
    let mut glob_cache: HashMap<String, Regex> = HashMap::new();


    tick_once(&app, &settings, &mut pending_confirmations, &mut glob_cache).await;

    loop {
        tick.tick().await;

        if paused.load(Ordering::Relaxed) {
            if let Ok(running) = state.lock() {
                if !*running { break; }
            }
            continue;
        }

        settings = config::load();


        if settings.polling_interval_ms != last_interval_ms {
            last_interval_ms = settings.polling_interval_ms;
            tick = interval(Duration::from_millis(settings.polling_interval_ms));
        }

        tick_once(&app, &settings, &mut pending_confirmations, &mut glob_cache).await;

        if let Ok(running) = state.lock() {
            if !*running { break; }
        }
    }
}
