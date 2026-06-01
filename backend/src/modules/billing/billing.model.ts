import mongoose, { Document, Model, Schema, Types } from "mongoose";

export type BillingPlanCode =
  | "single_pharmacy"
  | "professional"
  | "enterprise_chain";

export type BillingPaymentMethod =
  | "bank_transfer"
  | "mobile_money"
  | "cash";

export type BillingSubmissionStatus =
  | "pending_review"
  | "approved"
  | "rejected";

export interface IBillingSubmission extends Document {
  pharmacyId: Types.ObjectId;
  submittedBy: Types.ObjectId;
  planCode: BillingPlanCode;
  planName: string;
  billingPeriod: "monthly";
  amount: number;
  currency: "ETB";
  paymentMethod: BillingPaymentMethod;
  transactionReference: string;
  payerName?: string | undefined;
  payerPhone?: string | undefined;
  note?: string | undefined;
  status: BillingSubmissionStatus;
  reviewedBy?: Types.ObjectId | undefined;
  reviewedAt?: Date | undefined;
  rejectionReason?: string | undefined;
  coverageStartsAt?: Date | undefined;
  coverageEndsAt?: Date | undefined;
  createdAt: Date;
  updatedAt: Date;
}

const BillingSubmissionSchema = new Schema<IBillingSubmission>(
  {
    pharmacyId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    submittedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    planCode: {
      type: String,
      enum: ["single_pharmacy", "professional", "enterprise_chain"],
      required: true,
      index: true,
    },
    planName: {
      type: String,
      required: true,
      trim: true,
    },
    billingPeriod: {
      type: String,
      enum: ["monthly"],
      required: true,
      default: "monthly",
    },
    amount: {
      type: Number,
      required: true,
      min: 0.01,
    },
    currency: {
      type: String,
      enum: ["ETB"],
      required: true,
      default: "ETB",
    },
    paymentMethod: {
      type: String,
      enum: ["bank_transfer", "mobile_money", "cash"],
      required: true,
    },
    transactionReference: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
    },
    payerName: {
      type: String,
      trim: true,
    },
    payerPhone: {
      type: String,
      trim: true,
    },
    note: {
      type: String,
      trim: true,
    },
    status: {
      type: String,
      enum: ["pending_review", "approved", "rejected"],
      required: true,
      default: "pending_review",
      index: true,
    },
    reviewedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    reviewedAt: {
      type: Date,
    },
    rejectionReason: {
      type: String,
      trim: true,
    },
    coverageStartsAt: {
      type: Date,
    },
    coverageEndsAt: {
      type: Date,
    },
  },
  { timestamps: true },
);

BillingSubmissionSchema.index({ pharmacyId: 1, createdAt: -1 });
BillingSubmissionSchema.index({ status: 1, createdAt: -1 });
BillingSubmissionSchema.index(
  { paymentMethod: 1, transactionReference: 1 },
  { unique: true },
);

const BillingSubmission: Model<IBillingSubmission> =
  mongoose.model<IBillingSubmission>(
    "BillingSubmission",
    BillingSubmissionSchema,
  );

export default BillingSubmission;
