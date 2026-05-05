// src/modules/payments/payments.controller.ts
import type { NextFunction, Request, Response } from "express";
import mongoose, { type ClientSession } from "mongoose";
import { logAction } from "../../utils/auditLogger.js";
import Payment from "./payments.model.js";
import {
  processPaymentRecord,
  type CreatePaymentPayload,
} from "./payments.service.js";

/**
 * Sanitize Mongoose documents for API responses – removes internal fields.
 */
const sanitizeForResponse = (doc: any): Record<string, unknown> => {
  const obj = typeof doc?.toObject === "function" ? doc.toObject() : { ...doc };
  delete obj.__v;
  delete obj.passwordHash;
  return obj;
};

/**
 * Validate ObjectId string format
 */
const isValidObjectId = (id: string): boolean =>
  mongoose.Types.ObjectId.isValid(id);

/**
 * POST /api/payments
 * Record a payment against an order within the pharmacy tenant's boundary.
 * Access: 🟡 pharmacy_manager | 🔴 admin
 * FR: FR-4.1, FR-4.2, FR-4.4
 */
export const createPayment = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  const session: ClientSession = await mongoose.startSession();
  session.startTransaction();

  try {
    const managerId = req.user?.userId;

    if (!managerId) {
      const error = new Error(
        "VALIDATION_ERROR: Missing authenticated user context.",
      ) as any;
      error.statusCode = 401;
      error.code = "MISSING_USER_CONTEXT";
      throw error;
    }

    // Tenant context: pharmacy_manager from JWT, admin from request body
    let pharmacyId: string;
    if (req.user?.role === "pharmacy_manager") {
      pharmacyId = req.user.pharmacyId!;
    } else if (req.user?.role === "admin") {
      pharmacyId = req.body.pharmacyId;
      if (!pharmacyId) {
        const error = new Error(
          "VALIDATION_ERROR: pharmacyId is required for admin payment operations.",
        ) as any;
        error.statusCode = 400;
        error.code = "MISSING_TENANT_CONTEXT";
        throw error;
      }
    } else {
      const error = new Error(
        "FORBIDDEN: Insufficient role to record payments.",
      ) as any;
      error.statusCode = 403;
      error.code = "INSUFFICIENT_ROLE";
      throw error;
    }

    // Controller-level quick validation (defense-in-depth)
    const payload: CreatePaymentPayload = req.body;
    const requiredFields: (keyof CreatePaymentPayload)[] = [
      "orderId",
      "amount",
      "paymentMethod",
    ];
    for (const field of requiredFields) {
      if (payload[field] === undefined || payload[field] === null) {
        const error = new Error(
          `VALIDATION_ERROR: Missing required field '${String(field)}'.`,
        ) as any;
        error.statusCode = 400;
        error.code = "MISSING_FIELD";
        throw error;
      }
    }
    if (typeof payload.amount !== "number" || payload.amount <= 0) {
      const error = new Error(
        "VALIDATION_ERROR: amount must be a positive number.",
      ) as any;
      error.statusCode = 400;
      error.code = "INVALID_AMOUNT";
      throw error;
    }
    if (
      !["bank_transfer", "cash", "mobile_money"].includes(payload.paymentMethod)
    ) {
      const error = new Error(
        "VALIDATION_ERROR: paymentMethod must be bank_transfer, cash, or mobile_money.",
      ) as any;
      error.statusCode = 400;
      error.code = "INVALID_PAYMENT_METHOD";
      throw error;
    }
    if (!isValidObjectId(payload.orderId)) {
      const error = new Error(
        "VALIDATION_ERROR: orderId must be a valid ObjectId.",
      ) as any;
      error.statusCode = 400;
      error.code = "INVALID_OBJECT_ID";
      throw error;
    }

    const { payment, order, totalPaid, remainingBalance } =
      await processPaymentRecord(payload, { managerId, pharmacyId }, session);

    // Audit log: capture order payment status change for financial traceability
    await logAction(
      req,
      "PAYMENT_RECORDED",
      "Order", // Primary resource whose state changed
      order._id.toString(),
      {
        paymentStatus:
          order.paymentStatus === "paid" ? "partially_paid" : "unpaid",
      }, // Simplified before snapshot
      { paymentStatus: order.paymentStatus, totalPaid, remainingBalance },
      session,
    );

    await session.commitTransaction();
    session.endSession();

    res.status(201).json({
      success: true,
      message: "Payment recorded successfully.",
      data: {
        payment: sanitizeForResponse(payment),
        orderPaymentStatus: order.paymentStatus,
        totalPaid,
        remainingBalance,
      },
    });
  } catch (error: any) {
    await session.abortTransaction().catch(() => {});
    session.endSession();

    if (!error.statusCode) error.statusCode = 500;
    if (!error.code) error.code = "INTERNAL_ERROR";
    next(error);
  }
};

