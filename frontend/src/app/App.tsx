// src/app/App.tsx
import { Box, Typography } from "@mui/material";
import { Navigate, Route, Routes } from "react-router-dom";

// Import Auth Pages
import { SaaSLayout } from "../components/layout/SaaSLayout";
import { UserManagementPage } from "../features/admin/pages/UserManagementPage";
import { ConfirmDeactivationPage } from "../features/auth/pages/ConfirmDeactivationPage";
import { ConfirmReactivationPage } from "../features/auth/pages/ConfirmReactivationPage";
import { ForgotPasswordPage } from "../features/auth/pages/ForgotPasswordPage";
import { LoginPage } from "../features/auth/pages/LoginPage";
import { RegisterPage } from "../features/auth/pages/RegisterPage";
import { ResetPasswordPage } from "../features/auth/pages/ResetPasswordPage";
import { DashboardPage } from "../features/dashboard/pages/DashboardPage";
import { InventoryPage } from "../features/inventory/index";
import { MarketplacePage } from "../features/marketplace/pages/MarketplacePage";
import { OrdersPage } from "../features/orders/index";
import { ReportsPage } from "../features/reports/pages/ReportsPage";
import { ProfileSettingsPage } from "../features/users/index";
// Import Route Guards
import { ProtectedRoute } from "../routes/ProtectedRoute";
import { RoleRoute } from "../routes/RoleRoute";

// Placeholders (to be replaced with real feature pages)
const Unauthorized = () => (
  <Box sx={{ p: 4, textAlign: "center" }}>
    <Typography variant="h5" color="error">
      403: Access Denied
    </Typography>
    <Typography variant="body1" sx={{ mt: 2 }}>
      You do not have permission to view this page.
    </Typography>
  </Box>
);

export const App = () => {
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/reset-password/:token" element={<ResetPasswordPage />} />
      <Route
        path="/confirm-deactivation/:token"
        element={<ConfirmDeactivationPage />}
      />
      <Route
        path="/confirm-reactivation/:token"
        element={<ConfirmReactivationPage />}
      />
      <Route path="/unauthorized" element={<Unauthorized />} />
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="/marketplace" element={<MarketplacePage />} />
      <Route path="/" element={<Navigate to="/marketplace" replace />} />

      {/* Protected Routes (require authentication) */}
      <Route element={<ProtectedRoute />}>
        {/* Common Protected Routes (All Roles) */}
        <Route element={<SaaSLayout />}>
          <Route path="/settings" element={<ProfileSettingsPage />} />
        </Route>

        {/* Pharmacy Manager Only */}
        <Route element={<RoleRoute allowedRoles={["pharmacy_manager"]} />}>
          <Route element={<SaaSLayout />}>
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/inventory" element={<InventoryPage />} />
            <Route path="/orders" element={<OrdersPage />} />
            <Route path="/reports" element={<ReportsPage />} />
          </Route>
        </Route>

        {/* Admin Only */}
        <Route element={<RoleRoute allowedRoles={["admin"]} />}>
          <Route element={<SaaSLayout />}>
            {/* Mount the User Management page here */}
            <Route path="/admin/users" element={<UserManagementPage />} />

            {/* Keep other admin routes here if you add them later */}
          </Route>
        </Route>

        {/* Public User (Patient) Only 
        <Route element={<RoleRoute allowedRoles={["public_user"]} />}>
          <Route path="/marketplace" element={<MarketplacePlaceholder />} />
        </Route> */}
      </Route>

      {/* Catch‑all 404 */}
      <Route path="*" element={<Navigate to="/unauthorized" replace />} />
    </Routes>
  );
};

export default App;
