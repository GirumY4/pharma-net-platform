// src/modules/auth/auth.routes.ts
import { Router } from "express";
import {
  forgotPassword,
  login,
  register,
  resetPassword,
  changePassword,
} from "./auth.controller.js";
import { protect } from "../../middlewares/auth.middleware.js";

const router = Router();

// POST /api/auth/register
router.post("/register", register);

// POST /api/auth/login
router.post("/login", login);

// POST /api/auth/forgot-password
router.post("/forgot-password", forgotPassword);

// PUT /api/auth/reset-password/:token
router.put("/reset-password/:token", resetPassword);

// POST /api/auth/change-password
router.post("/change-password", protect, changePassword);

export default router;
