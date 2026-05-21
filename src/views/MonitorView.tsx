import { useEffect, useState } from "react";
import { Radio, Pause, Play, X, Check } from "lucide-react";
import { usePortStatus } from "@/hooks/usePortStatus";
import { useSettings } from "@/hooks/useSettings";
import { useActivityLog } from "@/hooks/useActivityLog";
import { BentoCard } from "@/components/BentoCard";
import { StatusDot } from "@/components/StatusDot";
import { StatSummary } from "@/components/StatSummary";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Callout } from "@/components/ui/Callout";
import { EmptyState } from "@/components/ui/EmptyState";
import { Skeleton } from "@/components/ui/Skeleton";
import { api, RuleEntry } from "@/lib/api";
import { toast } from "@/store/toastStore";
import { cn } from "@/lib/utils";

function relativeTime(ts: number): string {
  const diff = Math.floor((Date.now() - ts) / 1000);
  if (diff < 5) return "just now";
  if (diff < 60) return `${diff}s ago`;
  const m = Math.floor(diff / 60);
  if (m < 60) return `${m}m ago`;
  return `${Math.floor(m / 60)}h ago`;
}

function matchesRule(rules: RuleEntry[], processName: string, port: number): boolean {
  return rules.some(
    (r) => r.process_name === processName && (r.port === null || r.port === port)
  );
}

function MonitorPortRow({
  port,
  label,
  entry,
  whitelisted,
  blacklisted,
  autoFixEnabled,
  configProtocol,
}: {
  port: number;
  label: string | null;
  entry: { state: string; pid: number | null; process_name: string | null; protocol?: string } | undefined;
  whitelisted: boolean;
  blacklisted: boolean;
  autoFixEnabled: boolean;
  configProtocol?: string;
}) {
  const [killing, setKilling] = useState(false);
  const [justKilled, setJustKilled] = useState(false);

  const state = entry?.state ?? "unknown";
  const isConflict = state === "in_use";
  const processName = entry?.process_name ?? null;
  const pid = entry?.pid ?? null;

  const handleKill = async () => {
    setKilling(true);
    try {
      await api.killPort(port);
      setJustKilled(true);
      toast.success(`Killed process on :${port}`, processName ? `${processName} (PID ${pid})` : undefined);
      setTimeout(() => setJustKilled(false), 1600);
    } catch (e) {
      toast.error(`Couldn't kill :${port}`, e instanceof Error ? e.message : "Unknown error");
    } finally {
      setKilling(false);
    }
  };

  const stateBadgeTone = isConflict ? "destructive" : state === "clear" ? "success" : "neutral";
  const stateBadgeLabel = isConflict ? "conflict" : state === "clear" ? "clear" : "unknown";

  return (
    <div
      className={cn(
        "group relative flex items-center gap-3 rounded-lg px-3 py-2",
        "transition-[background-color,box-shadow] duration-200 ease-out anim-stagger-in",
        isConflict
          ? "bg-warning/[0.07] hover:bg-warning/[0.12] hover:shadow-[inset_0_0_0_1px_rgba(245,158,11,0.22)]"
          : "hover:bg-secondary/60 hover:shadow-[inset_0_0_0_1px_var(--color-border-strong)]",
        justKilled && "bg-success/[0.08] shadow-[inset_0_0_0_1px_rgba(16,185,129,0.3)]"
      )}
    >
      <StatusDot
        status={isConflict ? "conflict" : state === "clear" ? "clear" : "unknown"}
        pulse={isConflict}
        size="md"
      />

      <span className={cn("mono font-semibold tracking-tight tabular shrink-0 text-[13px] w-14", isConflict ? "text-warning" : "text-foreground")}>
        :{port}
      </span>

      <div className="flex flex-col flex-1 min-w-0">
        {isConflict && processName ? (
          <>
            <div className="flex items-center gap-1.5 min-w-0">
              <span className="text-foreground font-semibold truncate text-sm">{processName}</span>
              {(entry?.protocol === "udp" || configProtocol === "udp" || configProtocol === "both") && (
                <span className="mono text-[9px] uppercase tracking-wide px-1 py-px rounded bg-secondary hairline text-muted-foreground shrink-0">
                  {entry?.protocol ?? configProtocol}
                </span>
              )}
            </div>
            {pid && <span className="mono text-[11px] text-muted-foreground tabular">PID {pid}</span>}
          </>
        ) : label ? (
          <div className="flex items-center gap-1.5 min-w-0">
            <span className="text-foreground truncate text-sm">{label}</span>
            {configProtocol && configProtocol !== "tcp" && (
              <span className="mono text-[9px] uppercase tracking-wide px-1 py-px rounded bg-secondary hairline text-muted-foreground shrink-0">
                {configProtocol}
              </span>
            )}
          </div>
        ) : (
          <span className="text-[11.5px] text-muted-foreground italic">Idle</span>
        )}
      </div>

      <Badge tone={stateBadgeTone}>{stateBadgeLabel}</Badge>

      {isConflict && (
        justKilled ? (
          <span className="inline-flex items-center gap-1 text-success font-semibold tracking-wide uppercase text-[10.5px]">
            <Check className="size-3.5" />
            Killed
          </span>
        ) : whitelisted ? (
          <Badge tone="success">Whitelisted</Badge>
        ) : blacklisted && autoFixEnabled ? (
          <Badge tone="destructive">Blacklist — auto-kill</Badge>
        ) : pid ? (
          <Button
            size="sm"
            variant="destructive"
            onClick={handleKill}
            loading={killing}
            leftIcon={!killing && <X className="size-3" />}
            className="opacity-90 group-hover:opacity-100"
          >
            {killing ? "Killing" : "Kill"}
          </Button>
        ) : null
      )}
    </div>
  );
}