/**
 * GET /api/payments
 * List payment records with role-based scoping and pagination.
 * Access: 🟢 public_user | 🟡 pharmacy_manager | 🔴 admin
 * FR: FR-4.3
 */
export const getPayments = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const page = Math.max(1, parseInt(req.query.page as string, 10) || 1);
    const limit = Math.min(100, parseInt(req.query.limit as string, 10) || 20);
    const skip = (page - 1) * limit;

    const query: Record<string, unknown> = {};

    // 🔒 Strict role-based scoping
    if (req.user?.role === "public_user") {
      query.customerId = req.user.userId;
    } else if (req.user?.role === "pharmacy_manager") {
      query.pharmacyId = req.user.pharmacyId;
    } else if (req.user?.role === "admin") {
      // Admin may optionally filter by pharmacyId via validated query param
      if (
        req.query.pharmacyId &&
        isValidObjectId(req.query.pharmacyId as string)
      ) {
        query.pharmacyId = req.query.pharmacyId;
      }
      // If no pharmacyId provided, admin sees cross-tenant payments (allowed per spec)
    } else {
      const error = new Error(
        "FORBIDDEN: Insufficient role to access payments.",
      ) as any;
      error.statusCode = 403;
      error.code = "INSUFFICIENT_ROLE";
      throw error;
    }

    // Optional filters per API Documentation §7
    if (req.query.orderId && isValidObjectId(req.query.orderId as string)) {
      query.orderId = req.query.orderId;
    }
    if (
      req.query.paymentMethod &&
      ["bank_transfer", "cash", "mobile_money"].includes(
        req.query.paymentMethod as string,
      )
    ) {
      query.paymentMethod = req.query.paymentMethod;
    }
    if (
      req.query.status &&
      ["pending", "completed", "failed", "refunded"].includes(
        req.query.status as string,
      )
    ) {
      query.status = req.query.status;
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

    const [total, payments] = await Promise.all([
      Payment.countDocuments(query),
      Payment.find(query)
        .populate("customerId", "name email")
        .populate("pharmacyId", "name")
        .populate("recordedBy", "name")
        .populate("orderId", "status totalAmount")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
    ]);

    res.status(200).json({
      success: true,
      data: payments.map((p) => sanitizeForResponse(p)),
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

/**
 * GET /api/payments/:id
 * Retrieve a single payment record with full details.
 * Access: 🟢 public_user (own payments) | 🟡 pharmacy_manager (own pharmacy) | 🔴 admin
 * FR: FR-4.3
 */
export const getPaymentById = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { id } = req.params;

    if (typeof id !== "string" || !isValidObjectId(id)) {
      const error = new Error(
        "VALIDATION_ERROR: Invalid paymentId format.",
      ) as any;
      error.statusCode = 400;
      error.code = "INVALID_OBJECT_ID";
      throw error;
    }

    const query: Record<string, unknown> = { _id: id };

    // 🔒 Role-based access control
    if (req.user?.role === "public_user") {
      query.customerId = req.user.userId;
    } else if (req.user?.role === "pharmacy_manager") {
      query.pharmacyId = req.user.pharmacyId;
    }
    // Admin can access any payment (no additional filter)

    const payment = await Payment.findOne(query)
      .populate("customerId", "name email phoneNumber")
      .populate("pharmacyId", "name address city phoneNumber")
      .populate("recordedBy", "name role")
      .populate("orderId", "status totalAmount paymentStatus items");

    if (!payment) {
      const error = new Error(
        "PAYMENT_NOT_FOUND: Payment not found or access denied.",
      ) as any;
      error.statusCode = 404;
      error.code = "PAYMENT_NOT_FOUND";
      throw error;
    }

    res.status(200).json({
      success: true,
      data: sanitizeForResponse(payment),
    });
  } catch (error: any) {
    if (!error.statusCode) error.statusCode = 500;
    if (!error.code) error.code = "INTERNAL_ERROR";
    next(error);
  }
};
