// src/modules/inventory/inventory.service.ts
import mongoose, { type ClientSession } from 'mongoose';
import Medicine, { type IMedicine, type IBatch } from './medicine.model.js';
import InventoryTransaction, { type IInventoryTransaction } from './inventoryTransaction.model.js';

interface TransactionPayload {
    transactionType: 'GRN' | 'GIN';
    medicineId: string;
    batchNumber: string;
    quantityChanged: number;
    reason?: string;
    referenceNumber?: string;
    expiryDate?: string;
}

export const processStockAdjustment = async (
    payload: TransactionPayload,
    userId: string,
    session: ClientSession
): Promise<{ beforeMedicine: IMedicine; afterMedicine: IMedicine; transaction: IInventoryTransaction }> => {
    const { transactionType, medicineId, batchNumber, quantityChanged, reason, referenceNumber, expiryDate } = payload;

    // 1. Fetch medicine
    const medicine = await Medicine.findById(medicineId).session(session);
    if (!medicine || medicine.isDeleted) {
        const error = new Error('Medicine not found') as any;
        error.statusCode = 404;
        throw error;
    }

    // Deep clone before any modifications (for audit log)
    const beforeMedicine = medicine.toObject() as IMedicine;

    // 2. Validation
    const stockBefore = medicine.totalStock;

    if (transactionType === 'GIN') {
        if (quantityChanged >= 0) {
            throw new Error('GIN quantityChanged must be negative.');
        }
        if (stockBefore + quantityChanged < 0) {
            const error = new Error(
                `INSUFFICIENT_STOCK: Cannot remove ${Math.abs(quantityChanged)} units. Only ${stockBefore} in stock.`
            ) as any;
            error.statusCode = 400;
            error.code = 'INSUFFICIENT_STOCK';
            throw error;
        }
        if (!reason) {
            throw new Error('Reason is required for Goods Issued Notes (GIN).');
        }
    }

    if (transactionType === 'GRN' && quantityChanged <= 0) {
        throw new Error('GRN quantityChanged must be positive.');
    }

    // 3. Batch logic
    const batchIndex = medicine.batches.findIndex(b => b.batchNumber === batchNumber);

    if (batchIndex !== -1) {
        const batch = medicine.batches[batchIndex];
        if (!batch) {
            throw new Error(`Batch element not found at index ${batchIndex}`);
        }
        const currentBatchQty = batch.quantity;
        if (transactionType === 'GIN' && currentBatchQty + quantityChanged < 0) {
            const error = new Error(
                `INSUFFICIENT_BATCH_STOCK: Batch ${batchNumber} only has ${currentBatchQty} units.`
            ) as any;
            error.statusCode = 400;
            error.code = 'INSUFFICIENT_BATCH_STOCK';
            throw error;
        }
        batch.quantity += quantityChanged;
    } else {
        if (transactionType === 'GIN') {
            const error = new Error(`BATCH_NOT_FOUND: Cannot issue from non‑existent batch ${batchNumber}.`) as any;
            error.statusCode = 404;
            error.code = 'BATCH_NOT_FOUND';
            throw error;
        }
        // New batch via GRN
        if (!expiryDate) {
            throw new Error('expiryDate is required when receiving a new batch.');
        }
        medicine.batches.push({
            batchNumber,
            quantity: quantityChanged,
            expiryDate: new Date(expiryDate),
            receivedAt: new Date(),
        } as IBatch);
    }

    // 4. Update total stock
    medicine.totalStock += quantityChanged;
    const stockAfter = medicine.totalStock;

    // Save the updated medicine
    await medicine.save({ session });

    // Deep clone after update (for audit log)
    const afterMedicine = medicine.toObject() as IMedicine;

    // 5. Create ledger entry
    const [transaction] = await InventoryTransaction.create(
        [
            {
                transactionType,
                medicineId,
                batchNumber,
                quantityChanged,
                stockBefore,
                stockAfter,
                createdBy: userId,
                ...(reason !== undefined && { reason }),
                ...(referenceNumber !== undefined && { referenceNumber }),
                ...(expiryDate !== undefined && { expiryDate: new Date(expiryDate) }),
            },
        ],
        { session }
    );

    if (!transaction) {
        throw new Error('Failed to create inventory transaction.');
    }

    return { beforeMedicine, afterMedicine, transaction: transaction as IInventoryTransaction };
};