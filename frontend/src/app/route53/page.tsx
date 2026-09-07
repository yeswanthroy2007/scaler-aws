"use client";

import Link from "next/link";
import { Globe, Lock, Unlock, FileText, Plus, Upload, BookOpen, Activity, ArrowRight } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { StatCard } from "@/components/route53/StatCard";
import { LinkButton } from "@/components/ui/LinkButton";
import { EmptyState } from "@/components/feedback/EmptyState";
import { ErrorState } from "@/components/feedback/ErrorState";
import { Skeleton } from "@/components/feedback/Skeleton";
import { useAsyncData } from "@/hooks/useAsyncData";
import { dashboardApi } from "@/services/api/dashboard";
import { formatRelativeTime } from "@/utils/formatters";

const ACTION_LABEL: Record<string, string> = {
  create: "created",
  update: "updated",
  delete: "deleted",
  import: "imported records into",
};

export default function Route53OverviewPage() {
  const { data, loading, error, refetch } = useAsyncData(() => dashboardApi.summary(), []);

  return (
    <div>
      <PageHeader
        breadcrumbs={[{ label: "Route 53" }]}
        title="Route 53 overview"
        description="Amazon Route 53 is a scalable Domain Name System (DNS) web service. Manage hosted zones, DNS records, and routing policies for your domains."
        actions={
          <>
            <LinkButton variant="secondary" href="/route53/hosted-zones">
              View hosted zones
            </LinkButton>
            <LinkButton variant="primary" href="/route53/hosted-zones?create=1">
              <Plus size={15} /> Create hosted zone
            </LinkButton>
          </>
        }
      />

      <div className="grid gap-6 p-6 xl:grid-cols-3">
        <div className="flex flex-col gap-6 xl:col-span-2">
          <section aria-label="Resource summary">
            {loading && (
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} className="h-[74px]" />
                ))}
              </div>
            )}
            {error && <ErrorState message={error} onRetry={refetch} />}
            {data && (
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                <StatCard icon={Globe} label="Hosted zones" value={data.total_zones} href="/route53/hosted-zones" />
                <StatCard
                  icon={Unlock}
                  label="Public hosted zones"
                  value={data.public_zones}
                  href="/route53/hosted-zones?zone_type=public"
                />
                <StatCard
                  icon={Lock}
                  label="Private hosted zones"
                  value={data.private_zones}
                  href="/route53/hosted-zones?zone_type=private"
                />
                <StatCard icon={FileText} label="DNS records" value={data.total_records} />
              </div>
            )}
          </section>

          <section
            aria-labelledby="getting-started-heading"
            className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-sm"
          >
            <h2 id="getting-started-heading" className="text-base font-semibold text-[var(--color-text)]">
              Getting started with Route 53
            </h2>
            <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
              Follow these steps to route traffic for your domain.
            </p>
            <ol className="mt-4 flex flex-col gap-3">
              {[
                {
                  title: "Create a hosted zone",
                  description: "Register a container for DNS records that route traffic for your domain.",
                  href: "/route53/hosted-zones?create=1",
                },
                {
                  title: "Add DNS records",
                  description: "Create A, CNAME, MX, and other records to point your domain at your infrastructure.",
                  href: "/route53/hosted-zones",
                },
                {
                  title: "Import an existing zone file",
                  description: "Already have a BIND zone file? Import it directly into a hosted zone.",
                  href: "/route53/hosted-zones",
                },
              ].map((step, index) => (
                <li key={step.title} className="flex items-start gap-3">
                  <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-[var(--color-info-bg)] text-xs font-bold text-[var(--color-primary)]">
                    {index + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <Link href={step.href} className="text-sm font-semibold text-[var(--color-primary)] hover:underline">
                      {step.title}
                    </Link>
                    <p className="text-sm text-[var(--color-text-secondary)]">{step.description}</p>
                  </div>
                </li>
              ))}
            </ol>
          </section>

          <section
            aria-labelledby="quick-links-heading"
            className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-sm"
          >
            <h2 id="quick-links-heading" className="text-base font-semibold text-[var(--color-text)]">
              Quick actions
            </h2>
            <div className="mt-3 grid gap-3 sm:grid-cols-3">
              <QuickAction icon={Plus} title="Create hosted zone" href="/route53/hosted-zones?create=1" />
              <QuickAction icon={Upload} title="Import BIND zone file" href="/route53/hosted-zones" />
              <QuickAction icon={BookOpen} title="Route 53 documentation" href="https://docs.aws.amazon.com/route53/" external />
            </div>
          </section>
        </div>

        <section
          aria-labelledby="recent-activity-heading"
          className="h-fit rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-sm"
        >
          <div className="flex items-center gap-2">
            <Activity size={16} className="text-[var(--color-text-secondary)]" />
            <h2 id="recent-activity-heading" className="text-base font-semibold text-[var(--color-text)]">
              Recent activity
            </h2>
          </div>

          {loading && (
            <div className="mt-4 flex flex-col gap-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-10" />
              ))}
            </div>
          )}

          {data && data.recent_activity.length === 0 && (
            <EmptyState title="No activity yet" description="Actions you take will show up here." />
          )}

          {data && data.recent_activity.length > 0 && (
            <ul className="mt-4 flex flex-col gap-3">
              {data.recent_activity.map((item) => (
                <li key={item.id} className="border-b border-[var(--color-border)] pb-3 text-sm last:border-0 last:pb-0">
                  <p className="text-[var(--color-text)]">
                    <span className="font-medium">{item.user_name ?? "Someone"}</span>{" "}
                    {ACTION_LABEL[item.action] ?? item.action}{" "}
                    <span className="font-medium">{item.resource_type.replace("_", " ")}</span>
                    {item.resource_label ? ` "${item.resource_label}"` : ""}
                  </p>
                  <p className="mt-0.5 text-xs text-[var(--color-text-muted)]">{formatRelativeTime(item.created_at)}</p>
                </li>
              ))}
            </ul>
          )}

          <Link
            href="/route53/hosted-zones"
            className="mt-4 flex items-center gap-1 text-sm font-semibold text-[var(--color-primary)] hover:underline"
          >
            View all hosted zones <ArrowRight size={14} />
          </Link>
        </section>
      </div>
    </div>
  );
}

function QuickAction({
  icon: Icon,
  title,
  href,
  external,
}: {
  icon: typeof Plus;
  title: string;
  href: string;
  external?: boolean;
}) {
  return (
    <Link
      href={href}
      target={external ? "_blank" : undefined}
      rel={external ? "noreferrer" : undefined}
      className="flex items-center gap-2.5 rounded border border-[var(--color-border)] px-3 py-2.5 text-sm font-medium text-[var(--color-text)] transition-colors hover:border-[var(--color-primary)] hover:bg-[var(--color-info-bg)]"
    >
      <Icon size={16} className="text-[var(--color-primary)]" />
      {title}
    </Link>
  );
}
