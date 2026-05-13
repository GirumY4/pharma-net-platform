// src/features/users/services/usersApi.ts
import api from "../../../services/api";
import type { SuccessResponse } from "../../../types";
import type {
  ChangePasswordPayload,
  IUserProfile,
  PasswordChangeApiResponse,
  UpdateProfilePayload,
} from "../types";

/**
 * Fetch current user's profile
 * Endpoint: GET /api/users/me
 */
export const fetchUserProfile = async (): Promise<IUserProfile> => {
  const response = await api.get<SuccessResponse<IUserProfile>>("/users/me");
  return response.data.data;
};

/**
 * Update user profile fields
 * Endpoint: PATCH /api/users/me
 */
export const updateUserProfile = async (
  payload: UpdateProfilePayload,
): Promise<IUserProfile> => {
  const response = await api.patch<SuccessResponse<IUserProfile>>(
    "/users/me",
    payload,
  );
  return response.data.data;
};

/**
 * Change user password
 * Endpoint: POST /api/auth/change-password
 */
export const changePassword = async (
  payload: ChangePasswordPayload,
): Promise<PasswordChangeApiResponse> => {
  const response = await api.post<SuccessResponse<PasswordChangeApiResponse>>(
    "/auth/change-password",
    payload,
  );
  return response.data.data;
};

/**
 * Deactivate user account (soft delete)
 * Endpoint: DELETE /api/users/me
 * Note: Only available for pharmacy_manager via admin action; public users cannot self-delete
 */
export const deactivateAccount = async (): Promise<{ message: string }> => {
  const response = await api.delete<SuccessResponse<unknown>>("/users/me");
  return { message: response.data.message || "Deactivation email sent" };
};

export const confirmDeactivation = async (token: string): Promise<{ message: string }> => {
  const response = await api.post<SuccessResponse<unknown>>(`/users/confirm-deactivation/${encodeURIComponent(token)}`);
  return { message: response.data.message || "Account deactivated successfully" };
};

export const confirmReactivation = async (token: string): Promise<{ message: string }> => {
  const response = await api.post<SuccessResponse<unknown>>(`/users/confirm-reactivation/${encodeURIComponent(token)}`);
  return { message: response.data.message || "Account reactivated successfully" };
};

/**
 * Upload profile picture
 * Endpoint: POST /api/users/me/profile-picture
 */
export const uploadProfilePicture = async (file: File): Promise<{ profilePictureUrl: string }> => {
  const formData = new FormData();
  formData.append("profilePicture", file);
  
  const response = await api.post<SuccessResponse<{ profilePictureUrl: string }>>(
    "/users/me/profile-picture", 
    formData,
    {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    }
  );
  return response.data.data;
};

/**
 * Remove profile picture
 * Endpoint: DELETE /api/users/me/profile-picture
 */
export const removeProfilePicture = async (): Promise<{ message: string }> => {
  const response = await api.delete<SuccessResponse<unknown>>("/users/me/profile-picture");
  return { message: response.data.message || "Profile picture removed successfully" };
};
