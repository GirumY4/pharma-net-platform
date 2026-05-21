// src/features/auth/pages/ForgotPasswordPage.tsx
import {
  ArrowBack,
  Email,
  EmailOutlined,
  Lock,
  MarkEmailReadOutlined,
  SecurityOutlined,
} from "@mui/icons-material";
import {
  Alert,
  Box,
  Button,
  InputAdornment,
  TextField,
} from "@mui/material";
import { useState, type SyntheticEvent } from "react";
import { useNavigate } from "react-router-dom";
import {
  AuthFormHeader,
  AuthShell,
  AuthSubmitButton,
} from "../components/AuthShell";
import { handleApiError } from "../../../utils/errorMapper";
import { forgotPassword } from "../services/authApi";
import SEO from "../../../components/SEO";


const forgotPasswordBrand = {
  eyebrow: "Account recovery",
  title: "Recover access without disrupting pharmacy work.",
  description:
    "The recovery flow is calm, direct, and built around secure email verification so teams can return to essential workflows confidently.",
  items: [
    {
      icon: <SecurityOutlined fontSize="small" />,
      title: "Secure reset request",
      description:
        "Password recovery begins with the email address connected to the account.",
    },
    {
      icon: <MarkEmailReadOutlined fontSize="small" />,
      title: "Clear inbox handoff",
      description:
        "Users receive the next step by email instead of guessing through the interface.",
    },
    {
      icon: <Lock fontSize="small" />,
      title: "Credential reset",
      description:
        "Set a new password from a focused, secure recovery step.",
    },
  ],
  footer:
    "For account protection, recovery links should only be opened from messages you requested.",
};

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
    <AuthShell brand={forgotPasswordBrand} formMaxWidth={500}>
      <SEO title="Forgot Password" noIndex={true} />
      <Button
        startIcon={<ArrowBack />}
        onClick={() => navigate("/login")}
        sx={{
          mb: 3,
          px: 0.25,
          color: "text.secondary",
          fontWeight: 800,
          "&:hover": {
            color: "primary.main",
            backgroundColor: "transparent",
          },
        }}
      >
        Back to sign in
      </Button>

      <AuthFormHeader
        icon={<EmailOutlined />}
        eyebrow="Password help"
        title="Reset your password"
        description="Enter the email address linked to your account and we will send the reset instructions."
      />

      {message && (
        <Alert severity="success" sx={{ mb: 3 }}>
          {message}
        </Alert>
      )}

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {message ? (
        <AuthSubmitButton type="button" onClick={() => navigate("/login")}>
          Return to sign in
        </AuthSubmitButton>
      ) : (
        <Box component="form" onSubmit={handleSubmit} noValidate>
          <TextField
            label="Email address"
            type="email"
            variant="outlined"
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
                    <Email fontSize="small" />
                  </InputAdornment>
                ),
              },
            }}
            sx={{ mb: 3 }}
          />
          <AuthSubmitButton
            type="submit"
            loading={loading}
            loadingText="Sending reset link"
          >
            Send reset link
          </AuthSubmitButton>
        </Box>
      )}
    </AuthShell>
  );
};
