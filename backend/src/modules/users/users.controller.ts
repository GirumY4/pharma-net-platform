/// <reference types="multer" />
import crypto from "crypto";
import type { NextFunction, Request, Response } from "express";
import fs from "fs/promises";
import mongoose, { type ClientSession } from "mongoose";
import multer from "multer";
import path from "path";
import { logAction } from "../../utils/auditLogger.js";
import { sendEmail } from "../../utils/sendEmail.js";
import User from "./user.model.js";

// ─── Type for query filters (improves type safety) ─────────────────────────
interface UserFilter {
  isDeleted?: boolean;
  role?: "admin" | "pharmacy_manager" | "public_user";
  isActive?: boolean;
}

// ─── Helper: remove sensitive fields before audit logging ──────────────────
const sanitizeUser = (userDoc: any) => {
  const obj = userDoc.toObject ? userDoc.toObject() : userDoc;
  delete obj.passwordHash;
  delete obj.__v; // optional, removes mongoose version key
  return obj;
};

// Configure Multer for profile picture uploads
const storage = multer.diskStorage({
  destination: async (
    req: Request,
    file: Express.Multer.File,
    cb: (error: Error | null, destination: string) => void,
  ) => {
    const uploadDir = path.join(process.cwd(), "uploads", "profile-pictures");
    await fs.mkdir(uploadDir, { recursive: true });
    cb(null, uploadDir);
  },
  filename: (
    req: Request,
    file: Express.Multer.File,
    cb: (error: Error | null, filename: string) => void,
  ) => {
    const userId = req.user?.userId;
    const ext = path.extname(file.originalname);
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `profile-${userId}-${uniqueSuffix}${ext}`);
  },
});

const fileFilter = (
  req: Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback,
) => {
  const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Only JPG, PNG, or WebP images are allowed"));
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
  },
});

const getFrontendBaseUrl = (req: Request) =>
  (process.env.FRONTEND_URL || req.get("origin") || "http://localhost:5173").replace(
    /\/$/,
    "",
  );

const escapeHtml = (value: string) =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");

