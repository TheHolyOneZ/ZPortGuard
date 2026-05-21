import {
  Shield,
  Activity,
  SlidersHorizontal,
  ShieldCheck,
  AlertTriangle,
  Radio,
  ListTree,
  ArrowRight,
  Plus,
  Sparkles,
  PanelLeftClose,
  PanelLeftOpen,
  Pause,
  Play,
  PauseCircle,
  Bug,
  BookOpen,
  Info,
} from "lucide-react";
import { usePortStatus } from "@/hooks/usePortStatus";
import { useSettings } from "@/hooks/useSettings";
import { BentoCard } from "@/components/BentoCard";
import { PortRow } from "@/components/PortRow";
import { ConflictChart } from "@/components/ConflictChart";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { Button } from "@/components/ui/Button";
import { Callout } from "@/components/ui/Callout";
import { Skeleton } from "@/components/ui/Skeleton";
import { PreferencesPanel } from "./preferences/PreferencesPanel";
import { MonitorView } from "./MonitorView";
import { DebugTab } from "./preferences/DebugTab";
import { GuideTab } from "./preferences/GuideTab";
import { AboutTab } from "./preferences/AboutTab";
import { StatSummary } from "@/components/StatSummary";
import { ConfirmKillModal } from "@/components/ui/ConfirmKillModal";
import { cn } from "@/lib/utils";
import { useNavStore, PrefTab } from "@/store/navStore";
import { useEffect, useState } from "react";
import { listen } from "@tauri-apps/api/event";
import { api } from "@/lib/api";

const SIDEBAR_COLLAPSED_KEY = "zpg:sidebar:collapsed";

export function Dashboard() {
  const { entries, hasConflict, recentConflicts } = usePortStatus();
  const { settings, loading } = useSettings();
  const view = useNavStore((s) => s.view);
  const setView = useNavStore((s) => s.setView);
  const goToPreferences = useNavStore((s) => s.goToPreferences);

  const [monitorPaused, setMonitorPaused] = useState(false);
  useEffect(() => {
    api.isMonitorPaused().then(setMonitorPaused).catch(() => {});
  }, []);

  const [collapsed, setCollapsed] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    try {
      return window.localStorage.getItem(SIDEBAR_COLLAPSED_KEY) === "1";
    } catch {
      return false;
    }
  });
  useEffect(() => {
    try {
      window.localStorage.setItem(
        SIDEBAR_COLLAPSED_KEY,
        collapsed ? "1" : "0"
      );
    } catch {

    }
  }, [collapsed]);


  useEffect(() => {
    let unlisten: (() => void) | undefined;
    listen<{ view: "preferences"; tab: PrefTab }>("zpg:navigate", (e) => {
      goToPreferences(e.payload.tab);
    }).then((fn) => {
      unlisten = fn;
    });
    return () => {
      unlisten?.();
    };
  }, [goToPreferences]);

  const conflictCount = entries.filter((e) => e.state === "in_use").length;
  const clearCount = entries.filter((e) => e.state === "clear").length;
  const autoFixedCount = recentConflicts.filter((c) => c.auto_fixed).length;

  return (
    <div className="flex h-screen bg-background text-foreground overflow-hidden">
      <ConfirmKillModal />
      <Sidebar
        collapsed={collapsed}
        onToggleCollapse={() => setCollapsed((c) => !c)}
        view={view}
        onSetView={setView}
        hasConflict={hasConflict}
        conflictCount={conflictCount}
        monitorPaused={monitorPaused}
      />


      <main className="flex-1 overflow-y-auto">
        <div key={view} className="anim-fade-in">
          {view === "dashboard" ? (
            <DashboardView
              entries={entries}
              hasConflict={hasConflict}
              conflictCount={conflictCount}
              clearCount={clearCount}
              recentConflicts={recentConflicts}
              autoFixedCount={autoFixedCount}
              settings={settings}
              loading={loading}
              onGoToPreferences={goToPreferences}
              monitorPaused={monitorPaused}
              onTogglePause={async () => {
                if (monitorPaused) {
                  await api.resumeMonitor();
                  setMonitorPaused(false);
                } else {
                  await api.pauseMonitor();
                  setMonitorPaused(true);
                }
              }}
            />
          ) : view === "monitor" ? (
            <MonitorView />
          ) : view === "guide" ? (
            <div className="px-8 py-7 max-w-[1100px] mx-auto">
              <GuideTab />
            </div>
          ) : view === "debug" ? (
            <div className="px-8 py-7 max-w-[1100px] mx-auto">
              <DebugTab />
            </div>
          ) : view === "about" ? (
            <div className="px-8 py-7 max-w-[1100px] mx-auto">
              <AboutTab />
            </div>
          ) : (
            <PreferencesPanel />
          )}
        </div>
      </main>
    </div>
  );
}

