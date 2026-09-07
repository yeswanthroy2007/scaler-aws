import { ChevronLeft, ChevronRight } from "lucide-react";
import type { PageMeta } from "@/types/pagination";
import { Select } from "@/components/ui/Select";

interface PaginationProps {
  meta: PageMeta;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
}

const PAGE_SIZE_OPTIONS = [10, 20, 50];

export function Pagination({ meta, onPageChange, onPageSizeChange }: PaginationProps) {
  const { page, total_pages, total, page_size } = meta;
  const rangeStart = total === 0 ? 0 : (page - 1) * page_size + 1;
  const rangeEnd = Math.min(page * page_size, total);

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[var(--color-border)] px-4 py-2.5">
      <div className="flex items-center gap-2 text-xs text-[var(--color-text-secondary)]">
        <span>
          {rangeStart}-{rangeEnd} of {total}
        </span>
        <label className="ml-2 flex items-center gap-1.5">
          Per page
          <Select
            aria-label="Results per page"
            value={page_size}
            onChange={(e) => onPageSizeChange(Number(e.target.value))}
            className="w-auto! py-1"
          >
            {PAGE_SIZE_OPTIONS.map((size) => (
              <option key={size} value={size}>
                {size}
              </option>
            ))}
          </Select>
        </label>
      </div>

      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
          aria-label="Previous page"
          className="grid h-7 w-7 place-items-center rounded border border-[var(--color-border-strong)] text-[var(--color-text)] hover:bg-[var(--color-surface-secondary)] disabled:cursor-not-allowed disabled:opacity-40"
        >
          <ChevronLeft size={15} />
        </button>
        <span className="px-2 text-xs text-[var(--color-text-secondary)]">
          Page {page} of {total_pages}
        </span>
        <button
          type="button"
          onClick={() => onPageChange(page + 1)}
          disabled={page >= total_pages}
          aria-label="Next page"
          className="grid h-7 w-7 place-items-center rounded border border-[var(--color-border-strong)] text-[var(--color-text)] hover:bg-[var(--color-surface-secondary)] disabled:cursor-not-allowed disabled:opacity-40"
        >
          <ChevronRight size={15} />
        </button>
      </div>
    </div>
  );
}
