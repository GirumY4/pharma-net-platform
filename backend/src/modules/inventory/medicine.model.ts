// src/modules/inventory/medicine.model.ts
import mongoose, { Schema, Document, Model } from "mongoose";

export interface IBatch extends Document {
  batchNumber: string;
  gtin?: string;
  quantity: number;
  expiryDate: Date;
  manufactureDate?: Date;
  supplierName?: string;
  shelfLocation?: string;
  receivedAt: Date;
}

export interface IMedicine extends Document {
  pharmacyId: mongoose.Types.ObjectId; // 🔒 Tenant Isolation Key
  name: string;
  sku: string;
  genericName?: string;
  category: string;
  description?: string;
  unitPrice: number;
  unitOfMeasure: "tablet" | "capsule" | "vial" | "bottle" | "sachet" | "unit";
  totalStock: number;
  reorderThreshold: number;
  batches: IBatch[];
  isDeleted: boolean;
  deletedAt?: Date;
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
  isLowStock: boolean; // Virtual
}

const BatchSchema: Schema<IBatch> = new Schema<IBatch>(
  {
    batchNumber: { type: String, required: true, trim: true },
    gtin: { type: String, trim: true },
    quantity: { type: Number, required: true, min: 0 },
    expiryDate: { type: Date, required: true },
    manufactureDate: { type: Date },
    supplierName: { type: String, trim: true },
    shelfLocation: { type: String, trim: true },
    receivedAt: { type: Date, default: Date.now },
  },
  { _id: true },
);

const MedicineSchema: Schema<IMedicine> = new Schema<IMedicine>(
  {
    pharmacyId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    name: { type: String, required: true, trim: true, index: true },
    sku: { type: String, required: true, uppercase: true, trim: true },
    genericName: { type: String, trim: true },
    category: { type: String, required: true, trim: true, index: true },
    description: { type: String, trim: true },
    unitPrice: { type: Number, required: true, min: 0 },
    unitOfMeasure: {
      type: String,
      required: true,
      enum: ["tablet", "capsule", "vial", "bottle", "sachet", "unit"],
    },
    totalStock: { type: Number, required: true, default: 0, min: 0 },
    reorderThreshold: { type: Number, required: true, default: 50, min: 0 },
    batches: [BatchSchema],
    isDeleted: { type: Boolean, default: false, index: true },
    deletedAt: { type: Date, default: null },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

// ─── Multi-Tenant Indexes (exact from Database_Schema.md) ─────────────
MedicineSchema.index({ pharmacyId: 1, sku: 1 }, { unique: true }); // SKU unique PER pharmacy
MedicineSchema.index({ name: "text", category: "text", genericName: "text" }); // Global marketplace search
MedicineSchema.index({ pharmacyId: 1, isDeleted: 1 }); // Effiecient soft delete queries for pharmacy (Efficient tenant-scoped queries with soft-delete filter)

// Virtual for low-stock alerts
MedicineSchema.virtual("isLowStock").get(function (this: IMedicine) {
  return this.totalStock < this.reorderThreshold;
});

const Medicine: Model<IMedicine> = mongoose.model<IMedicine>(
  "Medicine",
  MedicineSchema,
);
export default Medicine;
