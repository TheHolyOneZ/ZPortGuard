import { forwardRef, InputHTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  leftIcon?: ReactNode;
  rightSlot?: ReactNode;
  invalid?: boolean;
  sizeVariant?: "sm" | "md";
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    { className, leftIcon, rightSlot, invalid = false, sizeVariant = "md", ...props },
    ref
  ) => {
    const sizes = {
      sm: "h-7 text-xs",
      md: "h-9 text-sm",
    };

    return (
      <div
        className={cn(
          "group relative flex items-center gap-2 rounded-lg bg-input",
          "border border-border-strong",
          "transition-[border-color,box-shadow,background-color] duration-200 ease-out",
          "hover:border-border-bright",
          "focus-within:border-primary/60",
          "focus-within:shadow-[0_0_0_3px_rgba(124,58,237,0.15),0_0_22px_-4px_rgba(124,58,237,0.5)]",
          invalid &&
            "border-destructive/60 focus-within:border-destructive focus-within:shadow-[0_0_0_3px_rgba(239,68,68,0.18),0_0_22px_-4px_rgba(239,68,68,0.55)]",
          sizes[sizeVariant],
          className
        )}
      >
        {leftIcon && (
          <span className="pl-2.5 text-muted-foreground group-focus-within:text-foreground transition-colors">
            {leftIcon}
          </span>
        )}
        <input
          ref={ref}
          className={cn(
            "flex-1 min-w-0 bg-transparent px-3 outline-none",
            "text-foreground placeholder:text-muted-foreground/70",
            "selection:bg-primary/30 selection:text-foreground",
            leftIcon && "pl-0",
            rightSlot && "pr-0"
          )}
          {...props}
        />
        {rightSlot && <span className="pr-2">{rightSlot}</span>}
      </div>
    );
  }
);
Input.displayName = "Input";
