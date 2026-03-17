// src/modules/auditLogs/auditLog.model.ts
import mongoose, { Schema, Document } from 'mongoose';
import User  from '../users/user.model.js';
import type { CallbackWithoutResultAndOptionalError } from 'mongoose';

export interface IAuditLog extends Document {
    userId: mongoose.Types.ObjectId;
    actionType: 'CREATE' | 'UPDATE' | 'DELETE' | 'LOGIN' | 'LOGOUT' | 'APPROVE' | 'REJECT' | 'PAYMENT_RECORDED' | 'GRN' | 'GIN';
    resource: 'User' | 'Medicine' | 'Order' | 'Payment' | 'InventoryTransaction';
    resourceId: mongoose.Types.ObjectId;
    before?: any;
    after?: any;
    ipAddress?: string;
    userAgent?: string;
    timestamp: Date;
}

const AuditLogSchema: Schema = new Schema({
    userId: { type: Schema.Types.ObjectId, ref: User, required: true },
    actionType: { type: String, required: true },
    resource: { type: String, required: true },
    resourceId: { type: Schema.Types.ObjectId, required: true },
    before: { type: Schema.Types.Mixed, default: null },
    after: { type: Schema.Types.Mixed, default: null },
    ipAddress: { type: String, trim: true },
    userAgent: { type: String, trim: true },
    timestamp: { type: Date, required: true, default: Date.now }
});

// Enforce immutability - prevent updates or deletes on this collection
AuditLogSchema.pre(/^findOneAnd/, { document: true, query: true }, function(next: CallbackWithoutResultAndOptionalError) { next(new Error('Audit logs are immutable')); });
AuditLogSchema.pre("deleteOne", { document: true, query: true }, function(next: CallbackWithoutResultAndOptionalError) { next(new Error('Audit logs are immutable')); });

export default mongoose.model<IAuditLog>('AuditLog', AuditLogSchema);