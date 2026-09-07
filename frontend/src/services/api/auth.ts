import { apiClient } from "./client";
import type { LoginPayload, LoginResponse, User } from "@/types/auth";

export const authApi = {
  login: (payload: LoginPayload) => apiClient.post<LoginResponse>("/api/auth/login", payload),
  logout: () => apiClient.post<void>("/api/auth/logout"),
  me: () => apiClient.get<User>("/api/auth/me"),
};
