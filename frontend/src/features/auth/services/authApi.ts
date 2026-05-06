// src/features/auth/services/authApi.ts
import api from "../../../services/api";
import type {
  ApiResponse,
  AuthResponseData,
  IUser,
  LoginRequest,
  RegisterRequest,
  ResetPasswordRequest,
} from "../../../types";

/**
 * Register a new user.
 * Backend: POST /api/auth/register → 201 Created
 */
export const registerUser = async (
  payload: RegisterRequest,
): Promise<IUser> => {
  const { data } = await api.post<ApiResponse<IUser>>(
    "/auth/register",
    payload,
  );
  if (!data.success) {
    throw new Error(data.error.message || "Registration failed");
  }
  return data.data;
};

/**
 * Login with email/password.
 * Backend: POST /api/auth/login → 200 OK
 */
export const loginUser = async (
  payload: LoginRequest,
): Promise<AuthResponseData> => {
  const { data } = await api.post<ApiResponse<AuthResponseData>>(
    "/auth/login",
    payload,
  );
  if (!data.success) {
    throw new Error(data.error.message || "Login failed");
  }
  return data.data;
};

/**
 * Request password reset email.
 * Backend: POST /api/auth/forgot-password → 200 OK
 */
export const forgotPassword = async (
  email: string,
): Promise<{ message: string }> => {
  const { data } = await api.post<ApiResponse<null>>("/auth/forgot-password", {
    email,
  });
  if (!data.success) {
    throw new Error(data.error.message || "Failed to send reset email");
  }
  return { message: data.message || "Reset instructions sent." };
};

/**
 * Reset password using token.
 * Backend: PUT /api/auth/reset-password/:token → 200 OK with new JWT
 */
export const resetPassword = async (
  token: string,
  password: string,
): Promise<AuthResponseData> => {
  const payload: ResetPasswordRequest = { password };
  const { data } = await api.put<ApiResponse<AuthResponseData>>(
    `/auth/reset-password/${encodeURIComponent(token)}`,
    payload,
  );
  if (!data.success) {
    throw new Error(data.error.message || "Password reset failed");
  }
  return data.data;
};
