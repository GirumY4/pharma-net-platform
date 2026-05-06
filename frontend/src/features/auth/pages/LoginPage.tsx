// src/features/auth/pages/LoginPage.tsx
import { Email, Lock, Visibility, VisibilityOff } from "@mui/icons-material";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Grid,
  IconButton,
  InputAdornment,
  Paper,
  TextField,
  Typography,
} from "@mui/material";
import { useState, type FormEvent } from "react";
import { Link as RouterLink, useLocation, useNavigate } from "react-router-dom";
import { getRoleFromToken, useAuth } from "../../../contexts/AuthContext";
import { getErrorMessage } from "../../../utils/errorMapper";
import { loginUser } from "../services/authApi";

export const LoginPage = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();

  // Show success message from registration redirect
  const registrationMessage = (location.state as { message?: string })?.message;

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const response = await loginUser({ email, password });
      login(response.token, response.user);

      const role = getRoleFromToken(response.token);
      switch (role) {
        case "admin":
          navigate("/admin", { replace: true });
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
    } catch (err: any) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Grid container sx={{ minHeight: "100vh" }}>
      {/* Left side - Branding & Information */}
      <Grid
        size={{ xs: 12, md: 5 }}
        sx={{
          backgroundColor: "primary.dark",
          color: "primary.contrastText",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          p: { xs: 4, md: 8 },
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Subtle background decoration */}
        <Box
          sx={{
            position: "absolute",
            top: -100,
            left: -100,
            width: 300,
            height: 300,
            borderRadius: "50%",
            background:
              "linear-gradient(45deg, rgba(0,237,100,0.1) 0%, rgba(0,104,74,0) 100%)",
            filter: "blur(40px)",
          }}
        />

        <Box sx={{ zIndex: 1, maxWidth: 480 }}>
          {/* Logo Placeholder */}
          <Box sx={{ display: "flex", alignItems: "center", mb: 4, gap: 1.5 }}>
            <svg
              width="40"
              height="40"
              viewBox="0 0 40 40"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <rect width="40" height="40" rx="8" fill="#00ED64" />
              <path
                d="M12 20h16M20 12v16"
                stroke="#001E2B"
                strokeWidth="4"
                strokeLinecap="round"
              />
            </svg>
            <Typography
              variant="h4"
              sx={{ fontWeight: "800", letterSpacing: "-0.5px" }}
            >
              Pharma-Net
            </Typography>
          </Box>

          <Typography
            variant="h3"
            sx={{ mb: 3, lineHeight: 1.2, fontWeight: "700" }}
          >
            The Modern Pharmacy Network
          </Typography>
          <Typography
            variant="h6"
            sx={{ opacity: 0.8, mb: 4, lineHeight: 1.6, fontWeight: "400" }}
          >
            Manage inventory, fulfill orders, and connect with a global
            marketplace of patients—all from one secure platform.
          </Typography>

          <Box sx={{ display: "flex", gap: 3, mt: 4 }}>
            <Box>
              <Typography
                variant="h4"
                color="primary.light"
                sx={{ fontWeight: "800" }}
              >
                10k+
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.8 }}>
                Pharmacies
              </Typography>
            </Box>
            <Box>
              <Typography
                variant="h4"
                color="primary.light"
                sx={{ fontWeight: "800" }}
              >
                99.9%
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.8 }}>
                Uptime SLA
              </Typography>
            </Box>
          </Box>
        </Box>
      </Grid>

      {/* Right side - Login Form */}
      <Grid
        size={{ xs: 12, md: 7 }}
        sx={{
          backgroundColor: "background.default",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          p: { xs: 4, md: 8 },
        }}
      >
        <Paper
          elevation={0}
          sx={{
            p: { xs: 4, md: 6 },
            width: "100%",
            maxWidth: 480,
            borderRadius: 3,
            border: "1px solid",
            borderColor: "divider",
          }}
        >
          <Typography
            variant="h5"
            component="h2"
            gutterBottom
            sx={{ fontWeight: "700" }}
          >
            Welcome back
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
            Sign in to your account to continue
          </Typography>

          {registrationMessage && !error && (
            <Alert severity="success" sx={{ mb: 3, borderRadius: 2 }}>
              {registrationMessage}
            </Alert>
          )}

          {error && (
            <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>
              {error}
            </Alert>
          )}

          <Box component="form" onSubmit={handleSubmit} noValidate>
            <TextField
              label="Email Address"
              type="email"
              fullWidth
              margin="normal"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={loading}
              autoFocus
              slotProps={{
                input: {
                  startAdornment: (
                    <InputAdornment position="start">
                      <Email color="action" />
                    </InputAdornment>
                  ),
                },
              }}
              sx={{ mb: 2 }}
            />
            <TextField
              label="Password"
              type={showPassword ? "text" : "password"}
              fullWidth
              margin="normal"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={loading}
              slotProps={{
                input: {
                  startAdornment: (
                    <InputAdornment position="start">
                      <Lock color="action" />
                    </InputAdornment>
                  ),
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={() => setShowPassword(!showPassword)}
                        edge="end"
                        disabled={loading}
                      >
                        {showPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                },
              }}
              sx={{ mb: 3 }}
            />
            <Button
              component={RouterLink}
              to="/forgot-password"
              variant="text"
              sx={{ mb: 3, p: 0, minWidth: "auto", fontWeight: 600 }}
              disabled={loading}
            >
              Forgot password?
            </Button>
            <Button
              type="submit"
              variant="contained"
              color="primary"
              fullWidth
              size="large"
              disabled={loading}
              sx={{
                py: 1.5,
                mb: 3,
                fontSize: "1.05rem",
                textTransform: "none",
                borderRadius: 2,
              }}
            >
              {loading ? (
                <CircularProgress size={24} color="inherit" />
              ) : (
                "Sign In"
              )}
            </Button>

            <Box sx={{ textAlign: "center" }}>
              <Typography variant="body2" color="text.secondary">
                Don't have an account?{" "}
                <Button
                  component={RouterLink}
                  to="/register"
                  variant="text"
                  disabled={loading}
                  sx={{
                    p: 0,
                    minWidth: "auto",
                    fontWeight: 600,
                    "&:hover": {
                      backgroundColor: "transparent",
                      textDecoration: "underline",
                    },
                  }}
                >
                  Register here
                </Button>
              </Typography>
            </Box>
          </Box>
        </Paper>
      </Grid>
    </Grid>
  );
};
