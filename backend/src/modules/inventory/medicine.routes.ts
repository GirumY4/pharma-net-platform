import { Router } from "express";
import { protect } from "../../middlewares/auth.middleware.js";
import { authorizeRoles } from "../../middlewares/rbac.middleware.js";
import {
  createMedicine,
  getMedicines,
  getMarketplaceMedicineById,
  getMarketplaceMedicines,
} from "./medicine.controller.js";

const router = Router();

router.get("/marketplace", getMarketplaceMedicines);
router.get("/marketplace/:id", getMarketplaceMedicineById);

router.use(protect);

router
  .route("/")
  .get(authorizeRoles(["pharmacy_manager", "admin"]), getMedicines)
  .post(authorizeRoles(["pharmacy_manager", "admin"]), createMedicine);

export default router;
