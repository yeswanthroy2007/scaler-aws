import { apiClient } from "./client";
import type { Page } from "@/types/pagination";
import type { DnsRecord, DnsRecordFormValues, DnsRecordListParams } from "@/types/dnsRecord";

export const dnsRecordsApi = {
  list: (zoneId: number, params: DnsRecordListParams) =>
    apiClient.get<Page<DnsRecord>>(`/api/hosted-zones/${zoneId}/records`, { ...params }),
  get: (zoneId: number, recordId: number) =>
    apiClient.get<DnsRecord>(`/api/hosted-zones/${zoneId}/records/${recordId}`),
  create: (zoneId: number, payload: DnsRecordFormValues) =>
    apiClient.post<DnsRecord>(`/api/hosted-zones/${zoneId}/records`, payload),
  update: (zoneId: number, recordId: number, payload: DnsRecordFormValues) =>
    apiClient.put<DnsRecord>(`/api/hosted-zones/${zoneId}/records/${recordId}`, payload),
  remove: (zoneId: number, recordId: number) => apiClient.delete<void>(`/api/hosted-zones/${zoneId}/records/${recordId}`),
  bulkDelete: (zoneId: number, recordIds: number[]) =>
    apiClient.post<{ deleted: number }>(`/api/hosted-zones/${zoneId}/records/bulk-delete`, { record_ids: recordIds }),
};
