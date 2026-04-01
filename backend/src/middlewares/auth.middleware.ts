// src/middlewares/auth.middleware.ts
import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

/**
 * Protect middleware — verifies JWT and injects tenant context
 * Matches exact error handling and messages from API_Documentation.md
 */
export const protect = (req: Request, res: Response, next: NextFunction) => {
  let token: string | undefined;

  if (req.headers.authorization?.startsWith("Bearer ")) {
    token = req.headers.authorization.split(" ")[1];
  }

  if (!token) {
    const error = new Error("Not authorized, no token provided") as any;
    error.statusCode = 401;
    return next(error);
  }

  try {
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET as string,
    ) as jwt.JwtPayload;

    req.user = {
      userId: decoded.userId,
      role: decoded.role as any,
      pharmacyId: decoded.pharmacyId, // Only present for pharmacy_manager
    };

    next();
  } catch (err) {
    const error = new Error("Not authorized, token failed or expired") as any;
    error.statusCode = 401;
    next(error);
  }
};
