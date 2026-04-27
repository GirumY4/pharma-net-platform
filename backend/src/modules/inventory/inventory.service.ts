// src/modules/inventory/inventory.service.ts
import mongoose, { type ClientSession } from "mongoose";
import Medicine, { type IBatch, type IMedicine } from "./medicine.model.js";
import InventoryTransaction, {
  type IInventoryTransaction,
} from "./inventoryTransaction.model.js";

export interface TransactionPayload {
  transactionType: "GRN" | "GIN";
  medicineId: string;
  batchNumber: string;
  quantityChanged: number;
  reason?: string;
  referenceNumber?: string;
  expiryDate?: string;
}

export interface StockAdjustmentResult {
  beforeMedicine: IMedicine;
  afterMedicine: IMedicine;
  transaction: IInventoryTransaction;
}

/**
 * Process a stock adjustment (GRN or GIN) atomically within a MongoDB session.
 *
 * - Enforces tenant isolation via pharmacyId from JWT context
 * - Validates business rules (sign, stock sufficiency, reason requirement)
 * - Updates batch quantity and denormalized totalStock
 * - Creates an immutable InventoryTransaction ledger entry
 * - Returns before/after medicine snapshots for audit logging
 *
 * @throws {AppError} With statusCode and code properties for API error mapping
 */
export const processStockAdjustment = async (
  payload: TransactionPayload,
  userContext: { userId: string; pharmacyId: string },
  session: ClientSession,
): Promise<StockAdjustmentResult> => {
  const {
    transactionType,
    medicineId,
    batchNumber,
    quantityChanged,
    reason,
    referenceNumber,
    expiryDate,
  } = payload;

  // 1. Fetch medicine with tenant isolation
  const medicine = await Medicine.findOne({
    _id: medicineId,
    pharmacyId: userContext.pharmacyId,
  }).session(session);

  if (!medicine || medicine.isDeleted) {
    const error = new Error(
      "MEDICINE_NOT_FOUND: Medicine not found within your tenant catalog.",
    ) as any;
    error.statusCode = 404;
    error.code = "MEDICINE_NOT_FOUND";
    throw error;
  }

  // Capture immutable BEFORE state for audit trail
  const beforeMedicine = medicine.toObject() as IMedicine;
  const stockBefore = medicine.totalStock;

  // 2. Business rule validations
  if (transactionType === "GIN") {
    if (quantityChanged >= 0) {
      throw createValidationError("GIN quantityChanged must be negative.");
    }
    if (stockBefore + quantityChanged < 0) {
      throw createInsufficientStockError(
        Math.abs(quantityChanged),
        stockBefore,
      );
    }
    if (!reason?.trim()) {
      throw createValidationError(
        "Reason is required for Goods Issued Notes (GIN).",
      );
    }
  }

  if (transactionType === "GRN" && quantityChanged <= 0) {
    throw createValidationError("GRN quantityChanged must be positive.");
  }

  // 3. Batch processing
  const batchIndex = medicine.batches.findIndex(
    (b) => b.batchNumber === batchNumber,
  );

  if (batchIndex !== -1) {
    // Existing batch: validate and update
    const batch = medicine.batches[batchIndex];
    if (!batch) {
      throw new Error(`Batch element not found at index ${batchIndex}`);
    }
    const currentBatchQty = batch.quantity;

    if (transactionType === "GIN" && currentBatchQty + quantityChanged < 0) {
      const error = new Error(
        `INSUFFICIENT_BATCH_STOCK: Batch ${batchNumber} only has ${currentBatchQty} units.`,
      ) as any;
      error.statusCode = 400;
      error.code = "INSUFFICIENT_BATCH_STOCK";
      throw error;
    }
    batch.quantity += quantityChanged;
  } else {
    // New batch: only permitted for GRN
    if (transactionType === "GIN") {
      const error = new Error(
        `BATCH_NOT_FOUND: Cannot issue from non-existent batch ${batchNumber}.`,
      ) as any;
      error.statusCode = 404;
      error.code = "BATCH_NOT_FOUND";
      throw error;
    }
    if (!expiryDate) {
      throw createValidationError(
        "expiryDate is required when receiving a new batch.",
      );
    }
    // Validate date string before conversion
    const parsedExpiry = new Date(expiryDate);
    if (isNaN(parsedExpiry.getTime())) {
      throw createValidationError(
        "expiryDate must be a valid ISO-8601 date string.",
      );
    }
    medicine.batches.push({
      batchNumber,
      quantity: quantityChanged,
      expiryDate: parsedExpiry,
      receivedAt: new Date(),
    } as IBatch);
  }

  // 4. Update denormalized total stock
  medicine.totalStock += quantityChanged;
  const stockAfter = medicine.totalStock;

  // Persist medicine changes within transaction
  await medicine.save({ session });

  // Capture immutable AFTER state for audit trail
  const afterMedicine = medicine.toObject() as IMedicine;

  // 5. Create immutable ledger entry
  const [transaction] = await InventoryTransaction.create(
    [
      {
        pharmacyId: userContext.pharmacyId,
        transactionType,
        medicineId,
        batchNumber,
        quantityChanged,
        stockBefore,
        stockAfter,
        createdBy: userContext.userId,
        // Conditionally include optional fields (concise spread pattern)
        ...(reason && { reason: reason.trim() }),
        ...(referenceNumber && { referenceNumber }),
        ...(expiryDate && { expiryDate: new Date(expiryDate) }),
      },
    ],
    { session },
  );

  if (!transaction) {
    throw new Error("Failed to create inventory transaction.");
  }

  return {
    beforeMedicine,
    afterMedicine,
    transaction: transaction as IInventoryTransaction,
  };
};

// ── Helper error factories for consistent API error contracts ──
const createValidationError = (message: string) => {
  const error = new Error(`VALIDATION_ERROR: ${message}`) as any;
  error.statusCode = 400;
  error.code = "VALIDATION_ERROR";
  return error;
};

const createInsufficientStockError = (requested: number, available: number) => {
  const error = new Error(
    `INSUFFICIENT_STOCK: Cannot remove ${requested}. Only ${available} in stock.`,
  ) as any;
  error.statusCode = 400;
  error.code = "INSUFFICIENT_STOCK";
  return error;
};
