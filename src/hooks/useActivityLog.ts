import { useEffect, useRef } from "react";
import { listen } from "@tauri-apps/api/event";
import Database from "@tauri-apps/plugin-sql";
import { create } from "zustand";
import { FrontendLogEvent, LogAction, api } from "@/lib/api";

export interface LogRow {
  id: number;
  ts: string;
  port: number;
  pid: number | null;
  process_name: string | null;
  process_path: string | null;
  action: LogAction;
  protocol: "tcp" | "udp";
}

interface ActivityLogStore {
  rows: LogRow[];
  sessionStart: number;
  pushRow: (row: LogRow) => void;
  setRows: (rows: LogRow[]) => void;
  clear: () => void;
}

const useActivityLogStore = create<ActivityLogStore>((set) => ({
  rows: [],
  sessionStart: Date.now(),
  pushRow: (row) => set((s) => ({ rows: [row, ...s.rows].slice(0, 1000) })),
  setRows: (rows) => set({ rows }),
  clear: () => set({ rows: [] }),
}));

let dbInstance: Database | null = null;
let dbPromise: Promise<Database> | null = null;

async function getDb(): Promise<Database> {
  if (dbInstance) return dbInstance;
  if (!dbPromise) {
    dbPromise = Database.load("sqlite:zportguard.db").then((db) => {
      dbInstance = db;
      return db;
    });
  }
  return dbPromise;
}

async function insertRow(event: FrontendLogEvent, profileId?: string | null): Promise<LogRow | null> {
  try {
    const db = await getDb();
    const result = await db.execute(
      `INSERT INTO events (ts, port, pid, process_name, process_path, action, profile_id, protocol)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [
        event.ts,
        event.port,
        event.pid ?? null,
        event.process_name ?? null,
        event.process_path ?? null,
        event.action,
        profileId ?? null,
        event.protocol,
      ]
    );
    return {
      id: result.lastInsertId as number,
      ts: event.ts,
      port: event.port,
      pid: event.pid ?? null,
      process_name: event.process_name ?? null,
      process_path: event.process_path ?? null,
      action: event.action as LogAction,
      protocol: event.protocol as "tcp" | "udp",
    };
  } catch (e) {
    console.error("useActivityLog: insert failed", e);
    return null;
  }
}

async function loadRecent(limit: number): Promise<LogRow[]> {
  try {
    const db = await getDb();
    const rows = await db.select<LogRow[]>(
      `SELECT id, ts, port, pid, process_name, process_path, action, protocol
       FROM events ORDER BY id DESC LIMIT $1`,
      [limit]
    );
    return rows;
  } catch (e) {
    console.error("useActivityLog: loadRecent failed", e);
    return [];
  }
}

async function clearAll(): Promise<void> {
  try {
    const db = await getDb();
    await db.execute("DELETE FROM events");
  } catch (e) {
    console.error("useActivityLog: clear failed", e);
  }
}


export function useActivityLogInit() {
  const pushRow = useActivityLogStore((s) => s.pushRow);
  const setRows = useActivityLogStore((s) => s.setRows);
  const initialized = useRef(false);

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;


    loadRecent(500).then(setRows);


    const unlisten = listen<FrontendLogEvent>("log-event", async (event) => {
      const settings = await api.getSettings().catch(() => null);
      const row = await insertRow(event.payload, settings?.active_profile ?? null);
      if (row) pushRow(row);
    });

    return () => {
      unlisten.then((fn) => fn());
    };
  }, [pushRow, setRows]);
}


export function useActivityLog() {
  const rows = useActivityLogStore((s) => s.rows);
  const sessionStart = useActivityLogStore((s) => s.sessionStart);
  const storeRows = useActivityLogStore((s) => s.setRows);
  const storeClear = useActivityLogStore((s) => s.clear);

  const sessionRows = rows.filter((r) => new Date(r.ts).getTime() >= sessionStart);

  const clear = async () => {
    await clearAll();
    storeClear();
    storeRows([]);
  };

  return { rows, sessionRows, sessionStart, clear };
}
