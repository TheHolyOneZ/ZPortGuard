import { HTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils";

type Tone = "neutral" | "brand" | "success" | "warning" | "destructive" | "info";

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  tone?: Tone;
  children: ReactNode;
}

const tones: Record<Tone, string> = {
  neutral: "bg-secondary text-secondary-foreground border-border-strong",
  brand: "bg-primary/12 text-primary-glow border-primary/25",
  success: "bg-success/12 text-success border-success/25",
  warning: "bg-warning/12 text-warning border-warning/30",
  destructive: "bg-destructive/12 text-destructive border-destructive/25",
  info: "bg-accent/12 text-accent-glow border-accent/25",
};

export function Badge({ tone = "neutral", className, children, ...rest }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 px-1.5 h-5 text-[10.5px] font-medium rounded-md",
        "border tracking-wide uppercase",
        tones[tone],
        className
      )}
      {...rest}
    >
      {children}
    </span>
  );
}
