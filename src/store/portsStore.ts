import { create } from "zustand";
import { listen } from "@tauri-apps/api/event";
import { api, PortEntry, PortStatusEvent, ConflictEvent } from "@/lib/api";

interface PortsStore {
  entries: PortEntry[];
  hasConflict: boolean;
  recentConflicts: ConflictEvent[];
  pendingConfirmations: ConflictEvent[];
  dismissConfirmation: (port: number, pid: number) => void;
  startListening: () => Promise<() => void>;
  refresh: () => Promise<void>;
}

export const usePortsStore = create<PortsStore>((set) => ({
  entries: [],
  hasConflict: false,
  recentConflicts: [],
  pendingConfirmations: [],

  dismissConfirmation: (port, pid) =>
    set((s) => ({
      pendingConfirmations: s.pendingConfirmations.filter(
        (c) => !(c.port === port && c.pid === pid)
      ),
    })),

  refresh: async () => {
    try {
      const entries = await api.scanAllActivePorts();
      const hasConflict = entries.some((e) => e.state === "in_use");
      set({ entries, hasConflict });
    } catch {

    }
  },

  startListening: async () => {
    const unlistenStatus = await listen<PortStatusEvent>(
      "port-status-changed",
      (event) => {
        set({
          entries: event.payload.entries,
          hasConflict: event.payload.has_conflict,
        });
      }
    );

    const unlistenConflict = await listen<ConflictEvent>(
      "conflict-detected",
      (event) => {
        set((state) => {
          const top = state.recentConflicts[0];

          if (top && top.port === event.payload.port && top.pid === event.payload.pid && !top.auto_fixed) {
            return {};
          }
          return {
            recentConflicts: [event.payload, ...state.recentConflicts].slice(0, 100),
          };
        });
      }
    );

    const unlistenFixed = await listen<ConflictEvent>(
      "conflict-auto-fixed",
      (event) => {
        set((state) => ({
          recentConflicts: [event.payload, ...state.recentConflicts].slice(0, 100),

          pendingConfirmations: state.pendingConfirmations.filter(
            (c) => !(c.port === event.payload.port && c.pid === event.payload.pid)
          ),
        }));
      }
    );

    const unlistenConfirm = await listen<ConflictEvent>(
      "conflict-needs-confirmation",
      (event) => {
        set((state) => {
          const already = state.pendingConfirmations.some(
            (c) => c.port === event.payload.port && c.pid === event.payload.pid
          );
          if (already) return {};
          return { pendingConfirmations: [...state.pendingConfirmations, event.payload] };
        });
      }
    );


    const unlistenStatusForConfirm = await listen<PortStatusEvent>(
      "port-status-changed",
      (event) => {
        const activeKeys = new Set(
          event.payload.entries
            .filter((e) => e.state === "in_use" && e.pid != null)
            .map((e) => `${e.port}:${e.pid}`)
        );
        set((state) => ({
          pendingConfirmations: state.pendingConfirmations.filter((c) =>
            activeKeys.has(`${c.port}:${c.pid}`)
          ),
        }));
      }
    );

    return () => {
      unlistenStatus();
      unlistenConflict();
      unlistenFixed();
      unlistenConfirm();
      unlistenStatusForConfirm();
    };
  },
}));
