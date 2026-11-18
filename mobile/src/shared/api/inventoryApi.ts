import { apiClient } from "./client";
import type {
  Brand,
  LaptopModel,
  LaptopModelFilters,
  LaptopUnit,
  LaptopUnitFilters,
} from "./types";

export async function getBrands(): Promise<Brand[]> {
  const response = await apiClient.get<Brand[]>("/api/brands");
  return response.data;
}

export async function getLaptopModels(
  filters: LaptopModelFilters = {},
): Promise<LaptopModel[]> {
  const response = await apiClient.get<LaptopModel[]>("/api/laptops", {
    params: filters,
  });
  return response.data;
}

export async function getLaptopModel(id: number): Promise<LaptopModel> {
  const response = await apiClient.get<LaptopModel>(`/api/laptops/${id}`);
  return response.data;
}

export async function getLaptopUnits(
  filters: LaptopUnitFilters = {},
): Promise<LaptopUnit[]> {
  const response = await apiClient.get<LaptopUnit[]>("/api/units", {
    params: filters,
  });
  return response.data;
}

export async function getLaptopUnit(id: number): Promise<LaptopUnit> {
  const response = await apiClient.get<LaptopUnit>(`/api/units/${id}`);
  return response.data;
}
