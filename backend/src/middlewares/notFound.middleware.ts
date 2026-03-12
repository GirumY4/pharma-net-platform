/**
 * notFound.middleware.js
 * Catches any request that did not match a registered route and responds
 * with a structured 404 JSON error.  Must be registered AFTER all routes.
 */

import type { Request, Response } from 'express';

export function notFoundHandler(req: Request, res: Response) {
    res.status(404).json({
        success: false,
        status: 404,
        message: `Route not found: ${req.method} ${req.originalUrl}`,
    });
}
