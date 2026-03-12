/**
 * error.middleware.ts
 * Global error-handling middleware.  Express recognises a 4-argument
 * middleware as an error handler.  Must be the LAST app.use() call.
 */

import type { Request, Response, NextFunction } from 'express';

interface AppError extends Error {
    statusCode?: number;
    status?: number;
}

export function errorHandler(
    err: AppError,
    _req: Request,
    res: Response,
    next: NextFunction
) {
    if (res.headersSent) {
        return next(err);
    }

    const statusCode = err.statusCode ?? err.status ?? 500;

    // Don't leak stack traces to clients in production
    const isDev = process.env.NODE_ENV === 'development';

    res.status(statusCode).json({
        success: false,
        status: statusCode,
        message: err.message || 'Internal Server Error',
        ...(isDev && { stack: err.stack }),
    });
}
