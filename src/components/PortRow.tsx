import { PortEntry, api } from "@/lib/api";
import { StatusDot } from "./StatusDot";
import { Button } from "./ui/Button";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { X, Check } from "lucide-react";
import { toast } from "@/store/toastStore";

interface PortRowProps {
  entry: PortEntry;
  projectName?: string | null;
  onKilled?: () => void;
  compact?: boolean;
}

export function PortRow({
  entry,
  projectName,
  onKilled,
  compact = false,
}: PortRowProps) {
  const [killing, setKilling] = useState(false);
  const [justKilled, setJustKilled] = useState(false);

  const isConflict = entry.state === "in_use";
  const label = isConflict
    ? entry.process_name || projectName || `Port ${entry.port}`
    : projectName || null;

  const handleKill = async () => {
    setKilling(true);
    try {
      await api.killPort(entry.port);
      setJustKilled(true);
      toast.success(
        `Killed process on :${entry.port}`,
        entry.process_name
          ? `${entry.process_name} (PID ${entry.pid})`
          : undefined
      );
      setTimeout(() => setJustKilled(false), 1600);
      onKilled?.();
    } catch (e) {
      toast.error(
        `Couldn't kill :${entry.port}`,
        e instanceof Error ? e.message : "Unknown error"
      );
    } finally {
      setKilling(false);
    }
  };

  return (
    <div
      className={cn(
        "group relative flex items-center gap-3 rounded-lg",
        "transition-[background-color,box-shadow,transform,opacity] duration-200 ease-out",
        compact ? "px-2.5 py-1.5" : "px-3 py-2",
        isConflict
          ? "bg-warning/[0.07] hover:bg-warning/[0.12] hover:shadow-[inset_0_0_0_1px_rgba(245,158,11,0.22)]"
          : "hover:bg-secondary/60 hover:shadow-[inset_0_0_0_1px_var(--color-border-strong)]",
        justKilled && "bg-success/[0.08] shadow-[inset_0_0_0_1px_rgba(16,185,129,0.3)]"
      )}
    >
      <StatusDot
        status={isConflict ? "conflict" : "clear"}
        pulse={isConflict}
        size={compact ? "sm" : "md"}
      />

      <span
        className={cn(
          "mono font-semibold tracking-tight tabular shrink-0",
          compact ? "text-xs w-12" : "text-[13px] w-14",
          isConflict ? "text-warning" : "text-foreground"
        )}
      >
        :{entry.port}
      </span>

      <div className="flex flex-col flex-1 min-w-0">
        <div className="flex items-center gap-1.5 min-w-0">
          {label !== null ? (
            <span
              className={cn(
                "text-foreground truncate",
                compact ? "text-xs" : "text-sm"
              )}
            >
              {label}
            </span>
          ) : (
            <span className="text-[11.5px] text-muted-foreground italic">Idle</span>
          )}
          {entry.protocol === "udp" && (
            <span className="mono text-[9px] uppercase tracking-wide px-1 py-px rounded bg-secondary hairline text-muted-foreground shrink-0">
              udp
            </span>
          )}
        </div>
        {entry.pid && (
          <span
            className={cn(
              "mono text-muted-foreground tabular",
              compact ? "text-[10px]" : "text-[11px]"
            )}
          >
            PID {entry.pid}
          </span>
        )}
      </div>

      {justKilled ? (
        <span
          className={cn(
            "inline-flex items-center gap-1 text-success font-semibold tracking-wide uppercase",
            compact ? "text-[10px]" : "text-[10.5px]"
          )}
        >
          <Check className={compact ? "size-3" : "size-3.5"} />
          Killed
        </span>
      ) : (
        isConflict &&
        entry.pid && (
          <Button
            size={compact ? "xs" : "sm"}
            variant="destructive"
            onClick={handleKill}
            loading={killing}
            leftIcon={!killing && <X className="size-3" />}
            className="opacity-90 group-hover:opacity-100"
          >
            {killing ? "Killing" : "Kill"}
          </Button>
        )
      )}
    </div>
  );
}
