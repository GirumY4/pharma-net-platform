// src/modules/auditLogs/auditLogs.routes.ts
import { Router } from "express";
import { protect } from "../../middlewares/auth.middleware.js";
import { authorizeRoles } from "../../middlewares/rbac.middleware.js";
import { getAuditLogs } from "./auditLogs.controller.js";

const router = Router();

// Apply authentication to all audit log routes
router.use(protect);

/**
 * @route   GET /api/logs
 * @desc    Retrieve immutable audit logs (role-scoped) with pagination
 * @access  🟡 pharmacy_manager (tenant-scoped) | 🔴 admin (cross-tenant)
 * @query   userId, resourceId, actionType, resource, startDate, endDate, pharmacyId (admin only), page, limit
 */
router.get("/", authorizeRoles(["pharmacy_manager", "admin"]), getAuditLogs);

export default router;
