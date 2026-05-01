// src/modules/payments/payments.model.ts
import mongoose, { Document, Model, Schema, Types } from "mongoose";

export interface IPayment extends Document {
  orderId: Types.ObjectId;
  pharmacyId: Types.ObjectId; // 🔒 Tenant isolation key
  customerId: Types.ObjectId;
  amount: number;
  paymentMethod: "bank_transfer" | "cash" | "mobile_money";
  transactionId?: string;
  status: "pending" | "completed" | "failed" | "refunded";
  note?: string;
  recordedBy: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const PaymentSchema = new Schema<IPayment>(
  {
    orderId: {
      type: Schema.Types.ObjectId,
      ref: "Order",
      required: true,
      index: true,
    },
    pharmacyId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    customerId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 0.01,
    },
    paymentMethod: {
      type: String,
      required: true,
      enum: ["bank_transfer", "cash", "mobile_money"],
    },
    transactionId: {
      type: String,
      trim: true,
      // Conditional validation handled at service layer
    },
    status: {
      type: String,
      required: true,
      enum: ["pending", "completed", "failed", "refunded"],
      default: "completed",
      index: true,
    },
    note: {
      type: String,
      trim: true,
    },
    recordedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
  },
  { timestamps: true },
);

// Indexes for efficient querying (NFR-1.4)
PaymentSchema.index({ pharmacyId: 1, createdAt: -1 }); // Tenant-scoped date-range queries
PaymentSchema.index({ orderId: 1, status: 1 }); // Payment history per order
PaymentSchema.index({ customerId: 1, createdAt: -1 }); // Consumer payment history

const Payment: Model<IPayment> = mongoose.model<IPayment>(
  "Payment",
  PaymentSchema,
);
export default Payment;
