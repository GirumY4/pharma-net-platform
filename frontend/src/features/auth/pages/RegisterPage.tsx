/* eslint-disable @typescript-eslint/no-explicit-any */
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
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  Grid,
  IconButton,
  InputAdornment,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { useCallback, useEffect, useState, type SyntheticEvent } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  AuthFormHeader,
  AuthShell,
  AuthSubmitButton,
} from "../components/AuthShell";
import { handleApiError } from "../../../utils/errorMapper";
import { registerUser } from "../services/authApi";
import SEO from "../../../components/SEO";

const redirectDelay = 5;

const planLabels = {
  single_pharmacy: "Single Pharmacy",
  professional: "Professional",
  enterprise_chain: "Enterprise Chain",
} as const;

const isKnownPlan = (value: string | null): value is keyof typeof planLabels =>
  value === "single_pharmacy" || value === "professional";

const registerBrand = {
  eyebrow: "Create your access",
  title: "Join the platform that simplifies pharmacy management.",
  description:
    "Choose the account type that matches your role, then build a secure profile for pharmacy operations, stock management, and compliance auditing.",
  items: [
    {
      icon: <StorefrontOutlined fontSize="small" />,
      title: "Pharmacy manager accounts",
      description:
        "Manage storefront details, inventory logs, batch tracking, and compliance audits from a focused workspace.",
    },
    {
      icon: <HealthAndSafetyOutlined fontSize="small" />,
      title: "Public user accounts",
      description:
        "Search for medicine availability at local pharmacies and find verified locations near you.",
    },
    {
      icon: <Inventory2Outlined fontSize="small" />,
      title: "Clean operational data",
      description:
        "Accurate contact and location fields make stock discovery and branch verification easier for everyone.",
    },
  ],
  footer:
    "Built to keep account setup clear, accurate, and ready for compliant pharmacy workflows.",
};

const loadGoogleMapsScript = (callback: () => void) => {
  if ((window as any).google && (window as any).google.maps) {
    callback();
    return;
  }
  const existingScript = document.getElementById("google-maps-script");
  if (existingScript) {
    existingScript.addEventListener("load", callback);
    return;
  }
  const script = document.createElement("script");
  script.src = `https://maps.googleapis.com/maps/api/js?key=${
    import.meta.env.VITE_GOOGLE_MAPS_API_KEY || ""
  }&libraries=places`;
  script.id = "google-maps-script";
  script.async = true;
  script.defer = true;
  script.onload = () => callback();
  document.body.appendChild(script);
};

interface MapPickerDialogProps {
  open: boolean;
  onClose: () => void;
  onSelectLocation: (lat: number, lng: number) => void;
  initialLat?: number;
  initialLng?: number;
}

