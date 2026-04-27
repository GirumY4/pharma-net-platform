// src/modules/inventory/inventoryTransaction.controller.ts
import type { Request, Response, NextFunction } from "express";
import mongoose, { type ClientSession } from "mongoose";
import InventoryTransaction from "./inventoryTransaction.model.js";
import {
  processStockAdjustment,
  type TransactionPayload,
} from "./inventory.service.js";
import { logAction } from "../../utils/auditLogger.js";

/**
 * Sanitize Mongoose documents for audit logging – removes internal fields.
 */
const sanitizeForAudit = (doc: any): Record<string, unknown> => {
  const obj = typeof doc?.toObject === "function" ? doc.toObject() : { ...doc };
  delete obj.__v;
  delete obj.createdAt;
  delete obj.updatedAt;
  delete obj.passwordHash; // Defense‑in‑depth: never log sensitive fields
  return obj;
};

/**
 * Validate that a string is a valid MongoDB ObjectId.
 */
const isValidObjectId = (id: string): boolean =>
  mongoose.Types.ObjectId.isValid(id);

/**
 * POST /api/inventory-transactions
 * Record a GRN (stock in) or GIN (stock out) adjustment.
 *
 * Access: 🟡 pharmacy_manager | 🔴 admin
 * FR: FR-2.7, NFR-4.4
 * SDS: §Technical Logic — atomic stock update via MongoDB session
 */
export const createTransaction = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  const session: ClientSession = await mongoose.startSession();
  session.startTransaction();

  try {
    const userId = req.user?.userId;
    const pharmacyId = req.user?.pharmacyId; // Always from JWT — never from body

    if (!userId || !pharmacyId) {
      const err: any = new Error(
        "VALIDATION_ERROR: Missing authenticated user or tenant context.",
      );
      err.statusCode = 400;
      err.code = "MISSING_TENANT_CONTEXT";
      throw err;
    }

    // Controller‑level quick validation (defense‑in‑depth)
    const payload: TransactionPayload = req.body;
    const requiredFields: (keyof TransactionPayload)[] = [
      "transactionType",
      "medicineId",
      "batchNumber",
      "quantityChanged",
    ];
    for (const field of requiredFields) {
      if (payload[field] === undefined || payload[field] === null) {
        const err: any = new Error(
          `VALIDATION_ERROR: Missing required field '${String(field)}'.`,
        );
        err.statusCode = 400;
        err.code = "MISSING_FIELD";
        throw err;
      }
    }
    if (!["GRN", "GIN"].includes(payload.transactionType)) {
      const err: any = new Error(
        "VALIDATION_ERROR: transactionType must be 'GRN' or 'GIN'.",
      );
      err.statusCode = 400;
      err.code = "INVALID_TRANSACTION_TYPE";
      throw err;
    }
    if (!isValidObjectId(payload.medicineId)) {
      const err: any = new Error(
        "VALIDATION_ERROR: medicineId must be a valid ObjectId.",
      );
      err.statusCode = 400;
      err.code = "INVALID_OBJECT_ID";
      throw err;
    }

    // Execute atomic stock adjustment via service layer
    const { beforeMedicine, afterMedicine, transaction } =
      await processStockAdjustment(payload, { userId, pharmacyId }, session);

    // Audit log: primary resource is Medicine (stock state changed); action is GRN/GIN
    await logAction(
      req,
      payload.transactionType, // actionType: 'GRN' | 'GIN'
      "Medicine", // resource whose state changed
      beforeMedicine._id.toString(),
      sanitizeForAudit(beforeMedicine),
      sanitizeForAudit(afterMedicine),
      session,
    );

    await session.commitTransaction();
    session.endSession();

    res.status(201).json({
      success: true,
      message: `Inventory transaction (${payload.transactionType}) recorded successfully.`,
      data: {
        transaction: sanitizeForAudit(transaction),
        updatedStock: afterMedicine.totalStock,
      },
    });
  } catch (error) {
    await session.abortTransaction().catch(() => {}); // Ensure abort even if commit failed
    session.endSession();
    next(error); // Forward to centralized error handler
  }
};

/**
 * GET /api/inventory-transactions
 * List inventory transactions with tenant scoping and pagination.
 *
 * Access: 🟡 pharmacy_manager | 🔴 admin
 * FR: FR-2.7
 */
export const getTransactions = async (
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
      // Pharmacy managers see ONLY their own tenant's transactions
      query.pharmacyId = req.user.pharmacyId;
    } else if (req.user?.role === "admin") {
      // Admins may optionally filter by pharmacyId via query param (validated)
      if (
        req.query.pharmacyId &&
        isValidObjectId(req.query.pharmacyId as string)
      ) {
        query.pharmacyId = req.query.pharmacyId;
      }
      // If no pharmacyId provided, admin sees cross‑tenant data (allowed per spec)
    } else {
      const err: any = new Error(
        "FORBIDDEN: Insufficient role to access inventory transactions.",
      );
      err.statusCode = 403;
      err.code = "INSUFFICIENT_ROLE";
      throw err;
    }

    // Optional filters
    if (
      req.query.medicineId &&
      isValidObjectId(req.query.medicineId as string)
    ) {
      query.medicineId = req.query.medicineId;
    }
    if (req.query.type && ["GRN", "GIN"].includes(req.query.type as string)) {
      query.transactionType = req.query.type;
    }
    if (req.query.startDate || req.query.endDate) {
      query.createdAt = {};
      if (req.query.startDate) {
        (query.createdAt as Record<string, unknown>).$gte = new Date(
          req.query.startDate as string,
        );
      }
      if (req.query.endDate) {
        (query.createdAt as Record<string, unknown>).$lte = new Date(
          req.query.endDate as string,
        );
      }
    }

    const [total, transactions] = await Promise.all([
      InventoryTransaction.countDocuments(query),
      InventoryTransaction.find(query)
        .populate("medicineId", "name sku")
        .populate("createdBy", "name role")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .session(null), // Read operations don't need the write session
    ]);

    res.status(200).json({
      success: true,
      data: transactions.map((t) => sanitizeForAudit(t)),
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    next(error);
  }
};
