import { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
  compact?: boolean;
}

export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
  compact = false,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center text-center",
        compact ? "py-6 gap-2" : "py-12 gap-3",
        className
      )}
    >
      {icon && (
        <div
          className={cn(
            "relative flex items-center justify-center rounded-2xl",
            compact ? "size-10" : "size-14",
            "bg-gradient-brand-faint hairline"
          )}
        >
          <span className={cn("text-primary-glow", compact ? "[&>svg]:size-5" : "[&>svg]:size-7")}>{icon}</span>
        </div>
      )}
      <div className="flex flex-col items-center gap-1">
        <p
          className={cn(
            "font-semibold text-foreground",
            compact ? "text-sm" : "text-[15px]"
          )}
        >
          {title}
        </p>
        {description && (
          <p
            className={cn(
              "text-muted-foreground max-w-[36ch]",
              compact ? "text-xs" : "text-[13px] leading-relaxed"
            )}
          >
            {description}
          </p>
        )}
      </div>
      {action && <div className="mt-1">{action}</div>}
    </div>
  );
}
