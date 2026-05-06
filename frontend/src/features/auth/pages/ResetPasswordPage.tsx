// src/features/auth/pages/ResetPasswordPage.tsx
import { Lock, Visibility, VisibilityOff } from "@mui/icons-material";
import {
  Alert,
  Box,
  Button,
  Grid,
  IconButton,
  InputAdornment,
  Paper,
  TextField,
  Typography,
} from "@mui/material";
import { useState, type FormEvent } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getRoleFromToken, useAuth } from "../../../contexts/AuthContext";
import { getErrorMessage } from "../../../utils/errorMapper";
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

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
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
    } catch (err: any) {
      // Handle expired/invalid token explicitly
      if (err.code === "INVALID_TOKEN") {
        setError(
          "This password reset link has expired. Please request a new one.",
        );
      } else {
        setError(getErrorMessage(err));
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Grid
      container
      sx={{
        minHeight: "100vh",
        backgroundColor: "background.default",
        alignItems: "center",
        justifyContent: "center",
        p: 2,
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
          Set New Password
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
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
            sx={{ py: 1.5, fontSize: "1.05rem", borderRadius: 2 }}
          >
            {loading ? "Resetting..." : "Reset Password"}
          </Button>
        </Box>
      </Paper>
    </Grid>
  );
};
