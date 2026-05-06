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
    <Grid
      container
      sx={{
        minHeight: "100vh",
        background:
          "linear-gradient(135deg, #F7FAF9 0%, #EEF5F2 46%, #F9FAFB 100%)",
        alignItems: "center",
        justifyContent: "center",
        p: { xs: 2.5, sm: 4 },
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

        <Box component="form" onSubmit={handleSubmit}>
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
  );
};
