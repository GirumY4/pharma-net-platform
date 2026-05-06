// src/features/auth/pages/ForgotPasswordPage.tsx
import { ArrowBack, Email } from "@mui/icons-material";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Grid,
  InputAdornment,
  Paper,
  TextField,
  Typography,
} from "@mui/material";
import { useState, type SyntheticEvent } from "react";
import { useNavigate } from "react-router-dom";
import { handleApiError } from "../../../utils/errorMapper";
import { forgotPassword } from "../services/authApi";

export const ForgotPasswordPage = () => {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setMessage(null);
    setLoading(true);

    try {
      const result = await forgotPassword(email);
      setMessage(result.message);
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
            Account recovery
          </Typography>
          <Typography
            variant="h3"
            sx={{ mt: 1.5, mb: 3, lineHeight: 1.15, fontWeight: 800 }}
          >
            Keep pharmacy operations moving securely.
          </Typography>
          <Typography
            variant="h6"
            sx={{ opacity: 0.82, lineHeight: 1.7, fontWeight: 400, mb: 5 }}
          >
            Recover access to the platform that connects inventory, orders, and
            patient demand across your pharmacy network.
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
                24/7
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.78 }}>
                Secure access workflows
              </Typography>
            </Box>
            <Box>
              <Typography
                variant="h5"
                color="primary.light"
                sx={{ fontWeight: 800 }}
              >
                Real-time
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.78 }}>
                Pharmacy network visibility
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
          <Button
            startIcon={<ArrowBack />}
            onClick={() => navigate("/login")}
            sx={{
              mb: 4,
              color: "text.secondary",
              px: 0,
              minWidth: "auto",
              fontWeight: 600,
              "&:hover": {
                backgroundColor: "transparent",
                color: "primary.main",
              },
            }}
          >
            Back to Login
          </Button>

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
              <Email />
            </Box>
            <Typography
              variant="overline"
              sx={{
                color: "primary.main",
                fontWeight: 700,
                letterSpacing: 0.8,
              }}
            >
              Account recovery
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
            Reset your password
          </Typography>
          <Typography
            variant="body1"
            color="text.secondary"
            sx={{ mb: 4, lineHeight: 1.7 }}
          >
            Enter your email address and we'll send you a link to reset your
            password.
          </Typography>

          {message && (
            <Alert severity="success" sx={{ mb: 3, borderRadius: 2 }}>
              {message}
            </Alert>
          )}
          {error && (
            <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>
              {error}
            </Alert>
          )}

          {!message && (
            <Box component="form" onSubmit={handleSubmit} noValidate>
              <TextField
                label="Email Address"
                type="email"
                variant="outlined"
                fullWidth
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
                sx={{ mb: 3 }}
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
                  "Send Reset Link"
                )}
              </Button>
            </Box>
          )}
        </Paper>
      </Grid>
    </Grid>
  );
};
