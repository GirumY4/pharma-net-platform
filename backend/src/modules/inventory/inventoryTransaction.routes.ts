// src/modules/inventory/inventoryTransaction.routes.ts
import { Router } from "express";
import {
  createTransaction,
  getTransactions,
} from "./inventoryTransaction.controller.js";
import { protect } from "../../middlewares/auth.middleware.js";
import { authorizeRoles } from "../../middlewares/rbac.middleware.js";

const router = Router();

// Apply authentication and RBAC to all inventory transaction routes
router.use(protect);
router.use(authorizeRoles(["admin", "pharmacy_manager"]));

/**
 * @route   POST /api/inventory-transactions
 * @desc    Record a GRN (stock in) or GIN (stock out) adjustment
 * @access  🟡 pharmacy_manager | 🔴 admin
 */
router.post("/", createTransaction);

/**
 * @route   GET /api/inventory-transactions
 * @desc    List inventory transactions (tenant‑scoped) with pagination
 * @access  🟡 pharmacy_manager | 🔴 admin
 */
router.get("/", getTransactions);

export default router;
