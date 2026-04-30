// src/contexts/AuthContext.tsx
import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from "react";
import { jwtDecode } from "jwt-decode";
import api from "../services/api";
import type { IUser, ApiResponse, UserRole } from "../types";

interface AuthState {
  token: string | null;
  user: IUser | null;
  isAuthenticated: boolean;
  isLoading: boolean; // true while checking /me on mount
  login: (token: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthState | undefined>(undefined);

/**
 * Decode the JWT to extract the user role for immediate redirect
 * after login, without waiting for the /me API call.
 */
export const getRoleFromToken = (token: string): UserRole | null => {
  try {
    const payload = jwtDecode<{ role: UserRole }>(token);
    return payload.role;
  } catch {
    return null;
  }
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [token, setToken] = useState<string | null>(
    localStorage.getItem("token"),
  );
  const [user, setUser] = useState<IUser | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(!!token); // show loader while fetching /me

  // When the component mounts (or token changes), fetch the full user profile
  useEffect(() => {
    if (!token) {
      setUser(null);
      setIsLoading(false);
      return;
    }

    let cancelled = false;
    setIsLoading(true); // ensure ProtectedRoute shows spinner while /me is in flight

    const fetchUser = async () => {
      try {
        const { data } = await api.get<ApiResponse<IUser>>("/users/me");
        if (!cancelled) {
          setUser(data.data);
        }
      } catch (err) {
        // Token invalid or user deactivated → force logout
        if (!cancelled) {
          logout();
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    fetchUser();

    return () => {
      cancelled = true;
    };
  }, [token]);

  // Only store the token; the useEffect above will fetch the full user from /me.
  // This avoids rendering with a partial/stub user object.
  const login = useCallback((newToken: string) => {
    localStorage.setItem("token", newToken);
    setToken(newToken);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem("token");
    setToken(null);
    setUser(null);
    setIsLoading(false);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        token,
        user,
        isAuthenticated: !!token && !!user,
        isLoading,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
