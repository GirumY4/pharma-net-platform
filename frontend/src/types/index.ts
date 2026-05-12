// src/types/index.ts
export type UserRole = "admin" | "pharmacy_manager" | "public_user";

export interface ILocation {
  lat: number;
  lng: number;
}

/**
 * User document as returned by backend (excluding passwordHash)
 * Matches backend: src/modules/users/user.model.ts
 */
export interface IUser {
  _id: string;
  name: string;
  email: string;
  role: UserRole;
  phoneNumber?: string;
  address?: string;
  city?: string;
  location?: ILocation | null;
  profilePictureUrl?: string;
  isActive: boolean;
  isDeleted: boolean;
  deletedAt?: string | null; // ISO date string or null
  createdAt: string; // ISO date string
  updatedAt: string; // ISO date string
}

/**
 * Standard error envelope returned by backend on failure
 * Matches API_Documentation.md §10
 */
export interface ApiError {
  code:
    | "VALIDATION_ERROR"
    | "EMAIL_EXISTS"
    | "INVALID_CREDENTIALS"
    | "ACCOUNT_INACTIVE"
    | "INVALID_TOKEN"
    | "NOT_FOUND"
    | string; // Allow extension for future codes
  message: string;
  details?: Array<{ field: string; message: string }>;
}

/**
 * Success response envelope
 */
export interface SuccessResponse<T = unknown> {
  success: true;
  message: string;
  data: T;
  pagination?: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

/**
 * Error response envelope
 */
export interface ErrorResponse {
  success: false;
  error: ApiError;
}

/**
 * Union type for all API responses
 */
export type ApiResponse<T = unknown> = SuccessResponse<T> | ErrorResponse;

/**
 * Helper type guard for success responses
 */
export const isSuccessResponse = <T>(
  response: ApiResponse<T>,
): response is SuccessResponse<T> => response.success === true;

/**
 * Helper type guard for error responses
 */
export const isErrorResponse = <T>(
  response: ApiResponse<T>,
): response is ErrorResponse => response.success === false;

/**
 * Shape of the "user" object inside the login response
 */
export interface AuthUser {
  _id: string;
  name: string;
  role: UserRole;
}

/**
 * Full login response body (data field)
 */
export interface AuthResponseData {
  token: string;
  expiresIn: string; // e.g., "8h"
  user: AuthUser;
}

/**
 * JWT payload structure (decoded client‑side for role/pharmacyId extraction)
 */
export interface JwtPayload {
  userId: string;
  role: UserRole;
  pharmacyId?: string; // Present only for pharmacy_manager role
  iat: number;
  exp: number;
}

/**
 * Registration request payload (matches backend validation)
 */
export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
  role: "pharmacy_manager" | "public_user"; // admin not self‑registered
  phoneNumber?: string;
  address?: string;
  city?: string;
  location?: ILocation;
}

/**
 * Login request payload
 */
export interface LoginRequest {
  email: string;
  password: string;
}

/**
 * Password reset request payload
 */
export interface ResetPasswordRequest {
  password: string;
}
