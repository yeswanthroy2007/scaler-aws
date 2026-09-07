import { forwardRef, type SelectHTMLAttributes } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/utils/cn";

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  hasError?: boolean;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select(
  { className, hasError, children, ...props },
  ref
) {
  return (
    <div className="relative">
      <select
        ref={ref}
        className={cn(
          "w-full appearance-none rounded border bg-[var(--color-surface)] px-2.5 py-1.5 pr-8 text-sm text-[var(--color-text)] focus-visible:outline-2 focus-visible:outline-offset-0 focus-visible:outline-[var(--color-focus-ring)] disabled:bg-[var(--color-surface-secondary)] disabled:text-[var(--color-text-muted)]",
          hasError ? "border-[var(--color-danger)]" : "border-[var(--color-border-strong)]",
          className
        )}
        {...props}
      >
        {children}
      </select>
      <ChevronDown
        size={16}
        className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]"
        aria-hidden="true"
      />
    </div>
  );
});
