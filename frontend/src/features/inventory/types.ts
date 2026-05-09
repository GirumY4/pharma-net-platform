// src/features/inventory/types.ts

export interface IBatch {
  _id: string;
  batchNumber: string;
  gtin?: string;
  quantity: number;
  expiryDate: string; // ISO 8601
  manufactureDate?: string;
  supplierName?: string;
  shelfLocation?: string;
  receivedAt: string;
}

export interface IMedicine {
  _id: string;
  pharmacyId: string;
  name: string;
  sku: string;
  genericName?: string;
  category: string;
  description?: string;
  unitPrice: number;
  unitOfMeasure: "tablet" | "capsule" | "vial" | "bottle" | "sachet" | "unit";
  totalStock: number;
  reorderThreshold: number;
  batches: IBatch[];
  isDeleted: boolean;
  deletedAt?: string | null;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  isLowStock?: boolean; // Virtual property from backend
}

export interface MedicineFormValues {
  name: string;
  sku: string;
  genericName?: string;
  category: string;
  description?: string;
  unitPrice: number;
  unitOfMeasure: "tablet" | "capsule" | "vial" | "bottle" | "sachet" | "unit";
  reorderThreshold: number;
  initialBatch?: {
    batchNumber: string;
    gtin?: string;
    quantity: number;
    expiryDate: string;
    manufactureDate?: string;
    supplierName?: string;
    shelfLocation?: string;
  };
}

export interface InventoryFilters {
  name?: string;
  sku?: string;
  category?: string;
  lowStock?: boolean;
  nearExpiry?: boolean;
  page?: number;
  limit?: number;
}

export interface InventoryApiResponse {
  success: boolean;
  data: IMedicine[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export type StockStatus = "healthy" | "low" | "critical" | "out";

