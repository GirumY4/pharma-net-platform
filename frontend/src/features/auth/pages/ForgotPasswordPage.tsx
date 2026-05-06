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
  );
};
