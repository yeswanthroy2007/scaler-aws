"use client";

import { useEffect, useState } from "react";
import { useUrlParams } from "@/hooks/useUrlParams";
import { useDebounce } from "@/hooks/useDebounce";
import { useAsyncData } from "@/hooks/useAsyncData";
import { hostedZonesApi } from "@/services/api/hostedZones";
import type { HostedZoneType } from "@/types/hostedZone";
import type { SortDirection } from "@/types/pagination";

const DEFAULT_PAGE_SIZE = 10;

export function useHostedZonesList() {
  const { params, setParams } = useUrlParams();

  const zoneType = (params.zone_type as HostedZoneType | undefined) ?? undefined;
  const sortBy = params.sort_by ?? "created_at";
  const sortDir = (params.sort_dir as SortDirection) ?? "desc";
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
      hostedZonesApi.list({
        search: params.search || undefined,
        zone_type: zoneType,
        sort_by: sortBy as "domain_name" | "created_at" | "updated_at" | "zone_type",
        sort_dir: sortDir,
        page,
        page_size: pageSize,
      }),
    [params.search, zoneType, sortBy, sortDir, page, pageSize]
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
    filters: { search: searchInput, zoneType, sortBy, sortDir, page, pageSize },
    setSearch: setSearchInput,
    setZoneType: (value: HostedZoneType | undefined) => setParams({ zone_type: value, page: 1 }),
    setPage: (value: number) => setParams({ page: value }),
    setPageSize: (value: number) => setParams({ page_size: value, page: 1 }),
    handleSort,
  };
}
