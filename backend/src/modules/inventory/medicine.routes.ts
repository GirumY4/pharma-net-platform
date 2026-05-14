import { Router } from "express";
import { protect } from "../../middlewares/auth.middleware.js";
import { authorizeRoles } from "../../middlewares/rbac.middleware.js";
import {
  createMedicine,
  deleteMedicine,
  getMedicines,
  getMarketplaceMedicineById,
  getMarketplaceMedicines,
  updateMedicine,
} from "./medicine.controller.js";

const router = Router();

router.get("/marketplace", getMarketplaceMedicines);
router.get("/marketplace/:id", getMarketplaceMedicineById);

router.use(protect);

router
  .route("/")
  .get(authorizeRoles(["pharmacy_manager", "admin"]), getMedicines)
  .post(authorizeRoles(["pharmacy_manager", "admin"]), createMedicine);

router
  .route("/:id")
  .patch(authorizeRoles(["pharmacy_manager", "admin"]), updateMedicine)
  .delete(authorizeRoles(["pharmacy_manager", "admin"]), deleteMedicine);

export default router;
