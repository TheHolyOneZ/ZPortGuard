import { useState } from "react";
import { useSettings } from "@/hooks/useSettings";
import { RuleEntry, MatchType } from "@/lib/api";
import { Plus, Trash2, ShieldCheck, ShieldOff } from "lucide-react";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { ConfirmButton } from "@/components/ui/ConfirmButton";

type RuleType = "whitelist" | "blacklist";

const MATCH_TYPE_LABELS: Record<MatchType, string> = {
  exact: "Exact",
  glob: "Glob",
  path: "Path",
};

const MATCH_TYPE_HINTS: Record<MatchType, string> = {
  exact: "Match the process name exactly",
  glob: 'Glob: "node*" matches anything starting with "node"',
  path: "Path: matches if the process exe path contains this string",
};

function RuleSection({
  title,
  description,
  icon,
  accent,
  rules,
  onAdd,
  onRemove,
}: {
  title: string;
  description: string;
  icon: React.ReactNode;
  accent: "success" | "destructive";
  rules: RuleEntry[];
  onAdd: (rule: RuleEntry) => void;
  onRemove: (index: number) => void;
}) {
  const [name, setName] = useState("");
  const [port, setPort] = useState("");
  const [matchType, setMatchType] = useState<MatchType>("exact");

  const handleAdd = () => {
    if (!name.trim()) return;
    const portNum = port ? parseInt(port, 10) : undefined;
    onAdd({
      process_name: name.trim(),
      port: portNum && !isNaN(portNum) ? portNum : null,
      note: null,
      match_type: matchType,
    });
    setName("");
    setPort("");
  };

  const iconBg =
    accent === "success"
      ? "bg-success/12 border-success/25 text-success"
      : "bg-destructive/12 border-destructive/25 text-destructive";

  return (
    <div className="rounded-xl bg-card hairline shadow-card p-4 flex flex-col gap-4">
      <div className="flex items-center gap-3">
        <div
          className={`size-9 rounded-lg border flex items-center justify-center shrink-0 ${iconBg}`}
        >
          {icon}
        </div>
        <div className="flex flex-col">
          <h3 className="text-[14px] font-semibold tracking-tight">{title}</h3>
          <p className="text-[11.5px] text-muted-foreground">{description}</p>
        </div>
        <span className="ml-auto text-[11px] mono tabular text-muted-foreground">
          {rules.length} rule{rules.length === 1 ? "" : "s"}
        </span>
      </div>

      <div className="flex gap-2 flex-wrap">
        <Input
          type="text"
          placeholder={matchType === "path" ? "/usr/bin/node or node" : "Process name (e.g. node)"}
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleAdd()}
          className="flex-1 min-w-[160px]"
        />
        <Select
          value={matchType}
          onChange={(e) => setMatchType(e.target.value as MatchType)}
          className="w-28"
          title={MATCH_TYPE_HINTS[matchType]}
        >
          {(Object.keys(MATCH_TYPE_LABELS) as MatchType[]).map((t) => (
            <option key={t} value={t}>{MATCH_TYPE_LABELS[t]}</option>
          ))}
        </Select>
        <Input
          type="number"
          placeholder="Port (any)"
          value={port}
          onChange={(e) => setPort(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleAdd()}
          className="w-28"
        />
        <Button
          onClick={handleAdd}
          variant="secondary"
          leftIcon={<Plus className="size-3.5" />}
          disabled={!name.trim()}
        >
          Add
        </Button>
      </div>
      <p className="text-[11px] text-muted-foreground -mt-1">{MATCH_TYPE_HINTS[matchType]}</p>

      <div className="flex flex-col gap-1">
        {rules.map((rule, i) => (
          <div
            key={i}
            className="flex items-center gap-3 px-3 h-9 rounded-lg bg-surface-1 hairline transition-colors duration-150 hover:bg-secondary/70"
          >
            <span className="text-[13px] flex-1 truncate">
              {rule.process_name}
            </span>
            <span className="mono text-[9.5px] uppercase tracking-wide px-1.5 py-0.5 rounded bg-secondary hairline text-muted-foreground shrink-0">
              {rule.match_type ?? "exact"}
            </span>
            {rule.port ? (
              <span className="mono text-[11.5px] tabular text-muted-foreground">
                :{rule.port}
              </span>
            ) : (
              <span className="text-[10.5px] uppercase tracking-wide text-muted-foreground">
                any port
              </span>
            )}
            <ConfirmButton
              onConfirm={() => onRemove(i)}
              idle={<Trash2 className="size-3.5" />}
              confirm="Remove"
              idleAriaLabel="Remove rule"
              confirmAriaLabel="Confirm remove rule"
              variant="ghost"
              size="icon-sm"
              className="text-muted-foreground hover:text-destructive hover:bg-destructive/10"
              confirmClassName="!w-auto !px-2 text-[11px]"
            />
          </div>
        ))}
        {rules.length === 0 && (
          <EmptyState
            compact
            title="No rules"
            description="Add a process name above to create a rule."
          />
        )}
      </div>
    </div>
  );
}

export function RulesTab() {
  const { settings, update } = useSettings();

  if (!settings) return null;

  const activeProfile = settings.profiles.find((p) => p.id === settings.active_profile);
  if (!activeProfile) return null;

  const updateProfile = async (patch: Partial<typeof activeProfile>) => {
    await update({
      ...settings,
      profiles: settings.profiles.map((p) =>
        p.id === activeProfile.id ? { ...p, ...patch } : p
      ),
    });
  };

  const handleAdd = async (type: RuleType, rule: RuleEntry) => {
    await updateProfile({ [type]: [...activeProfile[type], rule] });
  };

  const handleRemove = async (type: RuleType, index: number) => {
    await updateProfile({ [type]: activeProfile[type].filter((_, i) => i !== index) });
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-xl bg-card hairline shadow-card px-4 py-2.5 flex items-center gap-2">
        <ShieldCheck className="size-3.5 text-primary-glow" />
        <span className="text-[12px] text-muted-foreground">
          Rules for profile{" "}
          <span className="font-semibold text-foreground">{activeProfile.name}</span>
        </span>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <RuleSection
          title="Whitelist"
          description="Never kill these processes, even on conflict."
          icon={<ShieldCheck className="size-4" />}
          accent="success"
          rules={activeProfile.whitelist}
          onAdd={(r) => handleAdd("whitelist", r)}
          onRemove={(i) => handleRemove("whitelist", i)}
        />
        <RuleSection
          title="Blacklist"
          description="Always kill on sight when these match."
          icon={<ShieldOff className="size-4" />}
          accent="destructive"
          rules={activeProfile.blacklist}
          onAdd={(r) => handleAdd("blacklist", r)}
          onRemove={(i) => handleRemove("blacklist", i)}
        />
      </div>
    </div>
  );
}
