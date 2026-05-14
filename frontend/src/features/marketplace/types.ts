// src/features/marketplace/types.ts
export interface MarketplaceMedicine {
  medicineId: string;
  name: string;
  genericName?: string;
  category: string;
  description?: string;
  unitPrice: number;
  unitOfMeasure: "tablet" | "capsule" | "vial" | "bottle" | "sachet" | "unit";
  totalStock: number;
  pharmacyId: string;
  pharmacyName: string;
  pharmacyPhone?: string;
  pharmacyAddress?: string;
  pharmacyCity: string;
  pharmacyLocation?: {
    lat: number;
    lng: number;
  };
  distanceKm?: number; // Calculated if user provides geolocation
}

export interface MarketplaceFilters {
  name?: string;
  genericName?: string;
  category?: string;
  city?: string;
  maxPrice?: number;
  minStock?: number;
  userLat?: number;
  userLng?: number;
  page?: number;
  limit?: number;
}

export interface MarketplaceApiResponse {
  data: MarketplaceMedicine[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface CreateMarketplaceOrderPayload {
  pharmacyId: string;
  items: Array<{
    medicineId: string;
    quantity: number;
  }>;
  fulfillmentMethod: "pickup" | "delivery";
  deliveryAddress?: string;
}

export interface MarketplaceOrderSummary {
  _id: string;
  totalAmount: number;
  status: "pending" | "approved" | "processing" | "ready" | "delivered" | "rejected";
}

export const CATEGORIES = [
  "Antibiotic",
  "Analgesic",
  "Antihypertensive",
  "Antidiabetic",
  "Antimalarial",
  "Vitamin",
  "Other",
] as const;

export type Category = (typeof CATEGORIES)[number];

export const UNIT_OPTIONS = [
  "tablet",
  "capsule",
  "vial",
  "bottle",
  "sachet",
  "unit",
] as const;

export type UnitOfMeasure = (typeof UNIT_OPTIONS)[number];