const deleteUploadedFile = async (pictureUrl?: string | null) => {
  if (!pictureUrl) return;

  const filePath = path.join(process.cwd(), pictureUrl.replace(/^\//, ""));
  await fs.unlink(filePath).catch(() => {
    console.warn(`Could not delete profile picture: ${filePath}`);
  });
};

const buildAccountActionEmail = ({
  title,
  eyebrow,
  greetingName,
  body,
  buttonLabel,
  actionUrl,
  note,
}: {
  title: string;
  eyebrow: string;
  greetingName: string;
  body: string;
  buttonLabel: string;
  actionUrl: string;
  note: string;
}) => {
  const safeName = escapeHtml(greetingName);
  const safeBody = escapeHtml(body);
  const safeNote = escapeHtml(note);
  const safeUrl = escapeHtml(actionUrl);

  return `
<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${escapeHtml(title)}</title>
  </head>
  <body style="margin:0; padding:0; background-color:#F8FAFC; font-family:Arial, sans-serif; color:#17231F;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color:#F8FAFC; padding:32px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:640px; background-color:#FFFFFF; border-radius:18px; overflow:hidden; border:1px solid #E5E7EB; box-shadow:0 20px 45px rgba(23, 35, 31, 0.10);">
            <tr>
              <td style="background-color:#0F5E4D; padding:34px 36px;">
                <div style="display:inline-block; width:44px; height:44px; line-height:44px; text-align:center; border-radius:12px; background-color:#DDAA4A; color:#17231F; font-size:26px; font-weight:800;">+</div>
                <div style="margin-top:16px; color:#FFFFFF; font-size:26px; line-height:1.2; font-weight:800;">Pharma-Net</div>
                <div style="margin-top:6px; color:rgba(255,255,255,0.76); font-size:14px; line-height:1.6;">Account verification</div>
              </td>
            </tr>
            <tr>
              <td style="padding:38px 36px 18px;">
                <p style="margin:0 0 12px; color:#0F5E4D; font-size:13px; font-weight:800; letter-spacing:0.08em; text-transform:uppercase;">${escapeHtml(eyebrow)}</p>
                <h1 style="margin:0 0 18px; color:#17231F; font-size:30px; line-height:1.18; font-weight:800;">${escapeHtml(title)}</h1>
                <p style="margin:0 0 18px; color:#334155; font-size:16px; line-height:1.7;">Hello ${safeName},</p>
                <p style="margin:0; color:#334155; font-size:16px; line-height:1.7;">${safeBody}</p>
              </td>
            </tr>
            <tr>
              <td align="center" style="padding:14px 36px 30px;">
                <a href="${safeUrl}" style="display:inline-block; background-color:#0F5E4D; color:#FFFFFF; padding:15px 28px; border-radius:10px; font-size:16px; line-height:1; font-weight:800; text-decoration:none;">${escapeHtml(buttonLabel)}</a>
              </td>
            </tr>
            <tr>
              <td style="padding:0 36px 30px;">
                <div style="background-color:#FFFBEB; border-left:4px solid #DDAA4A; border-radius:12px; padding:18px 20px;">
                  <p style="margin:0 0 8px; color:#8A5F16; font-size:15px; line-height:1.6; font-weight:800;">Important</p>
                  <p style="margin:0; color:#8A5F16; font-size:14px; line-height:1.7;">${safeNote}</p>
                </div>
              </td>
            </tr>
            <tr>
              <td style="padding:0 36px 34px;">
                <p style="margin:0 0 10px; color:#64748B; font-size:13px; line-height:1.7;">If the button does not work, copy and paste this link into your browser:</p>
                <p style="margin:0; word-break:break-all; color:#0F5E4D; font-size:13px; line-height:1.7;"><a href="${safeUrl}" style="color:#0F5E4D;">${safeUrl}</a></p>
              </td>
            </tr>
            <tr>
              <td style="background-color:#F8FAFC; padding:22px 36px; border-top:1px solid #E5E7EB;">
                <p style="margin:0; color:#64748B; font-size:12px; line-height:1.7;">This is an automated message from Pharma-Net. Please do not reply directly to this email.</p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
};

// @desc    Get logged in user profile
// @route   GET /api/users/me
// @access  Private (All Roles)
export const getMe = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    if (!req.user) {
      const error = new Error("User not authenticated") as any;
      error.statusCode = 401;
      return next(error);
    }
    const user = await User.findById(req.user?.userId).select(
      "-passwordHash -isDeleted -deletedAt",
    );

    if (!user || user.isDeleted) {
      const error = new Error("User not found") as any;
      error.statusCode = 404;
      return next(error);
    }

    res.status(200).json({
      success: true,
      data: user,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update logged in user profile
// @route   PATCH /api/users/me
// @access  Private (All Roles)
export const updateMe = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    if (!req.user) {
      const error = new Error("User not authenticated") as any;
      error.statusCode = 401;
      return next(error);
    }

    // Fields that can be updated
    const { name, phoneNumber, address, city, location } = req.body;

    const user = await User.findById(req.user.userId);
    if (!user || user.isDeleted) {
      const error = new Error("User not found") as any;
      error.statusCode = 404;
      return next(error);
    }

    const oldData = sanitizeUser(user);

    if (name) user.name = name;
    if (phoneNumber !== undefined) user.phoneNumber = phoneNumber;
    if (address !== undefined) user.address = address;
    if (city !== undefined) user.city = city;
    if (location !== undefined) user.location = location;

    await user.save();

    await logAction(
      req,
      "UPDATE",
      "User",
      user._id.toString(),
      oldData,
      sanitizeUser(user),
    );

    const updatedUser = await User.findById(req.user.userId).select(
      "-passwordHash -isDeleted -deletedAt",
    );

    res.status(200).json({
      success: true,
      data: updatedUser,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all users (with pagination)
// @route   GET /api/users
// @access  Private/Admin
export const getUsers = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const page = parseInt(req.query.page as string, 10) || 1;
    const limit = parseInt(req.query.limit as string, 10) || 20;
    const startIndex = (page - 1) * limit;

    const query: UserFilter = { isDeleted: false };
    if (req.query.role)
      query.role = req.query.role as
        | "admin"
        | "pharmacy_manager"
        | "public_user";
    if (req.query.isActive !== undefined)
      query.isActive = req.query.isActive === "true";
    if (req.query.includeDeleted === "true") delete query.isDeleted;

    const total = await User.countDocuments(query);
    const users = await User.find(query)
      .select("-passwordHash")
      .skip(startIndex)
      .limit(limit);

    res.status(200).json({
      success: true,
      data: users,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Soft Delete User
// @route   DELETE /api/users/:id
// @access  Private/Admin
export const deleteUser = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  // Start a MongoDB session for transaction (requires replica set)
  const session: ClientSession = await mongoose.startSession();
  session.startTransaction();
  try {
    const user = await User.findById(req.params.id);
    if (!user || user.isDeleted) {
      const error = new Error("User not found") as any;
      error.statusCode = 404;
      await session.abortTransaction();
      session.endSession();
      return next(error);
    }

    const oldData = sanitizeUser(user);

    // NFR-4.2: Proper soft delete with deletedAt
    user.isDeleted = true;
    user.isActive = false;
    user.deletedAt = new Date();
    await user.save({ session });

    // ALCOA+ Audit Log
    await logAction(
      req,
      "DELETE",
      "User",
      user._id.toString(),
      oldData,
      sanitizeUser(user),
      session,
    );
    // Commit the transaction – both save and log succeed or fail together
    await session.commitTransaction();
    session.endSession();

    res.status(200).json({
      success: true,
      message: "User account has been deactivated and soft-deleted.",
    });
  } catch (error) {
    // Abort the transaction on error and Rollback any changes
    await session.abortTransaction();
    session.endSession();
    next(error);
  }
};
/**
 * POST /api/users/me/profile-picture
 * Upload a new profile picture for the authenticated user
 * Access: 🟢 public_user | 🟡 pharmacy_manager | 🔴 admin
 */
export const uploadProfilePicture = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  upload.single("profilePicture")(req, res, async (err: any) => {
    if (err) {
      const error: any = new Error(err.message || "File upload failed");
      error.statusCode = 400;
      error.code = "UPLOAD_ERROR";
      return next(error);
    }

    if (!req.file) {
      const error: any = new Error("No file uploaded");
      error.statusCode = 400;
      error.code = "NO_FILE_UPLOADED";
      return next(error);
    }

    try {
      const userId = req.user?.userId;
      if (!userId) {
        await fs.unlink(req.file.path).catch(() => {});
        const error: any = new Error("User not authenticated");
        error.statusCode = 401;
        error.code = "MISSING_USER_CONTEXT";
        return next(error);
      }

      const profilePictureUrl = `/uploads/profile-pictures/${req.file.filename}`;
      const user = await User.findById(userId);

      if (!user) {
        // Clean up uploaded file if user update fails
        await fs.unlink(req.file.path).catch(() => {});
        const error: any = new Error("User not found");
        error.statusCode = 404;
        error.code = "USER_NOT_FOUND";
        return next(error);
      }

      const oldPictureUrl = user.profilePictureUrl;
      user.profilePictureUrl = profilePictureUrl;
      await user.save();

      if (oldPictureUrl && oldPictureUrl !== profilePictureUrl) {
        await deleteUploadedFile(oldPictureUrl);
      }

      // Audit log the profile picture update
      await logAction(
        req,
        "UPDATE",
        "User",
        userId,
        { profilePictureUrl: oldPictureUrl || null },
        { profilePictureUrl },
      );

      res.status(200).json({
        success: true,
        message: "Profile picture updated successfully.",
        data: {
          profilePictureUrl,
        },
      });
    } catch (error) {
      // Clean up uploaded file on error
      if (req.file?.path) {
        await fs.unlink(req.file.path).catch(() => {});
      }
      next(error);
    }
  });
};

/**
 * DELETE /api/users/me/profile-picture
 * Remove the authenticated user's profile picture
 * Access: 🟢 public_user | 🟡 pharmacy_manager | 🔴 admin
 */
export const removeProfilePicture = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      const error: any = new Error("User not authenticated");
      error.statusCode = 401;
      error.code = "MISSING_USER_CONTEXT";
      return next(error);
    }

    const user = await User.findById(userId);
    if (!user) {
      const error: any = new Error("User not found");
      error.statusCode = 404;
      error.code = "USER_NOT_FOUND";
      return next(error);
    }

    const oldPictureUrl = user.profilePictureUrl;

    // Remove profile picture URL from user document
    user.profilePictureUrl = undefined;
    await user.save();

    await deleteUploadedFile(oldPictureUrl);

    // Audit log the profile picture removal
    await logAction(
      req,
      "UPDATE",
      "User",
      userId,
      { profilePictureUrl: oldPictureUrl },
      { profilePictureUrl: null },
    );

    res.status(200).json({
      success: true,
      message: "Profile picture removed successfully.",
    });
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /api/users/me
 * Request self-deactivation of account (sends confirmation email)
 * Access: 🟢 public_user | 🟡 pharmacy_manager | 🔴 admin
 */
export const deactivateMe = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  const session: ClientSession = await mongoose.startSession();
  session.startTransaction();
  try {
    const userId = req.user?.userId;
    const user = await User.findById(userId);

    if (!user || user.isDeleted) {
      const error: any = new Error("User not found");
      error.statusCode = 404;
      await session.abortTransaction();
      session.endSession();
      return next(error);
    }

    // Generate deactivation token
    const deactivationToken = crypto.randomBytes(20).toString("hex");
    user.deactivationToken = crypto
      .createHash("sha256")
      .update(deactivationToken)
      .digest("hex");
    user.deactivationExpire = new Date(Date.now() + 1 * 60 * 60 * 1000); // 1 hour

    await user.save({ session });

    const deactivationUrl = `${getFrontendBaseUrl(req)}/confirm-deactivation/${encodeURIComponent(deactivationToken)}`;

    const message = `Hello ${user.name},

You requested to deactivate your Pharma-Net account.

Confirm deactivation:
${deactivationUrl}

This link is valid for 1 hour. If you did not request this, ignore this email and your account will remain active.`;

    try {
      await sendEmail({
        email: user.email,
        subject: "Account Deactivation Confirmation",
        message,
        html: buildAccountActionEmail({
          title: "Confirm account deactivation",
          eyebrow: "Email verification required",
          greetingName: user.name,
          body:
            "You requested to deactivate your Pharma-Net account. Use the secure button below to verify this request.",
          buttonLabel: "Confirm Deactivation",
          actionUrl: deactivationUrl,
          note:
            "This link is valid for 1 hour. If you did not request this change, ignore this email and your account will remain active.",
        }),
      });

      await logAction(
        req,
        "UPDATE",
        "User",
        userId || "unknown",
        { deactivationRequested: true },
        { deactivationTokenPending: true },
        session,
      );

      await session.commitTransaction();
      session.endSession();

      res.status(200).json({
        success: true,
        message:
          "A confirmation email has been sent to your registered email address.",
      });
    } catch (err) {
      user.deactivationToken = undefined;
      user.deactivationExpire = undefined;
      await user.save({ session });
      await session.commitTransaction();
      session.endSession();

      const error: any = new Error("Email could not be sent");
      error.statusCode = 500;
      return next(error);
    }
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    next(error);
  }
};

/**
 * POST /api/users/confirm-deactivation/:token
 * Confirm account deactivation via token
 * Access: ⚪ Public
 */
export const confirmDeactivation = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  const session: ClientSession = await mongoose.startSession();
  session.startTransaction();
  try {
    const { token } = req.params;
    if (!token || typeof token !== "string") {
      const error: any = new Error("Invalid or missing token");
      error.statusCode = 400;
      await session.abortTransaction();
      session.endSession();
      return next(error);
    }

    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

    const user = await User.findOne({
      deactivationToken: hashedToken,
      deactivationExpire: { $gt: Date.now() },
    });

    if (!user || user.isDeleted) {
      const error: any = new Error("Invalid or expired token");
      error.statusCode = 400;
      await session.abortTransaction();
      session.endSession();
      return next(error);
    }

    const oldData = sanitizeUser(user);

    // Finalize deactivation
    user.isDeleted = true;
    user.isActive = false;
    user.deletedAt = new Date();
    user.deactivationToken = undefined;
    user.deactivationExpire = undefined;

    await user.save({ session });

    await logAction(
      req,
      "DELETE",
      "User",
      user._id.toString(),
      oldData,
      sanitizeUser(user),
      session,
    );

    await session.commitTransaction();
    session.endSession();

    res.status(200).json({
      success: true,
      message: "Your account has been successfully deactivated.",
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    next(error);
  }
};

/**
 * POST /api/users/:id/request-reactivation
 * Admin requests reactivation for a deactivated user
 * Access: 🔴 admin
 */
export const requestReactivation = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      const error: any = new Error("User not found");
      error.statusCode = 404;
      return next(error);
    }

    if (!user.isDeleted) {
      const error: any = new Error("User is already active");
      error.statusCode = 400;
      return next(error);
    }

    // Generate reactivation token
    const reactivationToken = crypto.randomBytes(20).toString("hex");
    user.reactivationToken = crypto
      .createHash("sha256")
      .update(reactivationToken)
      .digest("hex");
    user.reactivationExpire = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    await user.save();

    const reactivationUrl = `${getFrontendBaseUrl(req)}/confirm-reactivation/${encodeURIComponent(reactivationToken)}`;

    const message = `Hello ${user.name},

An admin requested to reactivate your Pharma-Net account.

Confirm reactivation:
${reactivationUrl}

This link is valid for 24 hours. If you did not expect this email, contact your system administrator.`;

    try {
      await sendEmail({
        email: user.email,
        subject: "Account Reactivation Request",
        message,
        html: buildAccountActionEmail({
          title: "Confirm account reactivation",
          eyebrow: "Email verification required",
          greetingName: user.name,
          body:
            "An admin requested to reactivate your Pharma-Net account. Use the secure button below to verify this request.",
          buttonLabel: "Confirm Reactivation",
          actionUrl: reactivationUrl,
          note:
            "This link is valid for 24 hours. If you did not expect this email, contact your system administrator.",
        }),
      });

      await logAction(
        req,
        "UPDATE",
        "User",
        user._id.toString(),
        { isDeleted: true },
        { reactivationTokenPending: true },
      );

      res.status(200).json({
        success: true,
        message: "Reactivation email sent successfully.",
      });
    } catch (err) {
      user.reactivationToken = undefined;
      user.reactivationExpire = undefined;
      await user.save();

      const error: any = new Error("Email could not be sent");
      error.statusCode = 500;
      return next(error);
    }
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/users/confirm-reactivation/:token
 * User confirms reactivation via token
 * Access: ⚪ Public
 */
export const confirmReactivation = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { token } = req.params;
    if (!token || typeof token !== "string") {
      const error: any = new Error("Invalid or missing token");
      error.statusCode = 400;
      return next(error);
    }

    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

    const user = await User.findOne({
      reactivationToken: hashedToken,
      reactivationExpire: { $gt: Date.now() },
    });

    if (!user) {
      const error: any = new Error("Invalid or expired token");
      error.statusCode = 400;
      return next(error);
    }

    const oldData = sanitizeUser(user);

    user.isDeleted = false;
    user.isActive = true;
    user.deletedAt = undefined;
    user.reactivationToken = undefined;
    user.reactivationExpire = undefined;

    await user.save();

    await logAction(
      req,
      "UPDATE",
      "User",
      user._id.toString(),
      oldData,
      sanitizeUser(user),
    );

    res.status(200).json({
      success: true,
      message: "Account reactivated successfully. You can now log in.",
    });
  } catch (error) {
    next(error);
  }
};

// Add this to your users.controller.ts
/**
 * PATCH /api/users/:id
 * Update user details or status. Access: Admin only.
 */
export const updateUser = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { name, role, isActive } = req.body;

    // Fetch user
    const user = await User.findById(req.params.id);
    if (!user) {
      return res
        .status(404)
        .json({
          success: false,
          error: { code: "NOT_FOUND", message: "User not found." },
        });
    }

    // Update fields if provided
    if (name !== undefined) user.name = name;
    if (role !== undefined) user.role = role;
    if (isActive !== undefined) user.isActive = isActive;

    await user.save();

    res
      .status(200)
      .json({ success: true, message: "User updated successfully.", user });
  } catch (error) {
    next(error);
  }
};
