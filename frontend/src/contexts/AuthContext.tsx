// src/contexts/AuthContext.tsx
import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from "react";
import api from "../services/api";
import type { IUser, ApiResponse } from "../types";

interface AuthState {
  token: string | null;
  user: IUser | null;
  isAuthenticated: boolean;
  isLoading: boolean; // true while checking /me on mount
  login: (
    token: string,
    baseUser: { _id: string; name: string; role: IUser["role"] },
  ) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthState | undefined>(undefined);

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

  const login = useCallback(
    (
      newToken: string,
      baseUser: { _id: string; name: string; role: IUser["role"] },
    ) => {
      localStorage.setItem("token", newToken);
      setToken(newToken);
      // The /me effect will fetch the full user; in the meantime we can show the base info
      setUser(baseUser as IUser);
    },
    [],
  );

  const logout = useCallback(() => {
    localStorage.removeItem("token");
    localStorage.removeItem("user"); // no longer needed but keep cleanup
    setToken(null);
    setUser(null);
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
