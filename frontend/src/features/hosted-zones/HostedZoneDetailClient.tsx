"use client";

import { Suspense, useRef, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { Plus, Upload, Trash2, Pencil, Server, FileText, Loader2 } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Select";
import { Badge } from "@/components/ui/Badge";
import { SearchBox } from "@/components/tables/SearchBox";
import { Pagination } from "@/components/tables/Pagination";
import { EmptyState } from "@/components/feedback/EmptyState";
import { ErrorState } from "@/components/feedback/ErrorState";
import { TableSkeleton, Skeleton } from "@/components/feedback/Skeleton";
import { useAsyncData } from "@/hooks/useAsyncData";
import { useKeyboardShortcut } from "@/hooks/useKeyboardShortcut";
import { hostedZonesApi } from "@/services/api/hostedZones";
import { useDnsRecordsList } from "@/features/dns-records/useDnsRecordsList";
import { DnsRecordsTable } from "@/features/dns-records/DnsRecordsTable";
import { DnsRecordFormModal } from "@/features/dns-records/DnsRecordFormModal";
import { DeleteDnsRecordDialog } from "@/features/dns-records/DeleteDnsRecordDialog";
import { BulkDeleteRecordsDialog } from "@/features/dns-records/BulkDeleteRecordsDialog";
import { ImportBindModal } from "@/features/dns-records/ImportBindModal";
import { ExportMenu } from "@/features/dns-records/ExportMenu";
import { EditHostedZoneModal } from "./EditHostedZoneModal";
import { DeleteHostedZoneDialog } from "./DeleteHostedZoneDialog";
import type { DnsRecord, DnsRecordType } from "@/types/dnsRecord";
import { DNS_RECORD_TYPES } from "@/types/dnsRecord";
import { formatDate } from "@/utils/formatters";

export function HostedZoneDetailClient({ zoneId }: { zoneId: number }) {
  return (
    <Suspense fallback={<div className="flex h-64 items-center justify-center"><Loader2 className="animate-spin text-[var(--color-primary)]" /></div>}>
      <HostedZoneDetailContent zoneId={zoneId} />
    </Suspense>
  );
}

function HostedZoneDetailContent({ zoneId }: { zoneId: number }) {
  const router = useRouter();
  const zoneQuery = useAsyncData(() => hostedZonesApi.get(zoneId), [zoneId]);
  const recordsQuery = useDnsRecordsList(zoneId);

  const [createRecordOpen, setCreateRecordOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<DnsRecord | null>(null);
  const [deletingRecord, setDeletingRecord] = useState<DnsRecord | null>(null);
  const [editingZoneOpen, setEditingZoneOpen] = useState(false);
  const [deletingZoneOpen, setDeletingZoneOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);

  useKeyboardShortcut("/", () => searchRef.current?.focus());
  useKeyboardShortcut("n", () => setCreateRecordOpen(true));

  function toggleSelect(id: number) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleSelectAll() {
    const items = recordsQuery.data?.items ?? [];
    setSelectedIds((prev) => {
      const allSelected = items.length > 0 && items.every((r) => prev.has(r.id));
      if (allSelected) return new Set();
      return new Set(items.map((r) => r.id));
    });
  }

  function refreshAll() {
    zoneQuery.refetch();
    recordsQuery.refetch();
    setSelectedIds(new Set());
  }

  // Only show the full-page skeleton on the *first* load. On background
  // refetches (e.g. after creating/importing a record, which also refreshes
  // the zone's record count) we keep the existing content -- and any open
  // modal -- mounted rather than swapping the whole tree out from under it.
  if (zoneQuery.loading && !zoneQuery.data) {
    return (
      <div className="p-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="mt-4 h-40" />
      </div>
    );
  }

  if (zoneQuery.error && !zoneQuery.data) {
    return <ErrorState message={zoneQuery.error} onRetry={zoneQuery.refetch} />;
  }

  if (!zoneQuery.data) {
    return <ErrorState message="Hosted zone not found." onRetry={zoneQuery.refetch} />;
  }

  const zone = zoneQuery.data;
  const hasFilters = Boolean(recordsQuery.filters.search || recordsQuery.filters.recordType);

  return (
    <div>
      <PageHeader
        breadcrumbs={[
          { label: "Route 53", href: "/route53" },
          { label: "Hosted zones", href: "/route53/hosted-zones" },
          { label: zone.domain_name },
        ]}
        title={zone.domain_name}
        description={zone.description ?? undefined}
        actions={
          <>
            <Button variant="secondary" onClick={() => setEditingZoneOpen(true)}>
              <Pencil size={14} /> Edit
            </Button>
            <Button variant="danger" onClick={() => setDeletingZoneOpen(true)}>
              <Trash2 size={14} /> Delete
            </Button>
          </>
        }
      />

      <div className="flex flex-col gap-6 p-6">
        <section className="grid gap-4 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-sm sm:grid-cols-2 lg:grid-cols-4">
          <InfoItem label="Hosted zone ID" value={zone.zone_id} mono />
          <InfoItem
            label="Type"
            value={
              <Badge variant={zone.zone_type === "public" ? "blue" : "grey"}>
                {zone.zone_type === "public" ? "Public" : "Private"}
              </Badge>
            }
          />
          <InfoItem label="Record count" value={String(zone.record_count)} />
          <InfoItem label="Created" value={formatDate(zone.created_at)} />
          {zone.zone_type === "private" && (
            <>
              <InfoItem label="VPC ID" value={zone.vpc_id ?? "-"} mono />
              <InfoItem label="VPC region" value={zone.vpc_region ?? "-"} />
            </>
          )}
        </section>

        <section className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-sm">
          <h2 className="flex items-center gap-2 text-sm font-semibold text-[var(--color-text)]">
            <Server size={15} /> Name servers
          </h2>
          <ul className="mt-2 grid gap-1 sm:grid-cols-2">
            {zone.name_servers.map((ns) => (
              <li key={ns} className="font-mono text-xs text-[var(--color-text-secondary)]">
                {ns}
              </li>
            ))}
          </ul>
        </section>

        <section className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--color-border)] p-4">
            <div>
              <h2 className="text-base font-semibold text-[var(--color-text)]">DNS records</h2>
              <p className="text-xs text-[var(--color-text-secondary)]">Records define how traffic is routed for this domain.</p>
            </div>
            <div className="flex items-center gap-2">
              {selectedIds.size > 0 && (
                <span className="mr-1 text-xs font-medium text-[var(--color-text-secondary)]">{selectedIds.size} selected</span>
              )}
              {selectedIds.size > 0 && (
                <Button variant="danger" size="sm" onClick={() => setBulkDeleteOpen(true)}>
                  <Trash2 size={13} /> Delete selected
                </Button>
              )}
              <Button variant="secondary" onClick={() => setImportOpen(true)}>
                <Upload size={14} /> Import
              </Button>
              <ExportMenu zoneId={zoneId} />
              <Button variant="primary" onClick={() => setCreateRecordOpen(true)}>
                <Plus size={14} /> Create record
              </Button>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 border-b border-[var(--color-border)] p-3">
            <SearchBox
              ref={searchRef}
              value={recordsQuery.filters.search}
              onChange={recordsQuery.setSearch}
              placeholder="Search by record name or value..."
              ariaLabel="Search DNS records"
            />
            <Select
              aria-label="Filter by record type"
              value={recordsQuery.filters.recordType ?? ""}
              onChange={(e) => recordsQuery.setRecordType((e.target.value || undefined) as DnsRecordType | undefined)}
              className="w-36!"
            >
              <option value="">All types</option>
              {DNS_RECORD_TYPES.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </Select>
            {recordsQuery.data && (
              <span className="ml-auto text-xs text-[var(--color-text-secondary)]">{recordsQuery.data.meta.total} record(s)</span>
            )}
          </div>

          {recordsQuery.loading && <TableSkeleton rows={6} columns={6} />}
          {recordsQuery.error && <ErrorState message={recordsQuery.error} onRetry={recordsQuery.refetch} />}

          {recordsQuery.data && recordsQuery.data.items.length === 0 && !hasFilters && (
            <EmptyState
              icon={<FileText size={30} />}
              title="No DNS records yet"
              description="Create your first record, or import an existing BIND zone file."
              action={
                <div className="flex gap-2">
                  <Button variant="primary" onClick={() => setCreateRecordOpen(true)}>
                    <Plus size={14} /> Create record
                  </Button>
                  <Button variant="secondary" onClick={() => setImportOpen(true)}>
                    <Upload size={14} /> Import
                  </Button>
                </div>
              }
            />
          )}

          {recordsQuery.data && recordsQuery.data.items.length === 0 && hasFilters && (
            <EmptyState
              title="No matching records"
              description="Try adjusting your search or filter criteria."
              action={
                <Button
                  variant="secondary"
                  onClick={() => {
                    recordsQuery.setSearch("");
                    recordsQuery.setRecordType(undefined);
                  }}
                >
                  Clear filters
                </Button>
              }
            />
          )}

          {recordsQuery.data && recordsQuery.data.items.length > 0 && (
            <>
              <DnsRecordsTable
                records={recordsQuery.data.items}
                domainName={zone.domain_name}
                sortBy={recordsQuery.filters.sortBy}
                sortDir={recordsQuery.filters.sortDir}
                onSort={recordsQuery.handleSort}
                onEdit={setEditingRecord}
                onDelete={setDeletingRecord}
                selectedIds={selectedIds}
                onToggleSelect={toggleSelect}
                onToggleSelectAll={toggleSelectAll}
              />
              <Pagination meta={recordsQuery.data.meta} onPageChange={recordsQuery.setPage} onPageSizeChange={recordsQuery.setPageSize} />
            </>
          )}
        </section>
      </div>

      <DnsRecordFormModal
        open={createRecordOpen}
        onClose={() => setCreateRecordOpen(false)}
        zoneId={zoneId}
        domainName={zone.domain_name}
        onSaved={() => {
          setCreateRecordOpen(false);
          refreshAll();
        }}
      />

      {editingRecord && (
        <DnsRecordFormModal
          open={Boolean(editingRecord)}
          onClose={() => setEditingRecord(null)}
          zoneId={zoneId}
          domainName={zone.domain_name}
          record={editingRecord}
          onSaved={() => {
            setEditingRecord(null);
            refreshAll();
          }}
        />
      )}

      <DeleteDnsRecordDialog
        zoneId={zoneId}
        record={deletingRecord}
        open={Boolean(deletingRecord)}
        onClose={() => setDeletingRecord(null)}
        onDeleted={() => {
          setDeletingRecord(null);
          refreshAll();
        }}
      />

      <BulkDeleteRecordsDialog
        zoneId={zoneId}
        recordIds={Array.from(selectedIds)}
        open={bulkDeleteOpen}
        onClose={() => setBulkDeleteOpen(false)}
        onDeleted={() => {
          setBulkDeleteOpen(false);
          refreshAll();
        }}
      />

      <ImportBindModal open={importOpen} onClose={() => setImportOpen(false)} zoneId={zoneId} onImported={refreshAll} />

      <EditHostedZoneModal
        zone={zone}
        open={editingZoneOpen}
        onClose={() => setEditingZoneOpen(false)}
        onUpdated={() => {
          setEditingZoneOpen(false);
          zoneQuery.refetch();
        }}
      />

      <DeleteHostedZoneDialog
        zone={deletingZoneOpen ? zone : null}
        open={deletingZoneOpen}
        onClose={() => setDeletingZoneOpen(false)}
        onDeleted={() => router.push("/route53/hosted-zones")}
      />
    </div>
  );
}

function InfoItem({ label, value, mono }: { label: string; value: ReactNode; mono?: boolean }) {
  return (
    <div>
      <p className="text-xs font-medium text-[var(--color-text-muted)]">{label}</p>
      <p className={`mt-0.5 text-sm text-[var(--color-text)] ${mono ? "font-mono" : ""}`}>{value}</p>
    </div>
  );
}
