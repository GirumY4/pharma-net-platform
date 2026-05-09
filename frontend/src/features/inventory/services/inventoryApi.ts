// src/features/inventory/services/inventoryApi.ts
import api from "../../../services/api";
import type { SuccessResponse } from "../../../types";
import type {
  IMedicine,
  InventoryApiResponse,
  InventoryFilters,
  MedicineFormValues,
} from "../types";

/**
 * Fetch tenant-scoped inventory list with filters and pagination
 * Endpoint: GET /api/medicines
 */
export const fetchInventory = async (
  filters: InventoryFilters = {},
): Promise<InventoryApiResponse> => {
  const params: Record<string, string | boolean | number> = {};

  if (filters.name) params.name = filters.name;
  if (filters.sku) params.sku = filters.sku;
  if (filters.category) params.category = filters.category;
  if (filters.lowStock) params.lowStock = true;
  if (filters.nearExpiry) params.nearExpiry = true;
  if (filters.page) params.page = filters.page;
  if (filters.limit) params.limit = filters.limit;

  const response = await api.get<InventoryApiResponse>("/medicines", {
    params,
  });
  return response.data;
};

/**
 * Create new medicine (tenant-scoped)
 * Endpoint: POST /api/medicines
 */
export const createMedicine = async (
  payload: MedicineFormValues,
): Promise<IMedicine> => {
  const response = await api.post<SuccessResponse<IMedicine>>(
    "/medicines",
    payload,
  );
  return response.data.data;
};

/**
 * Update existing medicine metadata (tenant-scoped)
 * Endpoint: PATCH /api/medicines/:id
 */
export const updateMedicine = async (
  medicineId: string,
  payload: Partial<MedicineFormValues>,
): Promise<IMedicine> => {
  const response = await api.patch<SuccessResponse<IMedicine>>(
    `/medicines/${medicineId}`,
    payload,
  );
  return response.data.data;
};

/**
 * Soft-delete a medicine (tenant-scoped)
 * Endpoint: DELETE /api/medicines/:id
 */
export const deleteMedicine = async (medicineId: string): Promise<void> => {
  await api.delete<SuccessResponse<unknown>>(`/medicines/${medicineId}`);
};

/**
 * Fetch single medicine details with full batch data
 * Endpoint: GET /api/medicines/:id
 */
export const fetchMedicineById = async (
  medicineId: string,
): Promise<IMedicine> => {
  const response = await api.get<SuccessResponse<IMedicine>>(
    `/medicines/${medicineId}`,
  );
  return response.data.data;
};
