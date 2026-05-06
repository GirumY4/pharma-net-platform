// src/app/App.tsx
import { Box, CssBaseline, ThemeProvider, Typography } from "@mui/material";
import {
  Navigate,
  Route,
  BrowserRouter as Router,
  Routes,
} from "react-router-dom";
import { AuthProvider } from "../contexts/AuthContext";
import { theme } from "../styles/theme";

// Import Auth Pages
import { ForgotPasswordPage } from "../features/auth/pages/ForgotPasswordPage";
import { LoginPage } from "../features/auth/pages/LoginPage";
import { RegisterPage } from "../features/auth/pages/RegisterPage";
import { ResetPasswordPage } from "../features/auth/pages/ResetPasswordPage";

// Import Route Guards
import { ProtectedRoute } from "../routes/ProtectedRoute";
import { RoleRoute } from "../routes/RoleRoute";

// Placeholders (to be replaced with real feature pages)
const DashboardPlaceholder = () => (
  <Box sx={{ p: 4 }}>Pharmacy Manager Dashboard</Box>
);
const MarketplacePlaceholder = () => (
  <Box sx={{ p: 4 }}>Public Marketplace</Box>
);
const AdminPlaceholder = () => <Box sx={{ p: 4 }}>System Admin Console</Box>;
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
    <ThemeProvider theme={theme}>
      <CssBaseline /> {/* Normalizes CSS across browsers */}
      <AuthProvider>
        <Router>
          <Routes>
            {/* Public Routes */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            <Route
              path="/reset-password/:token"
              element={<ResetPasswordPage />}
            />
            <Route path="/unauthorized" element={<Unauthorized />} />
            <Route path="/" element={<Navigate to="/login" replace />} />

            {/* Protected Routes (require authentication) */}
            <Route element={<ProtectedRoute />}>
              {/* Pharmacy Manager Only */}
              <Route
                element={<RoleRoute allowedRoles={["pharmacy_manager"]} />}
              >
                <Route path="/dashboard" element={<DashboardPlaceholder />} />
                {/* Future: /inventory, /orders, /reports */}
              </Route>

              {/* Admin Only */}
              <Route element={<RoleRoute allowedRoles={["admin"]} />}>
                <Route path="/admin" element={<AdminPlaceholder />} />
              </Route>

              {/* Public User (Patient) Only */}
              <Route element={<RoleRoute allowedRoles={["public_user"]} />}>
                <Route
                  path="/marketplace"
                  element={<MarketplacePlaceholder />}
                />
              </Route>
            </Route>

            {/* Catch‑all 404 */}
            <Route path="*" element={<Navigate to="/unauthorized" replace />} />
          </Routes>
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
};

export default App;
