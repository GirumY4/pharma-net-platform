// src/features/marketplace/services/marketplaceApi.ts
import api from "../../../services/api";
import type { SuccessResponse } from "../../../types";
import type {
  CreateMarketplaceOrderPayload,
  MarketplaceApiResponse,
  MarketplaceFilters,
  MarketplaceMedicine,
  MarketplaceOrderSummary,
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
  if (filters.maxPrice !== undefined) params.maxPrice = filters.maxPrice;
  if (filters.minStock !== undefined) params.minStock = filters.minStock;
  if (filters.userLat !== undefined && filters.userLng !== undefined) {
    params.lat = filters.userLat;
    params.lng = filters.userLng;
  }
  if (filters.page) params.page = filters.page;
  if (filters.limit) params.limit = filters.limit;

  const response = await api.get<SuccessResponse<MarketplaceMedicine[]>>(
    "/medicines/marketplace",
    { params },
  );
  return {
    data: response.data.data,
    pagination: response.data.pagination || {
      total: 0,
      page: filters.page || 1,
      limit: filters.limit || 20,
      totalPages: 0,
    },
  };
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

/**
 * Place a one-pharmacy marketplace order for an authenticated public user.
 * Endpoint: POST /api/orders
 */
export const createMarketplaceOrder = async (
  payload: CreateMarketplaceOrderPayload,
): Promise<MarketplaceOrderSummary> => {
  const response = await api.post<SuccessResponse<MarketplaceOrderSummary>>(
    "/orders",
    payload,
  );
  return response.data.data;
};
