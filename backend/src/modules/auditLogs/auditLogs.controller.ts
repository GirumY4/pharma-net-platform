// src/modules/auditLogs/auditLogs.controller.ts
import type { NextFunction, Request, Response } from "express";
import mongoose from "mongoose";
import AuditLog, { type IAuditLog } from "./auditLogs.model.js";

/**
 * Valid enum values for audit log filtering (per Database_Schema.md §8)
 */
const VALID_ACTION_TYPES = [
  "CREATE",
  "UPDATE",
  "DELETE",
  "LOGIN",
  "LOGOUT",
  "APPROVE",
  "REJECT",
  "PAYMENT_RECORDED",
  "GRN",
  "GIN",
] as const;

const VALID_RESOURCES = [
  "User",
  "Medicine",
  "Order",
  "Payment",
  "InventoryTransaction",
] as const;

type ActionType = (typeof VALID_ACTION_TYPES)[number];
type ResourceType = (typeof VALID_RESOURCES)[number];

/**
 * Validate ObjectId string format
 */
const isValidObjectId = (id: string): boolean =>
  mongoose.Types.ObjectId.isValid(id);

/**
 * Parse and validate ISO 8601 date string
 */
const parseDate = (
  dateStr: string | undefined,
  fieldName: string,
): Date | undefined => {
  if (!dateStr) return undefined;
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
 * Sanitize audit log snapshots for API responses – removes sensitive fields.
 */
const sanitizeSnapshot = (snapshot: any): Record<string, unknown> | null => {
  if (!snapshot) return null;
  const sanitized = { ...snapshot };
  delete sanitized.passwordHash;
  delete sanitized.__v;
  return sanitized;
};

/**
 * GET /api/logs
 * Retrieve the immutable audit log. Read-only.
 * Access: 🟡 pharmacy_manager (tenant-scoped) | 🔴 admin (cross-tenant)
 * FR: FR-5.4, NFR-4.1, ALCOA+
 */
export const getAuditLogs = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const page = Math.max(1, parseInt(req.query.page as string, 10) || 1);
    const limit = Math.min(100, parseInt(req.query.limit as string, 10) || 20);
    const skip = (page - 1) * limit;

    const query: Record<string, unknown> = {};

    // 🔒 Tenant isolation: mandatory scoping per role
    if (req.user?.role === "pharmacy_manager") {
      // Pharmacy managers see ONLY audit logs where the affected resource belongs to their tenant
      // This requires filtering by pharmacyId on the target resource collection
      // For efficiency, we assume auditLogger.ts stamps pharmacyId on write (see Recommendation #1)
      query.pharmacyId = req.user.pharmacyId;
    } else if (req.user?.role === "admin") {
      // Admins may optionally filter by a specific pharmacy tenant via query param
      if (
        req.query.pharmacyId &&
        isValidObjectId(req.query.pharmacyId as string)
      ) {
        query.pharmacyId = req.query.pharmacyId;
      }
      // If no pharmacyId provided, admin sees cross-tenant logs (allowed per spec)
    } else {
      const error = new Error(
        "FORBIDDEN: Insufficient role to access audit logs.",
      ) as any;
      error.statusCode = 403;
      error.code = "INSUFFICIENT_ROLE";
      throw error;
    }

    // Optional dynamic filters with validation (API Documentation §9)
    if (req.query.userId && isValidObjectId(req.query.userId as string)) {
      query.userId = req.query.userId;
    }

    if (
      req.query.resourceId &&
      isValidObjectId(req.query.resourceId as string)
    ) {
      query.resourceId = req.query.resourceId;
    }

    if (req.query.actionType) {
      const actionType = req.query.actionType as string;
      if (!VALID_ACTION_TYPES.includes(actionType as ActionType)) {
        const error = new Error(
          `VALIDATION_ERROR: actionType must be one of: ${VALID_ACTION_TYPES.join(", ")}.`,
        ) as any;
        error.statusCode = 400;
        error.code = "INVALID_ENUM_VALUE";
        throw error;
      }
      query.actionType = actionType;
    }

    if (req.query.resource) {
      const resource = req.query.resource as string;
      if (!VALID_RESOURCES.includes(resource as ResourceType)) {
        const error = new Error(
          `VALIDATION_ERROR: resource must be one of: ${VALID_RESOURCES.join(", ")}.`,
        ) as any;
        error.statusCode = 400;
        error.code = "INVALID_ENUM_VALUE";
        throw error;
      }
      query.resource = resource;
    }

    // Date range filtering with validation
    const startDate = parseDate(req.query.startDate as string, "startDate");
    const endDate = parseDate(req.query.endDate as string, "endDate");

    if (startDate || endDate) {
      query.timestamp = {};
      if (startDate) {
        (query.timestamp as Record<string, unknown>).$gte = startDate;
      }
      if (endDate) {
        (query.timestamp as Record<string, unknown>).$lte = endDate;
      }
      // Validate logical date order
      if (startDate && endDate && startDate > endDate) {
        const error = new Error(
          "VALIDATION_ERROR: startDate cannot be after endDate.",
        ) as any;
        error.statusCode = 400;
        error.code = "INVALID_DATE_RANGE";
        throw error;
      }
    }

    const [total, logs] = await Promise.all([
      AuditLog.countDocuments(query),
      AuditLog.find(query)
        .populate("userId", "name email role") // Show who performed the action
        .sort({ timestamp: -1 }) // Most recent first
        .skip(skip)
        .limit(limit)
        .lean(), // Faster read-only performance
    ]);

    // Sanitize sensitive fields from before/after snapshots
    const sanitizedLogs = logs.map((log: IAuditLog) => ({
      ...log,
      before: sanitizeSnapshot(log.before),
      after: sanitizeSnapshot(log.after),
    }));

    res.status(200).json({
      success: true,
      data: sanitizedLogs,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error: any) {
    if (!error.statusCode) error.statusCode = 500;
    if (!error.code) error.code = "INTERNAL_ERROR";
    next(error);
  }
};
