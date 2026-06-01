import type { Request, Response, NextFunction } from "express";
import User from "../modules/users/user.model.js";

/**
 * Middleware to enforce that a pharmacy manager has been approved/permitted by the admin.
 * A pharmacy is considered approved if its subscriptionStatus is "active" and
 * the approved billing period has not expired.
 * Admins are exempted from this check.
 */
export const requireApprovedPharmacy = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: {
          code: "UNAUTHORIZED",
          message: "Not authorized, no token provided.",
        },
      });
    }

    // Admins do not represent a single pharmacy tenant subject to subscription approval
    if (req.user.role === "admin") {
      return next();
    }

    if (req.user.role === "pharmacy_manager") {
      const user = await User.findById(req.user.userId);
      if (!user || user.isDeleted) {
        return res.status(404).json({
          success: false,
          error: {
            code: "NOT_FOUND",
            message: "User account not found.",
          },
        });
      }

      if (!user.isActive) {
        return res.status(403).json({
          success: false,
          error: {
            code: "ACCOUNT_INACTIVE",
            message: "ACCOUNT_INACTIVE: Account has been deactivated by an admin.",
          },
        });
      }

      const periodEnd = user.subscriptionCurrentPeriodEnd;
      const hasActiveSubscription =
        user.subscriptionStatus === "active" &&
        periodEnd instanceof Date &&
        periodEnd.getTime() > Date.now();

      if (!hasActiveSubscription) {
        return res.status(403).json({
          success: false,
          error: {
            code: "SUBSCRIPTION_REQUIRED",
            message:
              "SUBSCRIPTION_REQUIRED: Pharmacy access requires an active admin-approved subscription.",
          },
        });
      }
    }

    next();
  } catch (error) {
    next(error);
  }
};
