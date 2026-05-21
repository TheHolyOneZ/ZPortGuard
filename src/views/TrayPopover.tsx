import { getCurrentWindow } from "@tauri-apps/api/window";
import { Shield, Settings, Power, Sparkles, Plus, Radio } from "lucide-react";
import { usePortStatus } from "@/hooks/usePortStatus";
import { useSettings } from "@/hooks/useSettings";
import { PortRow } from "@/components/PortRow";
import { StatusDot } from "@/components/StatusDot";
import { Toggle } from "@/components/ui/Toggle";
import { EmptyState } from "@/components/ui/EmptyState";
import { Button } from "@/components/ui/Button";
import { WebviewWindow } from "@tauri-apps/api/webviewWindow";
import { emit } from "@tauri-apps/api/event";
import { PrefTab } from "@/store/navStore";

export function TrayPopover() {
  const { entries, hasConflict } = usePortStatus();
  const { settings, update } = useSettings();

  const conflictEntries = entries.filter((e) => e.state === "in_use");
  const displayEntries = hasConflict
    ? conflictEntries.slice(0, 5)
    : entries.slice(0, 5);

  const activeProfile = settings?.profiles.find(
    (p) => p.id === settings.active_profile
  );

  const toggleAutoFix = async () => {
    if (!settings || !activeProfile) return;
    await update({
      ...settings,
      profiles: settings.profiles.map((p) =>
        p.id !== activeProfile.id
          ? p
          : { ...p, auto_fix: { ...p.auto_fix, enabled: !p.auto_fix.enabled } }
      ),
    });
  };

  const openPreferences = async (tab?: PrefTab) => {
    const win = await WebviewWindow.getByLabel("main");
    if (win) {
      await win.show();
      await win.setFocus();
    }
    if (tab) await emit("zpg:navigate", { view: "preferences", tab });
    await getCurrentWindow().hide();
  };

  const handleQuit = async () => {
    const { exit } = await import("@tauri-apps/plugin-process");
    exit(0);
  };

  const autoFixEnabled = !!activeProfile?.auto_fix?.enabled;

  return (
    <div
      className="flex flex-col h-screen w-full select-none overflow-hidden rounded-2xl
                 bg-card text-foreground hairline shadow-popover
                 anim-slide-up-fade
                 relative isolate"
    >

      <div
        aria-hidden
        className="absolute inset-0 pointer-events-none opacity-90"
        style={{
          background:
            "radial-gradient(600px 200px at 10% -10%, rgba(124,58,237,0.20), transparent 60%), radial-gradient(500px 220px at 100% 0%, rgba(59,130,246,0.14), transparent 60%)",
        }}
      />


      <div
        className="relative flex items-center justify-between px-3.5 h-11 border-b border-border"
        data-tauri-drag-region
      >
        <div className="flex items-center gap-2">
          <div className="relative flex items-center justify-center size-6 rounded-md bg-gradient-brand shadow-[0_0_18px_-4px_rgba(124,58,237,0.7)]">
            <Shield className="size-3.5 text-white" strokeWidth={2.5} />
          </div>
          <span className="text-[13px] font-semibold tracking-tight">
            ZPortGuard
          </span>
          {activeProfile && (
            <span
              className="ml-1 inline-flex items-center gap-1 px-1.5 h-[18px] rounded-md bg-primary/12 border border-primary/25 text-primary-glow text-[10px] font-semibold tracking-wide uppercase"
              title={`Active profile: ${activeProfile.name}`}
            >
              <Radio className="size-2" />
              {activeProfile.name}
            </span>
          )}
        </div>

        <button
          onClick={toggleAutoFix}
          className="press focus-ring flex items-center gap-1.5 h-6 pl-1.5 pr-2 rounded-md border border-border-strong bg-secondary/60 hover:bg-secondary hover:border-border-bright transition-[background-color,border-color] duration-150"
          title={
            autoFixEnabled
              ? "Auto-Fix is on — conflicting processes will be killed automatically"
              : "Auto-Fix is off — kill manually from the row"
          }
        >
          <Sparkles
            className={
              autoFixEnabled
                ? "size-3 text-primary-glow"
                : "size-3 text-muted-foreground"
            }
          />
          <span className="text-[10.5px] font-semibold tracking-wide uppercase text-muted-foreground">
            Auto-Fix
          </span>
          <span
            className={
              autoFixEnabled
                ? "text-[10.5px] font-bold text-primary-glow"
                : "text-[10.5px] font-bold text-muted-foreground"
            }
          >
            {autoFixEnabled ? "ON" : "OFF"}
          </span>
        </button>
      </div>


      <div className="relative flex items-center gap-2.5 px-3.5 h-9 border-b border-border bg-surface-0/40">
        <StatusDot
          status={hasConflict ? "conflict" : "clear"}
          pulse={hasConflict}
          size="sm"
        />
        <span className="text-[11.5px] text-foreground/90 font-medium">
          {hasConflict
            ? `${conflictEntries.length} conflict${conflictEntries.length > 1 ? "s" : ""} detected`
            : "All monitored ports clear"}
        </span>
        <span className="ml-auto text-[10.5px] mono text-muted-foreground tabular">
          {entries.length} watched
        </span>
      </div>


      <div className="relative flex-1 overflow-y-auto px-2 py-2">
        {displayEntries.length === 0 ? (
          <EmptyState
            compact
            icon={<Plus />}
            title="No ports monitored"
            description="Add the ports your dev servers use to start watching."
            action={
              <Button
                size="sm"
                variant="secondary"
                onClick={() => openPreferences("ports")}
              >
                Open Preferences
              </Button>
            }
          />
        ) : (
          <div className="flex flex-col gap-0.5">
            {displayEntries.map((entry, i) => {
              const projectName = settings?.ports.find(
                (p) => p.port === entry.port
              )?.project_name;
              return (
                <div
                  key={entry.port}
                  className="anim-stagger-in"
                  style={{ animationDelay: `${i * 35}ms` }}
                >
                  <PortRow entry={entry} projectName={projectName} compact />
                </div>
              );
            })}
          </div>
        )}
      </div>


      <div className="relative flex items-center justify-between px-2 h-10 border-t border-border bg-surface-0/40">
        <div className="flex items-center gap-1">
          <Button
            size="sm"
            variant="ghost"
            onClick={() => openPreferences()}
            leftIcon={<Settings className="size-3.5" />}
          >
            Preferences
          </Button>
        </div>
        <div className="flex items-center gap-2 pr-1">
          <Toggle checked={autoFixEnabled} onChange={toggleAutoFix} size="sm" />
          <button
            onClick={handleQuit}
            className="press focus-ring size-7 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 inline-flex items-center justify-center transition-colors duration-150"
            aria-label="Quit"
            title="Quit"
          >
            <Power className="size-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
