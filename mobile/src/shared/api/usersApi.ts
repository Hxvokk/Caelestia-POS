import { apiClient } from "./client";
import type { VendorAccount } from "./types";

export type CreateVendorRequest = {
  name: string;
  email: string;
  password: string;
};

export async function getVendors(): Promise<VendorAccount[]> {
  const response = await apiClient.get<VendorAccount[]>("/api/users");
  return response.data;
}

export async function createVendor(request: CreateVendorRequest): Promise<VendorAccount> {
  const response = await apiClient.post<VendorAccount>("/api/users", request);
  return response.data;
}

export async function setVendorActive(id: string, isActive: boolean): Promise<void> {
  await apiClient.patch(`/api/users/${id}/status`, { isActive });
}
