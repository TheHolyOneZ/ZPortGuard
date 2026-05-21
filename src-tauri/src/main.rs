
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

fn main() {
    let args: Vec<String> = std::env::args().collect();
    let has_subcommand = args.len() > 1
        && matches!(
            args[1].as_str(),
            "status" | "kill" | "watch" | "--help" | "-h"
        );

    if has_subcommand {
        std::process::exit(zportguard_lib::cli::run_cli());
    }

    zportguard_lib::run();
}
