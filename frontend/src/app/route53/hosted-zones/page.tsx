"use client";

import { Suspense, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Plus, Globe } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { SearchBox } from "@/components/tables/SearchBox";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import { Pagination } from "@/components/tables/Pagination";
import { EmptyState } from "@/components/feedback/EmptyState";
import { ErrorState } from "@/components/feedback/ErrorState";
import { TableSkeleton } from "@/components/feedback/Skeleton";
import { useHostedZonesList } from "@/features/hosted-zones/useHostedZonesList";
import { HostedZonesTable } from "@/features/hosted-zones/HostedZonesTable";
import { HostedZoneFormModal } from "@/features/hosted-zones/HostedZoneFormModal";
import { EditHostedZoneModal } from "@/features/hosted-zones/EditHostedZoneModal";
import { DeleteHostedZoneDialog } from "@/features/hosted-zones/DeleteHostedZoneDialog";
import { useKeyboardShortcut } from "@/hooks/useKeyboardShortcut";
import type { HostedZone, HostedZoneType } from "@/types/hostedZone";

export default function HostedZonesPage() {
  return (
    <Suspense fallback={null}>
      <HostedZonesPageContent />
    </Suspense>
  );
}

function HostedZonesPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data, loading, error, refetch, filters, setSearch, setZoneType, setPage, setPageSize, handleSort } =
    useHostedZonesList();

  const [createOpen, setCreateOpen] = useState(searchParams.get("create") === "1");
  const [editingZone, setEditingZone] = useState<HostedZone | null>(null);
  const [deletingZone, setDeletingZone] = useState<HostedZone | null>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  useKeyboardShortcut("/", () => searchRef.current?.focus());
  useKeyboardShortcut("n", () => setCreateOpen(true));

  function closeCreate() {
    setCreateOpen(false);
    if (searchParams.get("create")) router.replace("/route53/hosted-zones");
  }

  const hasFilters = Boolean(filters.search || filters.zoneType);

  return (
    <div>
      <PageHeader
        breadcrumbs={[{ label: "Route 53", href: "/route53" }, { label: "Hosted zones" }]}
        title="Hosted zones"
        description="A hosted zone is a container for records, which define how you want to route traffic for a domain and its subdomains."
        actions={
          <Button variant="primary" onClick={() => setCreateOpen(true)}>
            <Plus size={15} /> Create hosted zone
          </Button>
        }
      />

      <div className="p-6">
        <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] shadow-sm">
          <div className="flex flex-wrap items-center gap-3 border-b border-[var(--color-border)] p-3">
            <SearchBox
              ref={searchRef}
              value={filters.search}
              onChange={setSearch}
              placeholder="Search by domain name, description, or zone ID..."
              ariaLabel="Search hosted zones"
            />
            <Select
              aria-label="Filter by type"
              value={filters.zoneType ?? ""}
              onChange={(e) => setZoneType((e.target.value || undefined) as HostedZoneType | undefined)}
              className="w-44!"
            >
              <option value="">All types</option>
              <option value="public">Public</option>
              <option value="private">Private</option>
            </Select>
            {data && <span className="ml-auto text-xs text-[var(--color-text-secondary)]">{data.meta.total} hosted zone(s)</span>}
          </div>

          {loading && <TableSkeleton rows={6} columns={7} />}

          {error && <ErrorState message={error} onRetry={refetch} />}

          {data && data.items.length === 0 && !hasFilters && (
            <EmptyState
              icon={<Globe size={32} />}
              title="No hosted zones yet"
              description="Create your first hosted zone to start managing DNS records for a domain."
              action={
                <Button variant="primary" onClick={() => setCreateOpen(true)}>
                  <Plus size={15} /> Create hosted zone
                </Button>
              }
            />
          )}

          {data && data.items.length === 0 && hasFilters && (
            <EmptyState
              icon={<Globe size={32} />}
              title="No matching hosted zones"
              description="Try adjusting your search or filter criteria."
              action={
                <Button
                  variant="secondary"
                  onClick={() => {
                    setSearch("");
                    setZoneType(undefined);
                  }}
                >
                  Clear filters
                </Button>
              }
            />
          )}

          {data && data.items.length > 0 && (
            <>
              <HostedZonesTable
                zones={data.items}
                sortBy={filters.sortBy}
                sortDir={filters.sortDir}
                onSort={handleSort}
                onEdit={setEditingZone}
                onDelete={setDeletingZone}
              />
              <Pagination meta={data.meta} onPageChange={setPage} onPageSizeChange={setPageSize} />
            </>
          )}
        </div>
      </div>

      <HostedZoneFormModal
        open={createOpen}
        onClose={closeCreate}
        onCreated={() => {
          closeCreate();
          refetch();
        }}
      />

      {editingZone && (
        <EditHostedZoneModal
          zone={editingZone}
          open={Boolean(editingZone)}
          onClose={() => setEditingZone(null)}
          onUpdated={() => {
            setEditingZone(null);
            refetch();
          }}
        />
      )}

      <DeleteHostedZoneDialog
        zone={deletingZone}
        open={Boolean(deletingZone)}
        onClose={() => setDeletingZone(null)}
        onDeleted={() => {
          setDeletingZone(null);
          refetch();
        }}
      />
    </div>
  );
}
