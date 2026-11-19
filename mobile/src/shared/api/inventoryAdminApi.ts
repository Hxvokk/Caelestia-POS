import { apiClient } from "./client";
import type { Brand, LaptopModel, LaptopUnit } from "./types";

export type SaveBrandRequest = {
  name: string;
};

export type SaveLaptopModelRequest = {
  brandId: number;
  sku: string | null;
  name: string;
  processorOrChip: string;
  cpuCores: number | null;
  cpuThreads: number | null;
  unifiedMemoryGb: number | null;
  ramGb: number | null;
  storageGb: number;
  storageType: string;
  gpu: string | null;
  gpuType: string | null;
  gpuVramGb: number | null;
  cpuLevel: string | null;
  gpuLevel: string | null;
  price: number;
  priceSourceUrl: string | null;
  priceCheckedOn: string | null;
  specificationsSource: string | null;
  imageUrl: string | null;
  imageSourceUrl: string | null;
  imageTermsUrl: string | null;
  imageRightsStatus: "no_confirmado" | "permiso_confirmado" | "licencia_abierta";
};

export type SaveLaptopUnitRequest = {
  modelId: number;
  serialNumber: string;
};

export type ModelImageUploadRequest = {
  uri: string;
  mimeType: "image/jpeg" | "image/png" | "image/webp";
};

export type ModelImageUploadResponse = {
  imageUrl: string;
  imageRightsStatus: LaptopModel["imageRightsStatus"];
};

export async function createBrand(request: SaveBrandRequest): Promise<Brand> {
  const response = await apiClient.post<Brand>("/api/brands", request);
  return response.data;
}

export async function updateBrand(id: number, request: SaveBrandRequest): Promise<void> {
  await apiClient.put(`/api/brands/${id}`, request);
}

export async function deleteBrand(id: number): Promise<void> {
  await apiClient.delete(`/api/brands/${id}`);
}

export async function createLaptopModel(
  request: SaveLaptopModelRequest,
): Promise<LaptopModel> {
  const response = await apiClient.post<LaptopModel>("/api/laptops", request);
  return response.data;
}

export async function updateLaptopModel(
  id: number,
  request: SaveLaptopModelRequest,
): Promise<void> {
  await apiClient.put(`/api/laptops/${id}`, request);
}

export async function uploadLaptopModelImage(
  id: number,
  image: ModelImageUploadRequest,
): Promise<ModelImageUploadResponse> {
  const formData = new FormData();
  const extension = image.mimeType === "image/jpeg"
    ? "jpg"
    : image.mimeType === "image/png"
      ? "png"
      : "webp";
  formData.append("file", {
    uri: image.uri,
    name: `model-image.${extension}`,
    type: image.mimeType,
  } as unknown as Blob);

  const response = await apiClient.post<ModelImageUploadResponse>(
    `/api/laptops/${id}/image`,
    formData,
    { headers: { "Content-Type": undefined } },
  );
  return response.data;
}

export async function deleteLaptopModel(id: number): Promise<void> {
  await apiClient.delete(`/api/laptops/${id}`);
}

export async function createLaptopUnit(
  request: SaveLaptopUnitRequest,
): Promise<LaptopUnit> {
  const response = await apiClient.post<LaptopUnit>("/api/units", request);
  return response.data;
}

export async function updateLaptopUnit(
  id: number,
  request: SaveLaptopUnitRequest,
): Promise<void> {
  await apiClient.put(`/api/units/${id}`, request);
}

export async function deleteLaptopUnit(id: number): Promise<void> {
  await apiClient.delete(`/api/units/${id}`);
}
