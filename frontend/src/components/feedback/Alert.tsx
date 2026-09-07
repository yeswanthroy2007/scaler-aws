import type { ReactNode } from "react";
import { AlertCircle, CheckCircle2, Info, AlertTriangle } from "lucide-react";
import { cn } from "@/utils/cn";

type AlertVariant = "info" | "success" | "warning" | "error";

const CONFIG: Record<AlertVariant, { icon: typeof Info; classes: string }> = {
  info: { icon: Info, classes: "bg-[var(--color-info-bg)] border-[var(--color-info-border)] text-[var(--color-text)]" },
  success: {
    icon: CheckCircle2,
    classes: "bg-[var(--color-success-bg)] border-[var(--color-success-border)] text-[var(--color-text)]",
  },
  warning: {
    icon: AlertTriangle,
    classes: "bg-[var(--color-warning-bg)] border-[var(--color-warning-border)] text-[var(--color-text)]",
  },
  error: { icon: AlertCircle, classes: "bg-[var(--color-danger-bg)] border-[var(--color-danger-border)] text-[var(--color-text)]" },
};

export function Alert({
  variant = "info",
  title,
  children,
}: {
  variant?: AlertVariant;
  title?: string;
  children: ReactNode;
}) {
  const { icon: Icon, classes } = CONFIG[variant];
  return (
    <div role={variant === "error" ? "alert" : "status"} className={cn("flex gap-2 rounded border px-3 py-2.5 text-sm", classes)}>
      <Icon size={18} className="mt-0.5 shrink-0" aria-hidden="true" />
      <div>
        {title && <p className="font-semibold">{title}</p>}
        <div className="text-[var(--color-text-secondary)]">{children}</div>
      </div>
    </div>
  );
}
