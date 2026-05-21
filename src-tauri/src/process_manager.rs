use anyhow::{anyhow, Result};
use sysinfo::{Pid, Signal, System};

pub fn kill_process(pid: u32) -> Result<()> {
    let mut sys = System::new_all();
    sys.refresh_all();

    let sysinfo_pid = Pid::from(pid as usize);
    let process = sys
        .process(sysinfo_pid)
        .ok_or_else(|| anyhow!("Process with PID {} not found", pid))?;

    if process.kill_with(Signal::Kill).unwrap_or(false) || process.kill() {
        Ok(())
    } else {
        Err(anyhow!("Failed to kill process with PID {}", pid))
    }
}

