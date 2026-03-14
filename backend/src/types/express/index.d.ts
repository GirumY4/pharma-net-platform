// src/types/express/index.d.ts
import { JwtPayload } from 'jsonwebtoken';

declare global {
  namespace Express {
    interface Request {
      user?: {
        userId: string;
        role: 'admin' | 'warehouse_manager' | 'pharmacy';
      } & JwtPayload;
    }
  }
}

export {};