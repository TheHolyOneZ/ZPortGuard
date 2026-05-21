import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { ConflictEvent } from "@/lib/api";
import { useMemo } from "react";
import { BarChart3 } from "lucide-react";
import { EmptyState } from "./ui/EmptyState";

interface ConflictChartProps {
  conflicts: ConflictEvent[];
}

export function ConflictChart({ conflicts }: ConflictChartProps) {
  const data = useMemo(() => {
    const counts: Record<number, number> = {};
    for (const c of conflicts) {
      counts[c.port] = (counts[c.port] ?? 0) + 1;
    }
    return Object.entries(counts)
      .map(([port, count]) => ({ port: `:${port}`, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8);
  }, [conflicts]);

  if (data.length === 0) {
    return (
      <EmptyState
        compact
        icon={<BarChart3 />}
        title="No conflicts yet"
        description="Frequency will appear here once a conflict is detected."
      />
    );
  }

  return (
    <div className="anim-fade-in">
      <ResponsiveContainer width="100%" height={150}>
        <BarChart data={data} barSize={22} margin={{ top: 4, right: 4, left: -16, bottom: 0 }}>
          <defs>
            <linearGradient id="conflict-bar-primary" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#a78bfa" stopOpacity={1} />
              <stop offset="100%" stopColor="#7c3aed" stopOpacity={0.85} />
            </linearGradient>
            <linearGradient id="conflict-bar-secondary" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#60a5fa" stopOpacity={0.95} />
              <stop offset="100%" stopColor="#3b82f6" stopOpacity={0.75} />
            </linearGradient>
          </defs>
          <XAxis
            dataKey="port"
            tick={{ fill: "var(--color-muted-foreground)", fontSize: 10.5, fontFamily: "var(--font-mono)" }}
            axisLine={false}
            tickLine={false}
            interval={0}
          />
          <YAxis
            tick={{ fill: "var(--color-muted-foreground)", fontSize: 10.5 }}
            axisLine={false}
            tickLine={false}
            width={28}
            allowDecimals={false}
          />
          <Tooltip
            contentStyle={{
              background: "var(--color-card-elevated)",
              border: "1px solid var(--color-border-strong)",
              borderRadius: 10,
              color: "var(--color-foreground)",
              fontSize: 12,
              padding: "6px 10px",
              boxShadow: "0 20px 40px -16px rgba(0,0,0,0.7)",
            }}
            cursor={{ fill: "rgba(124,58,237,0.06)" }}
            labelStyle={{ color: "var(--color-muted-foreground)", marginBottom: 2 }}
          />
          <Bar dataKey="count" radius={[4, 4, 0, 0]}>
            {data.map((_, i) => (
              <Cell
                key={i}
                fill={i === 0 ? "url(#conflict-bar-primary)" : "url(#conflict-bar-secondary)"}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
