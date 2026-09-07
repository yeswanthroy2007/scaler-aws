import { apiClient } from "./client";
import type { Page } from "@/types/pagination";
import type {
  DashboardStats,
  HostedZone,
  HostedZoneCreatePayload,
  HostedZoneListParams,
  HostedZoneUpdatePayload,
} from "@/types/hostedZone";

export const hostedZonesApi = {
  list: (params: HostedZoneListParams) => apiClient.get<Page<HostedZone>>("/api/hosted-zones", { ...params }),
  get: (id: number) => apiClient.get<HostedZone>(`/api/hosted-zones/${id}`),
  create: (payload: HostedZoneCreatePayload) => apiClient.post<HostedZone>("/api/hosted-zones", payload),
  update: (id: number, payload: HostedZoneUpdatePayload) =>
    apiClient.put<HostedZone>(`/api/hosted-zones/${id}`, payload),
  remove: (id: number) => apiClient.delete<void>(`/api/hosted-zones/${id}`),
  stats: () => apiClient.get<DashboardStats>("/api/hosted-zones/stats"),
};
