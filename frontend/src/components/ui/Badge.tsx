import type { ReactNode } from "react";
import { cn } from "@/utils/cn";

type BadgeVariant = "neutral" | "blue" | "green" | "red" | "yellow" | "grey";

const VARIANT_CLASSES: Record<BadgeVariant, string> = {
  neutral: "bg-[var(--color-surface-secondary)] text-[var(--color-text-secondary)] border-[var(--color-border)]",
  blue: "bg-[var(--color-info-bg)] text-[var(--color-primary)] border-[var(--color-info-border)]",
  green: "bg-[var(--color-success-bg)] text-[var(--color-success)] border-[var(--color-success-border)]",
  red: "bg-[var(--color-danger-bg)] text-[var(--color-danger)] border-[var(--color-danger-border)]",
  yellow: "bg-[var(--color-warning-bg)] text-[var(--color-warning)] border-[var(--color-warning-border)]",
  grey: "bg-[var(--color-surface-secondary)] text-[var(--color-text-muted)] border-[var(--color-border)]",
};

export function Badge({ variant = "neutral", children }: { variant?: BadgeVariant; children: ReactNode }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium",
        VARIANT_CLASSES[variant]
      )}
    >
      {children}
    </span>
  );
}
