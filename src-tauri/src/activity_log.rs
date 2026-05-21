use tauri_plugin_sql::{Builder as SqlBuilder, Migration, MigrationKind};

pub fn migrations() -> Vec<Migration> {
    vec![
        Migration {
            version: 1,
            description: "create events table",
            sql: "CREATE TABLE IF NOT EXISTS events (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                ts TEXT NOT NULL,
                port INTEGER NOT NULL,
                pid INTEGER,
                process_name TEXT,
                process_path TEXT,
                action TEXT NOT NULL,
                profile_id TEXT
            );",
            kind: MigrationKind::Up,
        },
        Migration {
            version: 2,
            description: "add protocol column",
            sql: "ALTER TABLE events ADD COLUMN protocol TEXT NOT NULL DEFAULT 'tcp';",
            kind: MigrationKind::Up,
        },
    ]
}

pub fn build_plugin() -> SqlBuilder {
    SqlBuilder::default().add_migrations("sqlite:zportguard.db", migrations())
}
