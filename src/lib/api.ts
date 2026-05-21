import { invoke } from "@tauri-apps/api/core";

export type PortProtocol = "tcp" | "udp" | "both";
export type MatchType = "exact" | "glob" | "path";
export type LogAction = "auto_killed" | "user_killed" | "user_ignored" | "dismissed" | "conflict_detected";


export interface PortEntry {
  port: number;
  pid: number | null;
  process_name: string | null;
  process_path: string | null;
  process_cwd: string | null;
  state: "clear" | "in_use" | "unknown";
  protocol: "tcp" | "udp";
}

export interface PortConfig {
  port: number;
  label: string | null;
  project_name: string | null;
  project_path: string | null;
  protocol: PortProtocol;
}

export interface AutoFixSettings {
  enabled: boolean;
  require_confirmation: boolean;
}

export interface RuleEntry {
  process_name: string;
  port: number | null;
  note: string | null;
  match_type: MatchType;
}

export interface Profile {
  id: string;
  name: string;
  ports: number[];
  auto_fix: AutoFixSettings;
  whitelist: RuleEntry[];
  blacklist: RuleEntry[];
}

export interface Settings {
  schema_version: number;
  ports: PortConfig[];
  profiles: Profile[];
  active_profile: string;
  polling_interval_ms: number;
  autolaunch: boolean;
  start_minimized: boolean;
}

export interface PortStatusEvent {
  entries: PortEntry[];
  has_conflict: boolean;
}

export interface ConflictEvent {
  port: number;
  pid: number;
  process_name: string;
  auto_fixed: boolean;
  protocol: string;
}

export interface FrontendLogEvent {
  ts: string;
  port: number;
  pid: number | null;
  process_name: string | null;
  process_path: string | null;
  action: LogAction;
  protocol: "tcp" | "udp";
}

export const api = {
  getPortStatus: (ports: number[]) =>
    invoke<PortEntry[]>("get_port_status", { ports }),

  killPort: (port: number) =>
    invoke<string>("kill_port", { port }),

  getSettings: () =>
    invoke<Settings>("get_settings"),

  updateSettings: (settings: Settings) =>
    invoke<void>("update_settings", { settings }),

  addPort: (port: number, label?: string, protocol?: PortProtocol) =>
    invoke<Settings>("add_port", { port, label: label ?? null, protocol: protocol ?? null }),

  removePort: (port: number) =>
    invoke<Settings>("remove_port", { port }),

  setActiveProfile: (profileId: string) =>
    invoke<Settings>("set_active_profile", { profileId }),

  getActivePorts: () =>
    invoke<number[]>("get_active_ports"),

  updatePortProject: (port: number, projectName: string | null, projectPath: string | null) =>
    invoke<Settings>("update_port_project", { port, projectName, projectPath }),

  updatePortProtocol: (port: number, protocol: PortProtocol) =>
    invoke<Settings>("update_port_protocol", { port, protocol }),

  scanAllActivePorts: () =>
    invoke<PortEntry[]>("scan_all_active_ports"),

  pauseMonitor: () => invoke<void>("pause_monitor"),
  resumeMonitor: () => invoke<void>("resume_monitor"),
  isMonitorPaused: () => invoke<boolean>("is_monitor_paused"),

  logUserDismissed: (port: number, pid: number, protocol: string) =>
    invoke<void>("log_user_dismissed", { port, pid, protocol }),

  debugEmitLogEvent: () =>
    invoke<void>("debug_emit_log_event"),

  debugSpawnPortHolder: (port: number, protocol?: string) =>
    invoke<number>("debug_spawn_port_holder", { port, protocol: protocol ?? null }),
};
