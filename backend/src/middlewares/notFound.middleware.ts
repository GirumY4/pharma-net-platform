/**
 * notFound.middleware.js
 * Catches any request that did not match a registered route and responds
 * with a structured 404 JSON error.  Must be registered AFTER all routes.
 */

// src/middlewares/notFound.middleware.ts
import type { Request, Response } from 'express';

export const notFoundHandler = (req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    status: 404,
    error: {
      code: 'NOT_FOUND',
      message: `Route not found: ${req.method} ${req.originalUrl}`,
    },
  });
};
