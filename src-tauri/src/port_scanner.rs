use netstat2::{get_sockets_info, AddressFamilyFlags, ProtocolFlags, ProtocolSocketInfo};
use serde::{Deserialize, Serialize};
use sysinfo::System;

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "snake_case")]
pub enum Protocol {
    Tcp,
    Udp,
}

fn default_protocol() -> Protocol {
    Protocol::Tcp
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PortEntry {
    pub port: u16,
    pub pid: Option<u32>,
    pub process_name: Option<String>,
    pub process_path: Option<String>,
    pub process_cwd: Option<String>,
    pub state: PortState,
    #[serde(default = "default_protocol")]
    pub protocol: Protocol,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "snake_case")]
pub enum PortState {
    Clear,
    InUse,
    Unknown,
}

pub fn scan_ports(ports: &[u16]) -> Vec<PortEntry> {
    let socket_map = build_socket_map();
    let mut sys = System::new_all();
    sys.refresh_all();

    ports
        .iter()
        .map(|&port| resolve_port(port, &socket_map, &sys))
        .collect()
}

pub fn get_port_entry(port: u16) -> Option<PortEntry> {
    let socket_map = build_socket_map();
    let mut sys = System::new_all();
    sys.refresh_all();
    let entry = resolve_port(port, &socket_map, &sys);
    if entry.state == PortState::InUse {
        Some(entry)
    } else {
        None
    }
}

pub fn scan_all_active() -> Vec<PortEntry> {
    let af_flags = AddressFamilyFlags::IPV4 | AddressFamilyFlags::IPV6;
    let proto_flags = ProtocolFlags::TCP | ProtocolFlags::UDP;
    let mut sys = System::new_all();
    sys.refresh_all();

    let sockets = match get_sockets_info(af_flags, proto_flags) {
        Ok(s) => s,
        Err(e) => {
            log::warn!("scan_all_active: get_sockets_info failed: {e} — returning empty result. \
                        On macOS this may indicate a permissions issue; on Linux check netstat2 support.");
            return vec![];
        }
    };

    sockets
        .into_iter()
        .filter_map(|si| {
            let (port, scanner_proto) = match &si.protocol_socket_info {
                ProtocolSocketInfo::Tcp(tcp) => (tcp.local_port, Protocol::Tcp),
                ProtocolSocketInfo::Udp(udp) => (udp.local_port, Protocol::Udp),
            };
            let pid = si.associated_pids.first().copied();
            let (name, path, cwd) = pid
                .and_then(|p| {
                    let pid = sysinfo::Pid::from(p as usize);
                    sys.process(pid).map(|proc| {
                        (
                            Some(proc.name().to_string_lossy().to_string()),
                            proc.exe().map(|p| p.to_string_lossy().to_string()),
                            proc.cwd().map(|p| p.to_string_lossy().to_string()),
                        )
                    })
                })
                .unwrap_or((None, None, None));
            Some(PortEntry {
                port,
                pid,
                process_name: name,
                process_path: path,
                process_cwd: cwd,
                state: PortState::InUse,
                protocol: scanner_proto,
            })
        })
        .collect()
}


pub fn build_separate_maps() -> (std::collections::HashMap<u16, u32>, std::collections::HashMap<u16, u32>) {
    let af_flags = AddressFamilyFlags::IPV4 | AddressFamilyFlags::IPV6;
    let proto_flags = ProtocolFlags::TCP | ProtocolFlags::UDP;
    let mut tcp_map: std::collections::HashMap<u16, u32> = std::collections::HashMap::new();
    let mut udp_map: std::collections::HashMap<u16, u32> = std::collections::HashMap::new();

    match get_sockets_info(af_flags, proto_flags) {
        Ok(sockets) => {
            for si in sockets {
                match &si.protocol_socket_info {
                    ProtocolSocketInfo::Tcp(tcp) => {
                        if let Some(&pid) = si.associated_pids.first() {
                            tcp_map.insert(tcp.local_port, pid);
                        }
                    }
                    ProtocolSocketInfo::Udp(udp) => {
                        if let Some(&pid) = si.associated_pids.first() {
                            udp_map.insert(udp.local_port, pid);
                        }
                    }
                }
            }
        }
        Err(e) => {
            log::warn!("build_separate_maps: get_sockets_info failed: {e}");
        }
    }
    (tcp_map, udp_map)
}


fn build_socket_map() -> std::collections::HashMap<u16, (u32, Protocol)> {
    let (tcp_map, udp_map) = build_separate_maps();
    let mut map = std::collections::HashMap::new();
    for (port, pid) in &udp_map {
        map.insert(*port, (*pid, Protocol::Udp));
    }
    for (port, pid) in &tcp_map {
        map.insert(*port, (*pid, Protocol::Tcp));
    }
    map
}

fn resolve_port(
    port: u16,
    socket_map: &std::collections::HashMap<u16, (u32, Protocol)>,
    sys: &System,
) -> PortEntry {
    match socket_map.get(&port) {
        Some(&(pid, ref proto)) => {
            let sysinfo_pid = sysinfo::Pid::from(pid as usize);
            let (name, path, cwd) = sys
                .process(sysinfo_pid)
                .map(|p| {
                    (
                        Some(p.name().to_string_lossy().to_string()),
                        p.exe().map(|e| e.to_string_lossy().to_string()),
                        p.cwd().map(|c| c.to_string_lossy().to_string()),
                    )
                })
                .unwrap_or((None, None, None));
            PortEntry {
                port,
                pid: Some(pid),
                process_name: name,
                process_path: path,
                process_cwd: cwd,
                state: PortState::InUse,
                protocol: proto.clone(),
            }
        }
        None => PortEntry {
            port,
            pid: None,
            process_name: None,
            process_path: None,
            process_cwd: None,
            state: PortState::Clear,
            protocol: Protocol::Tcp,
        },
    }
}
