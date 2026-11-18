export type LaptopModel = {
  id: number;
  brandId: number;
  brandName: string;
  sku: string | null;
  name: string;
  processorOrChip: string;
  cpuCores: number | null;
  cpuThreads: number | null;
  ramGb: number | null;
  unifiedMemoryGb: number | null;
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
  createdAt: string;
};

export type LaptopModelFilters = {
  brandId?: number;
  minPrice?: number;
  maxPrice?: number;
  processor?: string;
  minMemoryGb?: number;
  availableOnly?: boolean;
};

export type LaptopUnit = {
  id: number;
  modelId: number;
  modelName: string;
  brandId: number;
  brandName: string;
  serialNumber: string;
  status: "disponible" | "vendida";
  registeredAt: string;
};

export type LaptopUnitFilters = {
  modelId?: number;
  status?: "disponible" | "vendida";
};

export type Brand = {
  id: number;
  name: string;
};

export type CurrentUser = {
  id: string;
  role: "administrador" | "vendedor";
};

export type VendorAccount = {
  id: string;
  name: string;
  email: string;
  isActive: boolean;
};
