// src/modules/auditLogs/auditLog.model.ts
import mongoose, { Schema, Document, type CallbackWithoutResultAndOptionalError } from 'mongoose';

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
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    actionType: { type: String, required: true, enum: ['CREATE', 'UPDATE', 'DELETE', 'LOGIN', 'LOGOUT', 'APPROVE', 'REJECT', 'PAYMENT_RECORDED', 'GRN', 'GIN'] },
    resource: { type: String, required: true, enum: ['User', 'Medicine', 'Order', 'Payment', 'InventoryTransaction'] },
    resourceId: { type: Schema.Types.ObjectId, required: true },
    before: { type: Schema.Types.Mixed, default: null },
    after: { type: Schema.Types.Mixed, default: null },
    ipAddress: { type: String, trim: true },
    userAgent: { type: String, trim: true },
    timestamp: { type: Date, required: true, default: Date.now },
});

// Enforce immutability - prevent updates or deletes on this collection
const immutableError = new Error('Audit logs are immutable – no updates or deletes allowed');
AuditLogSchema.pre(/^findOneAnd/, { document: true, query: true }, function (next: CallbackWithoutResultAndOptionalError) { next(immutableError); });
AuditLogSchema.pre(/^delete/, { document: true, query: true }, function (next: CallbackWithoutResultAndOptionalError) { next(immutableError); });
AuditLogSchema.pre('updateOne', { document: true, query: true }, function (next: CallbackWithoutResultAndOptionalError) {
    next(immutableError);
});

export default mongoose.model<IAuditLog>('AuditLog', AuditLogSchema);