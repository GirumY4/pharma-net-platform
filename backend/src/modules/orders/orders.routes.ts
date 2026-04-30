// src/modules/orders/orders.routes.ts
import { Router } from "express";
import {
  createOrder,
  getOrders,
  getOrderById,
  updateOrderStatus,
} from "./orders.controller.js";
import { protect } from "../../middlewares/auth.middleware.js";
import { authorizeRoles } from "../../middlewares/rbac.middleware.js";

const router = Router();

// Apply authentication to all order routes
router.use(protect);

/**
 * @route   GET /api/orders
 * @desc    List orders (role-scoped) with pagination
 * @access  🟢 public_user | 🟡 pharmacy_manager | 🔴 admin
 */
router.get("/", getOrders);

/**
 * @route   POST /api/orders
 * @desc    Place a new consumer order targeting a pharmacy
 * @access  🟢 public_user only
 */
router.post("/", authorizeRoles("public_user"), createOrder);

/**
 * @route   GET /api/orders/:id
 * @desc    Retrieve a single order by ID (role-scoped access)
 * @access  🟢 public_user (own) | 🟡 pharmacy_manager (own pharmacy) | 🔴 admin
 */
router.get("/:id", getOrderById);

/**
 * @route   PATCH /api/orders/:id/status
 * @desc    Update order status (approve/reject/fulfill)
 * @access  🟡 pharmacy_manager | 🔴 admin
 */
router.patch(
  "/:id/status",
  authorizeRoles("pharmacy_manager", "admin"),
  updateOrderStatus,
);

export default router;
