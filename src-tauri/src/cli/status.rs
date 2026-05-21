use crate::port_scanner;

pub fn run() -> i32 {
    let ports = port_scanner::scan_all_active();
    if ports.is_empty() {
        println!("No active connections found.");
        return 0;
    }
    println!("{:<8} {:<6} {:<8} {:<24} {}", "PORT", "PROTO", "PID", "PROCESS", "PATH");
    println!("{}", "-".repeat(80));
    for entry in &ports {
        let proto = match entry.protocol {
            port_scanner::Protocol::Tcp => "tcp",
            port_scanner::Protocol::Udp => "udp",
        };
        println!(
            "{:<8} {:<6} {:<8} {:<24} {}",
            entry.port,
            proto,
            entry.pid.map(|p| p.to_string()).unwrap_or_default(),
            entry.process_name.as_deref().unwrap_or("-"),
            entry.process_path.as_deref().unwrap_or("-"),
        );
    }
    0
}
