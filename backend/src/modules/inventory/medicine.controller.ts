import type { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import Medicine from './medicine.model.js';
import { logAction } from '../../utils/auditLogger.js';

// @desc    Create new medicine (with optional initial batch)
// @route   POST /api/medicines
// @access  Private (warehouse_manager, admin)
export const createMedicine = async (req: Request, res: Response, next: NextFunction) => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const {
            name,
            sku,
            genericName,
            category,
            description,
            unitPrice,
            unitOfMeasure,
            reorderThreshold = 50,           // safe default
            initialBatch,
        } = req.body;

        // 1. SKU uniqueness check (within transaction)
        const existing = await Medicine.findOne({ sku }).session(session);
        if (existing) {
            const err = new Error(`SKU_EXISTS: Medicine with SKU ${sku} already exists`) as any;
            err.statusCode = 409;
            throw err;                        // caught and rolled back
        }

        // 2. Prepare data
        const batches = initialBatch ? [initialBatch] : [];
        const totalStock = initialBatch?.quantity || 0;

        // 3. Create medicine (array destructuring for cleaner syntax)
        const [medicine] = await Medicine.create(
            [{
                name,
                sku,
                genericName,
                category,
                description,
                unitPrice,
                unitOfMeasure,
                reorderThreshold,
                totalStock,
                batches,
                createdBy: req.user!.userId,
            }],
            { session }
        );

        if (!medicine) {
            throw new Error('Failed to create medicine: insertion returned no document or medicine is undefined');
        }

        // 4. ALCOA+ Audit Log (inside the transaction)
        await logAction(
            req,
            'CREATE',
            'Medicine',
            medicine._id.toString(),
            null,
            medicine.toObject(),
            session                     // pass session for atomicity
        );

        await session.commitTransaction();
        session.endSession();

        res.status(201).json({
            success: true,
            message: 'Medicine added successfully.',
            data: medicine,
        });
    } catch (error) {
        await session.abortTransaction();
        session.endSession();
        next(error);
    }
};

// @desc    Get all medicines with filtering & pagination
// @route   GET /api/medicines
// @access  Private (All roles)
export const getMedicines = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { name, sku, category, lowStock, nearExpiry, page = '1', limit = '20' } = req.query;
        const query: any = { isDeleted: false };

        if (name) query.name = { $regex: name as string, $options: 'i' };
        if (sku) query.sku = sku as string;
        if (category) query.category = category as string;

        // Low stock (totalStock < reorderThreshold)
        if (lowStock === 'true') {
            query.$expr = { $lt: ['$totalStock', '$reorderThreshold'] };
        }

        // Near expiry (any batch within 90 days)
        if (nearExpiry === 'true') {
            const ninetyDays = new Date();
            ninetyDays.setDate(ninetyDays.getDate() + 90);
            query.batches = {
                $elemMatch: {
                    expiryDate: { $lte: ninetyDays, $gt: new Date() },
                },
            };
        }

        const pageNum = parseInt(page as string, 10) || 1;
        const limitNum = parseInt(limit as string, 10) || 20;

        const total = await Medicine.countDocuments(query);
        const medicines = await Medicine.find(query)
            .skip((pageNum - 1) * limitNum)
            .limit(limitNum)
            .sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            data: medicines,
            pagination: {
                total,
                page: pageNum,
                limit: limitNum,
                totalPages: Math.ceil(total / limitNum),
            },
        });
    } catch (error) {
        next(error);
    }
};