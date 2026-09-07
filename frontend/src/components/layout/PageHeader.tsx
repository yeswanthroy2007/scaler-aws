import type { ReactNode } from "react";
import { Breadcrumbs, type Crumb } from "./Breadcrumbs";

interface PageHeaderProps {
  breadcrumbs: Crumb[];
  title: string;
  description?: string;
  actions?: ReactNode;
}

export function PageHeader({ breadcrumbs, title, description, actions }: PageHeaderProps) {
  return (
    <div className="border-b border-[var(--color-border)] bg-[var(--color-surface)] px-6 py-4">
      <Breadcrumbs items={breadcrumbs} />
      <div className="mt-1.5 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-normal text-[var(--color-text)]">{title}</h1>
          {description && <p className="mt-1 max-w-2xl text-sm text-[var(--color-text-secondary)]">{description}</p>}
        </div>
        {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
      </div>
    </div>
  );
}
