import { create } from "zustand";
import { api, Settings } from "@/lib/api";
import { toast } from "./toastStore";

interface SettingsStore {
  settings: Settings | null;
  loading: boolean;
  load: () => Promise<void>;
  update: (settings: Settings) => Promise<void>;


  replace: (settings: Settings) => void;
}

export const useSettingsStore = create<SettingsStore>((set) => ({
  settings: null,
  loading: false,

  load: async () => {
    set({ loading: true });
    try {
      const settings = await api.getSettings();
      set({ settings, loading: false });
    } catch (e) {
      set({ loading: false });
      toast.error(
        "Couldn't load settings",
        e instanceof Error ? e.message : "Unknown error"
      );
    }
  },

  update: async (settings: Settings) => {
    try {
      await api.updateSettings(settings);
      set({ settings });
    } catch (e) {
      toast.error(
        "Couldn't save settings",
        e instanceof Error ? e.message : "Unknown error"
      );
      throw e;
    }
  },

  replace: (settings: Settings) => set({ settings }),
}));
