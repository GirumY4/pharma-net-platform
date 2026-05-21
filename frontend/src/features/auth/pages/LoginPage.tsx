// src/features/auth/pages/LoginPage.tsx
import {
  EmailOutlined,
  Inventory2Outlined,
  LocalShippingOutlined,
  LockOutlined,
  LoginOutlined,
  SecurityOutlined,
  Visibility,
  VisibilityOff,
} from "@mui/icons-material";
import {
  Alert,
  Box,
  Button,
  IconButton,
  InputAdornment,
  TextField,
  Typography,
} from "@mui/material";
import { useState, type SyntheticEvent } from "react";
import { Link as RouterLink, useLocation, useNavigate } from "react-router-dom";
import {
  AuthFormHeader,
  AuthShell,
  AuthSubmitButton,
} from "../components/AuthShell";
import { useAuth } from "../../../contexts/useAuth";
import SEO from "../../../components/SEO";
import { handleApiError } from "../../../utils/errorMapper";
import { getRoleFromToken } from "../../../utils/authToken";
import { loginUser } from "../services/authApi";


const loginBrand = {
  eyebrow: "Secure pharmacy access",
  title: "Coordinate care, stock, and orders from one trusted place.",
  description:
    "Pharma-Net gives pharmacy teams and public users a focused sign-in path into role-aware workflows for inventory, ordering, and patient access.",
  items: [
    {
      icon: <SecurityOutlined fontSize="small" />,
      title: "Role-aware workspaces",
      description:
        "Admins, pharmacy managers, and public users enter the right experience after authentication.",
    },
    {
      icon: <Inventory2Outlined fontSize="small" />,
      title: "Operational clarity",
      description:
        "Inventory and order workflows stay connected so teams can act with less friction.",
    },
    {
      icon: <LocalShippingOutlined fontSize="small" />,
      title: "Healthcare logistics",
      description:
        "Support medicine discovery, fulfillment, and communication from a single platform.",
    },
  ],
  footer:
    "Use your verified account credentials to continue into your Pharma-Net workspace.",
};

export const LoginPage = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();

  const routeMessage = (location.state as { message?: string } | null)?.message;

  const handleSubmit = async (e: SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const response = await loginUser({ email, password });
      login(response.token, response.user);

      const role = getRoleFromToken(response.token);
      switch (role) {
        case "admin":
          navigate("/admin/users", { replace: true });
          break;
        case "pharmacy_manager":
          navigate("/dashboard", { replace: true });
          break;
        case "public_user":
          navigate("/marketplace", { replace: true });
          break;
        default:
          navigate("/login", { replace: true });
      }
    } catch (err: unknown) {
      setError(handleApiError(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell brand={loginBrand} formMaxWidth={500}>
      <SEO
        title="Sign In"
        description="Log in to Alyah Pharma Net to access your dashboard, manage pharmaceutical inventory, track orders, or purchase wholesale medicines."
        keywords={["pharma net login", "alyah pharma sign in", "pharmaceutical log in"]}
      />
      <AuthFormHeader
        icon={<LoginOutlined />}
        eyebrow="Welcome back"
        title="Sign in to Pharma-Net"
        description="Enter your credentials to continue to your dashboard, marketplace, or admin console."
      />

      {routeMessage && !error && (
        <Alert severity="success" sx={{ mb: 3 }}>
          {routeMessage}
        </Alert>
      )}

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <Box component="form" onSubmit={handleSubmit} noValidate>
        <TextField
          label="Email address"
          type="email"
          fullWidth
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          disabled={loading}
          autoFocus
          autoComplete="email"
          slotProps={{
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  <EmailOutlined fontSize="small" />
                </InputAdornment>
              ),
            },
          }}
          sx={{ mb: 2.25 }}
        />

        <TextField
          label="Password"
          type={showPassword ? "text" : "password"}
          fullWidth
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          disabled={loading}
          autoComplete="current-password"
          slotProps={{
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  <LockOutlined fontSize="small" />
                </InputAdornment>
              ),
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    onClick={() => setShowPassword((value) => !value)}
                    edge="end"
                    disabled={loading}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              ),
            },
          }}
          sx={{ mb: 1.5 }}
        />

        <Box sx={{ display: "flex", justifyContent: "flex-end", mb: 3 }}>
          <Button
            component={RouterLink}
            to="/forgot-password"
            variant="text"
            disabled={loading}
            sx={{ px: 0.25, color: "primary.main", fontWeight: 800 }}
          >
            Forgot password?
          </Button>
        </Box>

        <AuthSubmitButton type="submit" loading={loading} loadingText="Signing in">
          Sign in
        </AuthSubmitButton>

        <Box sx={{ textAlign: "center", mt: 3 }}>
          <Typography variant="body2" color="text.secondary">
            New to Pharma-Net?{" "}
            <Button
              component={RouterLink}
              to="/register"
              variant="text"
              disabled={loading}
              sx={{ px: 0.25, color: "primary.main", fontWeight: 800 }}
            >
              Create an account
            </Button>
          </Typography>
        </Box>
      </Box>
    </AuthShell>
  );
};
