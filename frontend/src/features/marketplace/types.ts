// src/features/marketplace/types.ts
export interface MarketplaceMedicine {
  medicineId: string;
  name: string;
  genericName?: string;
  category: string;
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
  success: boolean;
  data: MarketplaceMedicine[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
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
