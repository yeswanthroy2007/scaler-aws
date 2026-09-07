import type { LucideIcon } from "lucide-react";
import Link from "next/link";

interface StatCardProps {
  icon: LucideIcon;
  label: string;
  value: number | string;
  href?: string;
}

export function StatCard({ icon: Icon, label, value, href }: StatCardProps) {
  const content = (
    <div className="flex items-center gap-3 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-4 shadow-sm transition-colors hover:border-[var(--color-border-strong)]">
      <div className="grid h-10 w-10 shrink-0 place-items-center rounded bg-[var(--color-info-bg)] text-[var(--color-primary)]">
        <Icon size={19} />
      </div>
      <div className="min-w-0">
        <p className="text-2xl font-semibold text-[var(--color-text)]">{value}</p>
        <p className="truncate text-xs text-[var(--color-text-secondary)]">{label}</p>
      </div>
    </div>
  );

  return href ? (
    <Link href={href} className="block">
      {content}
    </Link>
  ) : (
    content
  );
}
