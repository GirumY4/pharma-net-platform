// src/features/inventory/hooks/useInventory.ts
import { useCallback, useEffect, useState } from "react";
import { handleApiError } from "../../../utils/errorMapper";
import { fetchInventory } from "../services/inventoryApi";
import type { IMedicine, InventoryFilters } from "../types";

interface UseInventoryReturn {
  medicines: IMedicine[];
  loading: boolean;
  error: string | null;
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
  refresh: () => Promise<void>;
  updateFilters: (filters: Partial<InventoryFilters>) => void;
}

export const useInventory = (
  initialFilters: InventoryFilters = { page: 1, limit: 20 },
  autoFetch = true,
): UseInventoryReturn => {
  const [medicines, setMedicines] = useState<IMedicine[]>([]);
  const [loading, setLoading] = useState<boolean>(autoFetch);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<InventoryFilters>(initialFilters);
  const [pagination, setPagination] = useState<{
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }>({ total: 0, page: 1, limit: 20, totalPages: 0 });

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const result = await fetchInventory(filters);
      setMedicines(result.data || []);
      setPagination(
        result.pagination || {
          total: 0,
          page: 1,
          limit: 20,
          totalPages: 0,
        },
      );
    } catch (err) {
      const message = handleApiError(err);
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    if (autoFetch) {
      fetchData();
    }
  }, [autoFetch, fetchData]);

  const updateFilters = useCallback((newFilters: Partial<InventoryFilters>) => {
    setFilters((prev) => ({ ...prev, ...newFilters, page: 1 })); // Reset to page 1 on filter change
  }, []);

  return {
    medicines,
    loading,
    error,
    pagination,
    refresh: fetchData,
    updateFilters,
  };
};
