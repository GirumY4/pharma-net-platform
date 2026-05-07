// src/services/api.ts
import axios, {
  type AxiosError,
  type AxiosInstance,
  type AxiosResponse,
  type InternalAxiosRequestConfig,
} from "axios";
import type { ApiError, ApiResponse, ErrorResponse } from "../types";

const API_BASE_URL =
  import.meta.env.VITE_API_URL || "http://localhost:5000/api";

type ApiClientError = Error & {
  code?: ApiError["code"];
  details?: ApiError["details"];
  status?: number;
};

const createApiClientError = (
  message: string,
  options: {
    code?: ApiError["code"];
    details?: ApiError["details"];
    status?: number;
  } = {},
): ApiClientError => {
  const error = new Error(message) as ApiClientError;
  error.code = options.code;
  error.details = options.details;
  error.status = options.status;
  return error;
};

const api: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: false,
});

api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem("token");
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error: unknown) => Promise.reject(error),
);

api.interceptors.response.use(
  (response: AxiosResponse<ApiResponse>) => {
    if (!response.data.success) {
      const errorResponse = response.data as ErrorResponse;
      return Promise.reject(
        createApiClientError(errorResponse.error.message, {
          code: errorResponse.error.code,
          details: errorResponse.error.details,
          status: response.status,
        }),
      );
    }
    return response;
  },
  (error: AxiosError<ApiResponse>) => {
    if (!error.response) {
      return Promise.reject(
        createApiClientError("Network error. Please check your connection.", {
          code: "NETWORK_ERROR",
        }),
      );
    }

    if (error.response.status === 401 || error.response.status === 403) {
      localStorage.removeItem("token");
      window.dispatchEvent(new Event("auth:unauthorized"));
    }

    const responseData = error.response.data;
    if (responseData && !responseData.success) {
      return Promise.reject(
        createApiClientError(responseData.error.message, {
          code: responseData.error.code,
          details: responseData.error.details,
          status: error.response.status,
        }),
      );
    }

    return Promise.reject(error);
  },
);

export default api;
