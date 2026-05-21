use crate::config;

pub fn run(port: u16) -> i32 {
    match config::add_port_to_config(port) {
        Ok(()) => {
            println!("Port {} added to monitored list.", port);
            0
        }
        Err(e) => {
            eprintln!("Failed to add port {}: {}", port, e);
            1
        }
    }
}
