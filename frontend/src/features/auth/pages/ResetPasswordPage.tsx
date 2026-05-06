// src/features/auth/pages/ResetPasswordPage.tsx
import { Lock, Visibility, VisibilityOff } from "@mui/icons-material";
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
import { useState, type SyntheticEvent } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getRoleFromToken, useAuth } from "../../../contexts/AuthContext";
import { handleApiError } from "../../../utils/errorMapper";
import { resetPassword } from "../services/authApi";

export const ResetPasswordPage = () => {
  const { token: resetToken } = useParams<{ token: string }>(); // Grab token from URL
  const navigate = useNavigate();
  const { login } = useAuth();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    if (!resetToken) {
      setError("Invalid reset link. Please request a new password reset.");
      return;
    }
    if (password !== confirmPassword) {
      return setError("Passwords do not match.");
    }
    if (password.length < 8) {
      return setError("Password must be at least 8 characters long.");
    }

    setLoading(true);

    try {
      const response = await resetPassword(resetToken, password);

      // Auto‑login with the new token returned by backend
      login(response.token);

      // Redirect based on role
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
    } catch (err: unknown) {
      setError(handleApiError(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Grid container sx={{ minHeight: "100vh" }}>
      <Grid
        size={{ xs: 12, md: 5 }}
        sx={{
          minHeight: { xs: 320, md: "100vh" },
          backgroundColor: "primary.dark",
          backgroundImage:
            "linear-gradient(rgba(0, 237, 100, 0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(0, 237, 100, 0.08) 1px, transparent 1px)",
          backgroundSize: "44px 44px",
          color: "primary.contrastText",
          display: "flex",
          alignItems: "center",
          p: { xs: 3, sm: 5, md: 8 },
        }}
      >
        <Box sx={{ maxWidth: 520 }}>
          <Box sx={{ display: "flex", alignItems: "center", mb: 6, gap: 1.5 }}>
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
            <Typography variant="h4" sx={{ fontWeight: 800, letterSpacing: 0 }}>
              Pharma-Net
            </Typography>
          </Box>
          <Typography
            variant="overline"
            sx={{ color: "primary.light", fontWeight: 700, letterSpacing: 1 }}
          >
            Secure credential reset
          </Typography>
          <Typography
            variant="h3"
            sx={{ mt: 1.5, mb: 3, lineHeight: 1.15, fontWeight: 800 }}
          >
            Restore access without slowing your network down.
          </Typography>
          <Typography
            variant="h6"
            sx={{ opacity: 0.82, lineHeight: 1.7, fontWeight: 400, mb: 5 }}
          >
            Set a fresh password and return to the dashboards that help teams
            coordinate stock, orders, and fulfillment.
          </Typography>
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
              gap: 2,
              pt: 4,
              borderTop: "1px solid rgba(255, 255, 255, 0.16)",
            }}
          >
            <Box>
              <Typography
                variant="h5"
                color="primary.light"
                sx={{ fontWeight: 800 }}
              >
                Encrypted
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.78 }}>
                Token-based reset flow
              </Typography>
            </Box>
            <Box>
              <Typography
                variant="h5"
                color="primary.light"
                sx={{ fontWeight: 800 }}
              >
                Focused
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.78 }}>
                Direct return to your workspace
              </Typography>
            </Box>
          </Box>
        </Box>
      </Grid>

      <Grid
        size={{ xs: 12, md: 7 }}
        sx={{
          minHeight: { xs: "auto", md: "100vh" },
          background:
            "linear-gradient(135deg, #F7FAF9 0%, #EEF5F2 46%, #F9FAFB 100%)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          p: { xs: 2.5, sm: 5, md: 8 },
        }}
      >
        <Paper
          elevation={0}
          sx={{
            p: { xs: 3, sm: 4.5, md: 5 },
            width: "100%",
            maxWidth: 464,
            borderRadius: 4,
            border: "1px solid",
            borderColor: "rgba(255, 255, 255, 0.72)",
            backgroundColor: "rgba(255, 255, 255, 0.82)",
            backdropFilter: "blur(18px)",
            boxShadow: "0 24px 70px rgba(0, 30, 43, 0.12)",
          }}
        >
          <Box sx={{ mb: 3 }}>
            <Box
              sx={{
                width: 48,
                height: 48,
                borderRadius: 2,
                display: "grid",
                placeItems: "center",
                mb: 3,
                backgroundColor: "rgba(0, 104, 74, 0.1)",
                color: "primary.main",
              }}
            >
              <Lock />
            </Box>
            <Typography
              variant="overline"
              sx={{
                color: "primary.main",
                fontWeight: 700,
                letterSpacing: 0.8,
              }}
            >
              Secure access
            </Typography>
          </Box>
          <Typography
            variant="h4"
            component="h2"
            sx={{
              mb: 1.5,
              fontWeight: 800,
              letterSpacing: 0,
              color: "text.primary",
            }}
          >
            Set New Password
          </Typography>
          <Typography
            variant="body1"
            color="text.secondary"
            sx={{ mb: 4, lineHeight: 1.7 }}
          >
            Please enter your new password below.
          </Typography>

          {error && (
            <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>
              {error}
            </Alert>
          )}

          <Box component="form" onSubmit={handleSubmit} noValidate>
            <TextField
              label="New Password"
              type={showPassword ? "text" : "password"}
              variant="outlined"
              fullWidth
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={loading}
              sx={{ mb: 3 }}
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
                        aria-label={
                          showPassword ? "Hide password" : "Show password"
                        }
                      >
                        {showPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                },
              }}
            />

            <TextField
              label="Confirm New Password"
              type={showPassword ? "text" : "password"}
              variant="outlined"
              fullWidth
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              disabled={loading}
              sx={{ mb: 4 }}
              slotProps={{
                input: {
                  startAdornment: (
                    <InputAdornment position="start">
                      <Lock color="action" />
                    </InputAdornment>
                  ),
                },
              }}
            />

            <Button
              type="submit"
              variant="contained"
              color="primary"
              fullWidth
              size="large"
              disabled={loading}
              sx={{
                py: 1.45,
                fontSize: "1rem",
                borderRadius: 2,
                backgroundColor: "primary.main",
                boxShadow: "0 12px 24px rgba(0, 104, 74, 0.22)",
                "&:hover": {
                  backgroundColor: "#00593f",
                  boxShadow: "0 16px 30px rgba(0, 104, 74, 0.28)",
                },
              }}
            >
              {loading ? (
                <CircularProgress size={22} color="inherit" />
              ) : (
                "Reset Password"
              )}
            </Button>
          </Box>
        </Paper>
      </Grid>
    </Grid>
  );
};
