import { debounce } from "lodash";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { handleApiError } from "../../../utils/errorMapper";
import { searchMarketplace } from "../services/marketplaceApi";
import type { MarketplaceFilters, MarketplaceMedicine } from "../types";

interface UseMarketplaceSearchReturn {
  results: MarketplaceMedicine[];
  loading: boolean;
  error: string | null;
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
  search: (filters: MarketplaceFilters) => void;
  retry: () => void;
  loadMore: () => void;
}

const DEFAULT_PAGINATION = {
  total: 0,
  page: 1,
  limit: 20,
  totalPages: 0,
};

export const useMarketplaceSearch = (
  initialFilters: MarketplaceFilters = { page: 1, limit: 20 },
): UseMarketplaceSearchReturn => {
  const [results, setResults] = useState<MarketplaceMedicine[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    ...DEFAULT_PAGINATION,
    limit: initialFilters.limit || DEFAULT_PAGINATION.limit,
  });

  const isMounted = useRef(true);
  const initialFiltersRef = useRef(initialFilters);
  const filtersRef = useRef<MarketplaceFilters>(initialFilters);

  const performSearch = useCallback(
    async (searchFilters: MarketplaceFilters, append = false) => {
      filtersRef.current = searchFilters;
      setLoading(true);
      setError(null);

      try {
        const result = await searchMarketplace(searchFilters);
        if (!isMounted.current) return;

        setResults((previous) =>
          append ? [...previous, ...result.data] : result.data,
        );
        setPagination(result.pagination);
      } catch (err) {
        if (isMounted.current) {
          setError(handleApiError(err));
        }
      } finally {
        if (isMounted.current) {
          setLoading(false);
        }
      }
    },
    [],
  );

  const debouncedSearch = useMemo(
    () =>
      debounce((nextFilters: MarketplaceFilters) => {
        void performSearch(nextFilters, false);
      }, 300),
    [performSearch],
  );

  const search = useCallback(
    (nextFilters: MarketplaceFilters) => {
      const normalizedFilters = {
        ...nextFilters,
        page: 1,
        limit: nextFilters.limit || filtersRef.current.limit || 20,
      };
      filtersRef.current = normalizedFilters;
      debouncedSearch(normalizedFilters);
    },
    [debouncedSearch],
  );

  const retry = useCallback(() => {
    void performSearch(filtersRef.current, false);
  }, [performSearch]);

  const loadMore = useCallback(() => {
    if (pagination.page >= pagination.totalPages || loading) return;

    const nextFilters = {
      ...filtersRef.current,
      page: pagination.page + 1,
      limit: pagination.limit,
    };

    void performSearch(nextFilters, true);
  }, [loading, pagination, performSearch]);

  useEffect(() => {
    isMounted.current = true;
    void performSearch(initialFiltersRef.current, false);

    return () => {
      isMounted.current = false;
      debouncedSearch.cancel();
    };
  }, [debouncedSearch, performSearch]);

  return {
    results,
    loading,
    error,
    pagination,
    search,
    retry,
    loadMore,
  };
};
