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

    const frontendUrl =
      process.env.FRONTEND_URL || req.get("origin") || "http://localhost:5173";
    const resetUrl = `${frontendUrl.replace(/\/$/, "")}/reset-password/${encodeURIComponent(resetToken)}`;

    const escapedUserName = user.name
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
    const escapedResetUrl = resetUrl
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
    const expiresInMinutes = Math.max(
      1,
      Math.round((resetPasswordExpire.getTime() - Date.now()) / (60 * 1000)),
    );
    const resetLinkExpiryLabel =
      expiresInMinutes >= 60 && expiresInMinutes % 60 === 0
        ? `${expiresInMinutes / 60} hour${expiresInMinutes === 60 ? "" : "s"}`
        : `${expiresInMinutes} minute${expiresInMinutes === 1 ? "" : "s"}`;

    const plainTextMessage = `Hello ${user.name},

We received a request to reset the password for your Pharma-Net account.

Reset your password:
${resetUrl}

This reset link expires in ${resetLinkExpiryLabel} and can only be used once.

If you did not request this password reset, you can safely ignore this email. Your password will remain unchanged.

Thank you,
The Pharma-Net Security Team

This is an automated message. Please do not reply directly to this email.`;

    const htmlMessage = `
<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Reset your Pharma-Net password</title>
  </head>
  <body style="margin:0; padding:0; background-color:#F8FAFC; font-family:'Inter', Arial, sans-serif; color:#001E2B;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color:#F8FAFC; padding:32px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:640px; background-color:#FFFFFF; border-radius:18px; overflow:hidden; border:1px solid #E5E7EB; box-shadow:0 20px 45px rgba(0, 30, 43, 0.10);">
            <tr>
              <td style="background-color:#00684A; padding:34px 36px;">
                <div style="display:inline-block; width:44px; height:44px; line-height:44px; text-align:center; border-radius:12px; background-color:#00ED64; color:#001E2B; font-size:26px; font-weight:800;">+</div>
                <div style="margin-top:16px; color:#FFFFFF; font-size:26px; line-height:1.2; font-weight:800;">Pharma-Net</div>
                <div style="margin-top:6px; color:rgba(255,255,255,0.76); font-size:14px; line-height:1.6;">Secure account recovery</div>
              </td>
            </tr>
            <tr>
              <td style="padding:38px 36px 18px;">
                <p style="margin:0 0 12px; color:#00684A; font-size:13px; font-weight:800; letter-spacing:0.08em; text-transform:uppercase;">Password reset request</p>
                <h1 style="margin:0 0 18px; color:#001E2B; font-size:30px; line-height:1.18; font-weight:800;">Reset your password</h1>
                <p style="margin:0 0 18px; color:#334155; font-size:16px; line-height:1.7;">Hello ${escapedUserName},</p>
                <p style="margin:0; color:#334155; font-size:16px; line-height:1.7;">We received a request to reset the password for your Pharma-Net account. Use the secure button below to choose a new password.</p>
              </td>
            </tr>
            <tr>
              <td align="center" style="padding:14px 36px 30px;">
                <a href="${escapedResetUrl}" style="display:inline-block; background-color:#00ED64; color:#001E2B; padding:15px 28px; border-radius:10px; font-size:16px; line-height:1; font-weight:800; text-decoration:none;">Reset Password</a>
              </td>
            </tr>
            <tr>
              <td style="padding:0 36px 30px;">
                <div style="background-color:#F1F5F9; border-left:4px solid #00684A; border-radius:12px; padding:18px 20px;">
                  <p style="margin:0 0 8px; color:#001E2B; font-size:15px; line-height:1.6; font-weight:800;">Important security note</p>
                  <p style="margin:0; color:#475569; font-size:14px; line-height:1.7;">This reset link expires in <strong>${resetLinkExpiryLabel}</strong> and can only be used once. If you did not request this password reset, you can safely ignore this email. Your password will remain unchanged.</p>
                </div>
              </td>
            </tr>
            <tr>
              <td style="padding:0 36px 34px;">
                <p style="margin:0 0 10px; color:#64748B; font-size:13px; line-height:1.7;">If the button does not work, copy and paste this link into your browser:</p>
                <p style="margin:0; word-break:break-all; color:#00684A; font-size:13px; line-height:1.7;"><a href="${escapedResetUrl}" style="color:#00684A;">${escapedResetUrl}</a></p>
              </td>
            </tr>
            <tr>
              <td style="background-color:#F8FAFC; padding:22px 36px; border-top:1px solid #E5E7EB;">
                <p style="margin:0; color:#64748B; font-size:12px; line-height:1.7;">This is an automated message from the Pharma-Net Security Team. Please do not reply directly to this email.</p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;

    try {
      const emailOptions: Parameters<typeof sendEmail>[0] & { html: string } = {
        email: user.email,
        subject: "Pharma-Net Password Reset Token",
        message: plainTextMessage,
        html: htmlMessage,
      };

      await sendEmail(emailOptions);

      res
        .status(200)
        .json({ success: true, message: "Email sent successfully." });
    } catch (err) {
      console.error("Password reset email failed:", err);

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
    });

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
    await user.save();

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
    await logAction(req, "UPDATE", "User", user._id.toString(), null, {
      note: "Password was reset",
    });

    res.status(200).json({
      success: true,
      message: "Password reset successfully.",
      data: { token },
    });
  } catch (error) {
    next(error);
  }
};
