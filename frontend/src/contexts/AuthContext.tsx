// src/contexts/AuthContext.tsx
import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { useNavigate } from "react-router-dom";
import type {
  ApiResponse,
  AuthUser,
  IUser,
  JwtPayload,
  UserRole,
} from "../types";

/**
 * Decode JWT payload (base64url) – client‑side only for role/pharmacyId extraction.
 * ⚠️ Never trust client‑side decoded values for authorization decisions.
 */
const decodeJwtPayload = (token: string): JwtPayload | null => {
  try {
    const payloadBase64 = token.split(".")[1];
    const payloadJson = atob(
      payloadBase64.replace(/-/g, "+").replace(/_/g, "/"),
    );
    return JSON.parse(payloadJson) as JwtPayload;
  } catch {
    return null;
  }
};

interface AuthContextValue {
  user: IUser | AuthUser | null;
  token: string | null;
  role: UserRole | null;
  pharmacyId: string | null; // Extracted from JWT for pharmacy_manager
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (token: string, userData?: IUser | AuthUser) => void;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<IUser | AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [role, setRole] = useState<UserRole | null>(null);
  const [pharmacyId, setPharmacyId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  /**
   * Initialize auth state from localStorage on mount
   */
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
            // Ignore parse errors; user will be refreshed on first API call
          }
        }
      } else {
        // Token expired – clear storage
        localStorage.removeItem("token");
        localStorage.removeItem("user");
      }
    }
    setIsLoading(false);
  }, []);

  /**
   * Listen for auth:unauthorized event (dispatched by api.ts interceptor)
   */
  useEffect(() => {
    const handleUnauthorized = () => {
      logout();
      navigate("/login", { replace: true });
    };
    window.addEventListener("auth:unauthorized", handleUnauthorized);
    return () =>
      window.removeEventListener("auth:unauthorized", handleUnauthorized);
  }, [navigate]);

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

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setToken(null);
    setUser(null);
    setRole(null);
    setPharmacyId(null);
  };

  /**
   * Fetch current user profile from backend (optional – for fresh data)
   */
  const refreshUser = async () => {
    if (!token) return;
    try {
      // Import dynamically to avoid circular dependency
      const { default: api } = await import("../services/api");
      const { data } = await api.get<ApiResponse<IUser>>("/users/me");
      if (data.success) {
        localStorage.setItem("user", JSON.stringify(data.data));
        setUser(data.data);
      }
    } catch {
      // Silently fail – user can continue with cached data
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

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

/**
 * Helper: extract role from token string (for quick redirects)
 * ⚠️ Use AuthContext for authoritative role checks in components.
 */
export const getRoleFromToken = (token: string): UserRole | null => {
  const payload = decodeJwtPayload(token);
  return payload?.role || null;
};

/**
 * Helper: extract pharmacyId from token string
 */
export const getPharmacyIdFromToken = (token: string): string | null => {
  const payload = decodeJwtPayload(token);
  return payload?.pharmacyId || null;
};
