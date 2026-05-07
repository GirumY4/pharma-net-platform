// src/features/auth/pages/RegisterPage.tsx
import {
  AccessTime,
  Business,
  CheckCircle,
  Email,
  HealthAndSafetyOutlined,
  Inventory2Outlined,
  LocationCity,
  LocationOn,
  Lock,
  Map,
  Person,
  Phone,
  StorefrontOutlined,
  Visibility,
  VisibilityOff,
} from "@mui/icons-material";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Divider,
  Grid,
  IconButton,
  InputAdornment,
  MenuItem,
  TextField,
  Typography,
} from "@mui/material";
import { useEffect, useState, type SyntheticEvent } from "react";
import { useNavigate } from "react-router-dom";
import {
  AuthFormHeader,
  AuthShell,
  AuthSubmitButton,
} from "../components/AuthShell";
import { handleApiError } from "../../../utils/errorMapper";
import { registerUser } from "../services/authApi";

const redirectDelay = 5;

const registerBrand = {
  eyebrow: "Create your access",
  title: "Join the network that connects pharmacies and patients.",
  description:
    "Choose the account type that matches your role, then build a secure profile for ordering, pharmacy operations, and connected fulfillment.",
  items: [
    {
      icon: <StorefrontOutlined fontSize="small" />,
      title: "Pharmacy manager accounts",
      description:
        "Manage storefront details, inventory context, and fulfillment information from a focused workspace.",
    },
    {
      icon: <HealthAndSafetyOutlined fontSize="small" />,
      title: "Public user accounts",
      description:
        "Search for medicine availability, save delivery details, and place orders with less friction.",
    },
    {
      icon: <Inventory2Outlined fontSize="small" />,
      title: "Clean operational data",
      description:
        "Accurate contact and location fields make discovery and delivery easier for everyone.",
    },
  ],
  footer:
    "Built to keep account setup clear, accurate, and ready for real pharmacy workflows.",
};

