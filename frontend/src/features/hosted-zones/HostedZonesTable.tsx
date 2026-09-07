"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { MoreVertical, Pencil, Trash2, Globe, Lock } from "lucide-react";
import { SortableTh } from "@/components/tables/SortableTh";
import { Badge } from "@/components/ui/Badge";
import { useOnClickOutside } from "@/hooks/useOnClickOutside";
import { formatDate } from "@/utils/formatters";
import type { HostedZone } from "@/types/hostedZone";
import type { SortDirection } from "@/types/pagination";

interface HostedZonesTableProps {
  zones: HostedZone[];
  sortBy: string;
  sortDir: SortDirection;
  onSort: (key: string) => void;
  onEdit: (zone: HostedZone) => void;
  onDelete: (zone: HostedZone) => void;
}

export function HostedZonesTable({ zones, sortBy, sortDir, onSort, onEdit, onDelete }: HostedZonesTableProps) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[900px] border-collapse text-sm">
        <thead className="border-b border-[var(--color-border)] bg-[var(--color-surface-secondary)]">
          <tr className="[&>th]:px-4 [&>th]:py-2.5">
            <SortableTh label="Domain name" sortKey="domain_name" currentSort={sortBy} currentDir={sortDir} onSort={onSort} />
            <SortableTh label="Type" sortKey="zone_type" currentSort={sortBy} currentDir={sortDir} onSort={onSort} />
            <th scope="col" className="text-left font-semibold text-[var(--color-text-secondary)]">
              Description
            </th>
            <th scope="col" className="text-left font-semibold text-[var(--color-text-secondary)]">
              Hosted zone ID
            </th>
            <th scope="col" className="text-left font-semibold text-[var(--color-text-secondary)]">
              Records
            </th>
            <SortableTh label="Created" sortKey="created_at" currentSort={sortBy} currentDir={sortDir} onSort={onSort} />
            <th scope="col" className="w-10" aria-label="Actions" />
          </tr>
        </thead>
        <tbody className="divide-y divide-[var(--color-border)]">
          {zones.map((zone) => (
            <HostedZoneRow key={zone.id} zone={zone} onEdit={onEdit} onDelete={onDelete} />
          ))}
        </tbody>
      </table>
    </div>
  );
}

function HostedZoneRow({
  zone,
  onEdit,
  onDelete,
}: {
  zone: HostedZone;
  onEdit: (zone: HostedZone) => void;
  onDelete: (zone: HostedZone) => void;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  useOnClickOutside(menuRef, () => setMenuOpen(false));

  return (
    <tr className="hover:bg-[var(--color-surface-secondary)] [&>td]:px-4 [&>td]:py-3">
      <td>
        <Link
          href={`/route53/hosted-zones/${zone.id}`}
          className="font-medium text-[var(--color-primary)] hover:underline"
        >
          {zone.domain_name}
        </Link>
      </td>
      <td>
        <Badge variant={zone.zone_type === "public" ? "blue" : "grey"}>
          {zone.zone_type === "public" ? <Globe size={11} /> : <Lock size={11} />}
          {zone.zone_type === "public" ? "Public" : "Private"}
        </Badge>
      </td>
      <td className="max-w-[220px] truncate text-[var(--color-text-secondary)]" title={zone.description ?? undefined}>
        {zone.description || <span className="text-[var(--color-text-muted)]">-</span>}
      </td>
      <td className="whitespace-nowrap font-mono text-xs text-[var(--color-text-secondary)]">{zone.zone_id}</td>
      <td className="text-[var(--color-text-secondary)]">{zone.record_count}</td>
      <td className="whitespace-nowrap text-[var(--color-text-secondary)]">{formatDate(zone.created_at)}</td>
      <td className="relative">
        <button
          type="button"
          onClick={() => setMenuOpen((v) => !v)}
          aria-label={`Actions for ${zone.domain_name}`}
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
            className="absolute right-4 top-full z-10 w-40 rounded border border-[var(--color-border)] bg-[var(--color-surface)] py-1 shadow-lg"
          >
            <button
              role="menuitem"
              onClick={() => {
                setMenuOpen(false);
                onEdit(zone);
              }}
              className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-sm hover:bg-[var(--color-surface-secondary)]"
            >
              <Pencil size={14} /> Edit
            </button>
            <button
              role="menuitem"
              onClick={() => {
                setMenuOpen(false);
                onDelete(zone);
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