export function MonitorView() {
  const { entries, recentConflicts } = usePortStatus();
  const { settings, loading } = useSettings();
  const { sessionRows } = useActivityLog();

  const [monitorPaused, setMonitorPaused] = useState(false);
  const [, setTick] = useState(0);

  useEffect(() => {
    api.isMonitorPaused().then(setMonitorPaused).catch(() => {});
  }, []);


  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 5000);
    return () => clearInterval(id);
  }, []);

  const activeProfile = settings?.profiles.find((p) => p.id === settings.active_profile);
  const activePorts: number[] = activeProfile ? activeProfile.ports : (settings?.ports.map((p) => p.port) ?? []);

  const conflictCount = entries.filter((e) => e.state === "in_use").length;
  const autoKilledCount = sessionRows.filter((r) => r.action === "auto_killed").length;
  const detectedCount = sessionRows.filter((r) => r.action === "conflict_detected" || r.action === "auto_killed" || r.action === "user_killed").length || recentConflicts.length;

  const handleTogglePause = async () => {
    if (monitorPaused) {
      await api.resumeMonitor();
      setMonitorPaused(false);
    } else {
      await api.pauseMonitor();
      setMonitorPaused(true);
    }
  };

  if (!settings && loading) {
    return (
      <div className="px-8 py-7 max-w-[1100px] mx-auto">
        <div className="flex items-end justify-between mb-6">
          <div>
            <h1 className="text-[22px] font-semibold tracking-tight text-foreground">Live Monitor</h1>
            <p className="text-[13px] text-muted-foreground mt-0.5">Real-time port activity for active profile</p>
          </div>
        </div>
        <div className="grid grid-cols-12 auto-rows-min gap-4">
          <Skeleton className="col-span-12 lg:col-span-7 h-[320px]" />
          <Skeleton className="col-span-12 lg:col-span-5 h-[320px]" />
          <Skeleton className="col-span-12 h-[80px]" />
        </div>
      </div>
    );
  }

  return (
    <div className="px-8 py-7 max-w-[1100px] mx-auto">

      <div className="flex items-end justify-between mb-6">
        <div>
          <h1 className="text-[22px] font-semibold tracking-tight text-foreground">Live Monitor</h1>
          <p className="text-[13px] text-muted-foreground mt-0.5">Real-time port activity for active profile</p>
        </div>
        <div className="flex items-center gap-1.5">
          {activeProfile && (
            <Badge tone="brand">
              <Radio className="size-2.5" />
              {activeProfile.name}
            </Badge>
          )}
          <Badge tone={monitorPaused ? "neutral" : "success"}>
            {monitorPaused ? "Paused" : "Running"}
          </Badge>
          <Badge tone={activeProfile?.auto_fix?.enabled ? "success" : "neutral"}>
            Auto-Fix {activeProfile?.auto_fix?.enabled ? "ON" : "OFF"}
          </Badge>
          <Button
            size="sm"
            variant="secondary"
            onClick={handleTogglePause}
            leftIcon={monitorPaused ? <Play className="size-3.5" /> : <Pause className="size-3.5" />}
          >
            {monitorPaused ? "Resume" : "Pause"}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-12 auto-rows-min gap-4">

        <BentoCard
          className="col-span-12 lg:col-span-7"
          title="Watched Ports"
          subtitle={`${activePorts.length} port${activePorts.length === 1 ? "" : "s"} · ${conflictCount} in conflict`}
        >
          {monitorPaused && (
            <div className="mb-3">
              <Callout tone="info" title="Monitor is paused — shown data is stale" dense />
            </div>
          )}
          {activePorts.length === 0 ? (
            <EmptyState
              compact
              icon={<Radio />}
              title="No ports in active profile"
              description="Add ports to your active profile in Preferences."
            />
          ) : (
            <div className="flex flex-col gap-0.5">
              {activePorts.map((port, i) => {
                const entry = entries.find((e) => e.port === port);
                const portCfg = settings?.ports.find((p) => p.port === port);
                const label = portCfg?.project_name ?? portCfg?.label ?? null;
                const processName = entry?.process_name ?? null;
                const whitelisted = processName
                  ? matchesRule(activeProfile?.whitelist ?? [], processName, port)
                  : false;
                const blacklisted = processName
                  ? matchesRule(activeProfile?.blacklist ?? [], processName, port)
                  : false;
                return (
                  <div key={port} style={{ animationDelay: `${i * 30}ms` }}>
                    <MonitorPortRow
                      port={port}
                      label={label}
                      entry={entry}
                      whitelisted={whitelisted}
                      blacklisted={blacklisted}
                      autoFixEnabled={activeProfile?.auto_fix?.enabled ?? false}
                      configProtocol={portCfg?.protocol}
                    />
                  </div>
                );
              })}
            </div>
          )}
        </BentoCard>


        <BentoCard
          className="col-span-12 lg:col-span-5"
          title="Live Events"
          subtitle={`${recentConflicts.length} event${recentConflicts.length === 1 ? "" : "s"} this session`}
        >
          {recentConflicts.length === 0 ? (
            <EmptyState
              compact
              icon={<Radio />}
              title="No events yet"
              description="Conflicts appear here as they're detected."
            />
          ) : (
            <div className="flex flex-col gap-0.5 max-h-[340px] overflow-y-auto pr-1 -mr-1">
              {recentConflicts.slice(0, 100).map((c, i) => (
                <EventRow key={i} conflict={c} />
              ))}
            </div>
          )}
        </BentoCard>


        <BentoCard className="col-span-12">
          <div className="flex items-center">
            <StatSummary label="Events This Session" value={detectedCount} tone="warning" />
            <StatSummary label="Auto-Killed" value={autoKilledCount} tone="success" />
            <StatSummary label="Active Now" value={conflictCount} tone="brand" />
          </div>
        </BentoCard>
      </div>
    </div>
  );
}

