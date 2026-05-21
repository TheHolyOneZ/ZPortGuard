import { useEffect, useRef, useState, ReactNode } from "react";
import { Button } from "./Button";

type Variant = "primary" | "secondary" | "ghost" | "destructive" | "outline";
type Size = "xs" | "sm" | "md" | "lg" | "icon" | "icon-sm";

interface ConfirmButtonProps {
  onConfirm: () => void | Promise<void>;
  idle: ReactNode;
  confirm?: ReactNode;
  idleAriaLabel?: string;
  confirmAriaLabel?: string;
  variant?: Variant;
  confirmVariant?: Variant;
  size?: Size;
  className?: string;
  confirmClassName?: string;
  timeoutMs?: number;
  disabled?: boolean;
  leftIcon?: ReactNode;
  confirmLeftIcon?: ReactNode;
}


export function ConfirmButton({
  onConfirm,
  idle,
  confirm = "Sure?",
  idleAriaLabel,
  confirmAriaLabel,
  variant = "ghost",
  confirmVariant = "destructive",
  size = "icon-sm",
  className,
  confirmClassName,
  timeoutMs = 3000,
  disabled,
  leftIcon,
  confirmLeftIcon,
}: ConfirmButtonProps) {
  const [armed, setArmed] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const cancel = () => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = null;
    setArmed(false);
  };

  useEffect(() => {
    if (!armed) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") cancel();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [armed]);

  useEffect(() => {
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, []);

  const handleClick = async () => {
    if (disabled) return;
    if (!armed) {
      setArmed(true);
      timer.current = setTimeout(() => setArmed(false), timeoutMs);
      return;
    }
    cancel();
    await onConfirm();
  };

  return (
    <Button
      variant={armed ? confirmVariant : variant}
      size={size}
      onClick={handleClick}
      onBlur={cancel}
      disabled={disabled}
      aria-label={armed ? confirmAriaLabel ?? "Confirm" : idleAriaLabel}
      className={armed ? confirmClassName ?? className : className}
      leftIcon={armed ? confirmLeftIcon ?? leftIcon : leftIcon}
    >
      {armed ? confirm : idle}
    </Button>
  );
}
