// src/modules/inventory/medicine.routes.ts
import { Router } from "express";
import {
  createMedicine,
  getMedicines,
  getMarketplaceMedicines,
} from "./medicine.controller.js";
import { protect } from "../../middlewares/auth.middleware.js";
import { authorizeRoles } from "../../middlewares/rbac.middleware.js";

const router = Router();

// 🔓 PUBLIC — Global Marketplace Search (no auth required)
router.get("/marketplace", getMarketplaceMedicines);

// 🔒 All routes below require authentication
router.use(protect);

router
  .route("/")
  .get(authorizeRoles(["pharmacy_manager", "admin"]), getMedicines)
  .post(authorizeRoles(["pharmacy_manager", "admin"]), createMedicine);

// TODO: Add PATCH /:id and DELETE /:id later (soft-delete) as per full API spec

export default router;
