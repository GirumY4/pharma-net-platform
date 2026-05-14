// src/app.ts
import "./config/env.js";
import cors from "cors";
import express, { type Express, type Request, type Response } from "express";
import helmet from "helmet"; // security headers
import morgan from "morgan"; // optional – nice for development

import path from "path";

import { errorHandler } from "./middlewares/error.middleware.js";
import { notFoundHandler } from "./middlewares/notFound.middleware.js";

// Import routes (create these folders/files later)
import auditRoutes from "./modules/auditLogs/auditLogs.routes.js";
import authRoutes from "./modules/auth/auth.routes.js";
import inventoryTransactionRoutes from "./modules/inventory/inventoryTransaction.routes.js";
import medicineRoutes from "./modules/inventory/medicine.routes.js";
import orderRoutes from "./modules/orders/orders.routes.js";
import paymentRoutes from "./modules/payments/payments.routes.js";
import reportRoutes from "./modules/reports/reports.routes.js";
import userRoutes from "./modules/users/users.routes.js";

const app: Express = express();

// ─── Middleware ────────────────────────────────────────────────────────

// Security headers
app.use(helmet());

// CORS – very restrictive in production
const allowedOrigins = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(",").map((origin) => origin.trim())
  : [
      "http://localhost:5173",
      "http://127.0.0.1:5173",
      "http://localhost:3000",
      "http://127.0.0.1:3000",
    ];

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);

// Logging in development
if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
}

// Body parsing
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));
app.use(
  "/uploads",
  (_req, res, next) => {
    res.setHeader("Cross-Origin-Resource-Policy", "cross-origin");
    next();
  },
  express.static(path.join(process.cwd(), "uploads")),
);

// ─── Routes ────────────────────────────────────────────────────────────
app.get("/health", (_req: Request, res: Response) => {
  res.status(200).json({
    status: "ok",
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
  });
});

app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/medicines", medicineRoutes);
app.use("/api/inventory-transactions", inventoryTransactionRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/reports", reportRoutes);
app.use("/api/logs", auditRoutes); // admin only

// ─── Error handling ────────────────────────────────────────────────────
app.use(notFoundHandler); // 404 handler
app.use(errorHandler); // global error handler (must be last)

export default app;
