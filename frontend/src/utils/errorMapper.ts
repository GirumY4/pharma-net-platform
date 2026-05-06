// src/utils/errorMapper.ts
import axios from "axios";
import type { ApiError, ErrorResponse } from "../types";

/**
 * Map backend error codes to user‑friendly, localized messages.
 * Extend this object as new error codes are added to the backend.
 */
export const ERROR_MESSAGES: Record<string, string> = {
  // Authentication
  VALIDATION_ERROR: "Please check your input and try again.",
  EMAIL_EXISTS: "An account with this email already exists.",
  INVALID_CREDENTIALS: "Invalid email or password.",
  ACCOUNT_INACTIVE:
    "This account has been deactivated. Please contact support.",
  INVALID_TOKEN:
    "This password reset link has expired or is invalid. Please request a new one.",
  NOT_FOUND: "The requested resource could not be found.",

  // Fallback
  UNKNOWN_ERROR: "An unexpected error occurred. Please try again later.",
};

/**
 * Convert a backend ApiError into a display‑ready message.
 */
export const getErrorMessage = (error: ApiError): string => {
  return (
    ERROR_MESSAGES[error.code] || error.message || ERROR_MESSAGES.UNKNOWN_ERROR
  );
};

/**
 * Extract field‑level validation errors for form display.
 */
export const getFieldErrors = (error: ApiError): Record<string, string> => {
  if (!error.details) return {};
  return error.details.reduce(
    (acc, { field, message }) => {
      acc[field] = message;
      return acc;
    },
    {} as Record<string, string>,
  );
};

/**
 * NEW: The ultimate error handler for your UI components.
 * Pass the raw error from the catch block here.
 */
export const handleApiError = (err: unknown): string => {
  // 1. Check if it's an Axios Error
  if (axios.isAxiosError<ErrorResponse>(err)) {
    // 2. Check if the backend successfully sent our expected ErrorResponse format
    if (err.response?.data && err.response.data.error) {
      return getErrorMessage(err.response.data.error);
    }

    // 3. Handle network errors (backend is down, no internet, etc.)
    if (err.code === "ERR_NETWORK") {
      return "Unable to connect to the server. Please check your internet connection.";
    }
  }

  // 4. Fallback for non-Axios errors (e.g., standard JS errors)
  if (err instanceof Error) {
    return err.message;
  }

  return ERROR_MESSAGES.UNKNOWN_ERROR;
};
