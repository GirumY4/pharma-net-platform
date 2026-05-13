// src/features/marketplace/services/marketplaceApi.ts
import api from "../../../services/api";
import type { SuccessResponse } from "../../../types";
import type {
  MarketplaceApiResponse,
  MarketplaceFilters,
  MarketplaceMedicine,
} from "../types";

/**
 * Search medicines across all pharmacy tenants (public endpoint)
 * Endpoint: GET /api/medicines/marketplace
 */
export const searchMarketplace = async (
  filters: MarketplaceFilters = {},
): Promise<MarketplaceApiResponse> => {
  const params: Record<string, string | number> = {};

  if (filters.name) params.name = filters.name;
  if (filters.genericName) params.genericName = filters.genericName;
  if (filters.category) params.category = filters.category;
  if (filters.city) params.city = filters.city;
  if (filters.maxPrice) params.maxPrice = filters.maxPrice;
  if (filters.minStock) params.minStock = filters.minStock;
  if (filters.userLat && filters.userLng) {
    params.lat = filters.userLat;
    params.lng = filters.userLng;
  }
  if (filters.page) params.page = filters.page;
  if (filters.limit) params.limit = filters.limit;

  const response = await api.get<SuccessResponse<MarketplaceApiResponse>>(
    "/medicines/marketplace",
    { params },
  );
  return response.data.data;
};

/**
 * Fetch a single medicine's public details (optional enhancement)
 * Endpoint: GET /api/medicines/marketplace/:id
 */
export const fetchMedicinePublicDetails = async (
  medicineId: string,
): Promise<MarketplaceMedicine> => {
  const response = await api.get<SuccessResponse<MarketplaceMedicine>>(
    `/medicines/marketplace/${medicineId}`,
  );
  return response.data.data;
};
