use clap::{Parser, Subcommand};

#[derive(Parser)]
#[command(name = "zportguard", about = "Port conflict detector and auto-fixer")]
pub struct Cli {
    #[command(subcommand)]
    pub command: Commands,
}

#[derive(Subcommand)]
pub enum Commands {

    Status,

    Kill {

        port: u16,
    },

    Watch {

        port: u16,
    },
}

pub fn run_cli() -> i32 {
    let cli = Cli::parse();

    match cli.command {
        Commands::Status => status::run(),
        Commands::Kill { port } => kill::run(port),
        Commands::Watch { port } => watch::run(port),
    }
}

mod status;
mod kill;
mod watch;
