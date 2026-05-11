// src/features/orders/services/ordersApi.ts
import api from "../../../services/api";
import type { SuccessResponse } from "../../../types";
import type {
  CreatePaymentPayload,
  IOrder,
  OrderFilters,
  OrdersApiResponse,
  PaymentApiResponse,
  PaymentRecord,
  UpdateOrderStatusPayload,
} from "../types";

/**
 * Fetch role-scoped orders list with filters and pagination
 * Endpoint: GET /api/orders
 */
export const fetchOrders = async (
  filters: OrderFilters = {},
): Promise<OrdersApiResponse> => {
  const params: Record<string, string> = {};

  if (filters.status) params.status = filters.status;
  if (filters.paymentStatus) params.paymentStatus = filters.paymentStatus;
  if (filters.startDate) params.startDate = filters.startDate;
  if (filters.endDate) params.endDate = filters.endDate;
  if (filters.page) params.page = filters.page.toString();
  if (filters.limit) params.limit = filters.limit.toString();

  const response = await api.get<SuccessResponse<IOrder[]>>(
    "/orders",
    { params },
  );
  
  return {
    success: response.data.success,
    data: response.data.data,
    pagination: response.data.pagination || {
      total: 0,
      page: 1,
      limit: 20,
      totalPages: 0,
    },
  };
};

/**
 * Fetch single order with full details
 * Endpoint: GET /api/orders/:id
 */
export const fetchOrderById = async (orderId: string): Promise<IOrder> => {
  const response = await api.get<SuccessResponse<IOrder>>(`/orders/${orderId}`);
  return response.data.data;
};

/**
 * Update order status (approve/reject/fulfill)
 * Endpoint: PATCH /api/orders/:id/status
 */
export const updateOrderStatus = async (
  orderId: string,
  payload: UpdateOrderStatusPayload,
): Promise<IOrder> => {
  const response = await api.patch<SuccessResponse<IOrder>>(
    `/orders/${orderId}/status`,
    payload,
  );
  return response.data.data;
};

/**
 * Record a payment against an order
 * Endpoint: POST /api/payments
 */
export const recordPayment = async (
  payload: CreatePaymentPayload,
): Promise<PaymentApiResponse["data"]> => {
  const response = await api.post<SuccessResponse<PaymentApiResponse["data"]>>(
    "/payments",
    payload,
  );
  return response.data.data;
};

/**
 * Fetch payments for a specific order
 * Endpoint: GET /api/payments?orderId=...
 */
export const fetchOrderPayments = async (
  orderId: string,
): Promise<PaymentRecord[]> => {
  const response = await api.get<
    SuccessResponse<{ data: PaymentRecord[]; pagination: any }>
  >("/payments", { params: { orderId } });
  return response.data.data.data;
};
