// src/modules/inventory/inventoryTransaction.model.ts
import mongoose, { Schema, Document, type CallbackWithoutResultAndOptionalError } from 'mongoose';

export interface IInventoryTransaction extends Document {
    transactionType: 'GRN' | 'GIN';
    medicineId: mongoose.Types.ObjectId;
    batchNumber: string;
    quantityChanged: number; // Positive for GRN, Negative for GIN
    stockBefore: number;
    stockAfter: number;
    reason?: string;
    referenceNumber?: string;
    expiryDate?: Date;
    createdBy: mongoose.Types.ObjectId;
    createdAt: Date;      // from timestamps
    updatedAt: Date;      // from timestamps (but should never be changed)
}

const InventoryTransactionSchema: Schema<IInventoryTransaction> = new Schema<IInventoryTransaction>(
    {
        transactionType: { type: String, required: true, enum: ['GRN', 'GIN'] },
        medicineId: { type: Schema.Types.ObjectId, ref: 'Medicine', required: true, index: true },
        batchNumber: { type: String, required: true },
        quantityChanged: { type: Number, required: true },
        stockBefore: { type: Number, required: true },
        stockAfter: { type: Number, required: true },
        reason: { type: String, trim: true },
        referenceNumber: { type: String, trim: true },
        expiryDate: { type: Date },
        createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    },
    { timestamps: true }
);

// ─── Enforce immutability (same pattern as AuditLog) ──────────────────────
const immutableError = new Error('Inventory transactions are immutable – updates and deletes are forbidden');

InventoryTransactionSchema.pre(/^findOneAnd/, { document: true, query: true }, function (next: CallbackWithoutResultAndOptionalError) {
    next(immutableError);
});
InventoryTransactionSchema.pre(/^delete/, { document: true, query: true }, function (next: CallbackWithoutResultAndOptionalError) {
    next(immutableError);
});
InventoryTransactionSchema.pre('updateOne', { document: true, query: true }, function (next: CallbackWithoutResultAndOptionalError) {
    next(immutableError);
});
// Also block replaceOne (if ever used)
InventoryTransactionSchema.pre(/^replaceOn/, { document: true, query: true }, function (next: CallbackWithoutResultAndOptionalError) {
    next(immutableError);
});

export default mongoose.model<IInventoryTransaction>('InventoryTransaction', InventoryTransactionSchema);