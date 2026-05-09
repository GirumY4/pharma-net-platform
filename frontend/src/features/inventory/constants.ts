// src/features/inventory/constants.ts
import type { StockStatus } from "./types";

export const STOCK_STATUS_CONFIG: Record<
  StockStatus,
  { label: string; color: string; bg: string; border: string }
> = {
  healthy: {
    label: "Healthy",
    color: "#059669",
    bg: "#D1FAE5",
    border: "rgba(5, 150, 105, 0.3)",
  },
  low: {
    label: "Low Stock",
    color: "#D97706",
    bg: "#FEF3C7",
    border: "rgba(217, 119, 6, 0.3)",
  },
  critical: {
    label: "Critical",
    color: "#DC2626",
    bg: "#FEE2E2",
    border: "rgba(220, 38, 38, 0.3)",
  },
  out: {
    label: "Out of Stock",
    color: "#6B7280",
    bg: "#F3F4F6",
    border: "rgba(107, 114, 128, 0.3)",
  },
};
