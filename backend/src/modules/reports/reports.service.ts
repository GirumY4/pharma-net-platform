// src/modules/reports/reports.service.ts
import mongoose, { Types } from "mongoose";
import InventoryTransaction from "../inventory/inventoryTransaction.model.js";
import Medicine from "../inventory/medicine.model.js";
import Order from "../orders/orders.model.js";
import User from "../users/user.model.js";

interface DashboardReportOptions {
  startDate: Date;
  endDate: Date;
  ordersLimit: number;
  expiryWindowDays: number;
  transactionsLimit: number;
  lowStockLimit: number;
}

interface RevenueTrendPoint {
  date: string;
  label: string;
  revenue: number;
  orders: number;
}

const ORDER_STATUSES = [
  "pending",
  "approved",
  "processing",
  "ready",
  "delivered",
  "rejected",
] as const;

/**
 * Validate ObjectId string format
 */
const isValidObjectId = (id: string): boolean =>
  mongoose.Types.ObjectId.isValid(id);

/**
 * Generate Tenant Inventory Valuation Report
 * Calculates total medicines, low stock items, near-expiry items, and monetary value of current stock.
 *
 * @param pharmacyId - Valid ObjectId string of the pharmacy tenant
 * @returns Aggregated inventory metrics scoped to the tenant
 */
export const generateInventoryReport = async (pharmacyId: string) => {
  if (!isValidObjectId(pharmacyId)) {
    const error = new Error(
      "VALIDATION_ERROR: Invalid pharmacyId format.",
    ) as any;
    error.statusCode = 400;
    error.code = "INVALID_OBJECT_ID";
    throw error;
  }

  const result = await Medicine.aggregate([
    {
      $match: { pharmacyId: new Types.ObjectId(pharmacyId), isDeleted: false },
    },
    {
      $group: {
        _id: null,
        totalMedicines: { $sum: 1 },
        totalStockValue: { $sum: { $multiply: ["$totalStock", "$unitPrice"] } },
        lowStockItems: {
          $sum: {
            $cond: [{ $lt: ["$totalStock", "$reorderThreshold"] }, 1, 0],
          },
        },
        // Count batches expiring within 90 days (FR-2.3, FR-5.3)
        nearExpiryItems: {
          $sum: {
            $cond: [
              {
                $and: [
                  { $gte: ["$batches.expiryDate", new Date()] },
                  {
                    $lte: [
                      "$batches.expiryDate",
                      new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
                    ],
                  },
                ],
              },
              1,
              0,
            ],
          },
        },
      },
    },
  ]);

  return (
    result[0] || {
      totalMedicines: 0,
      totalStockValue: 0,
      lowStockItems: 0,
      nearExpiryItems: 0,
    }
  );
};

/**
 * Generate Tenant Sales & Revenue Statistics
 * Groups revenue by order status and returns top-selling items within date range.
 *
 * @param pharmacyId - Valid ObjectId string of the pharmacy tenant
 * @param startDate - ISO 8601 date string for report window start
 * @param endDate - ISO 8601 date string for report window end
 * @returns Aggregated sales metrics and top medicines
 */
export const generateSalesStatistics = async (
  pharmacyId: string,
  startDate: Date,
  endDate: Date,
) => {
  if (!isValidObjectId(pharmacyId)) {
    const error = new Error(
      "VALIDATION_ERROR: Invalid pharmacyId format.",
    ) as any;
    error.statusCode = 400;
    error.code = "INVALID_OBJECT_ID";
    throw error;
  }

  if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
    const error = new Error(
      "VALIDATION_ERROR: startDate and endDate must be valid ISO 8601 dates.",
    ) as any;
    error.statusCode = 400;
    error.code = "INVALID_DATE_FORMAT";
    throw error;
  }

  if (startDate > endDate) {
    const error = new Error(
      "VALIDATION_ERROR: startDate cannot be after endDate.",
    ) as any;
    error.statusCode = 400;
    error.code = "INVALID_DATE_RANGE";
    throw error;
  }

  const matchStage = {
    pharmacyId: new Types.ObjectId(pharmacyId),
    createdAt: { $gte: startDate, $lte: endDate },
    isDeleted: false,
    status: { $nin: ["rejected", "pending"] }, // Only count fulfilled orders for revenue
  };

  // 1. Calculate Total Revenue & Order Counts
  const summary = await Order.aggregate([
    { $match: matchStage },
    {
      $group: {
        _id: null,
        totalRevenue: { $sum: "$totalAmount" },
        totalOrders: { $sum: 1 },
        deliveredOrders: {
          $sum: { $cond: [{ $eq: ["$status", "delivered"] }, 1, 0] },
        },
      },
    },
  ]);

  // 2. Calculate Top Selling Medicines (Unwind items array)
  const topMedicines = await Order.aggregate([
    { $match: matchStage },
    { $unwind: "$items" },
    {
      $group: {
        _id: "$items.medicineId",
        name: { $first: "$items.medicineName" },
        sku: { $first: "$items.sku" },
        qtySold: { $sum: "$items.quantity" },
        revenue: { $sum: "$items.lineTotal" },
      },
    },
    { $sort: { qtySold: -1 } },
    { $limit: 5 }, // Top 5 per API Documentation §8
  ]);

  return {
    summary: summary[0] || {
      totalRevenue: 0,
      totalOrders: 0,
      deliveredOrders: 0,
    },
    topMedicines,
  };
};

