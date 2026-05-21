import { ButtonHTMLAttributes, forwardRef } from "react";
import { cn } from "@/lib/utils";

interface ToggleProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, "onChange"> {
  checked: boolean;
  onChange: (value: boolean) => void;
  size?: "sm" | "md";
}

export const Toggle = forwardRef<HTMLButtonElement, ToggleProps>(
  ({ checked, onChange, disabled, size = "md", className, ...props }, ref) => {
    const dims =
      size === "sm"
        ? { track: "h-4 w-7", thumb: "size-3", translate: checked ? "translate-x-3" : "translate-x-0.5" }
        : { track: "h-[22px] w-10", thumb: "size-4", translate: checked ? "translate-x-[20px]" : "translate-x-[3px]" };

    return (
      <button
        ref={ref}
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => !disabled && onChange(!checked)}
        className={cn(
          "relative inline-flex items-center rounded-full",
          "transition-[background-color,box-shadow] duration-200 ease-out",
          "focus-ring",
          "disabled:opacity-40 disabled:cursor-not-allowed",
          dims.track,
          checked
            ? "bg-gradient-brand shadow-[0_0_0_1px_rgba(255,255,255,0.06)_inset,0_0_16px_-4px_rgba(124,58,237,0.6)]"
            : "bg-secondary border border-border-strong",
          className
        )}
        {...props}
      >
        <span
          aria-hidden
          className={cn(
            "inline-block rounded-full bg-white shadow-[0_2px_4px_rgba(0,0,0,0.4),0_0_0_1px_rgba(0,0,0,0.05)]",
            "transition-transform duration-200 ease-[cubic-bezier(0.22,1,0.36,1)]",
            dims.thumb,
            dims.translate,
            checked && "scale-[1.02]"
          )}
        />
      </button>
    );
  }
);
Toggle.displayName = "Toggle";
