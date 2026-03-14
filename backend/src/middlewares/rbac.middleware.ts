// src/middlewares/rbac.middleware.ts
import type { Request, Response, NextFunction } from 'express';

export const authorize = (allowedRoles: ('admin' | 'warehouse_manager' | 'pharmacy')[]) => 
  (req: Request, res: Response, next: NextFunction) => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ 
        success: false, 
        message: 'Forbidden: Insufficient permissions' 
      });
    }
    next();
  };