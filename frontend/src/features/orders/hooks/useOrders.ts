// src/features/orders/hooks/useOrders.ts
import { useCallback, useEffect, useState } from "react";
import { handleApiError } from "../../../utils/errorMapper";
import { fetchOrders } from "../services/ordersApi";
import type { IOrder, OrderFilters } from "../types";

interface UseOrdersReturn {
  orders: IOrder[];
  loading: boolean;
  error: string | null;
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
  refresh: () => Promise<void>;
  updateFilters: (filters: Partial<OrderFilters>) => void;
}

export const useOrders = (
  initialFilters: OrderFilters = { page: 1, limit: 20 },
  autoFetch = true,
): UseOrdersReturn => {
  const [orders, setOrders] = useState<IOrder[]>([]);
  const [loading, setLoading] = useState<boolean>(autoFetch);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<OrderFilters>(initialFilters);
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
      const result = await fetchOrders(filters);
      setOrders(result.data);
      setPagination(result.pagination);
    } catch (err) {
      const message = handleApiError(err);
      setError(message);
      console.error("Orders fetch failed:", err);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    if (autoFetch) {
      fetchData();
    }
  }, [autoFetch, fetchData]);

  const updateFilters = useCallback((newFilters: Partial<OrderFilters>) => {
    setFilters((prev: OrderFilters) => ({ ...prev, ...newFilters, page: 1 })); // Reset to page 1 on filter change
  }, []);

  return {
    orders,
    loading,
    error,
    pagination,
    refresh: fetchData,
    updateFilters,
  };
};
