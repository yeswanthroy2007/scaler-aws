"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useDebounce } from "@/hooks/useDebounce";
import { searchApi } from "@/services/api/search";
import type { SearchResultItem } from "@/types/search";

/** Controller for the AWS-console-style global search box: owns the query,
 * debounces it, calls the backend, and exposes everything the view needs
 * to render results / loading / empty states and navigate on selection. */
export function useGlobalSearch() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [results, setResults] = useState<SearchResultItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeIndex, setActiveIndex] = useState(-1);

  const debouncedQuery = useDebounce(query, 250);
  const requestId = useRef(0);

  useEffect(() => {
    const trimmed = debouncedQuery.trim();
    if (!trimmed) {
      // Clearing the query is a reset triggered by the debounced value
      // itself changing (an external timer), not a plain render -- the
      // synchronous clears here are the reset, not a redundant re-fetch.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setResults([]);
      setLoading(false);
      setError(null);
      setActiveIndex(-1);
      return;
    }

    const id = ++requestId.current;
    setLoading(true);
    setError(null);

    searchApi
      .search(trimmed)
      .then((response) => {
        if (id !== requestId.current) return;
        setResults(response.items);
        setActiveIndex(-1);
      })
      .catch((err: unknown) => {
        if (id !== requestId.current) return;
        setResults([]);
        setError(err instanceof Error ? err.message : "Search failed");
      })
      .finally(() => {
        if (id === requestId.current) setLoading(false);
      });
  }, [debouncedQuery]);

  const close = useCallback(() => {
    setOpen(false);
    setActiveIndex(-1);
  }, []);

  const reset = useCallback(() => {
    setQuery("");
    setResults([]);
    close();
  }, [close]);

  const navigateTo = useCallback(
    (item: SearchResultItem) => {
      router.push(item.href);
      reset();
    },
    [router, reset]
  );

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLInputElement>) => {
      if (!open || results.length === 0) return;
      if (event.key === "ArrowDown") {
        event.preventDefault();
        setActiveIndex((i) => (i + 1) % results.length);
      } else if (event.key === "ArrowUp") {
        event.preventDefault();
        setActiveIndex((i) => (i - 1 + results.length) % results.length);
      } else if (event.key === "Enter") {
        if (activeIndex >= 0 && activeIndex < results.length) {
          event.preventDefault();
          navigateTo(results[activeIndex]);
        }
      } else if (event.key === "Escape") {
        close();
      }
    },
    [open, results, activeIndex, navigateTo, close]
  );

  return {
    query,
    setQuery: (value: string) => {
      setQuery(value);
      setOpen(true);
    },
    open: open && query.trim().length > 0,
    openDropdown: () => query.trim() && setOpen(true),
    close,
    results,
    loading,
    error,
    activeIndex,
    setActiveIndex,
    navigateTo,
    handleKeyDown,
  };
}
