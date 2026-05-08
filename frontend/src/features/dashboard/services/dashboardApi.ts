import api from "../../../services/api";
import type { SuccessResponse } from "../../../types";
import type {
  DashboardApiFilters,
  DashboardData,
  ExpiringBatch,
  InventoryTransaction,
  OrderStatus,
  RecentOrder,
} from "../types";

export const ORDER_STATUSES: OrderStatus[] = [
  "pending",
  "approved",
  "processing",
  "ready",
  "delivered",
  "rejected",
];

type ApiClientError = Error & { status?: number; code?: string };

interface ExpiringReportData {
  items: ExpiringBatch[];
}

interface SalesReportData {
  totalRevenue?: number;
  totalOrders?: number;
  topMedicines?: DashboardData["topMedicines"];
}

const getDefaultRange = () => {
  const end = new Date();
  const start = new Date();
  start.setDate(end.getDate() - 6);

  return {
    startDate: toInputDate(start),
    endDate: toInputDate(end),
  };
};

const toInputDate = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const createEmptyStatusMap = (): DashboardData["ordersByStatus"] =>
  ORDER_STATUSES.reduce(
    (acc, status) => {
      acc[status] = 0;
      return acc;
    },
    {} as DashboardData["ordersByStatus"],
  );

const normalizeDashboardData = (data: Partial<DashboardData>): DashboardData => {
  const defaultData: DashboardData = {
    totalMedicines: 0,
    lowStockCount: 0,
    pendingOrdersCount: 0,
    activeCustomersCount: 0,
    rangeCustomersCount: 0,
    todaySales: 0,
    totalRevenue: 0,
    totalOrders: 0,
    totalStockValue: 0,
    ordersByStatus: createEmptyStatusMap(),
    revenueTrend: [],
    stockMovement: {
      stockIn: 0,
      stockOut: 0,
      stockInTransactions: 0,
      stockOutTransactions: 0,
    },
    lowStockItems: [],
    topMedicines: [],
    recentOrders: [],
    expiringBatches: [],
    recentInventoryTransactions: [],
  };

  return {
    ...defaultData,
    ...data,
    ordersByStatus: {
      ...defaultData.ordersByStatus,
      ...data.ordersByStatus,
    },
    stockMovement: {
      ...defaultData.stockMovement,
      ...data.stockMovement,
    },
  };
};

const shouldFallbackToLegacyEndpoints = (error: unknown) => {
  const apiError = error as ApiClientError;
  return apiError.status === 404 || apiError.code === "NOT_FOUND";
};

/**
 * Fetch aggregated dashboard metrics and operational lists.
 * Preferred path: GET /api/reports/dashboard.
 * Legacy fallback uses the real backend query parameters from orders,
 * medicines, sales reports, expiry reports, and inventory transactions.
 */
