// src/features/reports/hooks/useReports.ts
import { useCallback, useEffect, useState } from "react";
import { useAuth } from "../../../contexts/useAuth";
import { handleApiError } from "../../../utils/errorMapper";
import { fetchDashboardReport } from "../services/reportsApi";
import type { DashboardReport, DateRange } from "../types";

interface UseReportsReturn {
  report: DashboardReport | null;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  updateDateRange: (range: DateRange) => void;
}

export const useReports = (
  initialDateRange: DateRange,
  autoFetch = true,
): UseReportsReturn => {
  const { role, pharmacyId } = useAuth();
  const [report, setReport] = useState<DashboardReport | null>(null);
  const [loading, setLoading] = useState<boolean>(autoFetch);
  const [error, setError] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState<DateRange>(initialDateRange);

  const fetchData = useCallback(async () => {
    if (!pharmacyId && role !== "admin") return;

    setLoading(true);
    setError(null);
    try {
      const result = await fetchDashboardReport(
        role === "admin" ? pharmacyId || "" : pharmacyId!,
        dateRange,
      );
      setReport(result);
    } catch (err) {
      const message = handleApiError(err);
      setError(message);
      console.error("Reports fetch failed:", err);
    } finally {
      setLoading(false);
    }
  }, [dateRange, role, pharmacyId]);

  useEffect(() => {
    if (autoFetch) {
      fetchData();
    }
  }, [autoFetch, fetchData]);

  const updateDateRange = useCallback((newRange: DateRange) => {
    setDateRange(newRange);
  }, []);

  return {
    report,
    loading,
    error,
    refresh: fetchData,
    updateDateRange,
  };
};
