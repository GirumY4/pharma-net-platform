// src/routes/RoleRoute.tsx
import { Box, CircularProgress } from "@mui/material";
import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../contexts/useAuth";
import type { UserRole } from "../types";

interface RoleRouteProps {
  allowedRoles: UserRole[];
  fallbackPath?: string; // Default: "/unauthorized"
}

export const RoleRoute = ({
  allowedRoles,
  fallbackPath = "/unauthorized",
}: RoleRouteProps) => {
  const { user, role, isLoading } = useAuth();

  if (isLoading) {
    return (
      <Box
        sx={{
          display: "flex",
          height: "100vh",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <CircularProgress color="primary" />
      </Box>
    );
  }

  if (!user || !role || !allowedRoles.includes(role)) {
    return <Navigate to={fallbackPath} replace />;
  }

  return <Outlet />;
};
