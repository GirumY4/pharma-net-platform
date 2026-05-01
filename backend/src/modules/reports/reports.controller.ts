// src/modules/reports/reports.controller.ts
import type { NextFunction, Request, Response } from "express";
import mongoose from "mongoose";
import {
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
  const date = new Date(dateStr);
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
