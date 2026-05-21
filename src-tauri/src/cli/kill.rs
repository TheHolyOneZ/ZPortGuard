use crate::{port_scanner, process_manager};

pub fn run(port: u16) -> i32 {
    match port_scanner::get_port_entry(port) {
        Some(entry) => {
            if let Some(pid) = entry.pid {
                match process_manager::kill_process(pid) {
                    Ok(()) => {
                        println!("Killed process {} (PID {}) on port {}",
                            entry.process_name.as_deref().unwrap_or("unknown"), pid, port);
                        0
                    }
                    Err(e) => {
                        eprintln!("Failed to kill PID {}: {}", pid, e);
                        1
                    }
                }
            } else {
                eprintln!("Port {} is in use but PID could not be resolved.", port);
                1
            }
        }
        None => {
            println!("Port {} is not in use.", port);
            0
        }
    }
}
