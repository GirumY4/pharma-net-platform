// src/modules/auth/auth.controller.ts
import type { Request, Response, NextFunction } from "express";
import User from "../users/user.model.js";
import {
  hashPassword,
  comparePassword,
  generateToken,
} from "./auth.service.js";
import { logAction } from "../../utils/auditLogger.js";

/**
 * POST /api/auth/register
 * Matches exact response format and error codes from API_Documentation.md
 */
export const register = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const {
      name,
      email,
      password,
      role,
      phoneNumber,
      address,
      city,
      location,
    } = req.body;

    // Role is required per API spec
    if (!role) {
      const error = new Error("VALIDATION_ERROR: Role is required") as any;
      error.statusCode = 400;
      throw error;
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      const error = new Error(
        "EMAIL_EXISTS: User with this email already exists.",
      ) as any;
      error.statusCode = 409;
      throw error;
    }

    const hashedPassword = await hashPassword(password);

    const user = await User.create({
      name,
      email,
      passwordHash: hashedPassword,
      role,
      phoneNumber,
      address,
      city,
      location,
    });

    // Audit log (CREATE action)
    await logAction(req, "CREATE", "User", user._id.toString(), null, {
      email: user.email,
      role: user.role,
    });

    // Exact response format required by API_Documentation.md
    res.status(201).json({
      success: true,
      message: "User registered successfully.",
      data: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        phoneNumber: user.phoneNumber,
        address: user.address,
        city: user.city,
        location: user.location,
        isActive: user.isActive,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/auth/login
 * Correctly separates ACCOUNT_INACTIVE (403) from INVALID_CREDENTIALS (401)
 */
export const login = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email, isDeleted: false });

    if (!user) {
      const error = new Error(
        "INVALID_CREDENTIALS: Email not found or password incorrect.",
      ) as any;
      error.statusCode = 401;
      throw error;
    }

    if (!user.isActive) {
      const error = new Error(
        "ACCOUNT_INACTIVE: Account has been deactivated by an admin.",
      ) as any;
      error.statusCode = 403;
      throw error;
    }

    const isMatch = await comparePassword(password, user.passwordHash);
    if (!isMatch) {
      const error = new Error(
        "INVALID_CREDENTIALS: Email not found or password incorrect.",
      ) as any;
      error.statusCode = 401;
      throw error;
    }

    const token = generateToken(user._id.toString(), user.role);

    // Audit log (LOGIN action)
    await logAction(req, "LOGIN", "User", user._id.toString());

    res.status(200).json({
      success: true,
      message: "Login successful.",
      data: {
        token,
        expiresIn: process.env.JWT_EXPIRATION || "8h",
        user: {
          _id: user._id,
          name: user.name,
          role: user.role,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};
