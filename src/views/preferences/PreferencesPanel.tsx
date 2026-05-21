import { cn } from "@/lib/utils";
import {
  Network,
  Layers,
  ShieldAlert,
  ScrollText,
  Settings2,
  Radio,
} from "lucide-react";
import { PortsTab } from "./PortsTab";
import { ProfilesTab } from "./ProfilesTab";
import { RulesTab } from "./RulesTab";
import { LogsTab } from "./LogsTab";
import { GeneralTab } from "./GeneralTab";
import { useNavStore, PrefTab } from "@/store/navStore";
import { useSettings } from "@/hooks/useSettings";
import { usePortStatus } from "@/hooks/usePortStatus";
import { Badge } from "@/components/ui/Badge";

const TABS: { id: PrefTab; label: string; icon: React.ReactNode }[] = [
  { id: "ports",    label: "Ports",    icon: <Network className="size-3.5" /> },
  { id: "profiles", label: "Profiles", icon: <Layers className="size-3.5" /> },
  { id: "rules",    label: "Rules",    icon: <ShieldAlert className="size-3.5" /> },
  { id: "logs",     label: "Logs",     icon: <ScrollText className="size-3.5" /> },
  { id: "general",  label: "General",  icon: <Settings2 className="size-3.5" /> },
];

export function PreferencesPanel() {
  const tab = useNavStore((s) => s.prefTab);
  const setTab = useNavStore((s) => s.setPrefTab);
  const { settings } = useSettings();
  const { recentConflicts } = usePortStatus();

  const counts: Record<PrefTab, number | null> = {
    ports: settings?.ports.length ?? null,
    profiles: settings?.profiles.length ?? null,
    rules: (() => {
      if (!settings) return null;
      const ap = settings.profiles.find((p) => p.id === settings.active_profile);
      return (ap?.whitelist.length ?? 0) + (ap?.blacklist.length ?? 0);
    })(),
    logs: recentConflicts.length,
    general: null,
  };

  const activeProfile = settings?.profiles.find(
    (p) => p.id === settings.active_profile
  );

  return (
    <div className="px-8 py-7 max-w-[1100px] mx-auto">
      <div className="mb-6 flex items-end justify-between gap-4">
        <div>
          <h1 className="text-[22px] font-semibold tracking-tight">Preferences</h1>
          <p className="text-[13px] text-muted-foreground mt-0.5">
            Configure ports, profiles, rules, and behavior.
          </p>
        </div>
        {activeProfile && (
          <Badge tone="brand">
            <Radio className="size-2.5" />
            {activeProfile.name}
          </Badge>
        )}
      </div>


      <div className="relative inline-flex gap-0.5 p-1 rounded-xl bg-card hairline mb-6 shadow-card">
        {TABS.map((t) => {
          const active = tab === t.id;
          const count = counts[t.id];
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={cn(
                "press focus-ring relative inline-flex items-center gap-1.5 h-8 px-3 rounded-lg text-[12.5px] font-medium",
                "transition-[color,background-color,box-shadow] duration-200 ease-out",
                active
                  ? "text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground hover:bg-secondary/60"
              )}
            >
              {active && (
                <span
                  aria-hidden
                  className="absolute inset-0 rounded-lg bg-gradient-brand shadow-[0_4px_14px_-4px_rgba(124,58,237,0.6),inset_0_1px_0_rgba(255,255,255,0.18)]"
                />
              )}
              <span className="relative inline-flex items-center gap-1.5">
                {t.icon}
                {t.label}
                {count !== null && count > 0 && (
                  <span
                    className={cn(
                      "mono tabular text-[10px] font-semibold leading-none rounded-md px-1.5 py-0.5 min-w-[18px] text-center",
                      active
                        ? "bg-white/20 text-white"
                        : "bg-secondary text-muted-foreground"
                    )}
                  >
                    {count}
                  </span>
                )}
              </span>
            </button>
          );
        })}
      </div>

      <div key={tab} className="anim-fade-in">
        {tab === "ports" && <PortsTab />}
        {tab === "profiles" && <ProfilesTab />}
        {tab === "rules" && <RulesTab />}
        {tab === "logs" && <LogsTab />}
        {tab === "general" && <GeneralTab />}
      </div>
    </div>
  );
}
