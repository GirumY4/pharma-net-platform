// src/utils/auditLogger.ts
import fs from 'fs/promises';
import path from 'path';
import { type ClientSession } from 'mongoose';
import AuditLog, { type IAuditLog } from '../modules/auditLogs/auditLogs.model.js';
import type { Request } from 'express';

// ── Fallback log file (relative to the process working directory) ─────────────
const FALLBACK_LOG_PATH = path.resolve(process.cwd(), '.audit-failures.log');

/**
 * Writes a structured JSON entry about a failed audit log to:
 *  1. process.stderr – picked up by any log aggregator (CloudWatch, Datadog, …)
 *  2. A local fallback file – so no audit entry is silently lost
 */
async function notifyAuditFailure(payload: object, error: unknown) {
    const entry = JSON.stringify({
        level: 'CRITICAL',
        message: 'Audit log write failed – data integrity risk',
        timestamp: new Date().toISOString(),
        payload,
        error: error instanceof Error
            ? { name: error.name, message: error.message, stack: error.stack }
            : String(error),
    });

    // 1. Structured stderr – log aggregators treat this as a CRITICAL alert
process.stderr.write(`${entry}\n`);

    // 2. Async fallback file (non-blocking)
    try {
        await fs.appendFile(FALLBACK_LOG_PATH, `${entry}\n`);
    } catch (fsErr) {
        process.stderr.write(`[auditLogger] Failed to write fallback log: ${fsErr}\n`);
    }
}

// ── Main exported function ────────────────────────────────────────────────────

export const logAction = async (
    req: Request,
    actionType: IAuditLog['actionType'],
    resource: IAuditLog['resource'],
    resourceId: string,
    before: any = null,
    after: any = null,
    session?: ClientSession
) => {
    // Prevent logging if user is not authenticated (safety)
    if (!req.user?.userId) return;

// Pre‑compute the values so we can use them safely
const ip = req.ip ?? req.socket.remoteAddress;
const rawUa = req.headers['user-agent'];
const userAgent = rawUa ? (Array.isArray(rawUa) ? rawUa.join(', ') : rawUa) : undefined;

// Now build the payload with conditional spreads
const auditPayload = {
    userId: req.user.userId,
    actionType,
    resource,
    resourceId,
    before: before ? JSON.parse(JSON.stringify(before)) : null,
    after: after ? JSON.parse(JSON.stringify(after)) : null,
    timestamp: new Date(),
    // Corrected conditional spread for ipAddress
    ...(ip && { ipAddress: String(ip) }),
    // Corrected conditional spread for userAgent
    ...(userAgent && { userAgent: String(userAgent) }),
};

    try {
        const createOptions = session ? { session } : undefined;
        await AuditLog.create([auditPayload], createOptions);
    } catch (error) {
        // Always notify via stderr + fallback file
       await notifyAuditFailure(auditPayload, error);

        if (process.env.NODE_ENV === 'production') {
            // Fail the transaction in production (ALCOA+ strict)
            const err = new Error('Audit log write failed - request aborted for data integrity');
            (err as any).statusCode = 500;
            (err as any).code = 'AUDIT_LOG_FAILED';
            throw err;
        }
        // In development: swallow the error and log to console so devs can continue
        console.error('CRITICAL: Audit log write failed →', error);
    }
};