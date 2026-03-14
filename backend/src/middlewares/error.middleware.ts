/**
 * error.middleware.ts
 * Global error-handling middleware.  Express recognises a 4-argument
 * middleware as an error handler.  Must be the LAST app.use() call.
 */

// src/middlewares/error.middleware.ts
import type { Request, Response, NextFunction } from 'express';

interface AppError extends Error {
  statusCode?: number;
  status?: number;
}

export const errorHandler = (
  err: AppError,
  _req: Request,
  res: Response,
  next: NextFunction
) => {
  if (res.headersSent) return next(err);

  const statusCode = err.statusCode ?? err.status ?? 500;

  res.status(statusCode).json({
    success: false,
    status: statusCode,
    error: {
      code: statusCode === 500 ? 'INTERNAL_SERVER_ERROR' : err.name || 'ERROR',
      message: err.message || 'Internal Server Error',
    },
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
};