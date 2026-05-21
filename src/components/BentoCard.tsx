import { cn } from "@/lib/utils";
import { ReactNode } from "react";

interface BentoCardProps {
  className?: string;
  children: ReactNode;
  title?: string;
  subtitle?: string;
  action?: ReactNode;
  hero?: boolean;
  noPadding?: boolean;
  contentClassName?: string;
}

export function BentoCard({
  className,
  children,
  title,
  subtitle,
  action,
  hero = false,
  noPadding = false,
  contentClassName,
}: BentoCardProps) {
  return (
    <div
      className={cn(
        "relative isolate overflow-hidden rounded-xl",
        "bg-card hairline shadow-card",

        "before:absolute before:inset-0 before:pointer-events-none before:rounded-[inherit]",
        "before:bg-[linear-gradient(180deg,rgba(255,255,255,0.035)_0%,rgba(255,255,255,0)_55%)]",
        hero &&
          "before:bg-[linear-gradient(135deg,rgba(124,58,237,0.10)_0%,rgba(59,130,246,0.06)_40%,rgba(255,255,255,0)_70%)]",
        "anim-fade-in",
        className
      )}
    >
      {(title || action) && (
        <div
          className={cn(
            "relative flex items-center justify-between",
            noPadding ? "px-4 pt-4" : "px-4 pt-4 pb-3"
          )}
        >
          <div className="flex flex-col gap-0.5">
            {title && (
              <span className="caps text-muted-foreground">{title}</span>
            )}
            {subtitle && (
              <span className="text-sm text-foreground">{subtitle}</span>
            )}
          </div>
          {action && <div className="flex items-center gap-1.5">{action}</div>}
        </div>
      )}
      <div
        className={cn(
          "relative",
          !noPadding && (title || action ? "px-4 pb-4" : "p-4"),
          contentClassName
        )}
      >
        {children}
      </div>
    </div>
  );
}
