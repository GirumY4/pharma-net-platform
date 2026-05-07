// src/contexts/AuthContext.tsx
import { useCallback, useEffect, useState, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import type { ApiResponse, AuthUser, IUser, UserRole } from "../types";
import { decodeJwtPayload } from "../utils/authToken";
import { AuthContext, type AuthContextValue } from "./authContextBase";

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<IUser | AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [role, setRole] = useState<UserRole | null>(null);
  const [pharmacyId, setPharmacyId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const storedToken = localStorage.getItem("token");
    const storedUser = localStorage.getItem("user");

    if (storedToken) {
      const payload = decodeJwtPayload(storedToken);
      if (payload && payload.exp * 1000 > Date.now()) {
        setToken(storedToken);
        setRole(payload.role);
        setPharmacyId(payload.pharmacyId || null);
        if (storedUser) {
          try {
            setUser(JSON.parse(storedUser) as IUser | AuthUser);
          } catch {
            // Ignore malformed cached user data; API refresh can replace it.
          }
        }
      } else {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
      }
    }
    setIsLoading(false);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setToken(null);
    setUser(null);
    setRole(null);
    setPharmacyId(null);
  }, []);

  useEffect(() => {
    const handleUnauthorized = () => {
      logout();
      navigate("/login", { replace: true });
    };
    window.addEventListener("auth:unauthorized", handleUnauthorized);
    return () =>
      window.removeEventListener("auth:unauthorized", handleUnauthorized);
  }, [logout, navigate]);

  const login = (newToken: string, userData?: IUser | AuthUser) => {
    const payload = decodeJwtPayload(newToken);
    if (!payload) {
      console.error("Invalid token format");
      return;
    }

    localStorage.setItem("token", newToken);
    setToken(newToken);
    setRole(payload.role);
    setPharmacyId(payload.pharmacyId || null);

    if (userData) {
      localStorage.setItem("user", JSON.stringify(userData));
      setUser(userData);
    }
  };

  const refreshUser = async () => {
    if (!token) return;
    try {
      const { default: api } = await import("../services/api");
      const { data } = await api.get<ApiResponse<IUser>>("/users/me");
      if (data.success) {
        localStorage.setItem("user", JSON.stringify(data.data));
        setUser(data.data);
      }
    } catch {
      // Keep the cached auth state when profile refresh is unavailable.
    }
  };

  const value: AuthContextValue = {
    user,
    token,
    role,
    pharmacyId,
    isAuthenticated: !!token && !!role,
    isLoading,
    login,
    logout,
    refreshUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
