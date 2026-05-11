// src/features/reports/types.ts
export type ReportDatePreset = "7d" | "30d" | "90d" | "custom";

export interface DateRange {
  startDate: Date;
  endDate: Date;
  preset: ReportDatePreset;
}

export interface DashboardReport {
  pharmacyId: string;
  generatedAt: string;
  startDate: string;
  endDate: string;

  // KPIs
  totalRevenue: number;
  totalOrders: number;
  averageOrderValue: number;
  fulfillmentRate: number;
  lowStockCount: number;
  nearExpiryCount: number;

  // Revenue trend (daily)
  revenueTrend: {
    date: string;
    revenue: number;
    orderCount: number;
  }[];

  // Order status distribution
  ordersByStatus: Record<string, number>;

  // Top medicines by volume
  topMedicines: {
    name: string;
    sku: string;
    category: string;
    qtySold: number;
    revenue: number;
  }[];

  // Stock health distribution
  stockHealth: {
    healthy: number;
    low: number;
    critical: number;
    out: number;
  };

  // Expiring batches (FEFO)
  expiringBatches: ExpiringBatch[];

  // Recent inventory transactions
  recentTransactions: TransactionLog[];
}

export interface InventoryReport {
  pharmacyId: string;
  generatedAt: string;
  totalMedicines: number;
  totalStockValue: number;
  lowStockItems: number;
  nearExpiryItems: number;
  medicines: {
    name: string;
    sku: string;
    category: string;
    totalStock: number;
    reorderThreshold: number;
    unitPrice: number;
    stockValue: number;
    isLowStock: boolean;
    batches: {
      batchNumber: string;
      quantity: number;
      expiryDate: string;
      shelfLocation?: string;
    }[];
  }[];
}

export interface SalesReport {
  pharmacyId: string;
  startDate: string;
  endDate: string;
  totalRevenue: number;
  totalOrders: number;
  deliveredOrders: number;
  averageOrderValue: number;
  topMedicines: {
    name: string;
    sku: string;
    qtySold: number;
    revenue: number;
  }[];
  timeline: {
    date: string;
    orderCount: number;
    revenue: number;
  }[];
}

export interface ExpiringReport {
  pharmacyId: string;
  generatedAt: string;
  cutoffDate: string;
  items: ExpiringBatch[];
}

export interface ExpiringBatch {
  medicineId?: string; // Optional in dashboard, required in detailed report
  medicineName: string;
  sku: string;
  batchNumber: string;
  gtin?: string;
  quantity: number;
  expiryDate: string;
  daysUntilExpiry: number;
  shelfLocation?: string;
}

export interface TransactionLog {
  _id: string;
  transactionType: "GRN" | "GIN";
  medicineName: string;
  batchNumber: string;
  quantityChanged: number;
  createdAt: string; // ISO 8601
  reason?: string;
}

export interface PlatformReport {
  generatedAt: string;
  activeTenants: number;
  totalMedicines: number;
  totalOrders: number;
  totalGMV: number;
  ordersByStatus: Record<string, number>;
}

export interface ExportOptions {
  format: "csv" | "pdf";
  reportType: "dashboard" | "inventory" | "sales" | "expiring";
  dateRange?: DateRange;
}