const MapPickerDialog = ({
  open,
  onClose,
  onSelectLocation,
  initialLat,
  initialLng,
}: MapPickerDialogProps) => {
  const [map, setMap] = useState<any>(null);
  const [marker, setMarker] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [selectedCoords, setSelectedCoords] = useState<{ lat: number; lng: number } | null>(
    initialLat && initialLng ? { lat: initialLat, lng: initialLng } : null
  );

  useEffect(() => {
    if (!open) return;

    loadGoogleMapsScript(() => {
      const defaultCenter = { lat: 9.03, lng: 38.74 }; // Addis Ababa default
      const center = initialLat && initialLng ? { lat: initialLat, lng: initialLng } : defaultCenter;

      const mapContainer = document.getElementById("google-map-picker");
      if (!mapContainer) return;

      const newMap = new (window as any).google.maps.Map(mapContainer, {
        center,
        zoom: 13,
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: false,
      });

      const newMarker = new (window as any).google.maps.Marker({
        position: initialLat && initialLng ? center : null,
        map: newMap,
        draggable: true,
      });

      setMap(newMap);
      setMarker(newMarker);

      newMap.addListener("click", (e: any) => {
        const clickedLat = e.latLng.lat();
        const clickedLng = e.latLng.lng();
        newMarker.setPosition(e.latLng);
        setSelectedCoords({ lat: clickedLat, lng: clickedLng });
      });

      newMarker.addListener("dragend", (e: any) => {
        const draggedLat = e.latLng.lat();
        const draggedLng = e.latLng.lng();
        setSelectedCoords({ lat: draggedLat, lng: draggedLng });
      });
    });
  }, [open, initialLat, initialLng]);

  const handleUseCurrentLocation = () => {
    if (navigator.geolocation) {
      setLoading(true);
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const userLat = position.coords.latitude;
          const userLng = position.coords.longitude;
          setSelectedCoords({ lat: userLat, lng: userLng });

          if (map && marker) {
            const pos = { lat: userLat, lng: userLng };
            map.setCenter(pos);
            map.setZoom(16);
            marker.setPosition(pos);
          }
          setLoading(false);
        },
        (error) => {
          console.error("Geolocation error:", error);
          setLoading(false);
          alert("Could not get your current location. Please select it manually on the map.");
        }
      );
    } else {
      alert("Geolocation is not supported by your browser.");
    }
  };

  const handleSearch = () => {
    if (!searchQuery.trim() || !map) return;
    const geocoder = new (window as any).google.maps.Geocoder();
    geocoder.geocode({ address: searchQuery }, (results: any, status: string) => {
      if (status === "OK" && results[0]) {
        const loc = results[0].geometry.location;
        map.setCenter(loc);
        map.setZoom(15);
        marker.setPosition(loc);
        setSelectedCoords({ lat: loc.lat(), lng: loc.lng() });
      } else {
        alert("Geocode was not successful: " + status);
      }
    });
  };

  const handleConfirm = () => {
    if (selectedCoords) {
      onSelectLocation(selectedCoords.lat, selectedCoords.lng);
      onClose();
    } else {
      alert("Please select a location on the map first.");
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ fontWeight: 800, color: "#0F5E4D" }}>
        Locate on Google Maps
      </DialogTitle>
      <DialogContent dividers>
        <Stack spacing={2}>
          <Typography variant="body2" color="text.secondary">
            Search for your address or click on the map to place a pin. Drag the pin to adjust your position.
          </Typography>
          <Stack direction="row" spacing={1}>
            <TextField
              size="small"
              fullWidth
              placeholder="Search city, neighborhood, or building..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            />
            <Button variant="contained" onClick={handleSearch} sx={{ bgcolor: "#0F5E4D" }}>
              Search
            </Button>
          </Stack>
          <Box
            id="google-map-picker"
            sx={{
              width: "100%",
              height: 350,
              borderRadius: 2,
              border: "1px solid rgba(23,35,31,0.12)",
              bgcolor: "#eee",
            }}
          />
          <Button
            variant="outlined"
            onClick={handleUseCurrentLocation}
            disabled={loading}
            startIcon={loading ? <CircularProgress size={16} /> : undefined}
            sx={{ borderColor: "#0F5E4D", color: "#0F5E4D" }}
          >
            {loading ? "Locating..." : "Use Current Location"}
          </Button>
        </Stack>
      </DialogContent>
      <DialogActions sx={{ p: 2.5 }}>
        <Button onClick={onClose} color="inherit" sx={{ fontWeight: 700 }}>
          Cancel
        </Button>
        <Button
          onClick={handleConfirm}
          variant="contained"
          disabled={!selectedCoords}
          sx={{ bgcolor: "#0F5E4D", fontWeight: 700 }}
        >
          Confirm Location
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export const RegisterPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const requestedPlan = searchParams.get("plan");
  const billingRedirectPlan = isKnownPlan(requestedPlan)
    ? requestedPlan
    : null;
  const selectedPlanLabel = billingRedirectPlan
    ? planLabels[billingRedirectPlan]
    : null;

  const [role, setRole] = useState<"pharmacy_manager" | "public_user" | "">(
    selectedPlanLabel ? "pharmacy_manager" : "",
  );
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [lat, setLat] = useState("");
  const [lng, setLng] = useState("");
  const [mapOpen, setMapOpen] = useState(false);

  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [countdown, setCountdown] = useState(redirectDelay);

  const isPharmacy = role === "pharmacy_manager";

  const buildLoginState = useCallback(() => ({
    message: "Registration successful. Please sign in.",
    ...(billingRedirectPlan && role === "pharmacy_manager"
      ? { from: { pathname: "/billing", search: `?plan=${billingRedirectPlan}` } }
      : {}),
  }), [billingRedirectPlan, role]);

  useEffect(() => {
    if (!success) return;

    if (countdown <= 0) {
      navigate("/login", {
        state: buildLoginState(),
        replace: true,
      });
      return;
    }

    const timer = window.setTimeout(
      () => setCountdown((current) => current - 1),
      1000,
    );
    return () => window.clearTimeout(timer);
  }, [success, countdown, navigate, buildLoginState]);

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
      state: buildLoginState(),
      replace: true,
    });
  };

  return (
    <AuthShell brand={registerBrand} formMaxWidth={660}>
      <SEO
        title="Create Account"
        description="Register a pharmacy manager or public user account on Alyah Pharma Net to coordinate orders, track shipments, and discover available medicines."
        keywords={["pharma net register", "create pharmacy account", "pharma net signup"]}
        noIndex={true}
      />
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

          {selectedPlanLabel && (
            <Alert severity="info" sx={{ mb: 3 }}>
              You selected the {selectedPlanLabel} billing path. Pharmacy
              manager accounts continue to billing after sign in.
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
              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
                <Typography
                  variant="subtitle2"
                  sx={{ display: "flex", alignItems: "center", gap: 0.75 }}
                >
                  <Map fontSize="small" />
                  GPS coordinates
                </Typography>
                <Button
                  size="small"
                  variant="text"
                  startIcon={<LocationOn fontSize="small" />}
                  onClick={() => setMapOpen(true)}
                  sx={{ color: "primary.main", fontWeight: 700 }}
                >
                  Locate on Map
                </Button>
              </Box>
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
      <MapPickerDialog
        key={mapOpen ? "open" : "closed"}
        open={mapOpen}
        onClose={() => setMapOpen(false)}
        onSelectLocation={(latitude, longitude) => {
          setLat(latitude.toFixed(6));
          setLng(longitude.toFixed(6));
        }}
        initialLat={lat ? parseFloat(lat) : undefined}
        initialLng={lng ? parseFloat(lng) : undefined}
      />
    </AuthShell>
  );
};
