// src/modules/orders/orders.controller.ts
import type { NextFunction, Request, Response } from "express";
import mongoose, { type ClientSession } from "mongoose";
import { logAction } from "../../utils/auditLogger.js";
import Order from "./orders.model.js";
import {
  processOrderApproval,
  processOrderPlacement,
  processOrderStatusUpdate,
  type PlaceOrderPayload,
  type UpdateOrderStatusPayload,
} from "./orders.service.js";

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
 * POST /api/orders
 * Place a new consumer order targeting a specific pharmacy.
 * Access: 🟢 public_user
 * FR: FR-3.1, FR-3.2
 */
export const createOrder = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  const session: ClientSession = await mongoose.startSession();
  session.startTransaction();

  try {
    const customerId = req.user?.userId;
    if (!customerId) {
      const error = new Error(
        "VALIDATION_ERROR: Missing authenticated user context.",
      ) as any;
      error.statusCode = 401;
      error.code = "MISSING_USER_CONTEXT";
      throw error;
    }

    // Controller-level quick validation (defense-in-depth)
    const payload: PlaceOrderPayload = req.body;
    const requiredFields: (keyof PlaceOrderPayload)[] = [
      "pharmacyId",
      "items",
      "fulfillmentMethod",
    ];
    for (const field of requiredFields) {
      if (!payload[field]) {
        const error = new Error(
          `VALIDATION_ERROR: Missing required field '${String(field)}'.`,
        ) as any;
        error.statusCode = 400;
        error.code = "MISSING_FIELD";
        throw error;
      }
    }
    if (!Array.isArray(payload.items) || payload.items.length === 0) {
      const error = new Error(
        "VALIDATION_ERROR: Order must contain at least one item.",
      ) as any;
      error.statusCode = 400;
      error.code = "EMPTY_ORDER";
      throw error;
    }

    const order = await processOrderPlacement(payload, customerId, session);

    // Audit log: CREATE action with full order snapshot
    await logAction(
      req,
      "CREATE",
      "Order",
      order._id.toString(),
      null,
      sanitizeForResponse(order),
      session,
    );

    await session.commitTransaction();
    session.endSession();

    res.status(201).json({
      success: true,
      message: "Order placed successfully.",
      data: sanitizeForResponse(order),
    });
  } catch (error: any) {
    await session.abortTransaction().catch(() => {});
    session.endSession();

    // Ensure error has statusCode and code for API error handler
    if (!error.statusCode) error.statusCode = 500;
    if (!error.code) error.code = "INTERNAL_ERROR";
    next(error);
  }
};

/**
 * PATCH /api/orders/:id/status
 * Update order status (approve/reject/fulfill).
 * Access: 🟡 pharmacy_manager | 🔴 admin
 * FR: FR-3.3, FR-3.4, NFR-2.5
 */