function Sidebar({
  collapsed,
  onToggleCollapse,
  view,
  onSetView,
  hasConflict,
  conflictCount,
  monitorPaused,
}: {
  collapsed: boolean;
  onToggleCollapse: () => void;
  view: import("@/store/navStore").View;
  onSetView: (v: import("@/store/navStore").View) => void;
  hasConflict: boolean;
  conflictCount: number;
  monitorPaused: boolean;
}) {
  const statusLabel = monitorPaused
    ? "Monitor paused"
    : hasConflict
    ? `${conflictCount} conflict${conflictCount === 1 ? "" : "s"} detected`
    : "Monitor running";

  return (
    <aside
      className={cn(
        "flex flex-col shrink-0 border-r border-border bg-card/40",
        "transition-[width] duration-200 ease-out",
        collapsed ? "w-14" : "w-52"
      )}
      data-tauri-drag-region
    >

      <div
        className={cn(
          "flex items-center h-12 shrink-0 px-3 border-b border-border/70",
          collapsed ? "justify-center" : "justify-between"
        )}
      >
        <button
          type="button"
          onClick={() => onSetView("dashboard")}
          title="ZPortGuard — Home"
          aria-label="ZPortGuard home"
          className={cn(
            "press focus-ring inline-flex items-center gap-2 rounded-md",
            "text-foreground hover:text-primary-glow transition-colors duration-150"
          )}
        >
          <span
            aria-hidden
            className="size-6 rounded-md bg-primary/15 border border-primary/30 inline-flex items-center justify-center"
          >
            <Shield className="size-3.5 text-primary-glow" strokeWidth={2.5} />
          </span>
          {!collapsed && (
            <span className="text-[12.5px] font-semibold tracking-tight">
              ZPortGuard
            </span>
          )}
        </button>
        {!collapsed && (
          <button
            type="button"
            onClick={onToggleCollapse}
            title="Collapse sidebar"
            aria-label="Collapse sidebar"
            className="press focus-ring size-7 rounded-md inline-flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-secondary/60 transition-colors"
          >
            <PanelLeftClose className="size-3.5" />
          </button>
        )}
      </div>


      <nav className="flex flex-col gap-0.5 p-2">
        <SidebarItem
          icon={<Activity className="size-[16px]" />}
          label="Dashboard"
          active={view === "dashboard"}
          collapsed={collapsed}
          onClick={() => onSetView("dashboard")}
        />
        <SidebarItem
          icon={<Radio className="size-[16px]" />}
          label="Monitor"
          active={view === "monitor"}
          collapsed={collapsed}
          onClick={() => onSetView("monitor")}
        />
        <SidebarItem
          icon={<SlidersHorizontal className="size-[16px]" />}
          label="Preferences"
          active={view === "preferences"}
          collapsed={collapsed}
          onClick={() => onSetView("preferences")}
        />
        <SidebarItem
          icon={<BookOpen className="size-[16px]" />}
          label="Guide"
          active={view === "guide"}
          collapsed={collapsed}
          onClick={() => onSetView("guide")}
        />
        <SidebarItem
          icon={<Bug className="size-[16px]" />}
          label="Debug"
          active={view === "debug"}
          collapsed={collapsed}
          onClick={() => onSetView("debug")}
        />
        <SidebarItem
          icon={<Info className="size-[16px]" />}
          label="About"
          active={view === "about"}
          collapsed={collapsed}
          onClick={() => onSetView("about")}
        />
      </nav>


      <div className="mt-auto flex flex-col gap-1 p-2 border-t border-border/70">
        {collapsed && (
          <button
            type="button"
            onClick={onToggleCollapse}
            title="Expand sidebar"
            aria-label="Expand sidebar"
            className="press focus-ring h-8 rounded-md inline-flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-secondary/60 transition-colors"
          >
            <PanelLeftOpen className="size-3.5" />
          </button>
        )}
        <div
          className={cn(
            "group relative flex items-center gap-2 h-8 rounded-md px-2",
            "text-[11.5px] text-muted-foreground",
            collapsed && "justify-center"
          )}
          title={
            monitorPaused
              ? "Monitor is paused."
              : hasConflict
              ? `${statusLabel}. Monitor is running and reporting.`
              : "Monitor is running. No conflicts on watched ports."
          }
          aria-label={statusLabel}
        >
          <span
            className={cn(
              "size-2 rounded-full shrink-0",
              monitorPaused
                ? "bg-muted-foreground"
                : hasConflict
                ? "bg-warning shadow-[0_0_10px_rgba(245,158,11,0.85)] animate-[pulse-glow_2.2s_ease-in-out_infinite]"
                : "bg-success shadow-[0_0_8px_rgba(16,185,129,0.7)]"
            )}
          />
          {!collapsed && (
            <span
              className={cn(
                "truncate",
                monitorPaused
                  ? "text-muted-foreground"
                  : hasConflict
                  ? "text-warning-glow"
                  : "text-foreground/80"
              )}
            >
              {statusLabel}
            </span>
          )}
          {collapsed && (
            <span
              className="pointer-events-none absolute left-[calc(100%+8px)] whitespace-nowrap
                         px-2 py-1 rounded-md bg-card-elevated border border-border-strong shadow-elevated
                         text-[11.5px] font-medium text-foreground
                         opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0
                         transition-[opacity,transform] duration-150 z-50"
            >
              {statusLabel}
            </span>
          )}
        </div>
      </div>
    </aside>
  );
}

