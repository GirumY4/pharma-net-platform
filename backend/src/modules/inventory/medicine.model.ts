// src/modules/inventory/medicine.model.ts
import mongoose, { Schema, Document } from 'mongoose';

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
    name: string;
    sku: string;
    genericName?: string;
    category: string;
    description?: string;
    unitPrice: number;
    unitOfMeasure: 'tablet' | 'capsule' | 'vial' | 'bottle' | 'sachet' | 'unit';
    totalStock: number;
    reorderThreshold: number;
    batches: IBatch[];
    isDeleted: boolean;
    deletedAt?: Date;
    createdBy: mongoose.Types.ObjectId;
}

const BatchSchema: Schema<IBatch> = new Schema<IBatch>({
    batchNumber: { type: String, required: true, trim: true },
    gtin: { type: String, trim: true },
    quantity: { type: Number, required: true, min: 0 },
    expiryDate: { type: Date, required: true },
    manufactureDate: { type: Date },
    supplierName: { type: String, trim: true },
    shelfLocation: { type: String, trim: true },
    receivedAt: { type: Date, default: Date.now },
});

const MedicineSchema: Schema<IMedicine> = new Schema<IMedicine>(
    {
        name: { type: String, required: true, trim: true, index: true },
        sku: { type: String, required: true, unique: true, uppercase: true, trim: true },
        genericName: { type: String, trim: true },
        category: { type: String, required: true, trim: true, index: true },
        description: { type: String, trim: true },
        unitPrice: { type: Number, required: true, min: 0 },
        unitOfMeasure: {
            type: String,
            required: true,
            enum: ['tablet', 'capsule', 'vial', 'bottle', 'sachet', 'unit']
        },
        totalStock: { type: Number, required: true, default: 0, min: 0 },
        reorderThreshold: { type: Number, required: true, default: 50, min: 0 },
        batches: [BatchSchema],
        isDeleted: { type: Boolean, default: false, index: true },
        deletedAt: { type: Date, default: null },
        createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    },
    { timestamps: true }
);

// Virtual for low-stock check (useful in frontend)
MedicineSchema.virtual('isLowStock').get(function () {
    return this.totalStock < this.reorderThreshold;
});

export default mongoose.model<IMedicine>('Medicine', MedicineSchema);