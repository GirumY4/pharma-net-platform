// src/features/auth/pages/RegisterPage.tsx
import { useState, type SubmitEvent } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import {
  Box,
  Button,
  TextField,
  Typography,
  Alert,
  Paper,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormHelperText,
  Grid,
  InputAdornment,
  IconButton,
  Divider,
} from "@mui/material";
import {
  Visibility,
  VisibilityOff,
  Email,
  Lock,
  Person,
  Phone,
  LocationOn,
  LocationCity,
  Map,
} from "@mui/icons-material";
import { registerUser } from "../services/authApi";

export const RegisterPage = () => {
  const navigate = useNavigate();

  // Form state
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

  // UI state
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  // Role‑based field requirements
  const isPharmacy = role === "pharmacy_manager";

  const handleSubmit = async (e: SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    let location: { lat: number; lng: number } | undefined;
    if (lat && lng) {
      const latNum = parseFloat(lat);
      const lngNum = parseFloat(lng);
      if (!isNaN(latNum) && !isNaN(lngNum)) {
        location = { lat: latNum, lng: lngNum };
      }
    }

    try {
      const response = await registerUser({
        name,
        email,
        password,
        role: role as "pharmacy_manager" | "public_user",
        phoneNumber: phoneNumber || undefined,
        address: address || undefined,
        city: city || undefined,
        location,
      });

      if (response.success) {
        setSuccess(true);
        setTimeout(() => {
          navigate("/login", {
            state: { message: "Registration successful. Please sign in." },
          });
        }, 2000);
      }
    } catch (err: unknown) {
      if (axios.isAxiosError(err) && err.response) {
        const apiError = (err.response.data as { error?: { message?: string } })
          ?.error;
        setError(
          apiError?.message || "Registration failed. Please check your inputs.",
        );
      } else {
        setError("A network error occurred. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <Grid
        container
        sx={{
          minHeight: "100vh",
          backgroundColor: "background.default",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Paper
          elevation={0}
          sx={{
            p: 6,
            borderRadius: 3,
            textAlign: "center",
            border: "1px solid",
            borderColor: "divider",
            maxWidth: 400,
          }}
        >
          <Box sx={{ mb: 3, display: "flex", justifyContent: "center" }}>
            <svg
              width="64"
              height="64"
              viewBox="0 0 64 64"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <circle cx="32" cy="32" r="32" fill="#00ED64" fillOpacity="0.2" />
              <path
                d="M20 32l8 8 16-16"
                stroke="#00684A"
                strokeWidth="4"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </Box>
          <Typography variant="h5" fontWeight="700" gutterBottom>
            Welcome to Pharma-Net!
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Your account has been created successfully. Redirecting to login...
          </Typography>
        </Paper>
      </Grid>
    );
  }

  return (
    <Grid container sx={{ minHeight: "100vh" }}>
      {/* Left side - Branding & Information */}
      <Grid
        item
        xs={12}
        md={4}
        lg={5}
        sx={{
          backgroundColor: "primary.dark",
          color: "primary.contrastText",
          display: { xs: "none", md: "flex" },
          flexDirection: "column",
          justifyContent: "center",
          p: { xs: 4, md: 8 },
          position: "relative",
          overflow: "hidden",
        }}
      >
        <Box
          sx={{
            position: "absolute",
            top: -100,
            left: -100,
            width: 300,
            height: 300,
            borderRadius: "50%",
            background:
              "linear-gradient(45deg, rgba(0,237,100,0.1) 0%, rgba(0,104,74,0) 100%)",
            filter: "blur(40px)",
          }}
        />

        <Box sx={{ zIndex: 1, maxWidth: 480 }}>
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
            <Typography variant="h4" fontWeight="800" letterSpacing="-0.5px">
              Pharma-Net
            </Typography>
          </Box>

          <Typography
            variant="h3"
            fontWeight="700"
            sx={{ mb: 3, lineHeight: 1.2 }}
          >
            Join the Network
          </Typography>
          <Typography
            variant="h6"
            fontWeight="400"
            sx={{ opacity: 0.8, mb: 4, lineHeight: 1.6 }}
          >
            Whether you are managing a pharmacy or searching for vital
            medicines, Pharma-Net connects you to what matters most.
          </Typography>

          <Box sx={{ display: "flex", flexDirection: "column", gap: 4, mt: 6 }}>
            <Box>
              <Typography
                variant="subtitle1"
                fontWeight="700"
                color="primary.light"
              >
                For Pharmacy Managers
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.8 }}>
                Streamline inventory, process orders seamlessly, and grow your
                customer base.
              </Typography>
            </Box>
            <Box>
              <Typography
                variant="subtitle1"
                fontWeight="700"
                color="primary.light"
              >
                For Patients
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.8 }}>
                Find availability nearby, place orders instantly, and manage
                your health efficiently.
              </Typography>
            </Box>
          </Box>
        </Box>
      </Grid>

      {/* Right side - Registration Form */}
      <Grid
        item
        xs={12}
        md={8}
        lg={7}
        sx={{
          backgroundColor: "background.default",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          p: { xs: 3, sm: 6, md: 8 },
        }}
      >
        <Paper
          elevation={0}
          sx={{
            p: { xs: 3, sm: 5 },
            width: "100%",
            maxWidth: 600,
            borderRadius: 3,
            border: "1px solid",
            borderColor: "divider",
          }}
        >
          <Box
            sx={{
              display: { xs: "flex", md: "none" },
              alignItems: "center",
              mb: 3,
              gap: 1,
            }}
          >
            <svg
              width="24"
              height="24"
              viewBox="0 0 40 40"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <rect width="40" height="40" rx="8" fill="#00684A" />
              <path
                d="M12 20h16M20 12v16"
                stroke="#ffffff"
                strokeWidth="4"
                strokeLinecap="round"
              />
            </svg>
            <Typography variant="h6" fontWeight="800">
              Pharma-Net
            </Typography>
          </Box>

          <Typography variant="h5" component="h2" fontWeight="700" gutterBottom>
            Create an account
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 4 }}>
            Please fill in the details below to get started.
          </Typography>

          {error && (
            <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>
              {error}
            </Alert>
          )}

          <Box component="form" onSubmit={handleSubmit}>
            <FormControl fullWidth margin="normal" required>
              <InputLabel id="role-label">Account Type</InputLabel>
              <Select
                labelId="role-label"
                value={role}
                label="Account Type"
                onChange={(e) =>
                  setRole(e.target.value as "pharmacy_manager" | "public_user")
                }
                disabled={loading}
                sx={{ borderRadius: 2 }}
              >
                <MenuItem value="public_user">Public User (Patient)</MenuItem>
                <MenuItem value="pharmacy_manager">Pharmacy Manager</MenuItem>
              </Select>
              <FormHelperText>
                {isPharmacy
                  ? "Pharmacy accounts require address and contact info for the marketplace."
                  : "Patients can search and order medicines."}
              </FormHelperText>
            </FormControl>

            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Full Name"
                  fullWidth
                  margin="normal"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  disabled={loading}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Person color="action" fontSize="small" />
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Email Address"
                  type="email"
                  fullWidth
                  margin="normal"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={loading}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Email color="action" fontSize="small" />
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>
            </Grid>

            <TextField
              label="Password"
              type={showPassword ? "text" : "password"}
              fullWidth
              margin="normal"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={loading}
              helperText="Minimum 8 characters"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Lock color="action" fontSize="small" />
                  </InputAdornment>
                ),
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={() => setShowPassword(!showPassword)}
                      edge="end"
                      size="small"
                    >
                      {showPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
              sx={{ mb: 1 }}
            />

            <Divider sx={{ my: 3 }} />

            <Typography
              variant="subtitle2"
              fontWeight="600"
              color="text.secondary"
              gutterBottom
            >
              Contact & Location Details
            </Typography>

            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Phone Number"
                  fullWidth
                  margin="normal"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  required={isPharmacy}
                  disabled={loading}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Phone color="action" fontSize="small" />
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="City"
                  fullWidth
                  margin="normal"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  required={isPharmacy}
                  disabled={loading}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <LocationCity color="action" fontSize="small" />
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>
            </Grid>

            <TextField
              label={
                isPharmacy ? "Pharmacy Address" : "Default Delivery Address"
              }
              fullWidth
              margin="normal"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              required={isPharmacy}
              disabled={loading}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <LocationOn color="action" fontSize="small" />
                  </InputAdornment>
                ),
              }}
            />

            <Box
              sx={{
                mt: 2,
                p: 2,
                bgcolor: "background.default",
                borderRadius: 2,
                border: "1px dashed",
                borderColor: "divider",
              }}
            >
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ display: "flex", alignItems: "center", mb: 1, gap: 0.5 }}
              >
                <Map fontSize="small" /> GPS Coordinates (Optional)
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="Latitude"
                    type="number"
                    fullWidth
                    size="small"
                    value={lat}
                    onChange={(e) => setLat(e.target.value)}
                    disabled={loading}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="Longitude"
                    type="number"
                    fullWidth
                    size="small"
                    value={lng}
                    onChange={(e) => setLng(e.target.value)}
                    disabled={loading}
                  />
                </Grid>
              </Grid>
            </Box>

            <Button
              type="submit"
              variant="contained"
              color="primary"
              fullWidth
              size="large"
              disabled={loading || role === ""}
              sx={{
                mt: 4,
                mb: 2,
                py: 1.5,
                fontSize: "1.05rem",
                textTransform: "none",
                borderRadius: 2,
              }}
            >
              {loading ? "Creating account..." : "Create Account"}
            </Button>

            <Box sx={{ textAlign: "center" }}>
              <Typography variant="body2" color="text.secondary">
                Already have an account?{" "}
                <Button
                  variant="text"
                  onClick={() => navigate("/login")}
                  disabled={loading}
                  sx={{
                    p: 0,
                    minWidth: "auto",
                    fontWeight: 600,
                    "&:hover": {
                      backgroundColor: "transparent",
                      textDecoration: "underline",
                    },
                  }}
                >
                  Sign in
                </Button>
              </Typography>
            </Box>
          </Box>
        </Paper>
      </Grid>
    </Grid>
  );
};
