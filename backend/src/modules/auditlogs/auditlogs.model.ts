// src/modules/auditLogs/auditLog.model.ts
import mongoose, {
  Document,
  Model,
  Schema,
  Types,
  type CallbackWithoutResultAndOptionalError,
} from "mongoose";

export interface IAuditLog extends Document {
  userId: Types.ObjectId;
  pharmacyId?: Types.ObjectId;
  actionType:
    | "CREATE"
    | "UPDATE"
    | "DELETE"
    | "LOGIN"
    | "LOGOUT"
    | "APPROVE"
    | "REJECT"
    | "PAYMENT_RECORDED"
    | "GRN"
    | "GIN";
  resource: "User" | "Medicine" | "Order" | "Payment" | "InventoryTransaction";
  resourceId: Types.ObjectId;
  before?: Record<string, unknown> | null;
  after?: Record<string, unknown> | null;
  ipAddress?: string;
  userAgent?: string;
  timestamp: Date;
}

const AuditLogSchema = new Schema<IAuditLog>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    pharmacyId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: false, // Optional for cross-tenant admin actions
      index: true, // Enables efficient tenant-scoped queries (NFR-1.4)
    },
    actionType: {
      type: String,
      required: true,
      enum: [
        "CREATE",
        "UPDATE",
        "DELETE",
        "LOGIN",
        "LOGOUT",
        "APPROVE",
        "REJECT",
        "PAYMENT_RECORDED",
        "GRN",
        "GIN",
      ],
      index: true,
    },
    resource: {
      type: String,
      required: true,
      enum: ["User", "Medicine", "Order", "Payment", "InventoryTransaction"],
      index: true,
    },
    resourceId: {
      type: Schema.Types.ObjectId,
      required: true,
      index: true,
    },
    before: {
      type: Schema.Types.Mixed,
      default: null,
    },
    after: {
      type: Schema.Types.Mixed,
      default: null,
    },
    ipAddress: {
      type: String,
      trim: true,
    },
    userAgent: {
      type: String,
      trim: true,
    },
    timestamp: {
      type: Date,
      required: true,
      default: Date.now,
      index: true, // Chronological ordering for compliance queries
    },
  },
  { timestamps: true },
);

// Compound indexes for common compliance query patterns (NFR-1.4)
AuditLogSchema.index({ pharmacyId: 1, timestamp: -1 }); // Tenant-scoped date-range queries
AuditLogSchema.index({ resource: 1, resourceId: 1 }); // Full history of a specific document
AuditLogSchema.index({ userId: 1, timestamp: -1 }); // Actions by a specific user

// Enforce immutability - prevent updates or deletes on this collection
const immutableError = new Error(
  "Audit logs are immutable - no updates or deletes allowed",
);
AuditLogSchema.pre(
  /^findAnd/,
  { document: true, query: true },
  function (this: any, next: CallbackWithoutResultAndOptionalError) {
    next(immutableError);
  },
);
AuditLogSchema.pre(
  /^findOneAnd/,
  { document: true, query: true },
  function (this: any, next: CallbackWithoutResultAndOptionalError) {
    next(immutableError);
  },
);
AuditLogSchema.pre(
  /^delete/,
  { document: true, query: true },
  function (this: any, next: CallbackWithoutResultAndOptionalError) {
    next(immutableError);
  },
);
AuditLogSchema.pre(
  "updateOne",
  { document: true, query: true },
  function (this: any, next: CallbackWithoutResultAndOptionalError) {
    next(immutableError);
  },
);
AuditLogSchema.pre(
  "replaceOne",
  { document: true, query: true },
  function (this: any, next: any) {
    next(immutableError);
  },
);
const AuditLog: Model<IAuditLog> = mongoose.model<IAuditLog>(
  "AuditLog",
  AuditLogSchema,
);
export default AuditLog;
