import { useState } from "react";
import { useSettings } from "@/hooks/useSettings";
import { api } from "@/lib/api";
import {
  Plus,
  Trash2,
  Check,
  Layers,
  Radio,
  ArrowRight,
  Info,
  Sparkles,
  ShieldCheck,
  ShieldOff,
} from "lucide-react";
import { Toggle } from "@/components/ui/Toggle";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { Callout } from "@/components/ui/Callout";
import { ConfirmButton } from "@/components/ui/ConfirmButton";
import { useNavStore } from "@/store/navStore";
import { toast } from "@/store/toastStore";
import { usePortsStore } from "@/store/portsStore";

export function ProfilesTab() {
  const { settings, update, replace } = useSettings();
  const setPrefTab = useNavStore((s) => s.setPrefTab);
  const refreshPorts = usePortsStore((s) => s.refresh);
  const [newName, setNewName] = useState("");

  if (!settings) return null;

  const handleCreate = async () => {
    if (!newName.trim()) return;
    const id = newName.trim().toLowerCase().replace(/\s+/g, "-");
    if (settings.profiles.some((p) => p.id === id)) {
      toast.error("Profile already exists", `An ID "${id}" is already used.`);
      return;
    }
    const updated = {
      ...settings,
      profiles: [
        ...settings.profiles,
        {
          id,
          name: newName.trim(),
          ports: [],
          auto_fix: { enabled: false, require_confirmation: true },
          whitelist: [],
          blacklist: [],
        },
      ],
    };
    await update(updated);
    setNewName("");
    toast.success(
      `Created "${updated.profiles[updated.profiles.length - 1].name}"`,
      "Activate it and assign ports below."
    );
  };

  const handleDelete = async (id: string) => {
    const deletedProfile = settings.profiles.find((p) => p.id === id)!;
    const remainingProfiles = settings.profiles.filter((p) => p.id !== id);
    const stillReferenced = new Set(remainingProfiles.flatMap((p) => p.ports));
    const portsToRemove = deletedProfile.ports.filter(
      (port) => !stillReferenced.has(port)
    );
    const updatedPorts = settings.ports.filter(
      (p) => !portsToRemove.includes(p.port)
    );
    const updated = {
      ...settings,
      profiles: remainingProfiles,
      ports: updatedPorts,
      active_profile:
        settings.active_profile === id
          ? remainingProfiles[0]?.id ?? settings.active_profile
          : settings.active_profile,
    };
    await update(updated);
    if (portsToRemove.length > 0) {
      toast.success(
        `Deleted "${deletedProfile.name}" and removed ${portsToRemove.length} exclusive port${portsToRemove.length === 1 ? "" : "s"}.`
      );
    }
  };

  const handleActivate = async (id: string) => {
    try {
      const result = await api.setActiveProfile(id);


      replace(result);


      await refreshPorts();
      const name = result.profiles.find((p) => p.id === id)?.name ?? id;
      const empty = result.profiles.find((p) => p.id === id)?.ports.length === 0;
      toast.success(
        `Activated "${name}"`,
        empty ? "This profile has no ports yet." : undefined
      );
    } catch (e) {
      toast.error(
        "Couldn't activate profile",
        e instanceof Error ? e.message : "Unknown error"
      );
    }
  };

  const handleAutoFixToggle = async (profileId: string, field: "enabled" | "require_confirmation", value: boolean) => {
    const updated = {
      ...settings,
      profiles: settings.profiles.map((p) =>
        p.id !== profileId ? p : { ...p, auto_fix: { ...p.auto_fix, [field]: value } }
      ),
    };
    await update(updated);
  };

  const handlePortToggle = async (profileId: string, port: number) => {
    const updated = {
      ...settings,
      profiles: settings.profiles.map((p) => {
        if (p.id !== profileId) return p;
        const ports = p.ports.includes(port)
          ? p.ports.filter((pt) => pt !== port)
          : [...p.ports, port];
        return { ...p, ports };
      }),
    };
    await update(updated);
  };

  const activeProfile = settings.profiles.find(
    (p) => p.id === settings.active_profile
  );
  const activeEmpty = !!activeProfile && activeProfile.ports.length === 0;
  const noPortsAtAll = settings.ports.length === 0;

  return (
    <div className="flex flex-col gap-4">

      {activeEmpty && !noPortsAtAll && (
        <Callout
          tone="warning"
          title={
            <>
              Profile{" "}
              <span className="text-primary-glow">{activeProfile!.name}</span>{" "}
              is active but has no ports
            </>
          }
          description="Toggle ports below to include them in this profile, or jump straight to the Ports tab."
          action={
            <Button
              size="sm"
              variant="secondary"
              onClick={() => setPrefTab("ports")}
              rightIcon={<ArrowRight className="size-3" />}
            >
              Go to Ports
            </Button>
          }
        />
      )}
      {noPortsAtAll && (
        <Callout
          tone="info"
          icon={<Info />}
          title="No ports defined yet"
          description="Profiles bundle subsets of your monitored ports. Add ports first, then assign them here."
          action={
            <Button
              size="sm"
              variant="secondary"
              onClick={() => setPrefTab("ports")}
              rightIcon={<ArrowRight className="size-3" />}
            >
              Add ports
            </Button>
          }
        />
      )}


      <div className="rounded-xl bg-card hairline shadow-card p-4 flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <Plus className="size-3.5 text-primary-glow" />
          <span className="caps text-muted-foreground">New Profile</span>
        </div>
        <div className="flex gap-2">
          <Input
            type="text"
            placeholder="Profile name (e.g. React Dev)"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleCreate()}
            className="flex-1"
          />
          <Button
            onClick={handleCreate}
            leftIcon={<Plus className="size-3.5" />}
            disabled={!newName.trim()}
          >
            Create
          </Button>
        </div>
      </div>

      <div className="flex flex-col gap-3">
        {settings.profiles.length === 0 && (
          <div className="rounded-xl bg-card hairline shadow-card">
            <EmptyState
              icon={<Layers />}
              title="No profiles yet"
              description="Profiles let you switch which subset of ports is monitored at once."
            />
          </div>
        )}
        {settings.profiles.map((profile, idx) => {
          const isActive = settings.active_profile === profile.id;
          return (
            <div
              key={profile.id}
              className={cn(
                "anim-stagger-in rounded-xl p-4 flex flex-col gap-3 transition-[border-color,box-shadow,background-color] duration-200",
                isActive
                  ? "bg-card hairline-strong shadow-[0_0_0_1px_rgba(124,58,237,0.35),0_20px_40px_-20px_rgba(124,58,237,0.4)]"
                  : "bg-card hairline shadow-card hover:hairline-strong"
              )}
              style={{ animationDelay: `${idx * 35}ms` }}
            >
              <div className="flex items-center gap-3">
                <div
                  className={cn(
                    "size-9 rounded-lg flex items-center justify-center shrink-0",
                    isActive
                      ? "bg-gradient-brand shadow-[0_0_18px_-4px_rgba(124,58,237,0.55)]"
                      : "bg-secondary border border-border-strong"
                  )}
                >
                  <Layers
                    className={cn(
                      "size-4",
                      isActive ? "text-white" : "text-muted-foreground"
                    )}
                  />
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="text-[14px] font-semibold tracking-tight">
                    {profile.name}
                  </span>
                  <span className="text-[11.5px] text-muted-foreground">
                    {profile.ports.length} port
                    {profile.ports.length === 1 ? "" : "s"} included
                  </span>
                </div>
                <div className="ml-auto flex items-center gap-1.5">
                  {isActive ? (
                    <Badge tone="brand">
                      <Radio className="size-2.5" />
                      Active
                    </Badge>
                  ) : (
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => handleActivate(profile.id)}
                      leftIcon={<Check className="size-3" />}
                    >
                      Activate
                    </Button>
                  )}
                  {profile.id !== "default" && (
                    <ConfirmButton
                      onConfirm={() => handleDelete(profile.id)}
                      idle={<Trash2 className="size-3.5" />}
                      confirm="Delete"
                      idleAriaLabel={`Delete ${profile.name}`}
                      confirmAriaLabel={`Confirm delete ${profile.name}`}
                      variant="ghost"
                      size="icon-sm"
                      className="text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                      confirmClassName="!w-auto !px-2 text-[11px]"
                    />
                  )}
                </div>
              </div>


              {isActive &&
                profile.ports.length === 0 &&
                settings.ports.length > 0 && (
                  <div className="rounded-lg border border-warning/25 bg-warning/[0.06] px-3 py-2 text-[11.5px] text-muted-foreground flex items-center gap-2">
                    <span className="size-1.5 rounded-full bg-warning shadow-[0_0_8px_rgba(245,158,11,0.7)]" />
                    Pick the ports this profile should watch below.
                  </div>
                )}

              <div className="flex flex-wrap gap-1.5">
                {settings.ports.map((p) => {
                  const included = profile.ports.includes(p.port);
                  return (
                    <button
                      key={p.port}
                      onClick={() => handlePortToggle(profile.id, p.port)}
                      className={cn(
                        "press focus-ring mono tabular text-[11.5px] font-medium",
                        "h-6 px-2 rounded-md border",
                        "transition-[background-color,border-color,color,box-shadow] duration-150",
                        included
                          ? "bg-primary/15 text-primary-glow border-primary/30 shadow-[0_0_12px_-4px_rgba(124,58,237,0.5)]"
                          : "bg-secondary text-muted-foreground border-border-strong hover:text-foreground hover:border-border-bright"
                      )}
                      title={
                        included
                          ? `Remove :${p.port} from ${profile.name}`
                          : `Add :${p.port} to ${profile.name}`
                      }
                    >
                      :{p.port}
                    </button>
                  );
                })}
                {settings.ports.length === 0 && (
                  <button
                    onClick={() => setPrefTab("ports")}
                    className="press focus-ring text-[11.5px] text-primary-glow hover:underline inline-flex items-center gap-1"
                  >
                    No ports defined yet. Add some in the Ports tab
                    <ArrowRight className="size-3" />
                  </button>
                )}
              </div>


              <div className="flex flex-col gap-1 border-t border-border pt-3">
                <div className="flex items-center justify-between gap-3 py-0.5">
                  <div className="flex items-center gap-1.5">
                    <Sparkles className="size-3.5 text-muted-foreground" />
                    <span className="text-[12.5px] font-medium text-foreground">Auto-Fix</span>
                  </div>
                  <Toggle
                    checked={profile.auto_fix?.enabled ?? false}
                    onChange={(v) => handleAutoFixToggle(profile.id, "enabled", v)}
                    size="sm"
                  />
                </div>
                {profile.auto_fix?.enabled && (
                  <div className="flex items-center justify-between gap-3 py-0.5 pl-5">
                    <span className="text-[11.5px] text-muted-foreground">Require confirmation</span>
                    <Toggle
                      checked={profile.auto_fix?.require_confirmation ?? true}
                      onChange={(v) => handleAutoFixToggle(profile.id, "require_confirmation", v)}
                      size="sm"
                    />
                  </div>
                )}
                <div className="flex items-center gap-3 pt-1">
                  <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                    <ShieldCheck className="size-3 text-success" />
                    {profile.whitelist?.length ?? 0} whitelist
                  </div>
                  <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                    <ShieldOff className="size-3 text-destructive" />
                    {profile.blacklist?.length ?? 0} blacklist
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="ml-auto text-[11px] text-primary-glow hover:text-primary-glow"
                    onClick={() => { handleActivate(profile.id).then(() => setPrefTab("rules")); }}
                  >
                    Edit rules
                    <ArrowRight className="size-3 ml-0.5" />
                  </Button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
