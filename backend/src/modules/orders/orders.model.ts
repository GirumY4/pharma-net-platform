// src/modules/orders/orders.model.ts
import mongoose, { Schema, Document, Model, Types } from "mongoose";

export interface IOrderItem {
  medicineId: Types.ObjectId;
  medicineName: string; // Denormalized snapshot
  sku: string; // Denormalized snapshot
  quantity: number;
  unitPrice: number; // Price snapshot at order time
  lineTotal: number;
}

export interface IStatusEvent {
  status:
    | "pending"
    | "approved"
    | "processing"
    | "ready"
    | "delivered"
    | "rejected";
  changedBy: Types.ObjectId;
  changedAt: Date;
  note?: string;
}

export interface IOrder extends Document {
  customerId: Types.ObjectId;
  pharmacyId: Types.ObjectId; // 🔒 Tenant isolation key
  items: IOrderItem[];
  totalAmount: number;
  status:
    | "pending"
    | "approved"
    | "processing"
    | "ready"
    | "delivered"
    | "rejected";
  fulfillmentMethod: "pickup" | "delivery";
  deliveryAddress?: string;
  statusHistory: IStatusEvent[];
  paymentStatus: "unpaid" | "partially_paid" | "paid";
  approvedBy?: Types.ObjectId;
  approvedAt?: Date;
  rejectedBy?: Types.ObjectId;
  rejectedAt?: Date;
  rejectionReason?: string;
  notes?: string;
  isDeleted: boolean;
  deletedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const OrderItemSchema = new Schema<IOrderItem>(
  {
    medicineId: {
      type: Schema.Types.ObjectId,
      ref: "Medicine",
      required: true,
    },
    medicineName: { type: String, required: true, trim: true },
    sku: { type: String, required: true, uppercase: true, trim: true },
    quantity: { type: Number, required: true, min: 1 },
    unitPrice: { type: Number, required: true, min: 0 },
    lineTotal: { type: Number, required: true, min: 0 },
  },
  { _id: false },
);

const StatusEventSchema = new Schema<IStatusEvent>(
  {
    status: {
      type: String,
      required: true,
      enum: [
        "pending",
        "approved",
        "processing",
        "ready",
        "delivered",
        "rejected",
      ],
    },
    changedBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    changedAt: { type: Date, default: Date.now },
    note: { type: String, trim: true },
  },
  { _id: false },
);

const OrderSchema = new Schema<IOrder>(
  {
    customerId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    pharmacyId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    }, // 🔒 Tenant FK
    items: {
      type: [OrderItemSchema],
      required: true,
      validate: [
        (v: IOrderItem[]) => v.length > 0,
        "Order must contain at least one item",
      ],
    },
    totalAmount: { type: Number, required: true, min: 0 },
    status: {
      type: String,
      required: true,
      enum: [
        "pending",
        "approved",
        "processing",
        "ready",
        "delivered",
        "rejected",
      ],
      default: "pending",
      index: true,
    },
    fulfillmentMethod: {
      type: String,
      required: true,
      enum: ["pickup", "delivery"],
      default: "pickup",
    },
    deliveryAddress: {
      type: String,
      trim: true,
      // Conditional validation handled at service layer
    },
    statusHistory: { type: [StatusEventSchema], default: [] },
    paymentStatus: {
      type: String,
      required: true,
      enum: ["unpaid", "partially_paid", "paid"],
      default: "unpaid",
      index: true,
    },
    approvedBy: { type: Schema.Types.ObjectId, ref: "User", default: null },
    approvedAt: { type: Date, default: null },
    rejectedBy: { type: Schema.Types.ObjectId, ref: "User", default: null },
    rejectedAt: { type: Date, default: null },
    rejectionReason: { type: String, trim: true },
    notes: { type: String, trim: true },
    isDeleted: { type: Boolean, default: false, index: true },
    deletedAt: { type: Date, default: null },
  },
  { timestamps: true },
);

// Compound index for efficient tenant + status queries (FR-3.5)
OrderSchema.index({ pharmacyId: 1, status: 1, createdAt: -1 });
OrderSchema.index({ customerId: 1, createdAt: -1 });

const Order: Model<IOrder> = mongoose.model<IOrder>("Order", OrderSchema);
export default Order;
