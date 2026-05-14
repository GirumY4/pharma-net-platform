// src/modules/reports/reports.controller.ts
import type { NextFunction, Request, Response } from "express";
import mongoose from "mongoose";
import {
  generateDashboardReport,
  generateInventoryReport,
  generateSalesStatistics,
  getExpiringBatches,
  getPlatformMetrics,
} from "./reports.service.js";

/**
 * Validate ObjectId string format
 */
const isValidObjectId = (id: string): boolean =>
  mongoose.Types.ObjectId.isValid(id);

/**
 * Parse and validate ISO 8601 date string
 */
const parseDate = (dateStr: string | undefined, fieldName: string): Date => {
  if (!dateStr) {
    const error = new Error(
      `VALIDATION_ERROR: ${fieldName} is required.`,
    ) as any;
    error.statusCode = 400;
    error.code = "MISSING_DATE_PARAMETER";
    throw error;
  }
  const date = /^\d{4}-\d{2}-\d{2}$/.test(dateStr)
    ? new Date(`${dateStr}T00:00:00`)
    : new Date(dateStr);
  if (isNaN(date.getTime())) {
    const error = new Error(
      `VALIDATION_ERROR: ${fieldName} must be a valid ISO 8601 date.`,
    ) as any;
    error.statusCode = 400;
    error.code = "INVALID_DATE_FORMAT";
    throw error;
  }
  return date;
};

const parseOptionalPositiveInt = (
  value: unknown,
  fallback: number,
  max: number,
): number => {
  const parsed = parseInt(String(value ?? ""), 10);
  if (Number.isNaN(parsed)) return fallback;
  return Math.min(Math.max(parsed, 1), max);
};

const startOfDay = (date: Date): Date => {
  const copy = new Date(date);
  copy.setHours(0, 0, 0, 0);
  return copy;
};

const endOfDay = (date: Date): Date => {
  const copy = new Date(date);
  copy.setHours(23, 59, 59, 999);
  return copy;
};

const getTenantScopedPharmacyId = (
  req: Request,
  reportName: string,
): string => {
  if (req.user?.role === "admin") {
    if (req.query.pharmacyId) {
      if (!isValidObjectId(req.query.pharmacyId as string)) {
        const error = new Error(
          "VALIDATION_ERROR: pharmacyId must be a valid ObjectId.",
        ) as any;
        error.statusCode = 400;
        error.code = "INVALID_OBJECT_ID";
        throw error;
      }
      return req.query.pharmacyId as string;
    }

    const error = new Error(
      `VALIDATION_ERROR: Admin must specify pharmacyId for tenant-scoped ${reportName} report.`,
    ) as any;
    error.statusCode = 400;
    error.code = "MISSING_TENANT_CONTEXT";
    throw error;
  }

  if (req.user?.role === "pharmacy_manager" && req.user.pharmacyId) {
    return req.user.pharmacyId;
  }

  const error = new Error(
    `FORBIDDEN: Insufficient role or missing context to access ${reportName} reports.`,
  ) as any;
  error.statusCode = 403;
  error.code = "INSUFFICIENT_ROLE";
  throw error;
};

/**
 * GET /api/reports/dashboard
 * Generate single-request dashboard data for tenant dashboards.
 * Access: pharmacy_manager | admin
 */