function SidebarItem({
  icon,
  label,
  active,
  collapsed,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  active: boolean;
  collapsed: boolean;
  onClick: () => void;
}) {
  return (
    <div className="group relative">

      {active && (
        <span
          aria-hidden
          className="absolute left-0 top-1.5 bottom-1.5 w-[2px] rounded-r bg-primary-glow"
        />
      )}
      <button
        type="button"
        onClick={onClick}
        title={collapsed ? label : undefined}
        aria-current={active ? "page" : undefined}
        className={cn(
          "press focus-ring relative w-full h-8 rounded-md inline-flex items-center gap-2.5 px-2",
          "text-[12.5px] font-medium",
          "transition-[background-color,color] duration-150 ease-out",
          active
            ? "bg-secondary/70 text-foreground"
            : "text-muted-foreground hover:text-foreground hover:bg-secondary/40",
          collapsed && "justify-center px-0"
        )}
      >
        <span
          className={cn(
            "inline-flex items-center justify-center shrink-0",
            active ? "text-primary-glow" : "text-current"
          )}
        >
          {icon}
        </span>
        {!collapsed && <span className="truncate">{label}</span>}
      </button>

      {collapsed && (
        <span
          className="pointer-events-none absolute left-[calc(100%+8px)] top-1/2 -translate-y-1/2 whitespace-nowrap
                     px-2 py-1 rounded-md bg-card-elevated border border-border-strong shadow-elevated
                     text-[11.5px] font-medium text-foreground
                     opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0
                     transition-[opacity,transform] duration-150 z-50"
        >
          {label}
        </span>
      )}
    </div>
  );
}

