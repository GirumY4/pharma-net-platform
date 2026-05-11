// src/features/orders/constants.ts
import type { OrderStatus, PaymentStatus } from "./types";

export const STATUS_CONFIG: Record<
  OrderStatus,
  { label: string; color: string; bg: string; border: string; icon: string }
> = {
  pending: {
    label: "Pending",
    color: "#D97706",
    bg: "#FEF3C7",
    border: "rgba(217, 119, 6, 0.3)",
    icon: "⏳",
  },
  approved: {
    label: "Approved",
    color: "#2563EB",
    bg: "#DBEAFE",
    border: "rgba(37, 99, 235, 0.3)",
    icon: "✅",
  },
  processing: {
    label: "Processing",
    color: "#7C3AED",
    bg: "#EDE9FE",
    border: "rgba(124, 58, 237, 0.3)",
    icon: "🔄",
  },
  ready: {
    label: "Ready",
    color: "#059669",
    bg: "#D1FAE5",
    border: "rgba(5, 150, 105, 0.3)",
    icon: "📦",
  },
  delivered: {
    label: "Delivered",
    color: "#10B981",
    bg: "#D1FAE5",
    border: "rgba(16, 185, 129, 0.3)",
    icon: "🎉",
  },
  rejected: {
    label: "Rejected",
    color: "#DC2626",
    bg: "#FEE2E2",
    border: "rgba(220, 38, 38, 0.3)",
    icon: "❌",
  },
};

export const PAYMENT_STATUS_CONFIG: Record<
  PaymentStatus,
  { label: string; color: string; bg: string }
> = {
  unpaid: { label: "Unpaid", color: "#6B7280", bg: "#F3F4F6" },
  partially_paid: { label: "Partially Paid", color: "#D97706", bg: "#FEF3C7" },
  paid: { label: "Paid", color: "#059669", bg: "#D1FAE5" },
};

// Allowed status transitions per FR-3.4 lifecycle
export const ALLOWED_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  pending: ["approved", "rejected"],
  approved: ["processing"],
  processing: ["ready"],
  ready: ["delivered"],
  delivered: [],
  rejected: [],
};
