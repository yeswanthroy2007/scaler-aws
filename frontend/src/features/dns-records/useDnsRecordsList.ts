"use client";

import { useEffect, useState } from "react";
import { useUrlParams } from "@/hooks/useUrlParams";
import { useDebounce } from "@/hooks/useDebounce";
import { useAsyncData } from "@/hooks/useAsyncData";
import { dnsRecordsApi } from "@/services/api/dnsRecords";
import type { DnsRecordType } from "@/types/dnsRecord";
import type { SortDirection } from "@/types/pagination";

const DEFAULT_PAGE_SIZE = 10;

export function useDnsRecordsList(zoneId: number) {
  const { params, setParams } = useUrlParams();

  const recordType = (params.type as DnsRecordType | undefined) ?? undefined;
  const sortBy = params.sort_by ?? "name";
  const sortDir = (params.sort_dir as SortDirection) ?? "asc";
  const page = Number(params.page ?? 1);
  const pageSize = Number(params.page_size ?? DEFAULT_PAGE_SIZE);

  const [searchInput, setSearchInput] = useState(params.search ?? "");
  const debouncedSearch = useDebounce(searchInput, 350);

  useEffect(() => {
    if (debouncedSearch !== (params.search ?? "")) {
      setParams({ search: debouncedSearch || undefined, page: 1 });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch]);

  const query = useAsyncData(
    () =>
      dnsRecordsApi.list(zoneId, {
        search: params.search || undefined,
        type: recordType,
        sort_by: sortBy as "name" | "type" | "ttl" | "created_at",
        sort_dir: sortDir,
        page,
        page_size: pageSize,
      }),
    [zoneId, params.search, recordType, sortBy, sortDir, page, pageSize]
  );

  function handleSort(key: string) {
    if (sortBy === key) {
      setParams({ sort_dir: sortDir === "asc" ? "desc" : "asc" });
    } else {
      setParams({ sort_by: key, sort_dir: "asc" });
    }
  }

  return {
    ...query,
    filters: { search: searchInput, recordType, sortBy, sortDir, page, pageSize },
    setSearch: setSearchInput,
    setRecordType: (value: DnsRecordType | undefined) => setParams({ type: value, page: 1 }),
    setPage: (value: number) => setParams({ page: value }),
    setPageSize: (value: number) => setParams({ page_size: value, page: 1 }),
    handleSort,
  };
}
