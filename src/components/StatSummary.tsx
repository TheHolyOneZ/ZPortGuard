import { cn } from "@/lib/utils";

type Tone = "warning" | "success" | "brand" | "destructive";

const toneClasses: Record<Tone, string> = {
  warning: "text-warning",
  success: "text-success",
  brand: "text-primary-glow",
  destructive: "text-destructive",
};

export function StatSummary({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: Tone;
}) {
  return (
    <div className="flex flex-col items-center gap-1 px-4 py-1.5 border-l border-border-strong/60 min-w-[72px] text-center">
      <span
        className={cn(
          "text-[22px] font-semibold tabular tracking-tight leading-none",
          toneClasses[tone]
        )}
      >
        {value}
      </span>
      <span className="caps text-muted-foreground leading-none">{label}</span>
    </div>
  );
}
