// src/features/auth/services/authApi.ts
import api from "../../../services/api";
import type { ApiResponse, AuthResponse, IUser } from "../../../types";

interface RegisterPayload {
  name: string;
  email: string;
  password: string;
  role: "pharmacy_manager" | "public_user"; // admin is not self‑registered
  phoneNumber?: string;
  address?: string;
  city?: string;
  location?: { lat: number; lng: number };
}

interface LoginPayload {
  email: string;
  password: string;
}

/**
 * Register a new user.
 * Backend returns 201 with the full user object (except passwordHash).
 */
export const registerUser = async (
  payload: RegisterPayload,
): Promise<ApiResponse<IUser>> => {
  const { data } = await api.post<ApiResponse<IUser>>(
    "/auth/register",
    payload,
  );
  return data;
};

/**
 * Login with email/password.
 * Backend returns 200 with token, expiration, and basic user info.
 */
export const loginUser = async (
  payload: LoginPayload,
): Promise<ApiResponse<AuthResponse>> => {
  const { data } = await api.post<ApiResponse<AuthResponse>>(
    "/auth/login",
    payload,
  );
  return data;
};
