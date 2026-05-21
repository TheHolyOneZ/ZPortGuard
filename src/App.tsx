import { getCurrentWindow } from "@tauri-apps/api/window";
import { TrayPopover } from "@/views/TrayPopover";
import { Dashboard } from "@/views/Dashboard";
import { Toaster } from "@/components/ui/Toaster";
import { useActivityLogInit } from "@/hooks/useActivityLog";

const windowLabel = getCurrentWindow().label;

export default function App() {
  useActivityLogInit();

  if (windowLabel === "tray") {
    return (
      <>
        <TrayPopover />
        <Toaster />
      </>
    );
  }
  return (
    <>
      <Dashboard />
      <Toaster />
    </>
  );
}
