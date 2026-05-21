import { cn } from "@/lib/utils";

interface StatusDotProps {
  status: "clear" | "conflict" | "unknown";
  size?: "sm" | "md" | "lg";
  pulse?: boolean;
  className?: string;
}

const sizeClasses: Record<NonNullable<StatusDotProps["size"]>, string> = {
  sm: "size-2",
  md: "size-2.5",
  lg: "size-3.5",
};

const ringDims: Record<NonNullable<StatusDotProps["size"]>, string> = {
  sm: "size-3.5 -inset-[3px]",
  md: "size-4 -inset-[3px]",
  lg: "size-6 -inset-[5px]",
};

export function StatusDot({
  status,
  size = "md",
  pulse = false,
  className,
}: StatusDotProps) {
  const config = {
    clear: {
      dot: "bg-success",
      glow: "shadow-[0_0_0_2px_rgba(16,185,129,0.18),0_0_12px_-2px_rgba(16,185,129,0.7)]",
      pulseBg: "bg-success/60",
    },
    conflict: {
      dot: "bg-warning",
      glow: "shadow-[0_0_0_2px_rgba(245,158,11,0.22),0_0_14px_-2px_rgba(245,158,11,0.85)]",
      pulseBg: "bg-warning/60",
    },
    unknown: {
      dot: "bg-muted-foreground",
      glow: "shadow-[0_0_0_1px_rgba(108,109,128,0.25)]",
      pulseBg: "bg-muted-foreground/40",
    },
  }[status];

  return (
    <span
      className={cn(
        "relative inline-flex items-center justify-center shrink-0",
        className
      )}
    >

      {pulse && status === "conflict" && (
        <>
          <span
            aria-hidden
            className={cn(
              "absolute rounded-full pointer-events-none",
              ringDims[size],
              "bg-[radial-gradient(circle,rgba(245,158,11,0.55)_0%,rgba(245,158,11,0)_70%)]",
              "animate-[conflict-pulse_1.8s_ease-out_infinite]"
            )}
          />
          <span
            aria-hidden
            className={cn(
              "absolute rounded-full pointer-events-none",
              ringDims[size],
              "bg-[radial-gradient(circle,rgba(245,158,11,0.55)_0%,rgba(245,158,11,0)_70%)]",
              "animate-[conflict-pulse_1.8s_ease-out_infinite]"
            )}
            style={{ animationDelay: "0.9s" }}
          />
        </>
      )}
      <span
        className={cn(
          "relative rounded-full",
          sizeClasses[size],
          config.dot,
          config.glow
        )}
      />
      {pulse && status === "clear" && (
        <span
          aria-hidden
          className={cn(
            "absolute rounded-full pointer-events-none opacity-50",
            sizeClasses[size],
            config.pulseBg,
            "animate-ping"
          )}
        />
      )}
    </span>
  );
}