export const getDashboardReport = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const pharmacyId = getTenantScopedPharmacyId(req, "dashboard");
    const now = new Date();
    const defaultStart = new Date(now);
    defaultStart.setDate(defaultStart.getDate() - 6);

    const startDate = req.query.startDate
      ? startOfDay(parseDate(req.query.startDate as string, "startDate"))
      : startOfDay(defaultStart);
    const endDate = req.query.endDate
      ? endOfDay(parseDate(req.query.endDate as string, "endDate"))
      : endOfDay(now);

    if (startDate > endDate) {
      const error = new Error(
        "VALIDATION_ERROR: startDate cannot be after endDate.",
      ) as any;
      error.statusCode = 400;
      error.code = "INVALID_DATE_RANGE";
      throw error;
    }

    const ordersLimit = parseOptionalPositiveInt(req.query.ordersLimit, 5, 25);
    const expiryWindowDays = parseOptionalPositiveInt(
      req.query.expiryWindowDays,
      90,
      365,
    );
    const transactionsLimit = parseOptionalPositiveInt(
      req.query.transactionsLimit,
      5,
      20,
    );
    const lowStockLimit = parseOptionalPositiveInt(
      req.query.lowStockLimit,
      5,
      20,
    );

    const report = await generateDashboardReport(pharmacyId, {
      startDate,
      endDate,
      ordersLimit,
      expiryWindowDays,
      transactionsLimit,
      lowStockLimit,
    });

    const reportData = {
      pharmacyId,
      generatedAt: new Date(),
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      ...report,
    };

    // CSV export handling
    if (req.query.export === "csv") {
      const lines: string[] = [];

      // KPI Summary
      lines.push("=== Dashboard Report ===");
      lines.push(`Generated At,${reportData.generatedAt}`);
      lines.push(`Date Range,${reportData.startDate} to ${reportData.endDate}`);
      lines.push("");
      lines.push("=== Key Performance Indicators ===");
      lines.push("Metric,Value");
      lines.push(`Total Revenue,${reportData.totalRevenue}`);
      lines.push(`Total Orders,${reportData.totalOrders}`);
      lines.push(`Average Order Value,${reportData.averageOrderValue?.toFixed(2) || 0}`);
      lines.push(`Fulfillment Rate,${reportData.fulfillmentRate || 0}%`);
      lines.push(`Total Medicines,${reportData.totalMedicines}`);
      lines.push(`Low Stock Count,${reportData.lowStockCount}`);
      lines.push(`Near Expiry Count,${reportData.nearExpiryCount || 0}`);
      lines.push(`Total Stock Value,${reportData.totalStockValue}`);
      lines.push("");

      // Revenue Trend
      if (reportData.revenueTrend && reportData.revenueTrend.length > 0) {
        lines.push("=== Revenue Trend ===");
        lines.push("Date,Revenue,Orders");
        for (const point of reportData.revenueTrend) {
          lines.push(`${point.date},${point.revenue},${point.orders}`);
        }
        lines.push("");
      }

      // Top Medicines
      if (reportData.topMedicines && reportData.topMedicines.length > 0) {
        lines.push("=== Top Medicines ===");
        lines.push("Name,SKU,Qty Sold,Revenue");
        for (const med of reportData.topMedicines) {
          lines.push(`"${med.name}",${med.sku},${med.qtySold},${med.revenue}`);
        }
        lines.push("");
      }

      // Expiring Batches
      if (reportData.expiringBatches && reportData.expiringBatches.length > 0) {
        lines.push("=== Expiring Batches ===");
        lines.push("Medicine,SKU,Batch,Quantity,Expiry Date,Days Until Expiry");
        for (const batch of reportData.expiringBatches) {
          lines.push(
            `"${batch.medicineName}",${batch.sku},${batch.batchNumber},${batch.quantity},${batch.expiryDate},${batch.daysUntilExpiry}`,
          );
        }
        lines.push("");
      }

      // Recent Transactions
      if (reportData.recentTransactions && reportData.recentTransactions.length > 0) {
        lines.push("=== Recent Transactions ===");
        lines.push("Type,Medicine,Batch,Qty Changed,Date,Reason");
        for (const txn of reportData.recentTransactions) {
          lines.push(
            `${txn.transactionType},"${txn.medicineName}",${txn.batchNumber},${txn.quantityChanged},${txn.createdAt},${txn.reason || ""}`,
          );
        }
      }

      const csvContent = lines.join("\n");
      const fileName = `dashboard-report-${startDate.toISOString().slice(0, 10)}-to-${endDate.toISOString().slice(0, 10)}.csv`;

      res.setHeader("Content-Type", "text/csv; charset=utf-8");
      res.setHeader("Content-Disposition", `attachment; filename="${fileName}"`);
      res.status(200).send(csvContent);
      return;
    }

    res.status(200).json({
      success: true,
      data: reportData,
    });
  } catch (error: any) {
    if (!error.statusCode) error.statusCode = 500;
    if (!error.code) error.code = "INTERNAL_ERROR";
    next(error);
  }
};

/**
 * GET /api/reports/inventory
 * Generate tenant-scoped inventory valuation report.
 * Access: 🟡 pharmacy_manager | 🔴 admin
 * FR: FR-5.1
 */
export const getInventoryReport = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    // 🔒 Tenant context extraction with admin override
    let pharmacyId: string;
    if (req.user?.role === "admin") {
      // Admin may optionally filter by pharmacyId via query param
      if (req.query.pharmacyId) {
        if (!isValidObjectId(req.query.pharmacyId as string)) {
          const error = new Error(
            "VALIDATION_ERROR: pharmacyId must be a valid ObjectId.",
          ) as any;
          error.statusCode = 400;
          error.code = "INVALID_OBJECT_ID";
          throw error;
        }
        pharmacyId = req.query.pharmacyId as string;
      } else {
        // Admin without pharmacyId filter sees cross-tenant aggregate (allowed per spec)
        const error = new Error(
          "VALIDATION_ERROR: Admin must specify pharmacyId for tenant-scoped inventory report.",
        ) as any;
        error.statusCode = 400;
        error.code = "MISSING_TENANT_CONTEXT";
        throw error;
      }
    } else if (req.user?.role === "pharmacy_manager" && req.user.pharmacyId) {
      pharmacyId = req.user.pharmacyId;
    } else {
      const error = new Error(
        "FORBIDDEN: Insufficient role or missing context to access inventory reports.",
      ) as any;
      error.statusCode = 403;
      error.code = "INSUFFICIENT_ROLE";
      throw error;
    }

    const report = await generateInventoryReport(pharmacyId);

    // Optional export handling (CSV/PDF) - stub for future implementation
    if (req.query.export === "csv" || req.query.export === "pdf") {
      // TODO: Implement export logic using a library like 'json2csv' or 'pdfkit'
      // For now, return JSON with export flag acknowledged
    }

    res.status(200).json({
      success: true,
      data: {
        pharmacyId,
        generatedAt: new Date(),
        ...report,
      },
    });
  } catch (error: any) {
    if (!error.statusCode) error.statusCode = 500;
    if (!error.code) error.code = "INTERNAL_ERROR";
    next(error);
  }
};

