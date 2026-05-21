import { useState } from "react";
import { useSettings } from "@/hooks/useSettings";
import { api, PortConfig, PortProtocol } from "@/lib/api";
import {
  Trash2,
  Plus,
  Network,
  Folder,
  Check,
  ArrowRight,
} from "lucide-react";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { Callout } from "@/components/ui/Callout";
import { ConfirmButton } from "@/components/ui/ConfirmButton";
import { cn } from "@/lib/utils";
import { useNavStore } from "@/store/navStore";
import { toast } from "@/store/toastStore";
import { parsePortInput } from "@/lib/parsePortInput";

export function PortsTab() {
  const { settings, update } = useSettings();
  const setPrefTab = useNavStore((s) => s.setPrefTab);
  const [newPort, setNewPort] = useState("");
  const [newLabel, setNewLabel] = useState("");
  const [newProtocol, setNewProtocol] = useState<PortProtocol>("tcp");
  const [error, setError] = useState("");

  const handleAdd = async () => {
    let ports: number[];
    try {
      ports = parsePortInput(newPort);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Invalid port input");
      return;
    }

    const alreadyMonitored = ports.filter((p) =>
      settings?.ports.some((cfg) => cfg.port === p)
    );
    if (alreadyMonitored.length > 0) {
      setError(`Port${alreadyMonitored.length > 1 ? "s" : ""} ${alreadyMonitored.map((p) => `:${p}`).join(", ")} already monitored`);
      return;
    }
    setError("");

    try {
      let updated = settings!;
      for (const port of ports) {
        updated = await api.addPort(port, ports.length === 1 ? (newLabel || undefined) : undefined, newProtocol);
      }

      const activeId = updated.active_profile;
      const shouldAutoInclude =
        !!activeId &&
        activeId !== "default" &&
        ports.some(
          (port) =>
            !updated.profiles.find((p) => p.id === activeId)?.ports.includes(port)
        );

      if (shouldAutoInclude) {
        updated = {
          ...updated,
          profiles: updated.profiles.map((p) =>
            p.id === activeId
              ? { ...p, ports: [...new Set([...p.ports, ...ports])] }
              : p
          ),
        };
      }

      await update(updated);
      setNewPort("");
      setNewLabel("");
      const activeName = updated.profiles.find((p) => p.id === activeId)?.name;
      toast.success(
        ports.length === 1 ? `Port :${ports[0]} added` : `${ports.length} ports added`,
        shouldAutoInclude && activeName
          ? `Included in profile "${activeName}".`
          : "Watching for activity."
      );
    } catch (e) {
      toast.error(
        "Couldn't add port",
        e instanceof Error ? e.message : "Unknown error"
      );
    }
  };

  const handleRemove = async (port: number) => {
    try {
      const updated = await api.removePort(port);
      await update(updated);
      toast.success(`Port :${port} removed`);
    } catch (e) {
      toast.error(
        "Couldn't remove port",
        e instanceof Error ? e.message : "Unknown error"
      );
    }
  };

  const handleProjectEdit = async (
    portCfg: PortConfig,
    field: "project_name" | "project_path",
    value: string
  ) => {
    if (!settings) return;
    const updated = {
      ...settings,
      ports: settings.ports.map((p) =>
        p.port === portCfg.port ? { ...p, [field]: value || null } : p
      ),
    };
    await update(updated);
  };

  const toggleInActiveProfile = async (port: number) => {
    if (!settings || !settings.active_profile) return;
    const updated = {
      ...settings,
      profiles: settings.profiles.map((p) => {
        if (p.id !== settings.active_profile) return p;
        const ports = p.ports.includes(port)
          ? p.ports.filter((pt) => pt !== port)
          : [...p.ports, port];
        return { ...p, ports };
      }),
    };
    await update(updated);
  };

  if (!settings) return null;

  const activeProfile = settings.profiles.find(
    (p) => p.id === settings.active_profile
  );

  return (
    <div className="flex flex-col gap-4">

      {activeProfile && (
        <Callout
          tone="brand"
          title={
            <>
              Editing ports for profile{" "}
              <span className="text-primary-glow">{activeProfile.name}</span>{" "}
              <span className="text-muted-foreground font-normal">
                ({activeProfile.ports.length} included)
              </span>
            </>
          }
          description="Toggle the checkmark on any port to include it in the active profile. Ports outside the profile are tracked but not actively scanned."
          action={
            <Button
              size="sm"
              variant="secondary"
              onClick={() => setPrefTab("profiles")}
              rightIcon={<ArrowRight className="size-3" />}
            >
              Manage profiles
            </Button>
          }
        />
      )}


      <div className="rounded-xl bg-card hairline shadow-card p-4 flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <Plus className="size-3.5 text-primary-glow" />
          <span className="caps text-muted-foreground">Add Port</span>
        </div>
        <div className="flex gap-2">
          <Input
            type="text"
            placeholder="3000 or 3000-3010 or 3000, 5173"
            value={newPort}
            onChange={(e) => {
              setNewPort(e.target.value);
              if (error) setError("");
            }}
            onKeyDown={(e) => e.key === "Enter" && handleAdd()}
            className="w-52"
            invalid={!!error}
          />
          <Select
            value={newProtocol}
            onChange={(e) => setNewProtocol(e.target.value as PortProtocol)}
            className="w-24"
          >
            <option value="tcp">TCP</option>
            <option value="udp">UDP</option>
            <option value="both">Both</option>
          </Select>
          <Input
            type="text"
            placeholder="Label (optional)"
            value={newLabel}
            onChange={(e) => setNewLabel(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleAdd()}
            className="flex-1"
          />
          <Button onClick={handleAdd} leftIcon={<Plus className="size-3.5" />}>
            Add
          </Button>
        </div>
        {error ? (
          <p className="text-[11.5px] text-destructive flex items-center gap-1.5">
            <span className="size-1.5 rounded-full bg-destructive" />
            {error}
          </p>
        ) : activeProfile && activeProfile.id !== "default" ? (
          <p className="text-[11px] text-muted-foreground flex items-center gap-1.5">
            <span className="size-1.5 rounded-full bg-primary-glow shadow-[0_0_8px_rgba(167,139,250,0.7)]" />
            Will be added to profile{" "}
            <span className="text-primary-glow font-medium">
              {activeProfile.name}
            </span>
            . Supports ranges like 3000-3010.
          </p>
        ) : (
          <p className="text-[11px] text-muted-foreground">
            Supports ranges (3000-3010) and comma-separated lists. Press Enter to add.
          </p>
        )}
      </div>


      <div className="flex flex-col gap-2">
        {settings.ports.map((p, i) => {
          const inProfile =
            !!activeProfile && activeProfile.ports.includes(p.port);
          return (
            <div
              key={p.port}
              className={cn(
                "anim-stagger-in group rounded-xl border bg-card transition-[border-color,box-shadow] duration-200 shadow-card p-4 flex flex-col gap-3",
                activeProfile && inProfile
                  ? "border-primary/30 shadow-[0_0_0_1px_rgba(124,58,237,0.25),0_8px_24px_-12px_rgba(124,58,237,0.45)]"
                  : "border-border hover:border-border-strong"
              )}
              style={{ animationDelay: `${i * 30}ms` }}
            >
              <div className="flex items-center gap-3">
                <div className="size-9 rounded-lg bg-gradient-brand-faint hairline-strong flex items-center justify-center shrink-0">
                  <Network className="size-4 text-primary-glow" />
                </div>
                <div className="flex flex-col">
                  <span className="mono text-[15px] font-semibold tabular tracking-tight">
                    :{p.port}
                  </span>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[11.5px] text-muted-foreground">
                      {p.label ?? "Unnamed port"}
                    </span>
                    {p.protocol && p.protocol !== "tcp" && (
                      <span className="mono text-[9.5px] uppercase tracking-wide px-1.5 py-0.5 rounded bg-secondary hairline text-muted-foreground">
                        {p.protocol}
                      </span>
                    )}
                  </div>
                </div>
                <div className="ml-auto flex items-center gap-1.5">
                  {activeProfile && (
                    <button
                      onClick={() => toggleInActiveProfile(p.port)}
                      className={cn(
                        "press focus-ring inline-flex items-center gap-1.5 h-7 px-2.5 rounded-md text-[11.5px] font-medium",
                        "transition-[background-color,border-color,color,box-shadow] duration-150 border",
                        inProfile
                          ? "bg-primary/15 text-primary-glow border-primary/30 shadow-[0_0_12px_-4px_rgba(124,58,237,0.5)]"
                          : "bg-secondary text-muted-foreground border-border-strong hover:text-foreground hover:border-border-bright"
                      )}
                      title={
                        inProfile
                          ? `Click to exclude from ${activeProfile.name}`
                          : `Click to include in ${activeProfile.name}`
                      }
                      aria-pressed={inProfile}
                    >
                      {inProfile ? (
                        <>
                          <Check className="size-3" />
                          Included
                        </>
                      ) : (
                        <>
                          <span className="size-3 inline-flex items-center justify-center">
                            <span className="size-2.5 rounded-full border border-current opacity-60" />
                          </span>
                          Excluded
                        </>
                      )}
                    </button>
                  )}
                  <ConfirmButton
                    onConfirm={() => handleRemove(p.port)}
                    idle={<Trash2 className="size-3.5" />}
                    confirm="Remove"
                    idleAriaLabel={`Remove port ${p.port}`}
                    confirmAriaLabel={`Confirm remove port ${p.port}`}
                    variant="ghost"
                    size="icon-sm"
                    className="text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                    confirmClassName="!w-auto !px-2 text-[11px]"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2 pl-12">
                <Input
                  sizeVariant="sm"
                  type="text"
                  placeholder="Project name"
                  defaultValue={p.project_name ?? ""}
                  onBlur={(e) =>
                    handleProjectEdit(p, "project_name", e.target.value)
                  }
                />
                <Input
                  sizeVariant="sm"
                  type="text"
                  placeholder="Project path"
                  defaultValue={p.project_path ?? ""}
                  onBlur={(e) =>
                    handleProjectEdit(p, "project_path", e.target.value)
                  }
                  leftIcon={<Folder className="size-3" />}
                />
              </div>
              <div className="flex items-center gap-2 pl-12">
                <span className="text-[11px] text-muted-foreground">Protocol:</span>
                <Select
                  value={p.protocol}
                  onChange={async (e) => {
                    try {
                      const updated = await api.updatePortProtocol(p.port, e.target.value as PortProtocol);
                      await update(updated);
                    } catch (err) {
                      toast.error("Couldn't update protocol", err instanceof Error ? err.message : "Unknown error");
                    }
                  }}
                  className="w-24"
                >
                  <option value="tcp">TCP</option>
                  <option value="udp">UDP</option>
                  <option value="both">Both</option>
                </Select>
              </div>
            </div>
          );
        })}
        {settings.ports.length === 0 && (
          <div className="rounded-xl bg-card hairline shadow-card">
            <EmptyState
              icon={<Network />}
              title="No ports monitored yet"
              description="Add the ports your dev servers bind to (3000, 5173, 8080, etc.) so ZPortGuard can flag conflicts the moment they occur."
            />
          </div>
        )}
      </div>
    </div>
  );
}
