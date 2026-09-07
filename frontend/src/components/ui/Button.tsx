import { forwardRef, type ButtonHTMLAttributes } from "react";
import { Loader2 } from "lucide-react";
import { cn } from "@/utils/cn";

export type ButtonVariant = "primary" | "secondary" | "danger" | "link" | "icon";
export type ButtonSize = "sm" | "md";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
}

export const BUTTON_BASE_CLASSES =
  "inline-flex items-center justify-center gap-1.5 rounded font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[var(--color-focus-ring)] disabled:cursor-not-allowed";

export const VARIANT_CLASSES: Record<ButtonVariant, string> = {
  primary:
    "bg-[var(--color-primary)] text-white border border-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] hover:border-[var(--color-primary-hover)] disabled:bg-[var(--color-border)] disabled:border-[var(--color-border)] disabled:text-[var(--color-text-muted)]",
  secondary:
    "bg-[var(--color-surface)] text-[var(--color-primary)] border border-[var(--color-border-strong)] hover:bg-[var(--color-sidebar-active-bg)] disabled:text-[var(--color-text-muted)] disabled:border-[var(--color-border)]",
  danger:
    "bg-[var(--color-surface)] text-[var(--color-danger)] border border-[var(--color-danger)] hover:bg-[var(--color-danger-bg)] disabled:opacity-50",
  link: "bg-transparent text-[var(--color-primary)] border border-transparent hover:underline px-0",
  icon: "bg-transparent text-[var(--color-text-secondary)] border border-transparent hover:bg-[var(--color-surface-secondary)] p-1.5",
};

export const SIZE_CLASSES: Record<ButtonSize, string> = {
  sm: "text-xs px-2.5 py-1",
  md: "text-sm px-3.5 py-1.5",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { className, variant = "secondary", size = "md", loading, disabled, children, ...props },
  ref
) {
  return (
    <button
      ref={ref}
      disabled={disabled || loading}
      className={cn(
        BUTTON_BASE_CLASSES,
        variant !== "icon" && variant !== "link" && SIZE_CLASSES[size],
        VARIANT_CLASSES[variant],
        className
      )}
      {...props}
    >
      {loading && <Loader2 size={14} className="animate-spin" aria-hidden="true" />}
      {children}
    </button>
  );
});