/**
 * Generate all tenant dashboard data in one request.
 *
 * @param pharmacyId - Valid ObjectId string of the pharmacy tenant
 * @param options - Date range and list limits used by dashboard widgets
 * @returns Dashboard KPIs, revenue trend, recent orders, and expiry alerts
 */
export const generateDashboardReport = async (
  pharmacyId: string,
  options: DashboardReportOptions,
) => {
  if (!isValidObjectId(pharmacyId)) {
    const error = new Error(
      "VALIDATION_ERROR: Invalid pharmacyId format.",
    ) as any;
    error.statusCode = 400;
    error.code = "INVALID_OBJECT_ID";
    throw error;
  }

  const {
    startDate,
    endDate,
    ordersLimit,
    expiryWindowDays,
    transactionsLimit,
    lowStockLimit,
  } = options;

  if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
    const error = new Error(
      "VALIDATION_ERROR: startDate and endDate must be valid ISO 8601 dates.",
    ) as any;
    error.statusCode = 400;
    error.code = "INVALID_DATE_FORMAT";
    throw error;
  }

  if (startDate > endDate) {
    const error = new Error(
      "VALIDATION_ERROR: startDate cannot be after endDate.",
    ) as any;
    error.statusCode = 400;
    error.code = "INVALID_DATE_RANGE";
    throw error;
  }

  const pharmacyObjectId = new Types.ObjectId(pharmacyId);
  const orderRangeMatch = {
    pharmacyId: pharmacyObjectId,
    createdAt: { $gte: startDate, $lte: endDate },
    isDeleted: false,
  };
  const transactionRangeMatch = {
    pharmacyId: pharmacyObjectId,
    createdAt: { $gte: startDate, $lte: endDate },
  };
  const revenueMatch = {
    ...orderRangeMatch,
    status: { $nin: ["rejected", "pending"] },
  };
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const todayEnd = new Date();
  todayEnd.setHours(23, 59, 59, 999);
  const expiryCutoff = new Date(
    Date.now() + expiryWindowDays * 24 * 60 * 60 * 1000,
  );

  const [
    inventorySummary,
    pendingOrdersCount,
    revenueSummary,
    todaySalesSummary,
    revenueTrendRows,
    recentOrders,
    expiringBatches,
    orderStatusRows,
    activeCustomerIds,
    rangeCustomerIds,
    lowStockItems,
    recentInventoryTransactions,
    stockMovementRows,
    topMedicines,
  ] = await Promise.all([
    Medicine.aggregate([
      { $match: { pharmacyId: pharmacyObjectId, isDeleted: false } },
      {
        $group: {
          _id: null,
          totalMedicines: { $sum: 1 },
          totalStockValue: {
            $sum: { $multiply: ["$totalStock", "$unitPrice"] },
          },
          lowStockCount: {
            $sum: {
              $cond: [{ $lt: ["$totalStock", "$reorderThreshold"] }, 1, 0],
            },
          },
        },
      },
    ]),
    Order.countDocuments({ ...orderRangeMatch, status: "pending" }),
    Order.aggregate([
      { $match: revenueMatch },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: "$totalAmount" },
          totalOrders: { $sum: 1 },
        },
      },
    ]),
    Order.aggregate([
      {
        $match: {
          pharmacyId: pharmacyObjectId,
          createdAt: { $gte: todayStart, $lte: todayEnd },
          isDeleted: false,
          status: { $nin: ["rejected", "pending"] },
        },
      },
      { $group: { _id: null, todaySales: { $sum: "$totalAmount" } } },
    ]),
    Order.aggregate([
      { $match: revenueMatch },
      {
        $group: {
          _id: {
            $dateToString: { format: "%Y-%m-%d", date: "$createdAt" },
          },
          revenue: { $sum: "$totalAmount" },
          orders: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]),
    Order.find(orderRangeMatch)
      .populate("customerId", "name email phoneNumber")
      .sort({ createdAt: -1 })
      .limit(ordersLimit),
    Medicine.aggregate([
      { $match: { pharmacyId: pharmacyObjectId, isDeleted: false } },
      { $unwind: "$batches" },
      {
        $match: {
          "batches.expiryDate": { $lte: expiryCutoff },
          "batches.quantity": { $gt: 0 },
        },
      },
      { $sort: { "batches.expiryDate": 1 } },
      { $limit: 5 },
      {
        $project: {
          _id: 0,
          medicineId: "$_id",
          medicineName: "$name",
          sku: 1,
          batchNumber: "$batches.batchNumber",
          gtin: "$batches.gtin",
          quantity: "$batches.quantity",
          expiryDate: "$batches.expiryDate",
          shelfLocation: "$batches.shelfLocation",
          daysUntilExpiry: {
            $floor: {
              $divide: [
                { $subtract: ["$batches.expiryDate", new Date()] },
                1000 * 60 * 60 * 24,
              ],
            },
          },
        },
      },
    ]),
    Order.aggregate([
      { $match: orderRangeMatch },
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
        },
      },
    ]),
    Order.distinct("customerId", {
      pharmacyId: pharmacyObjectId,
      isDeleted: false,
    }),
    Order.distinct("customerId", orderRangeMatch),
    Medicine.find({
      pharmacyId: pharmacyObjectId,
      isDeleted: false,
      $expr: { $lt: ["$totalStock", "$reorderThreshold"] },
    })
      .select("name sku category totalStock reorderThreshold unitOfMeasure")
      .sort({ totalStock: 1, updatedAt: -1 })
      .limit(lowStockLimit)
      .lean(),
    InventoryTransaction.find(transactionRangeMatch)
      .populate("medicineId", "name sku")
      .populate("createdBy", "name role")
      .sort({ createdAt: -1 })
      .limit(transactionsLimit)
      .lean(),
    InventoryTransaction.aggregate([
      { $match: transactionRangeMatch },
      {
        $group: {
          _id: "$transactionType",
          quantity: { $sum: "$quantityChanged" },
          transactions: { $sum: 1 },
        },
      },
    ]),
    Order.aggregate([
      { $match: revenueMatch },
      { $unwind: "$items" },
      {
        $group: {
          _id: "$items.medicineId",
          name: { $first: "$items.medicineName" },
          sku: { $first: "$items.sku" },
          qtySold: { $sum: "$items.quantity" },
          revenue: { $sum: "$items.lineTotal" },
        },
      },
      { $sort: { revenue: -1 } },
      { $limit: 5 },
    ]),
  ]);

  const trendByDate = new Map<string, { revenue: number; orders: number }>();
  for (const row of revenueTrendRows) {
    trendByDate.set(row._id, {
      revenue: row.revenue || 0,
      orders: row.orders || 0,
    });
  }

  const revenueTrend: RevenueTrendPoint[] = [];
  const cursor = new Date(startDate);
  cursor.setHours(0, 0, 0, 0);
  const lastDay = new Date(endDate);
  lastDay.setHours(0, 0, 0, 0);

  while (cursor <= lastDay) {
    const key = cursor.toISOString().slice(0, 10);
    const values = trendByDate.get(key) || { revenue: 0, orders: 0 };
    revenueTrend.push({
      date: key,
      label: cursor.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      }),
      revenue: values.revenue,
      orders: values.orders,
    });
    cursor.setDate(cursor.getDate() + 1);
  }

  const cleanRecentOrders = recentOrders.map((order) => {
    const obj = order.toObject() as any;
    delete obj.__v;
    return obj;
  });

  const ordersByStatus = ORDER_STATUSES.reduce(
    (acc, status) => {
      acc[status] = 0;
      return acc;
    },
    {} as Record<(typeof ORDER_STATUSES)[number], number>,
  );
  for (const row of orderStatusRows) {
    if (row._id in ordersByStatus) {
      ordersByStatus[row._id as keyof typeof ordersByStatus] = row.count || 0;
    }
  }

  const stockMovement = stockMovementRows.reduce(
    (acc, row) => {
      if (row._id === "GRN") {
        acc.stockIn += row.quantity || 0;
        acc.stockInTransactions += row.transactions || 0;
      }
      if (row._id === "GIN") {
        acc.stockOut += Math.abs(row.quantity || 0);
        acc.stockOutTransactions += row.transactions || 0;
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

  return {
    totalMedicines: inventorySummary[0]?.totalMedicines || 0,
    lowStockCount: inventorySummary[0]?.lowStockCount || 0,
    totalStockValue: inventorySummary[0]?.totalStockValue || 0,
    pendingOrdersCount,
    activeCustomersCount: activeCustomerIds.length,
    rangeCustomersCount: rangeCustomerIds.length,
    todaySales: todaySalesSummary[0]?.todaySales || 0,
    totalRevenue: revenueSummary[0]?.totalRevenue || 0,
    totalOrders: revenueSummary[0]?.totalOrders || 0,
    ordersByStatus,
    revenueTrend,
    stockMovement,
    lowStockItems,
    topMedicines,
    recentOrders: cleanRecentOrders,
    expiringBatches,
    recentInventoryTransactions,
  };
};

/**
 * Find batches expiring before a certain date (FEFO report)
 *
 * @param pharmacyId - Valid ObjectId string of the pharmacy tenant
 * @param beforeDate - ISO 8601 date string for expiry cutoff
 * @returns Array of medicine batches expiring on or before the cutoff date
 */
export const getExpiringBatches = async (
  pharmacyId: string,
  beforeDate: Date,
) => {
  if (!isValidObjectId(pharmacyId)) {
    const error = new Error(
      "VALIDATION_ERROR: Invalid pharmacyId format.",
    ) as any;
    error.statusCode = 400;
    error.code = "INVALID_OBJECT_ID";
    throw error;
  }

  if (isNaN(beforeDate.getTime())) {
    const error = new Error(
      "VALIDATION_ERROR: before date must be a valid ISO 8601 date.",
    ) as any;
    error.statusCode = 400;
    error.code = "INVALID_DATE_FORMAT";
    throw error;
  }

  return await Medicine.aggregate([
    {
      $match: { pharmacyId: new Types.ObjectId(pharmacyId), isDeleted: false },
    },
    { $unwind: "$batches" },
    {
      $match: {
        "batches.expiryDate": { $lte: beforeDate },
        "batches.quantity": { $gt: 0 },
      },
    },
    { $sort: { "batches.expiryDate": 1 } }, // FEFO order: earliest expiry first
    {
      $project: {
        _id: 0,
        medicineId: "$_id",
        medicineName: "$name",
        sku: 1,
        batchNumber: "$batches.batchNumber",
        gtin: "$batches.gtin", // EFDA traceability (SDS §Ethiopian Regulatory Context)
        quantity: "$batches.quantity",
        expiryDate: "$batches.expiryDate",
        shelfLocation: "$batches.shelfLocation",
        daysUntilExpiry: {
          $floor: {
            $divide: [
              { $subtract: ["$batches.expiryDate", new Date()] },
              1000 * 60 * 60 * 24,
            ],
          },
        },
      },
    },
  ]);
};

/**
 * Admin Platform-Wide Metrics Aggregation
 * Aggregates cross-tenant KPIs for system governance.
 *
 * @returns Platform-wide analytics object
 */
export const getPlatformMetrics = async () => {
  const [tenantCount, medicineCount, orderStats, ordersByStatus] =
    await Promise.all([
      // Active pharmacy tenants
      User.countDocuments({
        role: "pharmacy_manager",
        isActive: true,
        isDeleted: false,
      }),

      // Total medicines across all tenants (excluding soft-deleted)
      Medicine.countDocuments({ isDeleted: false }),

      // Platform GMV and order volume
      Order.aggregate([
        { $match: { isDeleted: false } },
        {
          $group: {
            _id: null,
            totalGMV: { $sum: "$totalAmount" },
            totalOrders: { $sum: 1 },
          },
        },
      ]),

      // Orders grouped by status for dashboard visualization
      Order.aggregate([
        { $match: { isDeleted: false } },
        {
          $group: {
            _id: "$status",
            count: { $sum: 1 },
          },
        },
      ]),
    ]);

  // Transform ordersByStatus array into key-value object
  const statusMap = ordersByStatus.reduce(
    (acc, curr) => {
      acc[curr._id] = curr.count;
      return acc;
    },
    {} as Record<string, number>,
  );

  return {
    activeTenants: tenantCount,
    totalMedicines: medicineCount,
    totalOrders: orderStats[0]?.totalOrders || 0,
    totalGMV: orderStats[0]?.totalGMV || 0,
    ordersByStatus: statusMap,
  };
};
