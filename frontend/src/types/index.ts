// src/types/index.ts
export type UserRole = "admin" | "pharmacy_manager" | "public_user";

export interface ILocation {
  lat: number;
  lng: number;
}

export interface IUser {
  _id: string;
  name: string;
  email: string;
  role: UserRole;
  phoneNumber?: string;
  address?: string;
  city?: string;
  location?: ILocation | null;
  isActive: boolean;
  createdAt: string; // ISO date string
}

// Generic envelope for all API responses (as per API_Documentation.md)
export interface ApiResponse<T = unknown> {
  success: boolean;
  message: string;
  data: T;
}

// Shape of the "user" object inside the login response
export interface AuthUser {
  _id: string;
  name: string;
  role: UserRole;
}

// Full login response body
export interface AuthResponse {
  token: string;
  expiresIn: string;
  user: AuthUser;
}
