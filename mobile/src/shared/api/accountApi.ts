import { apiClient } from "./client";
import type { CurrentUser } from "./types";

export async function getCurrentUser(): Promise<CurrentUser> {
  const response = await apiClient.get<CurrentUser>("/api/users/me");
  return response.data;
}
