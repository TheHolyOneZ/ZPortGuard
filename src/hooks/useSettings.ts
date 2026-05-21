import { useEffect } from "react";
import { useSettingsStore } from "@/store/settingsStore";

export function useSettings() {
  const { settings, loading, load, update, replace } = useSettingsStore();

  useEffect(() => {
    if (!settings) {
      load();
    }
  }, []);

  return { settings, loading, update, replace, reload: load };
}
