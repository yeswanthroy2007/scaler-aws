import { apiClient } from "./client";
import type { DashboardSummary } from "@/types/dashboard";

export const dashboardApi = {
  summary: () => apiClient.get<DashboardSummary>("/api/dashboard/summary"),
};
