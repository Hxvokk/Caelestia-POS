import { apiClient } from "./client";

export type LaptopRecommendationRequest = {
  budget: number;
  needs: string;
  software: string | null;
  resolution: string | null;
  minimumRamGb: number | null;
  minimumStorageGb: number | null;
  requiredGpu: string | null;
};

export type RecommendedLaptop = {
  modelId: number;
  brandName: string;
  modelName: string;
  price: number;
  processorOrChip: string;
  ramGb: number | null;
  unifiedMemoryGb: number | null;
  storageGb: number;
  gpu: string | null;
  matchSummary: string;
  limitations: string[];
};

export type LaptopRecommendationResponse = {
  status: "recomendado" | "sin_candidatos";
  message: string;
  usedAi: boolean;
  recommendations: RecommendedLaptop[];
};

export async function getLaptopRecommendations(
  request: LaptopRecommendationRequest,
): Promise<LaptopRecommendationResponse> {
  const response = await apiClient.post<LaptopRecommendationResponse>(
    "/api/advisor/recommendations",
    request,
  );
  return response.data;
}
