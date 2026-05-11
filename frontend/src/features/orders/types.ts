// src/features/orders/types.ts

export interface IOrderItem {
  _id: string;
  medicineId: string;
  medicineName: string;
  sku: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
}

export interface IStatusEvent {
  _id: string;
  status: OrderStatus;
  changedBy: { _id: string; name: string };
  changedAt: string; // ISO 8601
  note?: string;
}

export type OrderStatus =
  | "pending"
  | "approved"
  | "processing"
  | "ready"
  | "delivered"
  | "rejected";

export type PaymentStatus = "unpaid" | "partially_paid" | "paid";

export type FulfillmentMethod = "pickup" | "delivery";

export interface IOrder {
  _id: string;
  customerId: {
    _id: string;
    name: string;
    email?: string;
    phoneNumber?: string;
    address?: string;
    city?: string;
  };
  pharmacyId: {
    _id: string;
    name: string;
    phoneNumber?: string;
    address?: string;
    city?: string;
  };
  items: IOrderItem[];
  totalAmount: number;
  status: OrderStatus;
  fulfillmentMethod: FulfillmentMethod;
  deliveryAddress?: string;
  statusHistory: IStatusEvent[];
  paymentStatus: PaymentStatus;
  approvedBy?: { _id: string; name: string };
  approvedAt?: string;
  rejectedBy?: { _id: string; name: string };
  rejectedAt?: string;
  rejectionReason?: string;
  notes?: string;
  isDeleted: boolean;
  deletedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface OrderFilters {
  status?: OrderStatus;
  paymentStatus?: PaymentStatus;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}

export interface OrdersApiResponse {
  success: boolean;
  data: IOrder[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface UpdateOrderStatusPayload {
  status: OrderStatus;
  rejectionReason?: string;
  note?: string;
}

export interface CreatePaymentPayload {
  orderId: string;
  amount: number;
  paymentMethod: "bank_transfer" | "cash" | "mobile_money";
  transactionId?: string;
  note?: string;
}

export interface PaymentRecord {
  _id: string;
  orderId: string;
  pharmacyId: string;
  customerId: string;
  amount: number;
  paymentMethod: "bank_transfer" | "cash" | "mobile_money";
  transactionId?: string;
  status: "pending" | "completed" | "failed" | "refunded";
  note?: string;
  recordedBy: { _id: string; name: string };
  createdAt: string;
}

export interface PaymentApiResponse {
  success: boolean;
  data: {
    payment: PaymentRecord;
    orderPaymentStatus: PaymentStatus;
    totalPaid: number;
    remainingBalance: number;
  };
}

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
