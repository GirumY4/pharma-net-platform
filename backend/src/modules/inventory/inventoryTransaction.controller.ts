// src/modules/inventory/inventoryTransaction.controller.ts
import type { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import InventoryTransaction from './inventoryTransaction.model.js';
import { processStockAdjustment } from './inventory.service.js';
import { logAction } from '../../utils/auditLogger.js';

// Helper: sanitize medicine document for audit logs (remove sensitive fields if any)
const sanitizeMedicine = (doc: any) => {
    const obj = doc.toObject ? doc.toObject() : doc;
    // Remove any fields you don't want in audit logs
    delete obj.__v;
    delete obj.createdAt;
    delete obj.updatedAt;
    return obj;
};

// @desc    Record a GRN or GIN
// @route   POST /api/inventory-transactions
// @access  Private (Warehouse Manager, Admin)
export const createTransaction = async (req: Request, res: Response, next: NextFunction) => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const userId = req.user?.userId;
        if (!userId) {
            const error = new Error('User not authenticated') as any;
            error.statusCode = 401;
            throw error;
        }

        // Process the stock adjustment (now returns before & after snapshots)
        // Call service layer (handles business logic, validation, and updates)
        const { beforeMedicine, afterMedicine, transaction } = await processStockAdjustment(req.body, userId, session);

        // Capture before/after snapshots for audit log (full medicine state)
        const beforeSnapshot = sanitizeMedicine(beforeMedicine);
        const afterSnapshot = sanitizeMedicine(afterMedicine);
        // After saving, the medicine document already reflects the new state.
        // We need the state *before* the update, but our service already updated it.
        // To get a true "before", we could clone the medicine before modifications.
        // However, since the service uses the same document, we must create a deep clone
        // before passing it to the service, or capture before/after inside the service.
        // For simplicity, we'll assume the service returns both before and after states.
        // Alternatively, we can query the medicine again inside the transaction to get before.
        // For now, we'll use the transaction data and the updated medicine as after.

        // Proper approach: modify processStockAdjustment to return before/after medicine snapshots.
        // But to keep the example clean, we'll log the stock changes and batch info.
        await logAction(
            req,
            req.body.transactionType as 'GRN' | 'GIN',
            'Medicine',
            beforeMedicine._id.toString(),
            beforeSnapshot,
            afterSnapshot,
            session
        );

        await session.commitTransaction();
        session.endSession();

        res.status(201).json({
            success: true,
            message: `Inventory transaction (${req.body.transactionType}) recorded successfully.`,
            data: {
                transaction,
                updatedStock: afterMedicine.totalStock,
            },
        });
    } catch (error) {
        await session.abortTransaction();
        session.endSession();
        next(error);
    }
};

// @desc    Get all inventory transactions with filtering & pagination
// @route   GET /api/inventory-transactions
// @access  Private (Warehouse Manager, Admin)
export const getTransactions = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const page = parseInt(req.query.page as string, 10) || 1;
        const limit = parseInt(req.query.limit as string, 10) || 20;

        const query: Record<string, any> = {};
        if (req.query.medicineId) query.medicineId = req.query.medicineId;
        if (req.query.type) query.transactionType = req.query.type;

        const total = await InventoryTransaction.countDocuments(query);
        const transactions = await InventoryTransaction.find(query)
            .populate('medicineId', 'name sku')
            .populate('createdBy', 'name')
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(limit);

        res.status(200).json({
            success: true,
            data: transactions,
            pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
        });
    } catch (error) {
        next(error);
    }
};