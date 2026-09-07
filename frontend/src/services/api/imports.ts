import { apiClient } from "./client";
import type { BindImportPreviewResponse, BindImportSummary } from "@/types/bindImport";

export const importsApi = {
  preview: (zoneId: number, file: File) => {
    const formData = new FormData();
    formData.append("file", file);
    return apiClient.post<BindImportPreviewResponse>(`/api/hosted-zones/${zoneId}/import/preview`, formData);
  },
  confirm: (zoneId: number, importToken: string) =>
    apiClient.post<BindImportSummary>(`/api/hosted-zones/${zoneId}/import/confirm`, { import_token: importToken }),
};
