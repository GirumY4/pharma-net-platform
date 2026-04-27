// src/services/api.ts
import axios from "axios";

// Default to backend port 5000 in development
const API_BASE_URL =
  import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
  // No withCredentials – we use JWT in headers, not cookies
});

// Attach JWT automatically
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token"); // adjust if you store differently
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
