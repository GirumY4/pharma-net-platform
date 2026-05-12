// src/features/users/types.ts
import type { IUser } from "../../types";

export interface IUserProfile extends Omit<IUser, "passwordHash"> {
  // Additional computed fields for UI
  displayName: string;
  isPharmacyManager: boolean;
  pharmacyName?: string; // For pharmacy_manager role, name doubles as pharmacy name
}

export interface UpdateProfilePayload {
  name?: string;
  phoneNumber?: string;
  address?: string;
  city?: string;
  location?: {
    lat: number;
    lng: number;
  } | null;
}

export interface ChangePasswordPayload {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export interface ProfileApiResponse {
  success: boolean;
  message?: string;
  data?: IUserProfile;
}

export interface PasswordChangeApiResponse {
  success: boolean;
  message: string;
}
