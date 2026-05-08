import { useCallback, useEffect, useRef, useState } from "react";
import { handleApiError } from "../../../utils/errorMapper";
import {
  fetchDashboardData,
  updateDashboardOrderStatus,
} from "../services/dashboardApi";
import type { DashboardApiFilters, DashboardData } from "../types";

interface UseDashboardDataReturn {
  data: DashboardData | null;
  loading: boolean;
  refreshing: boolean;
  error: string | null;
  actionError: string | null;
  actionLoadingId: string | null;
  refresh: () => Promise<void>;
  approveOrder: (orderId: string) => Promise<void>;
}

const isCanceledRequest = (error: unknown) => {
  const candidate = error as { code?: string; name?: string };
  return candidate.code === "ERR_CANCELED" || candidate.name === "CanceledError";
};

export const useDashboardData = (
  filters?: DashboardApiFilters,
  autoFetch = true,
): UseDashboardDataReturn => {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState<boolean>(autoFetch);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const requestIdRef = useRef(0);
  const mountedRef = useRef(false);
  const hasLoadedRef = useRef(false);

  const fetchData = useCallback(async () => {
    abortRef.current?.abort();

    const controller = new AbortController();
    const requestId = requestIdRef.current + 1;
    abortRef.current = controller;
    requestIdRef.current = requestId;

    const isInitialLoad = !hasLoadedRef.current;
    if (isInitialLoad) {
      setLoading(true);
    } else {
      setRefreshing(true);
    }
    setError(null);

    try {
      const result = await fetchDashboardData(filters, controller.signal);
      if (
        mountedRef.current &&
        requestIdRef.current === requestId &&
        !controller.signal.aborted
      ) {
        setData(result);
        hasLoadedRef.current = true;
      }
    } catch (err) {
      if (isCanceledRequest(err)) return;
      if (mountedRef.current && requestIdRef.current === requestId) {
        const message = handleApiError(err);
        setError(message);
        console.error("Dashboard data fetch failed:", err);
      }
    } finally {
      if (mountedRef.current && requestIdRef.current === requestId) {
        setLoading(false);
        setRefreshing(false);
      }
    }
  }, [filters]);

  const approveOrder = useCallback(
    async (orderId: string) => {
      setActionLoadingId(orderId);
      setActionError(null);
      try {
        await updateDashboardOrderStatus(orderId, "approved");
        await fetchData();
      } catch (err) {
        if (isCanceledRequest(err)) return;
        const message = handleApiError(err);
        setActionError(message);
        console.error("Dashboard order approval failed:", err);
      } finally {
        if (mountedRef.current) {
          setActionLoadingId(null);
        }
      }
    },
    [fetchData],
  );

  useEffect(() => {
    mountedRef.current = true;
    if (autoFetch) {
      fetchData();
    }

    return () => {
      mountedRef.current = false;
      abortRef.current?.abort();
    };
  }, [autoFetch, fetchData]);

  return {
    data,
    loading,
    refreshing,
    error,
    actionError,
    actionLoadingId,
    refresh: fetchData,
    approveOrder,
  };
};
