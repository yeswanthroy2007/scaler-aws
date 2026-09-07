"use client";

import { Globe, FileText, Compass, Loader2, SearchX } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { cn } from "@/utils/cn";
import type { SearchResultItem, SearchResultType } from "@/types/search";

const GROUP_ORDER: SearchResultType[] = ["hosted_zone", "dns_record", "section"];

const GROUP_LABEL: Record<SearchResultType, string> = {
  hosted_zone: "Hosted zones",
  dns_record: "DNS records",
  section: "Route 53",
};

const GROUP_ICON: Record<SearchResultType, typeof Globe> = {
  hosted_zone: Globe,
  dns_record: FileText,
  section: Compass,
};

interface GlobalSearchResultsProps {
  query: string;
  results: SearchResultItem[];
  loading: boolean;
  error: string | null;
  activeIndex: number;
  onSelect: (item: SearchResultItem) => void;
  onHover: (index: number) => void;
}

export function GlobalSearchResults({
  query,
  results,
  loading,
  error,
  activeIndex,
  onSelect,
  onHover,
}: GlobalSearchResultsProps) {
  const groups = GROUP_ORDER.map((type) => ({
    type,
    items: results.filter((item) => item.type === type),
  })).filter((group) => group.items.length > 0);

  // `results` already arrives pre-ordered hosted_zone -> dns_record -> section
  // (matching GROUP_ORDER), so an item's position in the original flat array
  // is exactly its keyboard-navigation index -- no render-time counter needed.

  return (
    <div
      role="listbox"
      aria-label="Search results"
      className="absolute left-0 right-0 top-full mt-1 max-h-[70vh] overflow-y-auto rounded border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text)] shadow-xl"
    >
      {loading && results.length === 0 && (
        <div className="flex items-center gap-2 px-4 py-6 text-sm text-[var(--color-text-secondary)]">
          <Loader2 size={15} className="animate-spin" /> Searching...
        </div>
      )}

      {error && (
        <div className="px-4 py-6 text-sm text-[var(--color-danger)]">Something went wrong while searching. Please try again.</div>
      )}

      {!loading && !error && results.length === 0 && (
        <div className="flex flex-col items-center gap-2 px-4 py-8 text-center">
          <SearchX size={22} className="text-[var(--color-text-muted)]" />
          <p className="text-sm font-medium text-[var(--color-text)]">No results found</p>
          <p className="text-xs text-[var(--color-text-secondary)]">
            No hosted zones, DNS records, or Route 53 sections match &ldquo;{query}&rdquo;.
          </p>
        </div>
      )}

      {groups.map((group) => {
        const Icon = GROUP_ICON[group.type];
        return (
          <div key={group.type} className="py-1">
            <p className="px-4 pb-1 pt-2 text-[11px] font-semibold uppercase tracking-wide text-[var(--color-text-muted)]">
              {GROUP_LABEL[group.type]}
            </p>
            <ul>
              {group.items.map((item) => {
                const itemIndex = results.indexOf(item);
                const isActive = itemIndex === activeIndex;
                return (
                  <li key={`${item.type}-${item.id}`}>
                    <button
                      type="button"
                      role="option"
                      aria-selected={isActive}
                      onMouseEnter={() => onHover(itemIndex)}
                      onClick={() => onSelect(item)}
                      className={cn(
                        "flex w-full items-center gap-3 px-4 py-2 text-left",
                        isActive ? "bg-[var(--color-sidebar-active-bg)]" : "hover:bg-[var(--color-surface-secondary)]"
                      )}
                    >
                      <Icon size={16} className="shrink-0 text-[var(--color-text-secondary)]" />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-medium text-[var(--color-text)]">{item.title}</span>
                        {item.subtitle && (
                          <span className="block truncate text-xs text-[var(--color-text-secondary)]">{item.subtitle}</span>
                        )}
                      </span>
                      {item.badge && (
                        <Badge variant="neutral">
                          <span className="uppercase">{item.badge}</span>
                        </Badge>
                      )}
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        );
      })}
    </div>
  );
}