export const fetchDashboardData = async (
  filters?: DashboardApiFilters,
  signal?: AbortSignal,
): Promise<DashboardData> => {
  const defaults = getDefaultRange();
  const {
    ordersLimit = 6,
    expiryWindowDays = 90,
    transactionsLimit = 5,
    lowStockLimit = 5,
    startDate = defaults.startDate,
    endDate = defaults.endDate,
  } = filters || {};

  try {
    const response = await api.get<SuccessResponse<DashboardData>>(
      "/reports/dashboard",
      {
        params: {
          ordersLimit,
          expiryWindowDays,
          transactionsLimit,
          lowStockLimit,
          startDate,
          endDate,
        },
        signal,
      },
    );
    return normalizeDashboardData(response.data.data);
  } catch (error) {
    if (!shouldFallbackToLegacyEndpoints(error)) {
      throw error;
    }
  }

  const statusRequests = ORDER_STATUSES.map((status) =>
    api.get<SuccessResponse<RecentOrder[]>>("/orders", {
      params: { status, startDate, endDate, page: 1, limit: 1 },
      signal,
    }),
  );

  const [
    recentOrdersRes,
    pendingOrdersRes,
    medicinesRes,
    lowStockRes,
    expiryRes,
    salesRes,
    transactionsRes,
    ...statusResponses
  ] = await Promise.all([
    api.get<SuccessResponse<RecentOrder[]>>("/orders", {
      params: { startDate, endDate, page: 1, limit: ordersLimit },
      signal,
    }),
    api.get<SuccessResponse<RecentOrder[]>>("/orders", {
      params: { status: "pending", page: 1, limit: ordersLimit },
      signal,
    }),
    api.get<SuccessResponse<unknown[]>>("/medicines", {
      params: { page: 1, limit: 1 },
      signal,
    }),
    api.get<SuccessResponse<DashboardData["lowStockItems"]>>("/medicines", {
      params: { lowStock: true, page: 1, limit: lowStockLimit },
      signal,
    }),
    api.get<SuccessResponse<ExpiringReportData>>("/reports/expiring", {
      params: {
        before: new Date(
          Date.now() + expiryWindowDays * 24 * 60 * 60 * 1000,
        ).toISOString(),
      },
      signal,
    }),
    api.get<SuccessResponse<SalesReportData>>("/reports/sales", {
      params: { startDate, endDate },
      signal,
    }),
    api.get<SuccessResponse<InventoryTransaction[]>>(
      "/inventory-transactions",
      {
        params: { startDate, endDate, page: 1, limit: transactionsLimit },
        signal,
      },
    ),
    ...statusRequests,
  ]);

  const ordersByStatus = createEmptyStatusMap();
  statusResponses.forEach((response, index) => {
    ordersByStatus[ORDER_STATUSES[index]] = response.data.pagination?.total ?? 0;
  });

  const activeCustomerIds = new Set(
    recentOrdersRes.data.data
      .map((order) => order.customerId?._id)
      .filter(Boolean),
  );
  const stockMovement = transactionsRes.data.data.reduce(
    (acc, transaction) => {
      if (transaction.transactionType === "GRN") {
        acc.stockIn += Math.max(transaction.quantityChanged, 0);
        acc.stockInTransactions += 1;
      }
      if (transaction.transactionType === "GIN") {
        acc.stockOut += Math.abs(Math.min(transaction.quantityChanged, 0));
        acc.stockOutTransactions += 1;
      }
      return acc;
    },
    {
      stockIn: 0,
      stockOut: 0,
      stockInTransactions: 0,
      stockOutTransactions: 0,
    },
  );

  return normalizeDashboardData({
    startDate,
    endDate,
    totalMedicines: medicinesRes.data.pagination?.total ?? 0,
    lowStockCount: lowStockRes.data.pagination?.total ?? 0,
    pendingOrdersCount: pendingOrdersRes.data.pagination?.total ?? 0,
    activeCustomersCount: activeCustomerIds.size,
    rangeCustomersCount: activeCustomerIds.size,
    todaySales: 0,
    totalRevenue: salesRes.data.data.totalRevenue ?? 0,
    totalOrders: salesRes.data.data.totalOrders ?? 0,
    totalStockValue: 0,
    ordersByStatus,
    revenueTrend: [],
    stockMovement,
    lowStockItems: lowStockRes.data.data,
    topMedicines: salesRes.data.data.topMedicines ?? [],
    recentOrders: recentOrdersRes.data.data,
    expiringBatches: expiryRes.data.data.items.slice(0, 5),
    recentInventoryTransactions: transactionsRes.data.data,
  });
};

export const updateDashboardOrderStatus = async (
  orderId: string,
  status: Extract<OrderStatus, "approved" | "processing" | "ready" | "delivered">,
): Promise<RecentOrder> => {
  const response = await api.patch<SuccessResponse<RecentOrder>>(
    `/orders/${orderId}/status`,
    { status },
  );
  return response.data.data;
};
