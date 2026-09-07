import { ArrowDown, ArrowUp, ArrowUpDown } from "lucide-react";
import type { SortDirection } from "@/types/pagination";

interface SortableThProps {
  label: string;
  sortKey: string;
  currentSort: string;
  currentDir: SortDirection;
  onSort: (key: string) => void;
  className?: string;
}

export function SortableTh({ label, sortKey, currentSort, currentDir, onSort, className }: SortableThProps) {
  const isActive = currentSort === sortKey;
  const Icon = isActive ? (currentDir === "asc" ? ArrowUp : ArrowDown) : ArrowUpDown;

  return (
    <th scope="col" className={className} aria-sort={isActive ? (currentDir === "asc" ? "ascending" : "descending") : "none"}>
      <button
        type="button"
        onClick={() => onSort(sortKey)}
        className="flex items-center gap-1 text-left font-semibold text-[var(--color-text-secondary)] hover:text-[var(--color-text)]"
      >
        {label}
        <Icon size={13} className={isActive ? "text-[var(--color-primary)]" : "text-[var(--color-text-muted)]"} />
      </button>
    </th>
  );
}
