import { forwardRef, ButtonHTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils";

type Variant = "primary" | "secondary" | "ghost" | "destructive" | "outline";
type Size = "xs" | "sm" | "md" | "lg" | "icon" | "icon-sm";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
}

const sizeStyles: Record<Size, string> = {
  xs: "h-6 px-2 text-[11px] gap-1 rounded-md",
  sm: "h-7 px-2.5 text-xs gap-1.5 rounded-md",
  md: "h-8 px-3 text-sm gap-1.5 rounded-lg",
  lg: "h-10 px-4 text-sm gap-2 rounded-lg",
  icon: "size-8 rounded-lg",
  "icon-sm": "size-7 rounded-md",
};

const variantStyles: Record<Variant, string> = {
  primary: [
    "relative isolate text-primary-foreground font-medium",
    "bg-gradient-brand",
    "shadow-[0_1px_0_rgba(255,255,255,0.18)_inset,0_8px_20px_-8px_rgba(124,58,237,0.55)]",
    "hover:shadow-[0_1px_0_rgba(255,255,255,0.22)_inset,0_10px_28px_-8px_rgba(124,58,237,0.7),0_0_28px_-8px_rgba(59,130,246,0.55)]",
    "hover:brightness-110",
    "active:brightness-95",
    "disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:brightness-100",
  ].join(" "),
  secondary: [
    "bg-secondary text-secondary-foreground border border-border-strong",
    "hover:bg-card-elevated hover:border-border-bright hover:text-foreground",
    "active:bg-secondary",
    "disabled:opacity-50 disabled:cursor-not-allowed",
  ].join(" "),
  outline: [
    "bg-transparent text-foreground border border-border-strong",
    "hover:bg-secondary hover:border-border-bright",
    "active:bg-card",
    "disabled:opacity-50 disabled:cursor-not-allowed",
  ].join(" "),
  ghost: [
    "bg-transparent text-muted-foreground",
    "hover:bg-secondary hover:text-foreground",
    "active:bg-card",
    "disabled:opacity-50 disabled:cursor-not-allowed",
  ].join(" "),
  destructive: [
    "bg-destructive/15 text-destructive border border-destructive/25",
    "hover:bg-destructive hover:text-destructive-foreground hover:border-destructive",
    "hover:shadow-[0_0_18px_-4px_rgba(239,68,68,0.55)]",
    "active:brightness-95",
    "disabled:opacity-50 disabled:cursor-not-allowed",
  ].join(" "),
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = "primary",
      size = "md",
      loading = false,
      leftIcon,
      rightIcon,
      children,
      disabled,
      ...props
    },
    ref
  ) => {
    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={cn(
          "inline-flex items-center justify-center select-none whitespace-nowrap font-medium",
          "press focus-ring",
          "transition-[transform,box-shadow,background-color,border-color,color,opacity,filter] duration-150 ease-out",
          sizeStyles[size],
          variantStyles[variant],
          className
        )}
        {...props}
      >
        {loading ? (
          <span className="inline-block size-3 rounded-full border-2 border-current border-r-transparent animate-spin" />
        ) : (
          leftIcon
        )}
        {children}
        {!loading && rightIcon}
      </button>
    );
  }
);
Button.displayName = "Button";
