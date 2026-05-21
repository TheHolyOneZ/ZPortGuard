import { useToastStore, ToastTone } from "@/store/toastStore";
import { cn } from "@/lib/utils";
import { CheckCircle2, AlertCircle, Info, X } from "lucide-react";

const toneClasses: Record<
  ToastTone,
  { wrap: string; icon: string; Icon: React.ComponentType<{ className?: string }> }
> = {
  success: {
    wrap: "border-success/30 shadow-[0_0_28px_-8px_rgba(16,185,129,0.55)]",
    icon: "text-success",
    Icon: CheckCircle2,
  },
  error: {
    wrap: "border-destructive/40 shadow-[0_0_28px_-8px_rgba(239,68,68,0.6)]",
    icon: "text-destructive",
    Icon: AlertCircle,
  },
  info: {
    wrap: "border-accent/30 shadow-[0_0_28px_-8px_rgba(59,130,246,0.55)]",
    icon: "text-accent-glow",
    Icon: Info,
  },
};

export function Toaster() {
  const { toasts, dismiss } = useToastStore();

  if (toasts.length === 0) return null;

  return (
    <div className="pointer-events-none fixed bottom-4 right-4 z-[100] flex flex-col gap-2 max-w-[340px]">
      {toasts.map((t) => {
        const cfg = toneClasses[t.tone];
        return (
          <div
            key={t.id}
            className={cn(
              "pointer-events-auto anim-slide-up-fade",
              "relative flex items-start gap-2.5 rounded-xl border px-3 py-2.5",
              "bg-card-elevated/95 backdrop-blur-md",
              cfg.wrap
            )}
          >
            <cfg.Icon className={cn("size-4 shrink-0 mt-0.5", cfg.icon)} />
            <div className="flex-1 min-w-0">
              <div className="text-[12.5px] font-semibold text-foreground tracking-tight">
                {t.title}
              </div>
              {t.description && (
                <div className="text-[11.5px] text-muted-foreground mt-0.5 leading-relaxed">
                  {t.description}
                </div>
              )}
            </div>
            <button
              onClick={() => dismiss(t.id)}
              className="press focus-ring shrink-0 size-5 rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary inline-flex items-center justify-center"
              aria-label="Dismiss"
            >
              <X className="size-3" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
