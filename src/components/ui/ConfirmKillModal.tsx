import { useState } from "react";
import { X, AlertTriangle, Skull } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "./Button";
import { api, ConflictEvent } from "@/lib/api";
import { toast } from "@/store/toastStore";
import { usePortsStore } from "@/store/portsStore";

export function ConfirmKillModal() {
  const pendingConfirmations = usePortsStore((s) => s.pendingConfirmations);
  const dismissConfirmation = usePortsStore((s) => s.dismissConfirmation);

  if (pendingConfirmations.length === 0) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-end p-4 gap-3 flex-col pointer-events-none">
      {pendingConfirmations.map((c) => (
        <ConfirmCard
          key={`${c.port}:${c.pid}`}
          conflict={c}
          onDismiss={() => dismissConfirmation(c.port, c.pid)}
        />
      ))}
    </div>
  );
}

function ConfirmCard({
  conflict,
  onDismiss,
}: {
  conflict: ConflictEvent;
  onDismiss: () => void;
}) {
  const [killing, setKilling] = useState(false);

  const handleKill = async () => {
    setKilling(true);
    try {
      await api.killPort(conflict.port);
      toast.success(
        `Killed :${conflict.port}`,
        `${conflict.process_name} (PID ${conflict.pid})`
      );
      onDismiss();
    } catch (e) {
      toast.error(
        `Couldn't kill :${conflict.port}`,
        e instanceof Error ? e.message : "Unknown error"
      );
      setKilling(false);
    }
  };

  return (
    <div
      className={cn(
        "pointer-events-auto anim-slide-up-fade",
        "w-80 rounded-xl bg-card border border-warning/40",
        "shadow-[0_0_0_1px_rgba(245,158,11,0.2),0_20px_40px_-10px_rgba(0,0,0,0.5)]",
        "p-4 flex flex-col gap-3"
      )}
    >
      <div className="flex items-start gap-3">
        <div className="size-8 rounded-lg bg-warning/15 border border-warning/30 flex items-center justify-center shrink-0">
          <AlertTriangle className="size-4 text-warning" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[13.5px] font-semibold text-foreground leading-tight">
            Port conflict detected
          </p>
          <p className="text-[11.5px] text-muted-foreground mt-0.5">
            <span className="mono text-warning font-medium">:{conflict.port}</span>
            {" "}is held by{" "}
            <span className="text-foreground font-medium">{conflict.process_name}</span>
            {" "}(PID {conflict.pid})
          </p>
        </div>
        <button
          type="button"
          onClick={onDismiss}
          className="press focus-ring size-6 rounded-md inline-flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-secondary/60 shrink-0"
          aria-label="Dismiss"
        >
          <X className="size-3.5" />
        </button>
      </div>
      <div className="flex gap-2">
        <Button
          size="sm"
          variant="destructive"
          className="flex-1"
          onClick={handleKill}
          loading={killing}
          leftIcon={!killing ? <Skull className="size-3.5" /> : undefined}
        >
          {killing ? "Killing…" : "Kill Process"}
        </Button>
        <Button
          size="sm"
          variant="secondary"
          onClick={() => {
            api.logUserDismissed(conflict.port, conflict.pid, conflict.protocol).catch(() => {});
            onDismiss();
          }}
        >
          Ignore
        </Button>
      </div>
    </div>
  );
}
