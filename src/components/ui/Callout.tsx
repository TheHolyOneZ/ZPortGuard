import { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { Info, AlertTriangle, Sparkles, CheckCircle2 } from "lucide-react";

type Tone = "info" | "warning" | "brand" | "success";

interface CalloutProps {
  tone?: Tone;
  icon?: ReactNode;
  title: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
  className?: string;
  dense?: boolean;
}

const toneClasses: Record<
  Tone,
  { wrap: string; iconWrap: string; iconColor: string }
> = {
  info: {
    wrap: "bg-accent/[0.06] border-accent/25 shadow-[0_0_22px_-10px_rgba(59,130,246,0.45)]",
    iconWrap: "bg-accent/15 border-accent/30",
    iconColor: "text-accent-glow",
  },
  warning: {
    wrap: "bg-warning/[0.06] border-warning/30 shadow-[0_0_22px_-10px_rgba(245,158,11,0.45)]",
    iconWrap: "bg-warning/15 border-warning/30",
    iconColor: "text-warning",
  },
  brand: {
    wrap: "bg-gradient-brand-faint border-primary/30 shadow-[0_0_22px_-10px_rgba(124,58,237,0.55)]",
    iconWrap: "bg-primary/15 border-primary/30",
    iconColor: "text-primary-glow",
  },
  success: {
    wrap: "bg-success/[0.06] border-success/30 shadow-[0_0_22px_-10px_rgba(16,185,129,0.45)]",
    iconWrap: "bg-success/15 border-success/30",
    iconColor: "text-success",
  },
};

const defaultIcon: Record<Tone, ReactNode> = {
  info: <Info />,
  warning: <AlertTriangle />,
  brand: <Sparkles />,
  success: <CheckCircle2 />,
};

export function Callout({
  tone = "info",
  icon,
  title,
  description,
  action,
  className,
  dense = false,
}: CalloutProps) {
  const t = toneClasses[tone];
  return (
    <div
      className={cn(
        "relative flex items-start gap-3 rounded-xl border",
        dense ? "px-3 py-2.5" : "px-4 py-3",
        "anim-fade-in",
        t.wrap,
        className
      )}
    >
      <div
        className={cn(
          "shrink-0 rounded-lg border flex items-center justify-center",
          dense ? "size-7" : "size-8",
          t.iconWrap
        )}
      >
        <span className={cn(t.iconColor, "[&>svg]:size-3.5")}>
          {icon ?? defaultIcon[tone]}
        </span>
      </div>
      <div className="flex-1 min-w-0 flex flex-col gap-0.5">
        <div
          className={cn(
            "font-semibold text-foreground tracking-tight",
            dense ? "text-[12.5px]" : "text-[13px]"
          )}
        >
          {title}
        </div>
        {description && (
          <div
            className={cn(
              "text-muted-foreground leading-relaxed",
              dense ? "text-[11.5px]" : "text-[12px]"
            )}
          >
            {description}
          </div>
        )}
      </div>
      {action && (
        <div className="shrink-0 flex items-center gap-1.5 self-center">
          {action}
        </div>
      )}
    </div>
  );
}
