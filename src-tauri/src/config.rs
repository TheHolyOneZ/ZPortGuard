use anyhow::Result;
use serde::{Deserialize, Serialize};
use std::path::PathBuf;

const CONFIG_FILE: &str = "zportguard-config.json";

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Settings {
    #[serde(default = "default_schema_version")]
    pub schema_version: u32,
    pub ports: Vec<PortConfig>,
    pub profiles: Vec<Profile>,
    pub active_profile: String,
    pub polling_interval_ms: u64,
    pub autolaunch: bool,
    #[serde(default)]
    pub start_minimized: bool,
}

fn default_schema_version() -> u32 {
    2
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "snake_case")]
pub enum PortProtocol {
    Tcp,
    Udp,
    Both,
}

fn default_port_protocol() -> PortProtocol {
    PortProtocol::Tcp
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PortConfig {
    pub port: u16,
    pub label: Option<String>,
    pub project_name: Option<String>,
    pub project_path: Option<String>,
    #[serde(default = "default_port_protocol")]
    pub protocol: PortProtocol,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Profile {
    pub id: String,
    pub name: String,
    pub ports: Vec<u16>,
    #[serde(default)]
    pub auto_fix: AutoFixSettings,
    #[serde(default)]
    pub whitelist: Vec<RuleEntry>,
    #[serde(default)]
    pub blacklist: Vec<RuleEntry>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AutoFixSettings {
    pub enabled: bool,
    pub require_confirmation: bool,
}

impl Default for AutoFixSettings {
    fn default() -> Self {
        Self { enabled: false, require_confirmation: true }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "snake_case")]
pub enum MatchType {
    Exact,
    Glob,
    Path,
}

fn default_match_type() -> MatchType {
    MatchType::Exact
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RuleEntry {
    pub process_name: String,
    pub port: Option<u16>,
    pub note: Option<String>,
    #[serde(default = "default_match_type")]
    pub match_type: MatchType,
}

impl Default for Settings {
    fn default() -> Self {
        Self {
            schema_version: 2,
            ports: vec![
                PortConfig { port: 3000, label: Some("Dev Server".into()), project_name: None, project_path: None, protocol: PortProtocol::Tcp },
                PortConfig { port: 5173, label: Some("Vite".into()), project_name: None, project_path: None, protocol: PortProtocol::Tcp },
                PortConfig { port: 8080, label: Some("HTTP Alt".into()), project_name: None, project_path: None, protocol: PortProtocol::Tcp },
            ],
            profiles: vec![
                Profile {
                    id: "default".into(),
                    name: "Default".into(),
                    ports: vec![3000, 5173, 8080],
                    auto_fix: AutoFixSettings::default(),
                    whitelist: vec![],
                    blacklist: vec![],
                },
            ],
            active_profile: "default".into(),
            polling_interval_ms: 2000,
            autolaunch: false,
            start_minimized: false,
        }
    }
}

fn config_path() -> PathBuf {
    dirs_next::config_dir()
        .unwrap_or_else(|| PathBuf::from("."))
        .join("ZPortGuard")
        .join(CONFIG_FILE)
}

fn backup_config(content: &str) {
    let path = config_path();
    let ts = std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .map(|d| d.as_secs())
        .unwrap_or(0);
    let bak = path.with_file_name(format!("zportguard-config.json.bak-{}", ts));
    let _ = std::fs::write(bak, content);
}


fn migrate_v1_to_v2(val: &mut serde_json::Value) {
    let obj = match val.as_object_mut() {
        Some(o) => o,
        None => return,
    };


    let legacy_auto_fix = obj.remove("auto_fix").unwrap_or_else(|| serde_json::json!({
        "enabled": false,
        "require_confirmation": true
    }));
    let legacy_whitelist = obj.remove("whitelist").unwrap_or(serde_json::Value::Array(vec![]));
    let legacy_blacklist = obj.remove("blacklist").unwrap_or(serde_json::Value::Array(vec![]));


    obj.remove("accent_color");


    let mut clean_auto_fix = legacy_auto_fix.clone();
    if let Some(af) = clean_auto_fix.as_object_mut() {
        af.remove("ignore_whitelisted");
    }


    if let Some(ports) = obj.get_mut("ports").and_then(|p| p.as_array_mut()) {
        for port in ports.iter_mut() {
            if let Some(p) = port.as_object_mut() {
                p.remove("auto_fix_override");
            }
        }
    }


    let port_numbers: Vec<serde_json::Value> = obj
        .get("ports")
        .and_then(|p| p.as_array())
        .map(|arr| arr.iter().filter_map(|p| p.get("port").cloned()).collect())
        .unwrap_or_default();

    let profiles_val = obj.entry("profiles").or_insert(serde_json::Value::Array(vec![]));
    let profiles_arr = profiles_val.as_array_mut().unwrap();


    let mut seen: std::collections::HashSet<String> = std::collections::HashSet::new();
    profiles_arr.retain(|p| {
        let id = p.get("id").and_then(|v| v.as_str()).unwrap_or("").to_string();
        seen.insert(id)
    });

    if profiles_arr.is_empty() {
        profiles_arr.push(serde_json::json!({
            "id": "default",
            "name": "Default",
            "ports": port_numbers,
            "auto_fix": clean_auto_fix,
            "whitelist": legacy_whitelist,
            "blacklist": legacy_blacklist,
        }));
    } else {

        for profile in profiles_arr.iter_mut() {
            if let Some(p) = profile.as_object_mut() {
                p.entry("auto_fix").or_insert(clean_auto_fix.clone());
                p.entry("whitelist").or_insert(legacy_whitelist.clone());
                p.entry("blacklist").or_insert(legacy_blacklist.clone());

                if let Some(af) = p.get_mut("auto_fix").and_then(|v| v.as_object_mut()) {
                    af.remove("ignore_whitelisted");
                }
            }
        }
    }


    let first_id = obj
        .get("profiles")
        .and_then(|p| p.as_array())
        .and_then(|a| a.first())
        .and_then(|p| p.get("id"))
        .and_then(|v| v.as_str())
        .unwrap_or("default")
        .to_string();

    let active_valid = obj
        .get("active_profile")
        .and_then(|v| v.as_str())
        .map(|id| {
            obj.get("profiles")
                .and_then(|p| p.as_array())
                .map(|arr| arr.iter().any(|p| p.get("id").and_then(|v| v.as_str()) == Some(id)))
                .unwrap_or(false)
        })
        .unwrap_or(false);

    if !active_valid {
        obj.insert("active_profile".to_string(), serde_json::Value::String(first_id));
    }

    obj.insert("schema_version".to_string(), serde_json::json!(2));
}

pub fn load() -> Settings {
    let path = config_path();
    let content = match std::fs::read_to_string(&path) {
        Ok(c) => c,
        Err(_) => return Settings::default(),
    };

    let mut val: serde_json::Value = match serde_json::from_str(&content) {
        Ok(v) => v,
        Err(e) => {
            log::error!("Config JSON invalid: {e} — backing up and resetting to defaults");
            backup_config(&content);
            return Settings::default();
        }
    };

    let schema_version = val.get("schema_version").and_then(|v| v.as_u64()).unwrap_or(1) as u32;
    let needs_migration = schema_version < 2;
    if needs_migration {
        migrate_v1_to_v2(&mut val);
    }

    match serde_json::from_value::<Settings>(val) {
        Ok(mut s) => {

            if !s.profiles.iter().any(|p| p.id == s.active_profile) {
                if let Some(first) = s.profiles.first() {
                    s.active_profile = first.id.clone();
                } else {
                    return Settings::default();
                }
            }

            if needs_migration {
                let _ = save(&s);
            }
            s
        }
        Err(e) => {
            log::error!("Config deserialization failed after migration: {e} — backing up");
            backup_config(&content);
            Settings::default()
        }
    }
}

pub fn save(settings: &Settings) -> Result<()> {
    let path = config_path();
    if let Some(parent) = path.parent() {
        std::fs::create_dir_all(parent)?;
    }
    let json = serde_json::to_string_pretty(settings)?;
    std::fs::write(path, json)?;
    Ok(())
}

pub fn add_port_to_config(port: u16) -> Result<()> {
    let mut settings = load();
    if !settings.ports.iter().any(|p| p.port == port) {
        settings.ports.push(PortConfig {
            port,
            label: None,
            project_name: None,
            project_path: None,
            protocol: PortProtocol::Tcp,
        });
        save(&settings)?;
    }
    Ok(())
}

pub fn active_ports(settings: &Settings) -> Vec<u16> {
    settings.profiles
        .iter()
        .find(|p| p.id == settings.active_profile)
        .map(|p| p.ports.clone())
        .unwrap_or_default()
}
