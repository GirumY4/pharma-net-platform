// src/features/users/constants.ts
import type { UserRole } from "../../types";

export const ROLE_LABELS: Record<UserRole, string> = {
  admin: "System Administrator",
  pharmacy_manager: "Pharmacy Manager",
  public_user: "Public User",
};

export const FORM_FIELD_RULES = {
  name: {
    required: "Name is required",
    minLength: { value: 2, message: "Name must be at least 2 characters" },
    maxLength: { value: 100, message: "Name cannot exceed 100 characters" },
  },
  phoneNumber: {
    pattern: {
      value: /^\+?[0-9\s\-()]{7,20}$/,
      message: "Please enter a valid phone number",
    },
  },
  city: {
    maxLength: { value: 100, message: "City cannot exceed 100 characters" },
  },
  address: {
    maxLength: { value: 255, message: "Address cannot exceed 255 characters" },
  },
  password: {
    required: "Password is required",
    minLength: { value: 8, message: "Password must be at least 8 characters" },
    pattern: {
      value: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      message: "Password must contain uppercase, lowercase, and number",
    },
  },
};
