// src/modules/inventory/inventoryTransaction.model.ts
import mongoose, {
  Schema,
  Document,
  Model,
  type CallbackWithoutResultAndOptionalError,
} from "mongoose";

export interface IInventoryTransaction extends Document {
  pharmacyId: mongoose.Types.ObjectId; // 🔒 Tenant Isolation Key
  transactionType: "GRN" | "GIN";
  medicineId: mongoose.Types.ObjectId;
  batchNumber: string;
  quantityChanged: number; // Positive for GRN, Negative for GIN
  stockBefore: number;
  stockAfter: number;
  reason?: string;
  referenceNumber?: string;
  expiryDate?: Date;
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date; // from timestamps
}

const InventoryTransactionSchema: Schema<IInventoryTransaction> =
  new Schema<IInventoryTransaction>(
    {
      pharmacyId: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true,
        index: true,
      },
      transactionType: { type: String, required: true, enum: ["GRN", "GIN"] },
      medicineId: {
        type: Schema.Types.ObjectId,
        ref: "Medicine",
        required: true,
        index: true,
      },
      batchNumber: { type: String, required: true, index: true },
      quantityChanged: { type: Number, required: true },
      stockBefore: { type: Number, required: true },
      stockAfter: { type: Number, required: true },
      reason: { type: String, trim: true },
      referenceNumber: { type: String, trim: true },
      expiryDate: { type: Date },
      createdBy: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true,
        index: true,
      },
    },
    { timestamps: { createdAt: true, updatedAt: false } }, // Immutable -> no updatedAt
  );

// 🔐 ENFORCE IMMUTABILITY (21 CFR Part 11 / ALCOA+)
const immutableError = new Error(
  "Inventory transactions are immutable - updates and deletes are forbidden",
);

InventoryTransactionSchema.pre(
  /^findOneAnd/,
  { document: true, query: true },
  function (next: CallbackWithoutResultAndOptionalError) {
    next(immutableError);
  },
);
InventoryTransactionSchema.pre(
  /^delete/,
  { document: true, query: true },
  function (next: CallbackWithoutResultAndOptionalError) {
    next(immutableError);
  },
);
InventoryTransactionSchema.pre(
  "updateOne",
  { document: true, query: true },
  function (next: CallbackWithoutResultAndOptionalError) {
    next(immutableError);
  },
);
// Also block replaceOne (if ever used)
InventoryTransactionSchema.pre(
  /^replaceOne/,
  { document: true, query: true },
  function (next: CallbackWithoutResultAndOptionalError) {
    next(immutableError);
  },
);

const InventoryTransaction: Model<IInventoryTransaction> =
  mongoose.model<IInventoryTransaction>(
    "InventoryTransaction",
    InventoryTransactionSchema,
  );
export default InventoryTransaction;
