// src/features/reports/services/reportsApi.ts
import api from "../../../services/api";
import type { SuccessResponse } from "../../../types";
import type {
  DashboardReport,
  ExpiringReport,
  ExportOptions,
  InventoryReport,
  PlatformReport,
  SalesReport,
} from "../types";

/**
 * Fetch aggregated dashboard metrics for tenant dashboard
 * Endpoint: GET /api/reports/dashboard
 */
export const fetchDashboardReport = async (
  pharmacyId: string,
  dateRange: { startDate: Date; endDate: Date },
  limits?: {
    ordersLimit?: number;
    expiryWindowDays?: number;
    transactionsLimit?: number;
    lowStockLimit?: number;
  },
): Promise<DashboardReport> => {
  const params: Record<string, string> = {
    pharmacyId,
    startDate: dateRange.startDate.toISOString(),
    endDate: dateRange.endDate.toISOString(),
  };

  if (limits?.ordersLimit) params.ordersLimit = limits.ordersLimit.toString();
  if (limits?.expiryWindowDays)
    params.expiryWindowDays = limits.expiryWindowDays.toString();
  if (limits?.transactionsLimit)
    params.transactionsLimit = limits.transactionsLimit.toString();
  if (limits?.lowStockLimit)
    params.lowStockLimit = limits.lowStockLimit.toString();

  const response = await api.get<SuccessResponse<any>>(
    "/reports/dashboard",
    { params },
  );

  const raw = response.data.data;

  // Normalize the backend response to match our DashboardReport type
  return {
    pharmacyId: raw.pharmacyId,
    generatedAt: raw.generatedAt,
    startDate: raw.startDate,
    endDate: raw.endDate,
    totalRevenue: raw.totalRevenue ?? 0,
    totalOrders: raw.totalOrders ?? 0,
    averageOrderValue: raw.averageOrderValue ?? 0,
    fulfillmentRate: raw.fulfillmentRate ?? 0,
    lowStockCount: raw.lowStockCount ?? 0,
    nearExpiryCount: raw.nearExpiryCount ?? 0,
    // Map revenueTrend: backend sends { date, label, revenue, orders }
    // Frontend expects { date, revenue, orderCount }
    revenueTrend: (raw.revenueTrend ?? []).map(
      (point: { date: string; revenue: number; orders?: number; orderCount?: number }) => ({
        date: point.date,
        revenue: point.revenue ?? 0,
        orderCount: point.orders ?? point.orderCount ?? 0,
      }),
    ),
    ordersByStatus: raw.ordersByStatus ?? {},
    // Map topMedicines: backend may not return category
    topMedicines: (raw.topMedicines ?? []).map(
      (med: { name: string; sku: string; category?: string; qtySold: number; revenue: number }) => ({
        name: med.name ?? "Unknown",
        sku: med.sku ?? "",
        category: med.category ?? "",
        qtySold: med.qtySold ?? 0,
        revenue: med.revenue ?? 0,
      }),
    ),
    stockHealth: raw.stockHealth ?? { healthy: 0, low: 0, critical: 0, out: 0 },
    expiringBatches: raw.expiringBatches ?? [],
    // Use the flattened recentTransactions from backend (has medicineName directly)
    recentTransactions: raw.recentTransactions ?? [],
  };
};

/**
 * Fetch tenant-scoped inventory valuation report
 * Endpoint: GET /api/reports/inventory
 */
export const fetchInventoryReport = async (
  pharmacyId: string,
): Promise<InventoryReport> => {
  const response = await api.get<SuccessResponse<InventoryReport>>(
    "/reports/inventory",
    { params: { pharmacyId } },
  );
  return response.data.data;
};

/**
 * Fetch tenant-scoped sales statistics with date range
 * Endpoint: GET /api/reports/sales
 */
export const fetchSalesReport = async (
  pharmacyId: string,
  dateRange: { startDate: Date; endDate: Date },
): Promise<SalesReport> => {
  const response = await api.get<SuccessResponse<SalesReport>>(
    "/reports/sales",
    {
      params: {
        pharmacyId,
        startDate: dateRange.startDate.toISOString(),
        endDate: dateRange.endDate.toISOString(),
      },
    },
  );
  return response.data.data;
};

/**
 * Fetch FEFO batch expiry forecast
 * Endpoint: GET /api/reports/expiring
 */
export const fetchExpiringReport = async (
  pharmacyId: string,
  beforeDate: Date,
): Promise<ExpiringReport> => {
  const response = await api.get<SuccessResponse<ExpiringReport>>(
    "/reports/expiring",
    {
      params: {
        pharmacyId,
        before: beforeDate.toISOString(),
      },
    },
  );
  return response.data.data;
};

/**
 * Fetch platform-wide analytics (admin only)
 * Endpoint: GET /api/reports/platform
 */
export const fetchPlatformReport = async (): Promise<PlatformReport> => {
  const response =
    await api.get<SuccessResponse<PlatformReport>>("/reports/platform");
  return response.data.data;
};

/**
 * Export report as CSV or PDF
 * Endpoint: GET /api/reports/:type?export=csv|pdf
 */
export const exportReport = async (options: ExportOptions): Promise<Blob> => {
  const endpoint = `/reports/${options.reportType}`;
  const params: Record<string, string> = { export: options.format };

  if (options.dateRange) {
    params.startDate = options.dateRange.startDate.toISOString();
    params.endDate = options.dateRange.endDate.toISOString();
  }

  const response = await api.get(endpoint, {
    params,
    responseType: "blob",
  });

  return response.data;
};