export const updateOrderStatus = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  const session: ClientSession = await mongoose.startSession();
  session.startTransaction();

  try {
    const { status, rejectionReason, note } = req.body;
    const managerId = req.user?.userId;
    const pharmacyId = req.user?.pharmacyId;

    if (!managerId || !pharmacyId) {
      const error = new Error(
        "VALIDATION_ERROR: Missing tenant context.",
      ) as any;
      error.statusCode = 400;
      error.code = "MISSING_TENANT_CONTEXT";
      throw error;
    }

    if (!status) {
      const error = new Error("VALIDATION_ERROR: status is required.") as any;
      error.statusCode = 400;
      error.code = "MISSING_STATUS";
      throw error;
    }
    // Validate req.params.id is a string and valid ObjectId
    const orderId = req.params.id;
    if (
      typeof orderId !== "string" ||
      !mongoose.Types.ObjectId.isValid(orderId)
    ) {
      const error = new Error(
        "VALIDATION_ERROR: Invalid orderId format.",
      ) as any;
      error.statusCode = 400;
      error.code = "INVALID_OBJECT_ID";
      throw error;
    }

    let order;
    let oldOrderData: any = null;

    if (status === "approved") {
      // Atomic approval with stock deduction
      order = await processOrderApproval(
        orderId,
        pharmacyId,
        managerId,
        session,
      );
    } else {
      // Generic status update (reject, processing, ready, delivered)
      oldOrderData = await Order.findOne({
        _id: orderId,
        pharmacyId,
        isDeleted: false,
      }).session(session);
      if (!oldOrderData) {
        const error = new Error(
          "ORDER_NOT_FOUND: Order not found or access denied.",
        ) as any;
        error.statusCode = 404;
        error.code = "ORDER_NOT_FOUND";
        throw error;
      }
      order = await processOrderStatusUpdate(
        orderId,
        pharmacyId,
        managerId,
        { status, rejectionReason, note } as UpdateOrderStatusPayload,
        session,
      );
    }

    // Audit log: capture before/after for UPDATE actions
    await logAction(
      req,
      status === "approved"
        ? "APPROVE"
        : status === "rejected"
          ? "REJECT"
          : "UPDATE",
      "Order",
      order._id.toString(),
      oldOrderData ? sanitizeForResponse(oldOrderData) : null,
      sanitizeForResponse(order),
      session,
    );

    await session.commitTransaction();
    session.endSession();

    res.status(200).json({
      success: true,
      message: `Order status updated to '${status}'.`,
      data: sanitizeForResponse(order),
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
 * GET /api/orders
 * List orders with role-based scoping and pagination.
 * Access: 🟢 public_user | 🟡 pharmacy_manager | 🔴 admin
 * FR: FR-3.5
 */
export const getOrders = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const page = Math.max(1, parseInt(req.query.page as string, 10) || 1);
    const limit = Math.min(100, parseInt(req.query.limit as string, 10) || 20);
    const skip = (page - 1) * limit;

    const query: Record<string, unknown> = { isDeleted: false };

    // 🔒 Strict role-based scoping
    if (req.user?.role === "public_user") {
      query.customerId = req.user.userId;
    } else if (req.user?.role === "pharmacy_manager") {
      query.pharmacyId = req.user.pharmacyId;
    } else if (req.user?.role === "admin") {
      // Admin may optionally filter by pharmacyId via validated query param
      if (
        req.query.pharmacyId &&
        mongoose.Types.ObjectId.isValid(req.query.pharmacyId as string)
      ) {
        query.pharmacyId = req.query.pharmacyId;
      }
      // If no pharmacyId provided, admin sees cross-tenant orders (allowed per spec)
    } else {
      const error = new Error(
        "FORBIDDEN: Insufficient role to access orders.",
      ) as any;
      error.statusCode = 403;
      error.code = "INSUFFICIENT_ROLE";
      throw error;
    }

    // Optional filters per API Documentation §6
    if (
      req.query.status &&
      [
        "pending",
        "approved",
        "processing",
        "ready",
        "delivered",
        "rejected",
      ].includes(req.query.status as string)
    ) {
      query.status = req.query.status;
    }
    if (
      req.query.paymentStatus &&
      ["unpaid", "partially_paid", "paid"].includes(
        req.query.paymentStatus as string,
      )
    ) {
      query.paymentStatus = req.query.paymentStatus;
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

    const [total, orders] = await Promise.all([
      Order.countDocuments(query),
      Order.find(query)
        .populate("customerId", "name email phoneNumber")
        .populate("pharmacyId", "name address city phoneNumber")
        .populate("items.medicineId", "name sku category")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
    ]);

    res.status(200).json({
      success: true,
      data: orders.map((o) => sanitizeForResponse(o)),
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
 * GET /api/orders/:id
 * Retrieve a single order with full details.
 * Access: 🟢 public_user (own orders) | 🟡 pharmacy_manager (own pharmacy) | 🔴 admin
 * FR: FR-3.5
 */
export const getOrderById = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { id } = req.params;
    if (typeof id !== "string" || !mongoose.Types.ObjectId.isValid(id)) {
      const error = new Error(
        "VALIDATION_ERROR: Invalid orderId format.",
      ) as any;
      error.statusCode = 400;
      error.code = "INVALID_OBJECT_ID";
      throw error;
    }

    const query: any = { _id: id, isDeleted: false };

    // 🔒 Role-based access control
    if (req.user?.role === "public_user") {
      query.customerId = req.user.userId;
    } else if (req.user?.role === "pharmacy_manager") {
      query.pharmacyId = req.user.pharmacyId;
    }
    // Admin can access any order (no additional filter)

    const order = await Order.findOne(query)
      .populate("customerId", "name email phoneNumber address city")
      .populate("pharmacyId", "name address city phoneNumber location")
      .populate("items.medicineId", "name sku category unitOfMeasure")
      .populate("approvedBy", "name")
      .populate("rejectedBy", "name");

    if (!order) {
      const error = new Error(
        "ORDER_NOT_FOUND: Order not found or access denied.",
      ) as any;
      error.statusCode = 404;
      error.code = "ORDER_NOT_FOUND";
      throw error;
    }

    res.status(200).json({
      success: true,
      data: sanitizeForResponse(order),
    });
  } catch (error: any) {
    if (!error.statusCode) error.statusCode = 500;
    if (!error.code) error.code = "INTERNAL_ERROR";
    next(error);
  }
};
