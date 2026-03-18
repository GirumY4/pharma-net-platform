// src/modules/users/users.controller.ts
import type { Request, Response, NextFunction } from 'express';
import mongoose, { type ClientSession } from 'mongoose';
import User from './user.model.js';
import { logAction } from '../../utils/auditLogger.js';

// ─── Type for query filters (improves type safety) ─────────────────────────
interface UserFilter {
    isDeleted?: boolean;
    role?: string;
    isActive?: boolean;
}

// ─── Helper: remove sensitive fields before audit logging ──────────────────
const sanitizeUser = (userDoc: any) => {
    const obj = userDoc.toObject ? userDoc.toObject() : userDoc;
    delete obj.passwordHash;
    delete obj.__v;           // optional, removes mongoose version key
    return obj;
};


// @desc    Get logged in user profile
// @route   GET /api/users/me
// @access  Private (All Roles)
export const getMe = async (req: Request, res: Response, next: NextFunction) => {
    try {
        if (!req.user) {
            const error = new Error('User not authenticated') as any;
            error.statusCode = 401;
            return next(error);
        }
        const user = await User.findById(req.user?.userId)
            .select('-passwordHash -isDeleted -deletedAt');

        if (!user || user.isDeleted) {
            const error = new Error('User not found') as any;
            error.statusCode = 404;
            return next(error);
        }

        res.status(200).json({
            success: true,
            data: user,
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Get all users (with pagination)
// @route   GET /api/users
// @access  Private/Admin
export const getUsers = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const page = parseInt(req.query.page as string, 10) || 1;
        const limit = parseInt(req.query.limit as string, 10) || 20;
        const startIndex = (page - 1) * limit;

        const query: UserFilter = { isDeleted: false };
        if (req.query.role) query.role = req.query.role as string;
        if (req.query.isActive !== undefined) query.isActive = req.query.isActive === 'true';
        if (req.query.includeDeleted === 'true') delete query.isDeleted;

        const total = await User.countDocuments(query);
        const users = await User.find(query)
            .select('-passwordHash')
            .skip(startIndex)
            .limit(limit);

        res.status(200).json({
            success: true,
            data: users,
            pagination: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
            },
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Soft Delete User
// @route   DELETE /api/users/:id
// @access  Private/Admin
export const deleteUser = async (req: Request, res: Response, next: NextFunction) => {
    // Start a MongoDB session for transaction (requires replica set)
    const session: ClientSession = await mongoose.startSession();
    session.startTransaction();
    try {
        const user = await User.findById(req.params.id);
        if (!user || user.isDeleted) {
            const error = new Error('User not found') as any;
            error.statusCode = 404;
            await session.abortTransaction();
            session.endSession();
            return next(error);
        }

        const oldData = sanitizeUser(user);

        // NFR-4.2: Proper soft delete with deletedAt
        user.isDeleted = true;
        user.isActive = false;
        user.deletedAt = new Date();
        await user.save({ session });

        // ALCOA+ Audit Log
        await logAction(
            req,
            'DELETE',
            'User',
            user._id.toString(),
            oldData,
            sanitizeUser(user),
            session
        );
        // Commit the transaction – both save and log succeed or fail together
        await session.commitTransaction();
        session.endSession();

        res.status(200).json({
            success: true,
            message: 'User account has been deactivated and soft-deleted.',
        });
    } catch (error) {
        // Abort the transaction on error and Rollback any changes
        await session.abortTransaction();
        session.endSession();
        next(error);
    }
};