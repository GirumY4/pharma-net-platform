import {
  Box,
  Button,
  Stack,
  Typography,
} from "@mui/material";
import type { ReactNode } from "react";
import { Route, Routes } from "react-router-dom";

import { SaaSLayout } from "../components/layout/SaaSLayout";
import { UserManagementPage } from "../features/admin/pages/UserManagementPage";
import { ConfirmDeactivationPage } from "../features/auth/pages/ConfirmDeactivationPage";
import { ConfirmReactivationPage } from "../features/auth/pages/ConfirmReactivationPage";
import { ForgotPasswordPage } from "../features/auth/pages/ForgotPasswordPage";
import { LoginPage } from "../features/auth/pages/LoginPage";
import { RegisterPage } from "../features/auth/pages/RegisterPage";
import { ResetPasswordPage } from "../features/auth/pages/ResetPasswordPage";
import { AdminBillingPage, BillingPage } from "../features/billing";
import { DashboardPage } from "../features/dashboard/pages/DashboardPage";
import { InventoryPage } from "../features/inventory";
import { MarketplacePage } from "../features/marketplace";
import { ReportsPage } from "../features/reports/pages/ReportsPage";
import { ProfileSettingsPage } from "../features/users";
import { ProtectedRoute } from "../routes/ProtectedRoute";
import { RoleRoute } from "../routes/RoleRoute";
import { SubscriptionRoute } from "../routes/SubscriptionRoute";
import { LandingPage } from "../features/landing-page";

const CenteredPage = ({ children }: { children: ReactNode }) => (
  <Box
    sx={{
      minHeight: "100vh",
      display: "grid",
      placeItems: "center",
      bgcolor: "#F7FAF9",
      px: 2,
    }}
  >
    <Box sx={{ maxWidth: 520, textAlign: "center" }}>{children}</Box>
  </Box>
);

const Unauthorized = () => (
  <CenteredPage>
    <Typography variant="h5" color="error" sx={{ fontWeight: 800 }}>
      403: Access Denied
    </Typography>
    <Typography variant="body1" sx={{ mt: 2 }}>
      You do not have permission to view this page.
    </Typography>
  </CenteredPage>
);

const FeatureUnavailable = () => (
  <CenteredPage>
    <Typography variant="h5" sx={{ fontWeight: 800, color: "#0F5E4D" }}>
      Feature unavailable
    </Typography>
    <Typography variant="body1" color="text.secondary" sx={{ mt: 1.5 }}>
      Order management is disabled for now while the workflow is being prepared.
    </Typography>
    <Button href="/dashboard" variant="contained" sx={{ mt: 3 }}>
      Back to dashboard
    </Button>
  </CenteredPage>
);

const NotFound = () => (
  <CenteredPage>
    <Typography variant="h5" sx={{ fontWeight: 800, color: "#0F5E4D" }}>
      Page not found
    </Typography>
    <Typography variant="body1" color="text.secondary" sx={{ mt: 1.5 }}>
      The page you are looking for does not exist.
    </Typography>
    <Stack
      direction="row"
      spacing={1.5}
      sx={{ justifyContent: "center", mt: 3 }}
    >
      <Button href="/marketplace" variant="contained">
        Marketplace
      </Button>
      <Button href="/login" variant="outlined">
        Sign in
      </Button>
    </Stack>
  </CenteredPage>
);

export const App = () => (
  <Routes>
    <Route path="/" element={<LandingPage />} />

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
    <Route path="/marketplace" element={<MarketplacePage />} />
    <Route path="/unauthorized" element={<Unauthorized />} />

    <Route element={<ProtectedRoute />}>
      <Route element={<SaaSLayout />}>
        <Route path="/settings" element={<ProfileSettingsPage />} />
      </Route>

      <Route element={<RoleRoute allowedRoles={["pharmacy_manager"]} />}>
        <Route element={<SaaSLayout />}>
          <Route path="/billing" element={<BillingPage />} />
          <Route element={<SubscriptionRoute />}>
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/inventory" element={<InventoryPage />} />
            <Route path="/orders" element={<FeatureUnavailable />} />
            <Route path="/reports" element={<ReportsPage />} />
          </Route>
        </Route>
      </Route>

      <Route element={<RoleRoute allowedRoles={["admin"]} />}>
        <Route element={<SaaSLayout />}>
          <Route path="/admin/users" element={<UserManagementPage />} />
          <Route path="/admin/billing" element={<AdminBillingPage />} />
        </Route>
      </Route>
    </Route>

    <Route path="*" element={<NotFound />} />
  </Routes>
);

export default App;
