// src/utils/auditLogger.ts
import AuditLog from '../modules/auditLogs/auditlogs.model.js';
import type { Request } from 'express';

export const logAction = async (
    req: Request,
    actionType: string,
    resource: string,
    resourceId: string,
    before: any = null,
    after: any = null
) => {
    try {
        // Prevent logging if user is not authenticated (safety)
        if (!req.user?.userId) return;

        await AuditLog.create({
            userId: req.user.userId,
            actionType,
            resource,
            resourceId,
            before: before ? JSON.parse(JSON.stringify(before)) : null, // deep clone
            after: after ? JSON.parse(JSON.stringify(after)) : null,
            ipAddress: req.ip || req.socket.remoteAddress,
            userAgent: req.headers['user-agent'],
            timestamp: new Date(), // explicit server time
        });
    } catch (error) {
        console.error('CRITICAL: Failed to write audit log →', error);
        // In production you may want to notify admin or fail the transaction
    }
};