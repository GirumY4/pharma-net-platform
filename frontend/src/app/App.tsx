// src/app/App.tsx
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { ThemeProvider, CssBaseline } from "@mui/material";
import { theme } from "../styles/theme";
import { AuthProvider } from "../contexts/AuthContext";

// Import Auth Pages
import { LoginPage } from "../features/auth/pages/LoginPage";
import { RegisterPage } from "../features/auth/pages/RegisterPage";

// Import Route Guards
import { ProtectedRoute } from "../routes/ProtectedRoute";
import { RoleRoute } from "../routes/RoleRoute";

// Temporary Placeholder Components (We will build these in the next features)
const DashboardPlaceholder = () => (
  <div>Pharmacy Manager Dashboard (Building Next)</div>
);
const MarketplacePlaceholder = () => (
  <div>Public Marketplace (External/Placeholder)</div>
);
const AdminPlaceholder = () => <div>System Admin Console</div>;
const Unauthorized = () => (
  <div>403: You do not have permission to view this page.</div>
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
            <Route path="/unauthorized" element={<Unauthorized />} />

            {/* Redirect root to login for now */}
            <Route path="/" element={<Navigate to="/login" replace />} />

            {/* Protected Routes (Must be logged in) */}
            <Route element={<ProtectedRoute />}>
              {/* Pharmacy Manager Only Routes */}
              <Route
                element={<RoleRoute allowedRoles={["pharmacy_manager"]} />}
              >
                <Route path="/dashboard" element={<DashboardPlaceholder />} />
                {/* Future routes: /inventory, /orders, /reports */}
              </Route>

              {/* System Admin Only Routes */}
              <Route element={<RoleRoute allowedRoles={["admin"]} />}>
                <Route path="/admin" element={<AdminPlaceholder />} />
              </Route>

              {/* Public User (Patient) Only Routes */}
              <Route element={<RoleRoute allowedRoles={["public_user"]} />}>
                <Route
                  path="/marketplace"
                  element={<MarketplacePlaceholder />}
                />
              </Route>
            </Route>
          </Routes>
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
};

export default App;
