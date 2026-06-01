// src/modules/payments/payments.routes.ts
import { Router } from "express";
import type { NextFunction, Request, Response } from "express";
import { protect } from "../../middlewares/auth.middleware.js";
import { authorizeRoles } from "../../middlewares/rbac.middleware.js";
import { requireApprovedPharmacy } from "../../middlewares/approval.middleware.js";
import {
  createPayment,
  getPaymentById,
  getPayments,
} from "./payments.controller.js";

const router = Router();
const ORDER_PAYMENT_SYSTEM_ENABLED = false;

const requireOrderPaymentsEnabled = (
  _req: Request,
  res: Response,
  next: NextFunction,
) => {
  if (ORDER_PAYMENT_SYSTEM_ENABLED) {
    return next();
  }

  return res.status(503).json({
    success: false,
    error: {
      code: "FEATURE_DISABLED",
      message: "Order payment records are temporarily disabled.",
    },
  });
};

// Apply authentication to all payment routes
router.use(protect);
router.use(requireApprovedPharmacy);
router.use(requireOrderPaymentsEnabled);

/**
 * @route   GET /api/payments
 * @desc    List payment records (role-scoped) with pagination
 * @access  🟢 public_user | 🟡 pharmacy_manager | 🔴 admin
 */
router.get("/", getPayments);

/**
 * @route   POST /api/payments
 * @desc    Record a payment against an order (tenant-scoped)
 * @access  🟡 pharmacy_manager | 🔴 admin
 */
router.post("/", authorizeRoles(["pharmacy_manager", "admin"]), createPayment);

/**
 * @route   GET /api/payments/:id
 * @desc    Retrieve a single payment record by ID (role-scoped access)
 * @access  🟢 public_user (own) | 🟡 pharmacy_manager (own pharmacy) | 🔴 admin
 */
router.get("/:id", getPaymentById);

export default router;
