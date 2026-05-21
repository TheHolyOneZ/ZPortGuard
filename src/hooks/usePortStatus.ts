import { useEffect } from "react";
import { usePortsStore } from "@/store/portsStore";

export function usePortStatus() {
  const { entries, hasConflict, recentConflicts, startListening } = usePortsStore();

  useEffect(() => {
    let unlisten: (() => void) | undefined;
    startListening().then((fn) => {
      unlisten = fn;
    });
    return () => {
      unlisten?.();
    };
  }, []);

  return { entries, hasConflict, recentConflicts };
}
