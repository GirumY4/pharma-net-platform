import { Alert, Box, Button, CircularProgress, Typography } from "@mui/material";
import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { handleApiError } from "../../../utils/errorMapper";
import { confirmReactivation } from "../../users/services/usersApi";

export const ConfirmReactivationPage = () => {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const hasConfirmedRef = useRef(false);

  useEffect(() => {
    if (hasConfirmedRef.current) return;

    if (!token) {
      setError("No reactivation token provided.");
      setLoading(false);
      return;
    }

    const confirm = async () => {
      hasConfirmedRef.current = true;
      try {
        const response = await confirmReactivation(token);
        setSuccess(response.message || "Your account has been successfully reactivated.");
      } catch (err) {
        setError(handleApiError(err));
      } finally {
        setLoading(false);
      }
    };

    confirm();
  }, [token]);

  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        bgcolor: "#F8FAFC",
        p: 2,
      }}
    >
      <Box
        sx={{
          maxWidth: 400,
          width: "100%",
          p: 4,
          bgcolor: "white",
          borderRadius: 3,
          boxShadow: "0 10px 40px -10px rgba(0,0,0,0.1)",
          textAlign: "center",
        }}
      >
        <Typography variant="h5" sx={{ fontWeight: 800, color: "#001E2B", mb: 2 }}>
          Account Reactivation
        </Typography>

        {loading ? (
          <Box sx={{ my: 4 }}>
            <CircularProgress color="primary" />
            <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
              Verifying your request...
            </Typography>
          </Box>
        ) : error ? (
          <>
            <Alert severity="error" sx={{ mb: 3 }}>
              {error}
            </Alert>
            <Button
              variant="contained"
              fullWidth
              onClick={() => navigate("/login")}
              sx={{ bgcolor: "#001E2B", "&:hover": { bgcolor: "#000000" } }}
            >
              Back to Login
            </Button>
          </>
        ) : (
          <>
            <Alert severity="success" sx={{ mb: 3 }}>
              {success}
            </Alert>
            <Button
              variant="contained"
              fullWidth
              onClick={() => navigate("/login")}
              sx={{ bgcolor: "#00ED64", color: "#001E2B", fontWeight: 700, "&:hover": { bgcolor: "#00C853" } }}
            >
              Login Now
            </Button>
          </>
        )}
      </Box>
    </Box>
  );
};
