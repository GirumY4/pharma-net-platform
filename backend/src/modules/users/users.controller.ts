// src/modules/users/users.controller.ts
import type { Request, Response, NextFunction } from 'express';
import User from './user.model.js';
import { logAction } from '../../utils/auditLogger.js';

// @desc    Get logged in user profile
// @route   GET /api/users/me
// @access  Private (All Roles)
export const getMe = async (req: Request, res: Response, next: NextFunction) => {
    try {
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

        const query: any = { isDeleted: false };
        if (req.query.role) query.role = req.query.role;
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
    try {
        const user = await User.findById(req.params.id);
        if (!user || user.isDeleted) {
            const error = new Error('User not found') as any;
            error.statusCode = 404;
            return next(error);
        }

        const oldData = user.toObject();

        // NFR-4.2: Proper soft delete with deletedAt
        user.isDeleted = true;
        user.isActive = false;
        user.deletedAt = new Date();
        await user.save();

        // ALCOA+ Audit Log
        await logAction(
            req,
            'DELETE',
            'User',
            user._id.toString(),
            oldData,
            user.toObject()
        );

        res.status(200).json({
            success: true,
            message: 'User account has been deactivated and soft-deleted.',
        });
    } catch (error) {
        next(error);
    }
};