/**
 * GET /api/reports/sales
 * Generate tenant-scoped sales & revenue statistics.
 * Access: 🟡 pharmacy_manager | 🔴 admin
 * FR: FR-5.2
 */
export const getSalesReport = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    // 🔒 Tenant context extraction with admin override
    let pharmacyId: string;
    if (req.user?.role === "admin") {
      if (req.query.pharmacyId) {
        if (!isValidObjectId(req.query.pharmacyId as string)) {
          const error = new Error(
            "VALIDATION_ERROR: pharmacyId must be a valid ObjectId.",
          ) as any;
          error.statusCode = 400;
          error.code = "INVALID_OBJECT_ID";
          throw error;
        }
        pharmacyId = req.query.pharmacyId as string;
      } else {
        const error = new Error(
          "VALIDATION_ERROR: Admin must specify pharmacyId for tenant-scoped sales report.",
        ) as any;
        error.statusCode = 400;
        error.code = "MISSING_TENANT_CONTEXT";
        throw error;
      }
    } else if (req.user?.role === "pharmacy_manager" && req.user.pharmacyId) {
      pharmacyId = req.user.pharmacyId;
    } else {
      const error = new Error(
        "FORBIDDEN: Insufficient role or missing context to access sales reports.",
      ) as any;
      error.statusCode = 403;
      error.code = "INSUFFICIENT_ROLE";
      throw error;
    }

    const startDate = parseDate(req.query.startDate as string, "startDate");
    const endDate = parseDate(req.query.endDate as string, "endDate");

    const data = await generateSalesStatistics(pharmacyId, startDate, endDate);

    res.status(200).json({
      success: true,
      data: {
        pharmacyId,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        ...data.summary,
        topMedicines: data.topMedicines,
      },
    });
  } catch (error: any) {
    if (!error.statusCode) error.statusCode = 500;
    if (!error.code) error.code = "INTERNAL_ERROR";
    next(error);
  }
};

/**
 * GET /api/reports/expiring
 * Generate tenant-scoped batch expiry forecast (FEFO report).
 * Access: 🟡 pharmacy_manager | 🔴 admin
 * FR: FR-5.3
 */
export const getExpiringReport = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    // 🔒 Tenant context extraction with admin override
    let pharmacyId: string;
    if (req.user?.role === "admin") {
      if (req.query.pharmacyId) {
        if (!isValidObjectId(req.query.pharmacyId as string)) {
          const error = new Error(
            "VALIDATION_ERROR: pharmacyId must be a valid ObjectId.",
          ) as any;
          error.statusCode = 400;
          error.code = "INVALID_OBJECT_ID";
          throw error;
        }
        pharmacyId = req.query.pharmacyId as string;
      } else {
        const error = new Error(
          "VALIDATION_ERROR: Admin must specify pharmacyId for tenant-scoped expiry report.",
        ) as any;
        error.statusCode = 400;
        error.code = "MISSING_TENANT_CONTEXT";
        throw error;
      }
    } else if (req.user?.role === "pharmacy_manager" && req.user.pharmacyId) {
      pharmacyId = req.user.pharmacyId;
    } else {
      const error = new Error(
        "FORBIDDEN: Insufficient role or missing context to access expiry reports.",
      ) as any;
      error.statusCode = 403;
      error.code = "INSUFFICIENT_ROLE";
      throw error;
    }

    const beforeDate = req.query.before
      ? parseDate(req.query.before as string, "before")
      : new Date(Date.now() + 90 * 24 * 60 * 60 * 1000); // Default: 90 days from now

    const items = await getExpiringBatches(pharmacyId, beforeDate);

    res.status(200).json({
      success: true,
      data: {
        pharmacyId,
        generatedAt: new Date(),
        cutoffDate: beforeDate.toISOString(),
        items,
      },
    });
  } catch (error: any) {
    if (!error.statusCode) error.statusCode = 500;
    if (!error.code) error.code = "INTERNAL_ERROR";
    next(error);
  }
};

/**
 * GET /api/reports/platform
 * Generate platform-wide analytics for System Administrators.
 * Access: 🔴 admin only
 * FR: FR-5.5
 */
export const getPlatformReport = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    // 🔒 Admin-only enforcement (RBAC middleware should catch this, but defense-in-depth)
    if (req.user?.role !== "admin") {
      const error = new Error(
        "FORBIDDEN: Platform reports are restricted to System Administrators.",
      ) as any;
      error.statusCode = 403;
      error.code = "INSUFFICIENT_ROLE";
      throw error;
    }

    const metrics = await getPlatformMetrics();

    res.status(200).json({
      success: true,
      data: {
        generatedAt: new Date(),
        ...metrics,
      },
    });
  } catch (error: any) {
    if (!error.statusCode) error.statusCode = 500;
    if (!error.code) error.code = "INTERNAL_ERROR";
    next(error);
  }
};
