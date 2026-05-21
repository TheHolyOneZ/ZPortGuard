import { forwardRef, SelectHTMLAttributes } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  sizeVariant?: "sm" | "md";
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, children, sizeVariant = "md", ...props }, ref) => {
    const sizes = { sm: "h-7 text-xs pr-7", md: "h-9 text-sm pr-8" };
    return (
      <div className="relative inline-block">
        <select
          ref={ref}
          className={cn(
            "appearance-none bg-input text-foreground rounded-lg",
            "border border-border-strong",
            "pl-3 outline-none cursor-pointer",
            "transition-[border-color,box-shadow,background-color] duration-200 ease-out",
            "hover:border-border-bright",
            "focus:border-primary/60",
            "focus:shadow-[0_0_0_3px_rgba(124,58,237,0.15),0_0_22px_-4px_rgba(124,58,237,0.5)]",
            sizes[sizeVariant],
            className
          )}
          {...props}
        >
          {children}
        </select>
        <ChevronDown className="size-3.5 text-muted-foreground pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2" />
      </div>
    );
  }
);
Select.displayName = "Select";
