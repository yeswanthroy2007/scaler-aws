import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { ArrowLeft, Sparkles } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import type { Crumb } from "@/components/layout/Breadcrumbs";

interface ComingSoonPageProps {
  icon: LucideIcon;
  title: string;
  description: string;
  bullets: string[];
}

export function ComingSoonPage({ icon: Icon, title, description, bullets }: ComingSoonPageProps) {
  const breadcrumbs: Crumb[] = [
    { label: "Route 53", href: "/route53" },
    { label: title },
  ];

  return (
    <div>
      <PageHeader breadcrumbs={breadcrumbs} title={title} description={description} />
      <div className="p-6">
        <div className="mx-auto flex max-w-2xl flex-col items-center rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-8 py-14 text-center shadow-sm">
          <div className="mb-4 grid h-14 w-14 place-items-center rounded-full bg-[var(--color-info-bg)] text-[var(--color-primary)]">
            <Icon size={28} />
          </div>
          <div className="mb-2 inline-flex items-center gap-1.5 rounded-full bg-[var(--color-warning-bg)] px-3 py-1 text-xs font-semibold text-[var(--color-warning)]">
            <Sparkles size={13} /> Coming soon
          </div>
          <h2 className="text-lg font-semibold text-[var(--color-text)]">{title} is on the way</h2>
          <p className="mt-2 max-w-md text-sm text-[var(--color-text-secondary)]">{description}</p>

          <ul className="mt-6 flex w-full max-w-sm flex-col gap-2 text-left text-sm text-[var(--color-text-secondary)]">
            {bullets.map((bullet) => (
              <li key={bullet} className="flex items-start gap-2">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--color-primary)]" />
                {bullet}
              </li>
            ))}
          </ul>

          <Link
            href="/route53"
            className="mt-8 inline-flex items-center gap-1.5 text-sm font-semibold text-[var(--color-primary)] hover:underline"
          >
            <ArrowLeft size={15} /> Back to Route 53 overview
          </Link>
        </div>
      </div>
    </div>
  );
}
