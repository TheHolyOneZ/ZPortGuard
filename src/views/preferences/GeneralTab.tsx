import { useState } from "react";
import { useSettings } from "@/hooks/useSettings";
import {
  enable as enableAutostart,
  disable as disableAutostart,
} from "@tauri-apps/plugin-autostart";
import { Toggle } from "@/components/ui/Toggle";
import { Select } from "@/components/ui/Select";
import { Cog } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "@/store/toastStore";

type ChangeKey = "autolaunch" | "start_minimized" | "polling_interval_ms";

export function GeneralTab() {
  const { settings, update } = useSettings();
  const [pulse, setPulse] = useState<ChangeKey | null>(null);

  if (!settings) return null;

  const ping = (key: ChangeKey) => {
    setPulse(key);
    setTimeout(() => setPulse((p) => (p === key ? null : p)), 700);
  };

  const handleAutolaunchToggle = async (checked: boolean) => {
    try {
      if (checked) {
        await enableAutostart();
      } else {
        await disableAutostart();
      }
      await update({ ...settings, autolaunch: checked });
      ping("autolaunch");
    } catch (e) {
      toast.error(
        "Couldn't update autolaunch",
        e instanceof Error ? e.message : "Unknown error"
      );
    }
  };

  const handlePollingChange = async (value: number) => {
    await update({ ...settings, polling_interval_ms: value });
    ping("polling_interval_ms");
  };

  const handleStartMinimizedToggle = async (checked: boolean) => {
    await update({ ...settings, start_minimized: checked });
    ping("start_minimized");
  };

  return (
    <div className="flex flex-col gap-4">
      <Section
        title="Behavior"
        icon={<Cog className="size-4 text-primary-glow" />}
        subtitle="These settings apply globally across all profiles."
      >
        <Row
          label="Launch at Login"
          description="Start ZPortGuard automatically when you log in."
          checked={settings.autolaunch}
          onChange={handleAutolaunchToggle}
          pulsing={pulse === "autolaunch"}
        />
        <Divider />
        <Row
          label="Start Minimized to Tray"
          description="On launch, keep the main window hidden and only show the tray icon."
          checked={settings.start_minimized}
          onChange={handleStartMinimizedToggle}
          pulsing={pulse === "start_minimized"}
        />
        <Divider />
        <div className="flex items-center justify-between gap-4 py-1">
          <div className="min-w-0">
            <p className="text-[13.5px] font-medium text-foreground">
              Polling Interval
            </p>
            <p className="text-[11.5px] text-muted-foreground mt-0.5 max-w-[42ch]">
              How often to scan ports. Lower is more responsive, higher uses
              less CPU. Changes take effect immediately — no restart needed.
            </p>
          </div>
          <div
            className={cn(
              "rounded-lg transition-shadow duration-500",
              pulse === "polling_interval_ms" &&
                "shadow-[0_0_0_3px_rgba(124,58,237,0.25),0_0_22px_-4px_rgba(124,58,237,0.55)]"
            )}
          >
            <Select
              value={settings.polling_interval_ms}
              onChange={(e) => handlePollingChange(Number(e.target.value))}
            >
              <option value={500}>500 ms</option>
              <option value={1000}>1 s</option>
              <option value={2000}>2 s</option>
              <option value={5000}>5 s</option>
            </Select>
          </div>
        </div>
      </Section>

      <div className="rounded-xl bg-card hairline shadow-card p-4">
        <p className="text-[11.5px] text-muted-foreground leading-relaxed">
          <span className="font-semibold text-foreground">Auto-Fix</span> and{" "}
          <span className="font-semibold text-foreground">Rules</span> (whitelist &amp; blacklist)
          are now <span className="text-primary-glow font-semibold">per-profile</span>. Configure
          them in the{" "}
          <span className="font-semibold text-foreground">Profiles</span> and{" "}
          <span className="font-semibold text-foreground">Rules</span> tabs — each
          profile has its own independent behavior.
        </p>
      </div>
    </div>
  );
}

function Section({
  title,
  icon,
  subtitle,
  children,
}: {
  title: string;
  icon?: React.ReactNode;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl bg-card hairline shadow-card p-4 flex flex-col gap-3">
      <div className="flex flex-col gap-0.5">
        <div className="flex items-center gap-2">
          {icon}
          <h3 className="caps text-muted-foreground">{title}</h3>
        </div>
        {subtitle && (
          <p className="text-[11px] text-muted-foreground pl-6">{subtitle}</p>
        )}
      </div>
      <div className="flex flex-col">{children}</div>
    </div>
  );
}

function Divider() {
  return <div className="h-px bg-border my-1" />;
}

function Row({
  label,
  description,
  checked,
  onChange,
  disabled = false,
  pulsing = false,
}: {
  label: string;
  description: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  disabled?: boolean;
  pulsing?: boolean;
}) {
  return (
    <div
      className={cn(
        "flex items-center justify-between gap-4 py-1",
        disabled && "opacity-50"
      )}
    >
      <div className="min-w-0">
        <p className="text-[13.5px] font-medium text-foreground">{label}</p>
        <p className="text-[11.5px] text-muted-foreground mt-0.5 max-w-[42ch]">
          {description}
        </p>
      </div>
      <div
        className={cn(
          "rounded-full transition-shadow duration-500",
          pulsing &&
            "shadow-[0_0_0_4px_rgba(124,58,237,0.25),0_0_22px_-4px_rgba(124,58,237,0.55)]"
        )}
      >
        <Toggle checked={checked} onChange={onChange} disabled={disabled} />
      </div>
    </div>
  );
}
