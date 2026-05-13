// src/features/marketplace/hooks/useMarketplaceSearch.ts
import { debounce } from "lodash";
import { useCallback, useEffect, useRef, useState } from "react";
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
  loadMore: () => void;
}

export const useMarketplaceSearch = (
  initialFilters: MarketplaceFilters = { page: 1, limit: 20 },
): UseMarketplaceSearchReturn => {
  const [results, setResults] = useState<MarketplaceMedicine[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<MarketplaceFilters>(initialFilters);
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    limit: initialFilters.limit || 20,
    totalPages: 0,
  });

  const isMounted = useRef(true);

  const performSearch = useCallback(
    async (searchFilters: MarketplaceFilters) => {
      setLoading(true);
      setError(null);
      try {
        const result = await searchMarketplace(searchFilters);
        if (isMounted.current) {
          setResults(result.data);
          setPagination(result.pagination);
        }
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

  // Debounced search for text inputs
  const debouncedSearch = useCallback(
    debounce((filters: MarketplaceFilters) => {
      performSearch({ ...filters, page: 1 }); // Reset to page 1 on new search
    }, 300),
    [performSearch],
  );

  const search = useCallback(
    (newFilters: MarketplaceFilters) => {
      setFilters((prev) => ({ ...prev, ...newFilters }));
      debouncedSearch({ ...filters, ...newFilters, page: 1 });
    },
    [debouncedSearch, filters],
  );

  const loadMore = useCallback(() => {
    if (pagination.page >= pagination.totalPages || loading) return;
    const nextPage = pagination.page + 1;
    setFilters((prev) => ({ ...prev, page: nextPage }));
    performSearch({ ...filters, page: nextPage });
  }, [filters, loading, pagination, performSearch]);

  useEffect(() => {
    return () => {
      isMounted.current = false;
      debouncedSearch.cancel();
    };
  }, [debouncedSearch]);

  return {
    results,
    loading,
    error,
    pagination,
    search,
    loadMore,
  };
};