function DashboardView({
  entries,
  hasConflict,
  conflictCount,
  clearCount,
  recentConflicts,
  autoFixedCount,
  settings,
  loading,
  onGoToPreferences,
  monitorPaused,
  onTogglePause,
}: {
  entries: ReturnType<typeof usePortStatus>["entries"];
  hasConflict: boolean;
  conflictCount: number;
  clearCount: number;
  recentConflicts: ReturnType<typeof usePortStatus>["recentConflicts"];
  autoFixedCount: number;
  settings: ReturnType<typeof useSettings>["settings"];
  loading: boolean;
  onGoToPreferences: (tab?: "ports" | "profiles" | "rules" | "logs" | "general") => void;
  monitorPaused: boolean;
  onTogglePause: () => Promise<void>;
}) {
  const activeProfile = settings?.profiles.find(
    (p) => p.id === settings.active_profile
  );
  const activeProfileEmpty =
    !!activeProfile && activeProfile.ports.length === 0;
  const hasNoPorts = !!settings && settings.ports.length === 0;
  const autoFixOff =
    !!settings && !(activeProfile?.auto_fix?.enabled) && hasConflict;

  if (!settings && loading) {
    return (
      <div className="px-8 py-7 max-w-[1100px] mx-auto">
        <div className="flex items-end justify-between mb-6">
          <div>
            <h1 className="text-[22px] font-semibold tracking-tight text-foreground">
              Dashboard
            </h1>
            <p className="text-[13px] text-muted-foreground mt-0.5">
              Live status of your monitored ports.
            </p>
          </div>
        </div>
        <div className="grid grid-cols-12 auto-rows-min gap-4">
          <Skeleton className="col-span-12 h-[100px]" />
          <Skeleton className="col-span-12 lg:col-span-7 h-[260px]" />
          <Skeleton className="col-span-12 lg:col-span-5 h-[260px]" />
          <Skeleton className="col-span-12 h-[180px]" />
        </div>
      </div>
    );
  }

  return (
    <div className="px-8 py-7 max-w-[1100px] mx-auto">

      <div className="flex items-end justify-between mb-6">
        <div>
          <h1 className="text-[22px] font-semibold tracking-tight text-foreground">
            Dashboard
          </h1>
          <p className="text-[13px] text-muted-foreground mt-0.5">
            Live status of your monitored ports.
          </p>
        </div>
        <div className="flex items-center gap-1.5">
          {activeProfile && (
            <Badge tone="brand">
              <Radio className="size-2.5" />
              {activeProfile.name}
            </Badge>
          )}
          <Badge tone={activeProfile?.auto_fix?.enabled ? "success" : "neutral"}>
            Auto-Fix {activeProfile?.auto_fix?.enabled ? "ON" : "OFF"}
          </Badge>
        </div>
      </div>


      {(hasNoPorts || activeProfileEmpty || autoFixOff) && (
        <div className="flex flex-col gap-2.5 mb-5">
          {hasNoPorts && (
            <Callout
              tone="brand"
              icon={<Plus />}
              title="Add your first port to start monitoring"
              description="ZPortGuard watches the ports you configure and flags conflicts the moment they happen."
              action={
                <Button
                  size="sm"
                  onClick={() => onGoToPreferences("ports")}
                  rightIcon={<ArrowRight className="size-3" />}
                >
                  Add a port
                </Button>
              }
            />
          )}
          {!hasNoPorts && activeProfileEmpty && (
            <Callout
              tone="warning"
              title={
                <>
                  Active profile{" "}
                  <span className="text-primary-glow">
                    {activeProfile!.name}
                  </span>{" "}
                  has no ports yet
                </>
              }
              description="Pick which ports this profile should monitor in the Ports tab."
              action={
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => onGoToPreferences("profiles")}
                  rightIcon={<ArrowRight className="size-3" />}
                >
                  Assign ports
                </Button>
              }
            />
          )}
          {autoFixOff && (
            <Callout
              tone="info"
              icon={<Sparkles />}
              title="Auto-Fix is off"
              description="Enable Auto-Fix in the active profile to have ZPortGuard kill conflicting processes automatically."
              action={
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => onGoToPreferences("profiles")}
                  rightIcon={<ArrowRight className="size-3" />}
                >
                  Open Profiles
                </Button>
              }
            />
          )}
        </div>
      )}

      <div className="grid grid-cols-12 auto-rows-min gap-4">

        <BentoCard className="col-span-12" hero>
          <div className="flex items-center gap-5">
            <div
              className={cn(
                "relative size-14 rounded-2xl flex items-center justify-center shrink-0",
                hasConflict
                  ? "bg-warning/15 hairline-strong shadow-[0_0_24px_-6px_rgba(245,158,11,0.6)]"
                  : "bg-success/12 hairline-strong shadow-[0_0_24px_-6px_rgba(16,185,129,0.55)]"
              )}
            >
              {hasConflict ? (
                <AlertTriangle className="size-7 text-warning" strokeWidth={2} />
              ) : monitorPaused ? (
                <PauseCircle className="size-7 text-muted-foreground" strokeWidth={2} />
              ) : (
                <ShieldCheck className="size-7 text-success" strokeWidth={2} />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <h2 className={cn("text-[19px] font-semibold tracking-tight", monitorPaused && "text-muted-foreground")}>
                {hasConflict
                  ? "Port Conflict Detected"
                  : monitorPaused
                  ? "Monitor Paused"
                  : "System Guard Active"}
              </h2>
              <p className="text-[13px] text-muted-foreground mt-0.5">
                {hasConflict
                  ? `${conflictCount} port${conflictCount > 1 ? "s" : ""} currently in conflict — review below.`
                  : monitorPaused
                  ? "Monitoring is paused. Resume to continue watching ports."
                  : `${clearCount} port${clearCount !== 1 ? "s" : ""} monitored. Everything looks healthy.`}
              </p>
            </div>
            <StatSummary
              label="In use"
              value={conflictCount}
              tone="warning"
            />
            <StatSummary label="Clear" value={clearCount} tone="success" />
            <StatSummary
              label="Auto-killed"
              value={autoFixedCount}
              tone="brand"
            />
            <div className="pl-4 border-l border-border-strong/60">
              <Button
                size="sm"
                variant="secondary"
                onClick={onTogglePause}
                leftIcon={monitorPaused ? <Play className="size-3.5" /> : <Pause className="size-3.5" />}
              >
                {monitorPaused ? "Resume" : "Pause"}
              </Button>
            </div>
          </div>
        </BentoCard>


        <BentoCard
          className="col-span-12 lg:col-span-7"
          title="Monitored Ports"
          subtitle={`${entries.length} watched · ${conflictCount} in conflict`}
        >
          {entries.length === 0 ? (
            <EmptyState
              icon={<ListTree />}
              title="No ports configured"
              description="Head to Preferences to add the ports you want ZPortGuard to watch."
              action={
                <Button
                  size="sm"
                  onClick={() => onGoToPreferences("ports")}
                  leftIcon={<Plus className="size-3.5" />}
                >
                  Add a port
                </Button>
              }
            />
          ) : (
            <div className="flex flex-col gap-0.5">
              {entries.map((entry, i) => {
                const portCfg = settings?.ports.find(
                  (p) => p.port === entry.port
                );
                return (
                  <div
                    key={entry.port}
                    className="anim-stagger-in"
                    style={{ animationDelay: `${i * 30}ms` }}
                  >
                    <PortRow
                      entry={entry}
                      projectName={portCfg?.project_name ?? portCfg?.label}
                    />
                  </div>
                );
              })}
            </div>
          )}
        </BentoCard>


        <BentoCard
          className="col-span-12 lg:col-span-5"
          title="Conflict Frequency"
          subtitle="Top offenders this session"
        >
          <ConflictChart conflicts={recentConflicts} />
        </BentoCard>


        <BentoCard
          className="col-span-12"
          title="Recent Activity"
          subtitle={`${recentConflicts.length} event${recentConflicts.length === 1 ? "" : "s"} captured`}
        >
          {recentConflicts.length === 0 ? (
            <EmptyState
              compact
              icon={<ShieldCheck />}
              title="No conflicts this session"
              description="A clean slate. Conflicts and auto-kills will appear here as they happen."
            />
          ) : (
            <div className="flex flex-col gap-0.5 max-h-56 overflow-y-auto pr-1 -mr-1">
              {recentConflicts.slice(0, 24).map((c, i) => (
                <div
                  key={i}
                  className={cn(
                    "flex items-center gap-3 px-2.5 py-1.5 rounded-lg text-sm",
                    "transition-colors duration-150 hover:bg-secondary/50"
                  )}
                >
                  <span
                    className={cn(
                      "size-1.5 rounded-full shrink-0",
                      c.auto_fixed
                        ? "bg-success shadow-[0_0_8px_rgba(16,185,129,0.7)]"
                        : "bg-warning shadow-[0_0_8px_rgba(245,158,11,0.7)]"
                    )}
                  />
                  <span className="mono text-[11.5px] tabular text-muted-foreground w-14">
                    :{c.port}
                  </span>
                  <span className="text-foreground truncate flex-1 text-[13px]">
                    {c.process_name}
                  </span>
                  <span className="mono text-[11px] tabular text-muted-foreground">
                    PID {c.pid}
                  </span>
                  <Badge tone={c.auto_fixed ? "success" : "warning"}>
                    {c.auto_fixed ? "auto-killed" : "detected"}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </BentoCard>
      </div>
    </div>
  );
}

