"use client";

import { useRef, useState } from "react";
import { MoreVertical, Pencil, Trash2 } from "lucide-react";
import { SortableTh } from "@/components/tables/SortableTh";
import { Badge } from "@/components/ui/Badge";
import { Checkbox } from "@/components/ui/Checkbox";
import { useOnClickOutside } from "@/hooks/useOnClickOutside";
import { truncateMiddle } from "@/utils/formatters";
import type { DnsRecord } from "@/types/dnsRecord";
import type { SortDirection } from "@/types/pagination";

const TYPE_BADGE_VARIANT: Record<string, "blue" | "green" | "yellow" | "grey" | "neutral"> = {
  A: "blue",
  AAAA: "blue",
  CNAME: "green",
  MX: "yellow",
  TXT: "neutral",
  NS: "grey",
  PTR: "grey",
  SRV: "yellow",
  CAA: "neutral",
};

function recordSummary(record: DnsRecord): string {
  if (record.type === "MX") return `${record.priority} ${record.value}`;
  if (record.type === "SRV") return `${record.priority} ${record.weight} ${record.port} ${record.value}`;
  if (record.type === "CAA") return `${record.flags} ${record.tag} "${record.value}"`;
  return record.value;
}

interface DnsRecordsTableProps {
  records: DnsRecord[];
  domainName: string;
  sortBy: string;
  sortDir: SortDirection;
  onSort: (key: string) => void;
  onEdit: (record: DnsRecord) => void;
  onDelete: (record: DnsRecord) => void;
  selectedIds: Set<number>;
  onToggleSelect: (id: number) => void;
  onToggleSelectAll: () => void;
}

export function DnsRecordsTable({
  records,
  domainName,
  sortBy,
  sortDir,
  onSort,
  onEdit,
  onDelete,
  selectedIds,
  onToggleSelect,
  onToggleSelectAll,
}: DnsRecordsTableProps) {
  const allSelected = records.length > 0 && records.every((r) => selectedIds.has(r.id));

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[900px] border-collapse text-sm">
        <thead className="border-b border-[var(--color-border)] bg-[var(--color-surface-secondary)]">
          <tr className="[&>th]:px-4 [&>th]:py-2.5">
            <th scope="col" className="w-10">
              <Checkbox aria-label="Select all records" checked={allSelected} onChange={onToggleSelectAll} />
            </th>
            <SortableTh label="Name" sortKey="name" currentSort={sortBy} currentDir={sortDir} onSort={onSort} />
            <SortableTh label="Type" sortKey="type" currentSort={sortBy} currentDir={sortDir} onSort={onSort} />
            <SortableTh label="TTL" sortKey="ttl" currentSort={sortBy} currentDir={sortDir} onSort={onSort} />
            <th scope="col" className="text-left font-semibold text-[var(--color-text-secondary)]">
              Value / Route traffic to
            </th>
            <th scope="col" className="text-left font-semibold text-[var(--color-text-secondary)]">
              Health
            </th>
            <th scope="col" className="w-10" aria-label="Actions" />
          </tr>
        </thead>
        <tbody className="divide-y divide-[var(--color-border)]">
          {records.map((record) => (
            <DnsRecordRow
              key={record.id}
              record={record}
              domainName={domainName}
              onEdit={onEdit}
              onDelete={onDelete}
              selected={selectedIds.has(record.id)}
              onToggleSelect={() => onToggleSelect(record.id)}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
}

function DnsRecordRow({
  record,
  domainName,
  onEdit,
  onDelete,
  selected,
  onToggleSelect,
}: {
  record: DnsRecord;
  domainName: string;
  onEdit: (record: DnsRecord) => void;
  onDelete: (record: DnsRecord) => void;
  selected: boolean;
  onToggleSelect: () => void;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  useOnClickOutside(menuRef, () => setMenuOpen(false));

  const displayName = record.name ? `${record.name}.${domainName}` : domainName;
  const summary = recordSummary(record);

  return (
    <tr className={`hover:bg-[var(--color-surface-secondary)] [&>td]:px-4 [&>td]:py-3 ${selected ? "bg-[var(--color-info-bg)]" : ""}`}>
      <td>
        <Checkbox aria-label={`Select ${displayName}`} checked={selected} onChange={onToggleSelect} />
      </td>
      <td className="max-w-[220px] truncate font-medium text-[var(--color-text)]" title={displayName}>
        {displayName}
      </td>
      <td>
        <Badge variant={TYPE_BADGE_VARIANT[record.type] ?? "neutral"}>{record.type}</Badge>
      </td>
      <td className="text-[var(--color-text-secondary)]">{record.ttl}s</td>
      <td className="max-w-[260px] truncate font-mono text-xs text-[var(--color-text-secondary)]" title={summary}>
        {truncateMiddle(summary, 50)}
      </td>
      <td>
        {record.health_check_status === "healthy" ? (
          <Badge variant="green">Healthy</Badge>
        ) : record.health_check_status === "unhealthy" ? (
          <Badge variant="red">Unhealthy</Badge>
        ) : (
          <span className="text-xs text-[var(--color-text-muted)]">-</span>
        )}
      </td>
      <td className="relative">
        <button
          type="button"
          onClick={() => setMenuOpen((v) => !v)}
          aria-label={`Actions for ${displayName}`}
          aria-haspopup="menu"
          aria-expanded={menuOpen}
          className="rounded p-1.5 text-[var(--color-text-secondary)] hover:bg-[var(--color-surface)] hover:text-[var(--color-text)]"
        >
          <MoreVertical size={16} />
        </button>
        {menuOpen && (
          <div
            ref={menuRef}
            role="menu"
            className="absolute right-4 top-full z-10 w-36 rounded border border-[var(--color-border)] bg-[var(--color-surface)] py-1 shadow-lg"
          >
            <button
              role="menuitem"
              onClick={() => {
                setMenuOpen(false);
                onEdit(record);
              }}
              className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-sm hover:bg-[var(--color-surface-secondary)]"
            >
              <Pencil size={14} /> Edit
            </button>
            <button
              role="menuitem"
              onClick={() => {
                setMenuOpen(false);
                onDelete(record);
              }}
              className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-sm text-[var(--color-danger)] hover:bg-[var(--color-danger-bg)]"
            >
              <Trash2 size={14} /> Delete
            </button>
          </div>
        )}
      </td>
    </tr>
  );
}
