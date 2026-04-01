// src/types/express/index.d.ts
import { JwtPayload } from "jsonwebtoken";

declare global {
  namespace Express {
    interface Request {
      user?: {
        userId: string;
        role: "admin" | "pharmacy_manager" | "public_user";
        pharmacyId?: string; // 🔒 Tenant boundary — extracted from JWT only
      } & JwtPayload;
    }
  }
}

export {}; // Required for declaration merging
