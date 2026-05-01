// src/modules/reports/reports.routes.ts
import { Router } from "express";
import { protect } from "../../middlewares/auth.middleware.js";
import { authorizeRoles } from "../../middlewares/rbac.middleware.js";
import {
  getExpiringReport,
  getInventoryReport,
  getPlatformReport,
  getSalesReport,
} from "./reports.controller.js";

const router = Router();

// Apply authentication to all report routes
router.use(protect);

/**
 * @route   GET /api/reports/inventory
 * @desc    Generate tenant-scoped inventory valuation report
 * @access  🟡 pharmacy_manager | 🔴 admin
 * @query   pharmacyId (ObjectId, admin only) - Filter by specific tenant
 * @query   export (csv|pdf, optional) - Trigger file download
 */
router.get(
  "/inventory",
  authorizeRoles(["pharmacy_manager", "admin"]),
  getInventoryReport,
);

/**
 * @route   GET /api/reports/sales
 * @desc    Generate tenant-scoped sales & revenue statistics
 * @access  🟡 pharmacy_manager | 🔴 admin
 * @query   startDate (ISO 8601, required) - Report window start
 * @query   endDate (ISO 8601, required) - Report window end
 * @query   pharmacyId (ObjectId, admin only) - Filter by specific tenant
 * @query   export (csv|pdf, optional) - Trigger file download
 */
router.get(
  "/sales",
  authorizeRoles(["pharmacy_manager", "admin"]),
  getSalesReport,
);

/**
 * @route   GET /api/reports/expiring
 * @desc    Generate tenant-scoped batch expiry forecast (FEFO)
 * @access  🟡 pharmacy_manager | 🔴 admin
 * @query   before (ISO 8601, optional, default: +90 days) - Expiry cutoff date
 * @query   pharmacyId (ObjectId, admin only) - Filter by specific tenant
 * @query   export (csv|pdf, optional) - Trigger file download
 */
router.get(
  "/expiring",
  authorizeRoles(["pharmacy_manager", "admin"]),
  getExpiringReport,
);

/**
 * @route   GET /api/reports/platform
 * @desc    Generate platform-wide analytics for System Administrators
 * @access  🔴 admin only
 */
router.get("/platform", authorizeRoles(["admin"]), getPlatformReport);

export default router;
