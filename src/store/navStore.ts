import { create } from "zustand";

export type View = "dashboard" | "monitor" | "preferences" | "debug" | "guide" | "about";
export type PrefTab = "ports" | "profiles" | "rules" | "logs" | "general";

interface NavStore {
  view: View;
  prefTab: PrefTab;
  setView: (view: View) => void;
  setPrefTab: (tab: PrefTab) => void;
  goToPreferences: (tab?: PrefTab) => void;
}

export const useNavStore = create<NavStore>((set) => ({
  view: "dashboard",
  prefTab: "ports",
  setView: (view) => set({ view }),
  setPrefTab: (prefTab) => set({ prefTab }),
  goToPreferences: (tab) =>
    set((s) => ({ view: "preferences", prefTab: tab ?? s.prefTab })),
}));
