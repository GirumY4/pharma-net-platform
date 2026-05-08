import type { ReactNode } from "react";

export type OrderStatus =
  | "pending"
  | "approved"
  | "processing"
  | "ready"
  | "delivered"
  | "rejected";

export type InventoryTransactionType = "GRN" | "GIN";

export interface RevenueTrendPoint {
  date: string;
  label: string;
  revenue: number;
  orders: number;
}

export interface DashboardKpi {
  id: string;
  title: string;
  value: number | string;
  icon: ReactNode;
  tone: "green" | "gold" | "blue" | "red" | "slate";
  helper?: string;
  trend?: "up" | "down" | "neutral";
  trendValue?: string;
  chartData?: RevenueTrendPoint[];
}

export interface RecentOrder {
  _id: string;
  customerId?: { _id: string; name: string; email?: string; phoneNumber?: string };
  totalAmount: number;
  status: OrderStatus;
  fulfillmentMethod?: "pickup" | "delivery";
  paymentStatus?: "unpaid" | "partially_paid" | "paid";
  createdAt: string;
}

export interface ExpiringBatch {
  medicineId: string;
  medicineName: string;
  sku: string;
  batchNumber: string;
  gtin?: string;
  quantity: number;
  expiryDate: string;
  shelfLocation?: string;
  daysUntilExpiry: number;
}

export interface LowStockItem {
  _id: string;
  name: string;
  sku: string;
  category: string;
  totalStock: number;
  reorderThreshold: number;
  unitOfMeasure: string;
}

export interface TopMedicine {
  _id: string;
  name: string;
  sku: string;
  qtySold: number;
  revenue: number;
}

export interface InventoryTransaction {
  _id: string;
  transactionType: InventoryTransactionType;
  medicineId?: { _id: string; name: string; sku: string } | string;
  batchNumber: string;
  quantityChanged: number;
  stockBefore: number;
  stockAfter: number;
  reason?: string;
  referenceNumber?: string;
  createdBy?: { _id: string; name: string; role: string } | string;
  createdAt: string;
}

export interface StockMovement {
  stockIn: number;
  stockOut: number;
  stockInTransactions: number;
  stockOutTransactions: number;
}

export type OrdersByStatus = Record<OrderStatus, number>;

export interface DashboardData {
  pharmacyId?: string;
  generatedAt?: string;
  startDate?: string;
  endDate?: string;
  totalMedicines: number;
  lowStockCount: number;
  pendingOrdersCount: number;
  activeCustomersCount: number;
  rangeCustomersCount: number;
  todaySales: number;
  totalRevenue: number;
  totalOrders: number;
  totalStockValue: number;
  ordersByStatus: OrdersByStatus;
  revenueTrend: RevenueTrendPoint[];
  stockMovement: StockMovement;
  lowStockItems: LowStockItem[];
  topMedicines: TopMedicine[];
  recentOrders: RecentOrder[];
  expiringBatches: ExpiringBatch[];
  recentInventoryTransactions: InventoryTransaction[];
}

export interface DashboardApiFilters {
  ordersLimit?: number;
  expiryWindowDays?: number;
  transactionsLimit?: number;
  lowStockLimit?: number;
  startDate?: string;
  endDate?: string;
}
