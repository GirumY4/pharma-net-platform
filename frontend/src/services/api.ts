// src/services/api.ts
import axios, {
  type AxiosInstance,
  type AxiosResponse,
  type InternalAxiosRequestConfig,
} from "axios";
import type { ApiResponse, ErrorResponse } from "../types";

const API_BASE_URL =
  import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const api: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
  // Do not use withCredentials – JWT is sent in Authorization header not cookies
  withCredentials: false,
});

/**
 * Request interceptor: attach JWT from localStorage
 */
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem("token");
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

/**
 * Response interceptor: normalize error envelope and handle auth failures
 */
api.interceptors.response.use(
  (response: AxiosResponse<ApiResponse>) => {
    // If backend returned error envelope, throw it as a typed error
    if (!response.data.success) {
      const errorResponse = response.data as ErrorResponse;
      const error = new Error(errorResponse.error.message) as any;
      error.code = errorResponse.error.code;
      error.details = errorResponse.error.details;
      error.status = response.status;
      return Promise.reject(error);
    }
    return response;
  },
  (error) => {
    // Handle network errors or non‑API errors
    if (!error.response) {
      const networkError = new Error(
        "Network error. Please check your connection.",
      ) as any;
      networkError.code = "NETWORK_ERROR";
      return Promise.reject(networkError);
    }

    // Handle 401/403: clear auth state and redirect to login
    if (error.response.status === 401 || error.response.status === 403) {
      localStorage.removeItem("token");
      // Dispatch custom event for AuthContext to react (optional)
      window.dispatchEvent(new Event("auth:unauthorized"));
    }

    // If backend returned error envelope in response.data, use it
    if (error.response.data?.error) {
      const apiError = error.response.data.error;
      const typedError = new Error(apiError.message) as any;
      typedError.code = apiError.code;
      typedError.details = apiError.details;
      typedError.status = error.response.status;
      return Promise.reject(typedError);
    }

    return Promise.reject(error);
  },
);

export default api;
