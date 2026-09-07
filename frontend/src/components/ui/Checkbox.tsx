import { forwardRef, type InputHTMLAttributes } from "react";
import { cn } from "@/utils/cn";

type CheckboxProps = InputHTMLAttributes<HTMLInputElement>;

export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(function Checkbox({ className, ...props }, ref) {
  return (
    <input
      ref={ref}
      type="checkbox"
      className={cn(
        "h-4 w-4 shrink-0 rounded border-[var(--color-border-strong)] text-[var(--color-primary)] focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[var(--color-focus-ring)]",
        className
      )}
      {...props}
    />
  );
});
