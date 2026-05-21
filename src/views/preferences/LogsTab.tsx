import { useState } from "react";
import { useActivityLog } from "@/hooks/useActivityLog";
import { cn } from "@/lib/utils";
import { Search, ScrollText, Trash2 } from "lucide-react";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { LogAction } from "@/lib/api";

type Filter = "all" | "auto" | "manual" | "detected";

const FILTERS: { id: Filter; label: string }[] = [
  { id: "all", label: "All" },
  { id: "auto", label: "Auto-killed" },
  { id: "manual", label: "Manual" },
  { id: "detected", label: "Detected" },
];

function actionTone(action: LogAction): "success" | "destructive" | "warning" | "neutral" {
  if (action === "auto_killed") return "success";
  if (action === "user_killed") return "destructive";
  if (action === "conflict_detected") return "warning";
  return "neutral";
}

function actionLabel(action: LogAction): string {
  switch (action) {
    case "auto_killed": return "auto-killed";
    case "user_killed": return "killed";
    case "user_ignored": return "ignored";
    case "dismissed": return "dismissed";
    case "conflict_detected": return "detected";
  }
}

function relativeTime(ts: string): string {
  const diff = Math.floor((Date.now() - new Date(ts).getTime()) / 1000);
  if (diff < 5) return "just now";
  if (diff < 60) return `${diff}s ago`;
  const m = Math.floor(diff / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

export function LogsTab() {
  const { rows, clear } = useActivityLog();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const [clearing, setClearing] = useState(false);

  const filtered = rows.filter((c) => {
    const matchesSearch =
      !search ||
      (c.process_name ?? "").toLowerCase().includes(search.toLowerCase()) ||
      String(c.port).includes(search);
    const matchesFilter =
      filter === "all" ||
      (filter === "auto" && c.action === "auto_killed") ||
      (filter === "manual" && c.action === "user_killed") ||
      (filter === "detected" && c.action === "conflict_detected");
    return matchesSearch && matchesFilter;
  });

  const handleClear = async () => {
    setClearing(true);
    try {
      await clear();
    } finally {
      setClearing(false);
    }
  };

  return (
    <div className="rounded-xl bg-card hairline shadow-card p-4 flex flex-col gap-4">
      <div className="flex gap-2 flex-wrap">
        <Input
          type="text"
          placeholder="Search by process or port…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          leftIcon={<Search className="size-3.5" />}
          className="flex-1 min-w-[160px]"
        />
        <div className="inline-flex p-0.5 rounded-lg bg-surface-1 hairline">
          {FILTERS.map((f) => (
            <button
              key={f.id}
              onClick={() => setFilter(f.id)}
              className={cn(
                "press focus-ring relative h-8 px-3 rounded-md text-[12px] font-medium",
                "transition-[color,background-color,box-shadow] duration-200",
                filter === f.id
                  ? "text-foreground bg-gradient-brand-soft shadow-[inset_0_0_0_1px_rgba(124,58,237,0.35)]"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {f.label}
            </button>
          ))}
        </div>
        <Button
          size="sm"
          variant="ghost"
          leftIcon={<Trash2 className="size-3.5" />}
          onClick={handleClear}
          loading={clearing}
          disabled={rows.length === 0}
          className="text-muted-foreground hover:text-destructive"
        >
          Clear
        </Button>
      </div>

      <div className="flex flex-col gap-0.5 max-h-[480px] overflow-y-auto pr-1 -mr-1">
        {filtered.length === 0 ? (
          <EmptyState
            icon={<ScrollText />}
            title={rows.length === 0 ? "No events yet" : "No matches"}
            description={
              rows.length === 0
                ? "Detected conflicts will be logged here. Logs survive app restarts."
                : "Try adjusting your search or filter."
            }
          />
        ) : (
          filtered.map((c, i) => (
            <div
              key={c.id ?? i}
              className={cn(
                "anim-stagger-in flex items-center gap-3 px-3 py-2 rounded-lg",
                "transition-colors duration-150 hover:bg-secondary/50"
              )}
              style={{ animationDelay: `${Math.min(i, 12) * 20}ms` }}
            >
              <span
                className={cn(
                  "size-1.5 rounded-full shrink-0",
                  c.action === "auto_killed"
                    ? "bg-success shadow-[0_0_8px_rgba(16,185,129,0.7)]"
                    : c.action === "user_killed"
                    ? "bg-destructive shadow-[0_0_8px_rgba(239,68,68,0.7)]"
                    : "bg-warning shadow-[0_0_8px_rgba(245,158,11,0.7)]"
                )}
              />
              <span className="mono text-[11.5px] tabular text-muted-foreground w-14 shrink-0">
                :{c.port}
              </span>
              <span className="flex-1 truncate text-[13px]">
                {c.process_name ?? <span className="italic text-muted-foreground">unknown</span>}
              </span>
              {c.pid != null && (
                <span className="mono text-[11px] tabular text-muted-foreground shrink-0">
                  PID {c.pid}
                </span>
              )}
              <Badge tone={actionTone(c.action)}>{actionLabel(c.action)}</Badge>
              <span className="text-[11px] text-muted-foreground shrink-0 tabular">
                {relativeTime(c.ts)}
              </span>
            </div>
          ))
        )}
      </div>

      {rows.length > 0 && (
        <p className="text-[11px] text-muted-foreground text-right">
          {rows.length} event{rows.length !== 1 ? "s" : ""} · persists across restarts
        </p>
      )}
    </div>
  );
}