function EventRow({ conflict }: { conflict: { port: number; pid: number; process_name: string; auto_fixed: boolean } }) {
  const [, setTick] = useState(0);
  const [ts] = useState(() => Date.now());

  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 5000);
    return () => clearInterval(id);
  }, []);

  return (
    <div
      className={cn(
        "flex items-center gap-3 px-2.5 py-1.5 rounded-lg text-sm",
        "transition-colors duration-150 hover:bg-secondary/50"
      )}
    >
      <span
        className={cn(
          "size-1.5 rounded-full shrink-0",
          conflict.auto_fixed
            ? "bg-success shadow-[0_0_8px_rgba(16,185,129,0.7)]"
            : "bg-warning shadow-[0_0_8px_rgba(245,158,11,0.7)]"
        )}
      />
      <span className="mono text-[11.5px] tabular text-muted-foreground w-14 shrink-0">
        :{conflict.port}
      </span>
      <span className="text-foreground truncate flex-1 text-[13px]">{conflict.process_name}</span>
      <span className="mono text-[11px] tabular text-muted-foreground shrink-0">PID {conflict.pid}</span>
      <Badge tone={conflict.auto_fixed ? "success" : "warning"}>
        {conflict.auto_fixed ? "auto-killed" : "detected"}
      </Badge>
      <span className="text-[11px] text-muted-foreground shrink-0 tabular">{relativeTime(ts)}</span>
    </div>
  );
}
