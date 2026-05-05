// src/utils/auditLogger.ts
import type { Request } from "express";
import fs from "fs/promises";
import mongoose, { Types, type ClientSession } from "mongoose";
import path from "path";
import AuditLog, {
  type IAuditLog,
} from "../modules/auditLogs/auditLogs.model.js";

// ── Fallback log file (relative to the process working directory) ─────────────
const FALLBACK_LOG_PATH = path.resolve(process.cwd(), ".audit-failures.log");

/**
 * Writes a structured JSON entry about a failed audit log to:
 *  1. process.stderr – picked up by any log aggregator (CloudWatch, Datadog, …)
 *  2. A local fallback file – so no audit entry is silently lost
 */
async function notifyAuditFailure(payload: object, error: unknown) {
  const entry = JSON.stringify({
    level: "CRITICAL",
    message: "Audit log write failed – data integrity risk",
    timestamp: new Date().toISOString(),
    payload,
    error:
      error instanceof Error
        ? { name: error.name, message: error.message, stack: error.stack }
        : String(error),
  });

  // 1. Structured stderr – log aggregators treat this as a CRITICAL alert
  process.stderr.write(`${entry}\n`);

  // 2. Async fallback file (non-blocking)
  try {
    await fs.appendFile(FALLBACK_LOG_PATH, `${entry}\n`);
  } catch (fsErr) {
    process.stderr.write(
      `[auditLogger] Failed to write fallback log: ${fsErr}\n`,
    );
  }
}

/**
 * Validate ObjectId string format
 */
const isValidObjectId = (id: string): boolean =>
  mongoose.Types.ObjectId.isValid(id);

/**
 * Safely serialize a Mongoose document or plain object for audit snapshots.
 * Preserves Date, ObjectId, and nested structure without JSON.stringify pitfalls.
 */
const serializeSnapshot = (doc: any): Record<string, unknown> | null => {
  if (!doc) return null;
  // Use Mongoose's toObject if available, otherwise shallow clone
  const obj = typeof doc?.toObject === "function" ? doc.toObject() : { ...doc };
  // Remove sensitive/internal fields
  delete obj.passwordHash;
  delete obj.__v;
  return obj as Record<string, unknown>;
};

/**
 * Derive pharmacyId from the audited resource (never from client input).
 * Returns null for cross-tenant admin actions or system events.
 */
const derivePharmacyIdForResource = async (
  resource: IAuditLog["resource"],
  resourceId: string,
  session?: ClientSession | null,
): Promise<Types.ObjectId | null> => {
  if (!isValidObjectId(resourceId)) return null;

  const id = new Types.ObjectId(resourceId);
  const opts = session ? { session } : {};

  try {
    switch (resource) {
      case "Medicine": {
        const Medicine = await import("../modules/inventory/medicine.model.js");
        const doc = await Medicine.default
          .findById(id)
          .select("pharmacyId")
          .session(session ?? null);
        return doc?.pharmacyId ?? null;
      }
      case "Order": {
        const Order = await import("../modules/orders/orders.model.js");
        const doc = await Order.default
          .findById(id)
          .select("pharmacyId")
          .session(session ?? null);
        return doc?.pharmacyId ?? null;
      }
      case "Payment": {
        const Payment = await import("../modules/payments/payments.model.js");
        const doc = await Payment.default
          .findById(id)
          .select("pharmacyId")
          .session(session ?? null);
        return doc?.pharmacyId ?? null;
      }
      case "InventoryTransaction": {
        const InventoryTransaction =
          await import("../modules/inventory/inventoryTransaction.model.js");
        const doc = await InventoryTransaction.default
          .findById(id)
          .select("pharmacyId")
          .session(session ?? null);
        return doc?.pharmacyId ?? null;
      }
      case "User": {
        // For User resource, pharmacyId is only meaningful if the user is a pharmacy_manager
        // In that case, the user's _id IS the pharmacyId
        const User = await import("../modules/users/user.model.js");
        const doc = await User.default
          .findById(id)
          .select("role")
          .session(session ?? null);
        if (doc?.role === "pharmacy_manager") {
          return id; // The user's _id serves as the pharmacyId
        }
        return null; // Admin or public_user actions are cross-tenant
      }
      default:
        return null;
    }
  } catch {
    // If lookup fails, return null – the audit log will still be created without pharmacyId
    // This is acceptable for system events or edge cases
    return null;
  }
};

// ── Main exported function ────────────────────────────────────────────────────

/**
 * Create an immutable audit log entry with full attribution and tenant context.
 *
 * @param req - Express request object (for IP, User-Agent, user context)
 * @param actionType - Categorized action (CREATE, UPDATE, APPROVE, etc.)
 * @param resource - Entity type affected (Medicine, Order, etc.)
 * @param resourceId - ObjectId of the affected document
 * @param before - Snapshot of document state before change (null for CREATE)
 * @param after - Snapshot of document state after change (null for DELETE)
 * @param session - Optional MongoDB session for transactional audit logging
 *
 * @throws {Error} In production mode if audit write fails (ALCOA+ strict)
 */
export const logAction = async (
  req: Request,
  actionType: IAuditLog["actionType"],
  resource: IAuditLog["resource"],
  resourceId: string,
  before: any = null,
  after: any = null,
  session?: ClientSession | null,
): Promise<void> => {
  // Prevent logging if user is not authenticated (safety)
  if (!req.user?.userId) return;

  // Validate resourceId format
  if (!isValidObjectId(resourceId)) {
    // Log warning but do not abort the request – audit failure should not break business flow
    console.warn(`[auditLogger] Invalid resourceId format: ${resourceId}`);
    return;
  }

  // Pre‑compute network attribution fields
  const ip = req.ip ?? req.socket.remoteAddress;
  const rawUa = req.headers["user-agent"];
  const userAgent = rawUa
    ? Array.isArray(rawUa)
      ? rawUa.join(", ")
      : rawUa
    : undefined;

  // Derive pharmacyId from the audited resource (SECURITY CRITICAL)
  const pharmacyId = await derivePharmacyIdForResource(
    resource,
    resourceId,
    session,
  );

  // Build the audit payload with safe serialization
  const auditPayload = {
    userId: new Types.ObjectId(req.user.userId),
    ...(pharmacyId && { pharmacyId }), // 🔒 Derived from resource, never from client input
    actionType,
    resource,
    resourceId: new Types.ObjectId(resourceId),
    before: serializeSnapshot(before),
    after: serializeSnapshot(after),
    timestamp: new Date(),
    ...(ip && { ipAddress: String(ip) }),
    ...(userAgent && { userAgent: String(userAgent) }),
  };

  try {
    const createOptions = session ? { session } : undefined;
    await AuditLog.create([auditPayload], createOptions);
  } catch (error) {
    // Always notify via stderr + fallback file
    await notifyAuditFailure(auditPayload, error);

    if (process.env.NODE_ENV === "production") {
      // Fail the transaction in production (ALCOA+ strict mode)
      const err = new Error(
        "Audit log write failed - request aborted for data integrity",
      ) as any;
      err.statusCode = 500;
      err.code = "AUDIT_LOG_FAILED";
      throw err;
    }
    // In development: log to console but do not abort the request
    console.error("CRITICAL: Audit log write failed →", error);
  }
};
