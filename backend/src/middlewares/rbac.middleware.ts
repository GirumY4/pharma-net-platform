// src/middlewares/rbac.middleware.ts
import type { Request, Response, NextFunction } from "express";

export const authorizeRoles =
  (allowedRoles: ("admin" | "pharmacy_manager" | "public_user")[]) =>
  (req: Request, res: Response, next: NextFunction) => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        status: 403,
        message: "Forbidden: Insufficient permissions",
      });
    }
    next();
  };
