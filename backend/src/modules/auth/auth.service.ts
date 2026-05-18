// src/modules/auth/auth.service.ts
import bcrypt from "bcrypt";
import crypto from "crypto";
import jwt, { type SignOptions } from "jsonwebtoken";

export interface JWTPayload {
  userId: string;
  role: "admin" | "pharmacy_manager" | "public_user";
  pharmacyId?: string; // Only present for pharmacy_manager
}

/**
 * Hash a plaintext password using bcrypt
 */
export const hashPassword = async (password: string): Promise<string> => {
  const saltRounds = Number(process.env.BCRYPT_SALT_ROUNDS) || 12;
  const salt = await bcrypt.genSalt(saltRounds);
  return bcrypt.hash(password, salt);
};

/**
 * Compare plaintext password with stored hash
 */
export const comparePassword = async (
  password: string,
  hash: string,
): Promise<boolean> => {
  return bcrypt.compare(password, hash);
};

/**
 * Generate JWT with proper multi-tenant context
 * - pharmacyId is injected ONLY for pharmacy_manager role
 * - Matches exactly the requirement in API_Documentation.md and Project_Context.md
 */
export const generateToken = (userId: string, role: string): string => {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error("❌ JWT_SECRET is not defined in environment variables.");
  }
  const expiresIn = process.env.JWT_EXPIRATION || "8h";

  const payload: JWTPayload = {
    userId,
    role: role as JWTPayload["role"],
  };

  // SaaS Multi-Tenant Rule: pharmacyId = user._id for pharmacy_manager
  if (role === "pharmacy_manager") {
    payload.pharmacyId = userId;
  }

  return jwt.sign(payload, secret, { expiresIn } as SignOptions);
};
/**
 * Generate a secure password reset token.
 * Returns the unhashed token (to send to user) AND the hashed token (to save to DB).
 */
export const getResetPasswordToken = () => {
  // Generate random token
  const resetToken = crypto.randomBytes(20).toString("hex");

  // Hash the token (to store securely in DB - protects against DB breaches)
  const resetPasswordTokenHash = crypto
    .createHash("sha256")
    .update(resetToken)
    .digest("hex");

  // Set expiration to 10 minutes from now
  const resetPasswordExpire = new Date(Date.now() + 10 * 60 * 1000);

  return { resetToken, resetPasswordTokenHash, resetPasswordExpire };
};
