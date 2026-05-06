// src/features/auth/pages/ForgotPasswordPage.tsx
import { ArrowBack, Email } from "@mui/icons-material";
import {
  Alert,
  Box,
  Button,
  Grid,
  InputAdornment,
  Paper,
  TextField,
  Typography,
} from "@mui/material";
import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { getErrorMessage } from "../../../utils/errorMapper";
import { forgotPassword } from "../services/authApi";

export const ForgotPasswordPage = () => {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setMessage(null);
    setLoading(true);

    try {
      const result = await forgotPassword(email);
      setMessage(result.message);
    } catch (err: any) {
      setError(getErrorMessage(err));
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
        <Button
          startIcon={<ArrowBack />}
          onClick={() => navigate("/login")}
          sx={{ mb: 3, color: "text.secondary" }}
        >
          Back to Login
        </Button>

        <Typography
          variant="h5"
          component="h2"
          gutterBottom
          sx={{ fontWeight: "700" }}
        >
          Forgot Password?
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
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
          <Box component="form" onSubmit={handleSubmit}>
            <TextField
              label="Email Address"
              type="email"
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
              sx={{ py: 1.5, fontSize: "1.05rem", borderRadius: 2 }}
            >
              {loading ? "Sending..." : "Send Reset Link"}
            </Button>
          </Box>
        )}
      </Paper>
    </Grid>
  );
};
