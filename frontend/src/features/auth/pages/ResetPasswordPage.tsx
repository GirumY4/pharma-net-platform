// src/features/auth/pages/ResetPasswordPage.tsx
import {
  CheckCircle,
  KeyOutlined,
  Lock,
  LockResetOutlined,
  SecurityOutlined,
  Visibility,
  VisibilityOff,
} from "@mui/icons-material";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  IconButton,
  InputAdornment,
  TextField,
  Typography,
} from "@mui/material";
import { useEffect, useState, type SyntheticEvent } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  AuthFormHeader,
  AuthShell,
  AuthSubmitButton,
} from "../components/AuthShell";
import { handleApiError } from "../../../utils/errorMapper";
import { resetPassword } from "../services/authApi";

const resetPasswordBrand = {
  eyebrow: "Secure credential reset",
  title: "Set a fresh password and return with confidence.",
  description:
    "The reset experience keeps attention on one job: replacing compromised or forgotten credentials with a stronger password.",
  items: [
    {
      icon: <LockResetOutlined fontSize="small" />,
      title: "Focused reset step",
      description: "Update the credential without changing account details.",
    },
    {
      icon: <SecurityOutlined fontSize="small" />,
      title: "Token-based recovery",
      description:
        "The reset link validates the request before the password can be updated.",
    },
    {
      icon: <KeyOutlined fontSize="small" />,
      title: "Clean return path",
      description:
        "After success, users are sent back to sign in with the new password.",
    },
  ],
  footer:
    "Use a password that is unique to Pharma-Net and not shared with other systems.",
};

export const ResetPasswordPage = () => {
  const { token: resetToken } = useParams<{ token: string }>();
  const navigate = useNavigate();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!success) return;

    const timer = window.setTimeout(() => {
      navigate("/login", {
        state: {
          message:
            "Password reset successful. Please sign in with your new password.",
        },
        replace: true,
      });
    }, 2000);

    return () => window.clearTimeout(timer);
  }, [success, navigate]);

  const handleSubmit = async (e: SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    if (!resetToken) {
      setError("Invalid reset link. Please request a new password reset.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters long.");
      return;
    }

    setLoading(true);

    try {
      await resetPassword(resetToken, password);
      setSuccess(true);
    } catch (err: unknown) {
      setError(handleApiError(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell brand={resetPasswordBrand} formMaxWidth={500}>
      {success ? (
        <Box sx={{ textAlign: "center", py: { xs: 1, sm: 2 } }}>
          <Box
            sx={{
              width: 70,
              height: 70,
              mx: "auto",
              mb: 3,
              borderRadius: 2,
              display: "grid",
              placeItems: "center",
              color: "primary.main",
              background:
                "linear-gradient(135deg, rgba(15,139,108,0.14) 0%, rgba(221,170,74,0.16) 100%)",
              border: "1px solid rgba(15,139,108,0.18)",
            }}
          >
            <CheckCircle fontSize="large" />
          </Box>
          <Typography variant="overline" sx={{ color: "primary.main" }}>
            Password updated
          </Typography>
          <Typography variant="h4" component="h2" sx={{ mt: 0.75, mb: 1.5 }}>
            Your new password is set
          </Typography>
          <Typography
            variant="body1"
            color="text.secondary"
            sx={{ maxWidth: 420, mx: "auto", mb: 3 }}
          >
            Taking you back to sign in so you can enter with your new
            credentials.
          </Typography>
          <CircularProgress size={26} thickness={4} sx={{ mb: 3 }} />
          <AuthSubmitButton
            type="button"
            onClick={() =>
              navigate("/login", {
                state: {
                  message:
                    "Password reset successful. Please sign in with your new password.",
                },
                replace: true,
              })
            }
          >
            Go to sign in
          </AuthSubmitButton>
        </Box>
      ) : (
        <>
          <AuthFormHeader
            icon={<LockResetOutlined />}
            eyebrow="Secure access"
            title="Set new password"
            description="Choose a new password and confirm it below. You will return to the sign-in page after the reset completes."
          />

          {error && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {error}
            </Alert>
          )}

          <Box component="form" onSubmit={handleSubmit} noValidate>
            <TextField
              label="New password"
              type={showPassword ? "text" : "password"}
              variant="outlined"
              fullWidth
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={loading}
              autoFocus
              autoComplete="new-password"
              helperText="Use at least 8 characters."
              sx={{ mb: 2.5 }}
              slotProps={{
                input: {
                  startAdornment: (
                    <InputAdornment position="start">
                      <Lock fontSize="small" />
                    </InputAdornment>
                  ),
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={() => setShowPassword((value) => !value)}
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
              label="Confirm new password"
              type={showPassword ? "text" : "password"}
              variant="outlined"
              fullWidth
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              disabled={loading}
              autoComplete="new-password"
              sx={{ mb: 3 }}
              slotProps={{
                input: {
                  startAdornment: (
                    <InputAdornment position="start">
                      <Lock fontSize="small" />
                    </InputAdornment>
                  ),
                },
              }}
            />

            <AuthSubmitButton
              type="submit"
              loading={loading}
              loadingText="Resetting password"
            >
              Reset password
            </AuthSubmitButton>

            <Box sx={{ textAlign: "center", mt: 3 }}>
              <Button
                type="button"
                variant="text"
                onClick={() => navigate("/login")}
                disabled={loading}
                sx={{ px: 0.25, color: "primary.main", fontWeight: 800 }}
              >
                Back to sign in
              </Button>
            </Box>
          </Box>
        </>
      )}
    </AuthShell>
  );
};
