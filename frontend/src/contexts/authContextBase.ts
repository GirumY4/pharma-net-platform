import { createContext } from "react";
import type { AuthUser, IUser, UserRole } from "../types";

export interface AuthContextValue {
  user: IUser | AuthUser | null;
  token: string | null;
  role: UserRole | null;
  pharmacyId: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (token: string, userData?: IUser | AuthUser) => void;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextValue | undefined>(
  undefined,
);
