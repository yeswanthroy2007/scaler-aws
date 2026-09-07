import { forwardRef, type InputHTMLAttributes } from "react";
import { cn } from "@/utils/cn";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  hasError?: boolean;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { className, hasError, ...props },
  ref
) {
  return (
    <input
      ref={ref}
      className={cn(
        "w-full rounded border bg-[var(--color-surface)] px-2.5 py-1.5 text-sm text-[var(--color-text)] placeholder:text-[var(--color-text-muted)] focus-visible:outline-2 focus-visible:outline-offset-0 focus-visible:outline-[var(--color-focus-ring)] disabled:bg-[var(--color-surface-secondary)] disabled:text-[var(--color-text-muted)]",
        hasError ? "border-[var(--color-danger)]" : "border-[var(--color-border-strong)]",
        className
      )}
      {...props}
    />
  );
});