export const RegisterPage = () => {
  const navigate = useNavigate();

  const [role, setRole] = useState<"pharmacy_manager" | "public_user" | "">("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [lat, setLat] = useState("");
  const [lng, setLng] = useState("");

  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [countdown, setCountdown] = useState(redirectDelay);

  const isPharmacy = role === "pharmacy_manager";

  useEffect(() => {
    if (!success) return;

    if (countdown <= 0) {
      navigate("/login", {
        state: { message: "Registration successful. Please sign in." },
        replace: true,
      });
      return;
    }

    const timer = window.setTimeout(
      () => setCountdown((current) => current - 1),
      1000,
    );
    return () => window.clearTimeout(timer);
  }, [success, countdown, navigate]);

  const handleSubmit = async (e: SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    if (!role) {
      setError("Choose the account type that matches your Pharma-Net role.");
      return;
    }

    setLoading(true);

    let location: { lat: number; lng: number } | undefined;
    if (lat || lng) {
      const latNum = parseFloat(lat);
      const lngNum = parseFloat(lng);
      if (isNaN(latNum) || isNaN(lngNum)) {
        setError("GPS coordinates must be valid numbers.");
        setLoading(false);
        return;
      }
      location = { lat: latNum, lng: lngNum };
    }

    try {
      await registerUser({
        name,
        email,
        password,
        role,
        phoneNumber: phoneNumber || undefined,
        address: address || undefined,
        city: city || undefined,
        location,
      });
      setCountdown(redirectDelay);
      setSuccess(true);
    } catch (err: unknown) {
      setError(handleApiError(err));
    } finally {
      setLoading(false);
    }
  };

  const handleManualRedirect = () => {
    navigate("/login", {
      state: { message: "Registration successful. Please sign in." },
      replace: true,
    });
  };

  return (
    <AuthShell brand={registerBrand} formMaxWidth={660}>
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
            Registration complete
          </Typography>
          <Typography variant="h4" component="h2" sx={{ mt: 0.75, mb: 1.5 }}>
            Your account is ready
          </Typography>
          <Typography
            variant="body1"
            color="text.secondary"
            sx={{ maxWidth: 460, mx: "auto", mb: 3.5 }}
          >
            We created your Pharma-Net profile. You will be redirected to sign
            in and continue with your new credentials.
          </Typography>

          <Box
            sx={{
              display: "inline-grid",
              placeItems: "center",
              position: "relative",
              width: 92,
              height: 92,
              mb: 3.5,
            }}
          >
            <CircularProgress
              variant="determinate"
              value={((redirectDelay - countdown) / redirectDelay) * 100}
              size={92}
              thickness={3.5}
              sx={{ color: "primary.main" }}
            />
            <Typography
              variant="h5"
              sx={{ position: "absolute", fontWeight: 800 }}
            >
              {countdown}s
            </Typography>
          </Box>

          <AuthSubmitButton
            type="button"
            onClick={handleManualRedirect}
            startIcon={<AccessTime />}
          >
            Go to sign in now
          </AuthSubmitButton>
        </Box>
      ) : (
        <>
          <AuthFormHeader
            icon={<Business />}
            eyebrow="Account setup"
            title="Create your account"
            description="Start with the essentials. Pharmacy-specific details help your listing and delivery workflows work correctly."
          />

          {error && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {error}
            </Alert>
          )}

          <Box component="form" onSubmit={handleSubmit} noValidate>
            <TextField
              select
              label="Account type"
              fullWidth
              value={role}
              onChange={(e) =>
                setRole(e.target.value as "pharmacy_manager" | "public_user")
              }
              required
              disabled={loading}
              helperText={
                isPharmacy
                  ? "Pharmacy accounts use contact and address details for marketplace operations."
                  : "Public user accounts can search, order, and manage delivery details."
              }
              sx={{ mb: 2.5 }}
            >
              <MenuItem value="public_user">Public user</MenuItem>
              <MenuItem value="pharmacy_manager">Pharmacy manager</MenuItem>
            </TextField>

            <Grid container spacing={2}>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  label="Full name"
                  fullWidth
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  disabled={loading}
                  autoComplete="name"
                  slotProps={{
                    input: {
                      startAdornment: (
                        <InputAdornment position="start">
                          <Person fontSize="small" />
                        </InputAdornment>
                      ),
                    },
                  }}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  label="Email address"
                  type="email"
                  fullWidth
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={loading}
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
                />
              </Grid>
            </Grid>

            <TextField
              label="Password"
              type={showPassword ? "text" : "password"}
              fullWidth
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={loading}
              autoComplete="new-password"
              helperText="Use at least 8 characters."
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
                        size="small"
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
              sx={{ mt: 2, mb: 2.5 }}
            />

            <Divider sx={{ my: 3 }} />

            <Typography
              variant="subtitle2"
              color="text.primary"
              sx={{ mb: 0.5 }}
            >
              Contact and location
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              These details help match accounts to the right fulfillment and
              delivery context.
            </Typography>

            <Grid container spacing={2}>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  label="Phone number"
                  fullWidth
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  required={isPharmacy}
                  disabled={loading}
                  autoComplete="tel"
                  slotProps={{
                    input: {
                      startAdornment: (
                        <InputAdornment position="start">
                          <Phone fontSize="small" />
                        </InputAdornment>
                      ),
                    },
                  }}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  label="City"
                  fullWidth
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  required={isPharmacy}
                  disabled={loading}
                  autoComplete="address-level2"
                  slotProps={{
                    input: {
                      startAdornment: (
                        <InputAdornment position="start">
                          <LocationCity fontSize="small" />
                        </InputAdornment>
                      ),
                    },
                  }}
                />
              </Grid>
            </Grid>

            <TextField
              label={isPharmacy ? "Pharmacy address" : "Delivery address"}
              fullWidth
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              required={isPharmacy}
              disabled={loading}
              autoComplete="street-address"
              slotProps={{
                input: {
                  startAdornment: (
                    <InputAdornment position="start">
                      <LocationOn fontSize="small" />
                    </InputAdornment>
                  ),
                },
              }}
              sx={{ mt: 2 }}
            />

            <Box
              sx={{
                mt: 2.5,
                p: 2,
                borderRadius: 2,
                border: "1px dashed rgba(23,35,31,0.18)",
                backgroundColor: "rgba(247,250,249,0.74)",
              }}
            >
              <Typography
                variant="subtitle2"
                sx={{ display: "flex", alignItems: "center", gap: 0.75, mb: 2 }}
              >
                <Map fontSize="small" />
                GPS coordinates
              </Typography>
              <Grid container spacing={2}>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    label="Latitude"
                    type="number"
                    fullWidth
                    size="small"
                    value={lat}
                    onChange={(e) => setLat(e.target.value)}
                    disabled={loading}
                    slotProps={{
                      input: {
                        startAdornment: (
                          <InputAdornment position="start">
                            <Map fontSize="small" />
                          </InputAdornment>
                        ),
                      },
                    }}
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    label="Longitude"
                    type="number"
                    fullWidth
                    size="small"
                    value={lng}
                    onChange={(e) => setLng(e.target.value)}
                    disabled={loading}
                    slotProps={{
                      input: {
                        startAdornment: (
                          <InputAdornment position="start">
                            <Map fontSize="small" />
                          </InputAdornment>
                        ),
                      },
                    }}
                  />
                </Grid>
              </Grid>
            </Box>

            <AuthSubmitButton
              type="submit"
              loading={loading}
              loadingText="Creating account"
              disabled={role === ""}
              sx={{ mt: 3.5 }}
            >
              Create account
            </AuthSubmitButton>

            <Box sx={{ textAlign: "center", mt: 3 }}>
              <Typography variant="body2" color="text.secondary">
                Already registered?{" "}
                <Button
                  variant="text"
                  onClick={() => navigate("/login")}
                  disabled={loading}
                  sx={{ px: 0.25, color: "primary.main", fontWeight: 800 }}
                >
                  Sign in
                </Button>
              </Typography>
            </Box>
          </Box>
        </>
      )}
    </AuthShell>
  );
};
