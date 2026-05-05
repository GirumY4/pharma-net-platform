// src/modules/auth/auth.controller.ts
import crypto from "crypto";
import type { NextFunction, Request, Response } from "express";
import mongoose, { type ClientSession } from "mongoose";
import { logAction } from "../../utils/auditLogger.js";
import { sendEmail } from "../../utils/sendEmail.js";
import User from "../users/user.model.js";
import {
  comparePassword,
  generateToken,
  getResetPasswordToken,
  hashPassword,
} from "./auth.service.js";

/**
 * POST /api/auth/register
 * Matches exact response format and error codes from API_Documentation.md
 */
export const register = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const session: ClientSession = await mongoose.startSession();
  session.startTransaction();

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

    const existingUser = await User.findOne({ email }).session(session);
    if (existingUser) {
      const error = new Error(
        "EMAIL_EXISTS: User with this email already exists.",
      ) as any;
      error.statusCode = 409;
      throw error;
    }

    const hashedPassword = await hashPassword(password);

    const [user] = await User.create(
      [
        {
          name,
          email,
          passwordHash: hashedPassword,
          role,
          phoneNumber,
          address,
          city,
          location,
        },
      ],
      { session },
    );

    if (!user) {
      throw new Error("Failed to create user: insertion returned no document.");
    }

    // Inject user context for the audit logger (user is not yet authenticated)
    req.user = {
      userId: user._id.toString(),
      role: user.role,
      ...(user.role === "pharmacy_manager" && {
        pharmacyId: user._id.toString(),
      }),
    };

    // Audit log (CREATE action) — atomic with user creation
    await logAction(
      req,
      "CREATE",
      "User",
      user._id.toString(),
      null,
      { email: user.email, role: user.role },
      session,
    );

    await session.commitTransaction();
    session.endSession();

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
    await session.abortTransaction().catch(() => {});
    session.endSession();
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

/**
 * POST /api/auth/forgot-password
 * Generates a reset token and sends it via email.
 */
export const forgotPassword = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const user = await User.findOne({
      email: req.body.email,
      isDeleted: false,
    });

    if (!user) {
      const error = new Error(
        "NOT_FOUND: There is no user with that email.",
      ) as any;
      error.statusCode = 404;
      throw error;
    }

    // Get reset token (from service)
    const { resetToken, resetPasswordTokenHash, resetPasswordExpire } =
      getResetPasswordToken();

    // Save hashed token and expiry to database
    user.resetPasswordToken = resetPasswordTokenHash;
    user.resetPasswordExpire = resetPasswordExpire;
    await user.save();

    // Audit log: record that a password reset was requested (security traceability)
    // Inject user context since this endpoint is unauthenticated
    req.user = {
      userId: user._id.toString(),
      role: user.role,
      ...(user.role === "pharmacy_manager" && {
        pharmacyId: user._id.toString(),
      }),
    };
    await logAction(req, "UPDATE", "User", user._id.toString(), null, {
      note: "Password reset requested",
    });

    // Create reset url (this points to your React Frontend)
    const resetUrl = `${req.protocol}://${req.get("host")}/reset-password/${resetToken}`;
    // In production with a frontend, it would be: `${process.env.FRONTEND_URL}/reset-password/${resetToken}`

    const message = `You are receiving this email because you (or someone else) has requested the reset of a password. Please make a PUT request to: \n\n ${resetUrl}`;

    try {
      await sendEmail({
        email: user.email,
        subject: "Pharma-Net Password Reset Token",
        message,
      });

      res
        .status(200)
        .json({ success: true, message: "Email sent successfully." });
    } catch (err) {
      user.resetPasswordToken = undefined;
      user.resetPasswordExpire = undefined;
      await user.save();

      const error = new Error("EMAIL_FAILED: Email could not be sent.") as any;
      error.statusCode = 500;
      throw error;
    }
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/auth/reset-password/:token
 * Verifies token, sets new password.
 */
export const resetPassword = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  const session: ClientSession = await mongoose.startSession();
  session.startTransaction();

  try {
    // Get hashed token from the URL parameter to compare against database
    const rawToken = req.params["token"];
    if (!rawToken || typeof rawToken !== "string") {
      const error = new Error("INVALID_TOKEN: No reset token provided.") as any;
      error.statusCode = 400;
      throw error;
    }
    const resetPasswordTokenHash = crypto
      .createHash("sha256")
      .update(rawToken)
      .digest("hex");

    const user = await User.findOne({
      resetPasswordToken: resetPasswordTokenHash,
      resetPasswordExpire: { $gt: new Date() }, // Ensure token hasn't expired
    }).session(session);

    if (!user) {
      const error = new Error(
        "INVALID_TOKEN: Invalid or expired token.",
      ) as any;
      error.statusCode = 400;
      throw error;
    }

    if (!req.body.password) {
      const error = new Error(
        "VALIDATION_ERROR: Please provide a new password.",
      ) as any;
      error.statusCode = 400;
      throw error;
    }

    // Set new password
    user.passwordHash = await hashPassword(req.body.password);
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save({ session });

    // Create new JWT so user is immediately logged in
    const token = generateToken(user._id.toString(), user.role);

    // Write to Audit Log (Security compliance) — atomic with password change
    // Inject user context since this endpoint is unauthenticated
    req.user = {
      userId: user._id.toString(),
      role: user.role,
      ...(user.role === "pharmacy_manager" && {
        pharmacyId: user._id.toString(),
      }),
    };
    await logAction(
      req,
      "UPDATE",
      "User",
      user._id.toString(),
      null,
      { note: "Password was reset" },
      session,
    );

    await session.commitTransaction();
    session.endSession();

    res.status(200).json({
      success: true,
      message: "Password reset successfully.",
      data: { token },
    });
  } catch (error) {
    await session.abortTransaction().catch(() => {});
    session.endSession();
    next(error);
  }
};
