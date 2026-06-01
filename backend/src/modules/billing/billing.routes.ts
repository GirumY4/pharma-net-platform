import { Router } from "express";
import { protect } from "../../middlewares/auth.middleware.js";
import { authorizeRoles } from "../../middlewares/rbac.middleware.js";
import {
  getBillingPlans,
  getMyBilling,
  listBillingSubmissions,
  reviewBillingPayment,
  submitBillingPayment,
} from "./billing.controller.js";

const router = Router();

router.get("/plans", getBillingPlans);

router.get(
  "/me",
  protect,
  authorizeRoles(["pharmacy_manager"]),
  getMyBilling,
);

router.post(
  "/submissions",
  protect,
  authorizeRoles(["pharmacy_manager"]),
  submitBillingPayment,
);

router.get(
  "/submissions",
  protect,
  authorizeRoles(["admin"]),
  listBillingSubmissions,
);

router.patch(
  "/submissions/:id/review",
  protect,
  authorizeRoles(["admin"]),
  reviewBillingPayment,
);

export default router;
