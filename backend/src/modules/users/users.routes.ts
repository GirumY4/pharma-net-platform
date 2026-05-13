// src/modules/users/users.routes.ts
import { Router } from "express";
import { protect } from "../../middlewares/auth.middleware.js";
import { authorizeRoles } from "../../middlewares/rbac.middleware.js";
import {
  confirmDeactivation,
  confirmReactivation,
  deactivateMe,
  deleteUser,
  getMe,
  getUsers,
  removeProfilePicture,
  requestReactivation,
  updateMe,
  updateUser,
  uploadProfilePicture,
} from "./users.controller.js";

const router = Router();

// Route accessible to any authenticated user
router.get("/me", protect, getMe);
router.patch("/me", protect, updateMe);
router.delete("/me", protect, deactivateMe);
router.post("/confirm-deactivation/:token", confirmDeactivation);

// Routes accessible ONLY to admins
router.route("/").get(protect, authorizeRoles(["admin"]), getUsers);

router.route("/:id").delete(protect, authorizeRoles(["admin"]), deleteUser);

router.post(
  "/:id/request-reactivation",
  protect,
  authorizeRoles(["admin"]),
  requestReactivation,
);
router.post("/confirm-reactivation/:token", confirmReactivation);

// Profile picture upload endpoints
router
  .route("/me/profile-picture")
  .post(protect, uploadProfilePicture)
  .delete(protect, removeProfilePicture);

// Add this to users.routes.ts
router.route("/:id").patch(protect, authorizeRoles(["admin"]), updateUser);
export default router;
