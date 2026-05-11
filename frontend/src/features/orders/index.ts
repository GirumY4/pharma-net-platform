// src/features/orders/index.ts
// Public API exports for the Orders feature module

// Pages
export { OrdersPage } from "./pages/OrdersPage";

// Components (for advanced usage)
export { OrderDetailDrawer } from "./components/OrderDetailDrawer";
export { OrdersTable } from "./components/OrdersTable";
export { PaymentRecordForm } from "./components/PaymentRecordForm";
export { StatusChip } from "./components/StatusChip";
export { StatusStepper } from "./components/StatusStepper";

// Hooks
export { useOrders } from "./hooks/useOrders";

// Services
export {
  fetchOrderById,
  fetchOrderPayments,
  fetchOrders,
  recordPayment,
  updateOrderStatus,
} from "./services/ordersApi";

// Types
export type {
  CreatePaymentPayload,
  FulfillmentMethod,
  IOrder,
  IOrderItem,
  IStatusEvent,
  OrderFilters,
  OrderStatus,
  PaymentStatus,
  UpdateOrderStatusPayload,
} from "./types";

// Constants
export {
  ALLOWED_TRANSITIONS,
  PAYMENT_STATUS_CONFIG,
  STATUS_CONFIG,
} from "./constants";
