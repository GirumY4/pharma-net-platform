// src/routes/RoleRoute.tsx
import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import type { UserRole } from "../types";

interface RoleRouteProps {
  allowedRoles: UserRole[];
}

export const RoleRoute = ({ allowedRoles }: RoleRouteProps) => {
  const { user } = useAuth();

  if (!user || !allowedRoles.includes(user.role)) {
    // If they don't have permission, kick them to an unauthorized page or marketplace
    return <Navigate to="/unauthorized" replace />;
  }

  return <Outlet />;
};
