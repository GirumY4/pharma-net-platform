// src/features/users/components/LocationPicker.tsx
import { Clear, LocationOn, MyLocation } from "@mui/icons-material";
import {
  Alert,
  Box,
  Chip,
  CircularProgress,
  IconButton,
  Paper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { debounce } from "lodash";
import { useCallback, useEffect, useState } from "react";

interface LocationPickerProps {
  value: { lat: number; lng: number } | null;
  onChange: (location: { lat: number; lng: number } | null) => void;
  disabled?: boolean;
  label?: string;
  helperText?: string;
  error?: string;
}

// Google Maps API types (loaded dynamically)
declare global {
  interface Window {
    google?: {
      maps: {
        Map: any;
        Marker: any;
        SymbolPath: any;
        GeocoderStatus: any;
        places: {
          Autocomplete: any;
          AutocompleteService: any;
          PlacesService: any;
          PlacesServiceStatus: any;
        };
        Geocoder: any;
        event: {
          addListener: (
            instance: any,
            eventName: string,
            handler: Function,
          ) => any;
          removeListener: (listener: any) => void;
        };
      };
    };
  }
}

export const LocationPicker = ({
  value,
  onChange,
  disabled = false,
  label = "Location",
  helperText,
  error,
}: LocationPickerProps) => {
  const [mapContainer, setMapContainer] = useState<HTMLDivElement | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<
    { place_id: string; description: string; lat: number; lng: number }[]
  >([]);
  const [loading, setLoading] = useState(false);
  const [mapError, setMapError] = useState<string | null>(null);
  const [map, setMap] = useState<any>(null);
  const [marker, setMarker] = useState<any>(null);

  // Load Google Maps API dynamically
  useEffect(() => {
    const loadGoogleMaps = async () => {
      if (window.google?.maps) {
        initMap();
        return;
      }

      const script = document.createElement("script");
      script.src = `https://maps.googleapis.com/maps/api/js?key=${
        import.meta.env.VITE_GOOGLE_MAPS_API_KEY
      }&libraries=places`;
      script.async = true;
      script.defer = true;
      script.onload = () => initMap();
      script.onerror = () =>
        setMapError(
          "Failed to load map service. Please check your connection.",
        );
      document.head.appendChild(script);

      return () => {
        if (script.parentNode) {
          document.head.removeChild(script);
        }
      };
    };

    loadGoogleMaps();
  }, []);

  const initMap = useCallback(() => {
    const google = window.google;
    if (!google?.maps || !mapContainer) return;

    const defaultCenter = { lat: 9.03, lng: 38.74 }; // Addis Ababa fallback
    const center = value || defaultCenter;

    const newMap = new google.maps.Map(mapContainer, {
      center,
      zoom: value ? 15 : 10,
      disableDefaultUI: true,
      zoomControl: true,
      mapTypeControl: false,
      streetViewControl: false,
      fullscreenControl: false,
      styles: [
        {
          featureType: "poi",
          elementType: "labels",
          stylers: [{ visibility: "off" }],
        },
      ],
    });

    const newMarker = new google.maps.Marker({
      map: newMap,
      position: center,
      draggable: !disabled,
      icon: {
        path: google.maps.SymbolPath.CIRCLE,
        scale: 10,
        fillColor: "#0F8B6C",
        fillOpacity: 1,
        strokeWeight: 2,
        strokeColor: "#FFFFFF",
      },
    });

    // Handle marker drag end
    if (!disabled) {
      google.maps.event.addListener(newMarker, "dragend", (event: any) => {
        const { lat, lng } = event.latLng;
        onChange({ lat: lat(), lng: lng() });
        reverseGeocode(lat(), lng());
      });
    }

    // Handle map click to move marker
    if (!disabled) {
      newMap.addListener("click", (event: any) => {
        const { lat, lng } = event.latLng;
        newMarker.setPosition({ lat: lat(), lng: lng() });
        onChange({ lat: lat(), lng: lng() });
        reverseGeocode(lat(), lng());
      });
    }

    setMap(newMap);
    setMarker(newMarker);
  }, [mapContainer, value, disabled, onChange]);

  // Update marker position when value changes externally
  useEffect(() => {
    if (marker && value) {
      marker.setPosition(value);
      map?.panTo(value);
      map?.setZoom(15);
    }
  }, [value, marker, map]);

  // Debounced place search
  const searchPlaces = useCallback(
    debounce(async (query: string) => {
      if (!window.google?.maps || query.length < 3) {
        setSearchResults([]);
        return;
      }

      setLoading(true);
      try {
        const google = window.google;
        if (!google) return;

        const service = new google.maps.places.AutocompleteService();
        service.getPlacePredictions(
          {
            input: query,
            types: ["address"],
            componentRestrictions: { country: "et" }, // Ethiopia-focused
          },
          (predictions: any[], status: string) => {
            const google = window.google;
            if (!google) return;

            setLoading(false);
            if (
              status === google.maps.places.PlacesServiceStatus.OK &&
              predictions
            ) {
              // Fetch details for each prediction to get coordinates
              const detailsService = new google.maps.places.PlacesService(
                document.createElement("div"),
              );
              const results = predictions.map((p) => ({
                place_id: p.place_id,
                description: p.description,
                lat: 0,
                lng: 0,
              }));

              // Fetch coordinates for first 5 results
              results.slice(0, 5).forEach((result, index) => {
                detailsService.getDetails(
                  { placeId: result.place_id, fields: ["geometry"] },
                  (place: any, placeStatus: string) => {
                    const google = window.google;
                    if (!google) return;

                    if (
                      placeStatus ===
                        google.maps.places.PlacesServiceStatus.OK &&
                      place?.geometry?.location
                    ) {
                      results[index].lat = place.geometry.location.lat();
                      results[index].lng = place.geometry.location.lng();
                      // Update state when all results are fetched
                      if (index === Math.min(results.length - 1, 4)) {
                        setSearchResults(results.filter((r) => r.lat !== 0));
                      }
                    }
                  },
                );
              });
            } else {
              setSearchResults([]);
            }
          },
        );
      } catch {
        setLoading(false);
        setSearchResults([]);
      }
    }, 300),
    [],
  );

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);
    searchPlaces(query);
  };

  const handleSelectPlace = (place: {
    place_id: string;
    description: string;
    lat: number;
    lng: number;
  }) => {
    onChange({ lat: place.lat, lng: place.lng });
    setSearchQuery(place.description);
    setSearchResults([]);
    if (marker) {
      marker.setPosition({ lat: place.lat, lng: place.lng });
      map?.panTo({ lat: place.lat, lng: place.lng });
      map?.setZoom(15);
    }
  };

  const reverseGeocode = useCallback((lat: number, lng: number) => {
    const google = window.google;
    if (!google?.maps) return;

    const geocoder = new google.maps.Geocoder();
    geocoder.geocode(
      { location: { lat, lng } },
      (results: any[], status: string) => {
        const google = window.google;
        if (!google) return;

        if (
          status === google.maps.GeocoderStatus.OK &&
          results?.[0]?.formatted_address
        ) {
          setSearchQuery(results[0].formatted_address);
        }
      },
    );
  }, []);

  const useCurrentLocation = () => {
    if (!navigator.geolocation) {
      setMapError("Geolocation is not supported by your browser.");
      return;
    }

    setLoading(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        onChange({ lat: latitude, lng: longitude });
        if (marker) {
          marker.setPosition({ lat: latitude, lng: longitude });
          map?.panTo({ lat: latitude, lng: longitude });
          map?.setZoom(15);
        }
        reverseGeocode(latitude, longitude);
        setLoading(false);
      },
      (err) => {
        setMapError(
          "Unable to retrieve your location. Please select manually.",
        );
        setLoading(false);
        console.error("Geolocation error:", err);
      },
      { enableHighAccuracy: true, timeout: 10000 },
    );
  };

  const clearLocation = () => {
    onChange(null);
    setSearchQuery("");
    setSearchResults([]);
    if (marker) {
      marker.setPosition({ lat: 9.03, lng: 38.74 }); // Reset to Addis
      map?.setZoom(10);
    }
  };

  return (
    <Paper
      elevation={0}
      sx={{
        p: 2.5,
        borderRadius: 3,
        border: "1px solid rgba(0,0,0,0.06)",
        bgcolor: "rgba(255, 255, 255, 0.7)",
        backdropFilter: "blur(24px)",
        boxShadow: "0 10px 40px rgba(0,0,0,0.03)",
      }}
    >
      <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 2 }}>
        <LocationOn sx={{ color: "#0F8B6C" }} />
        <Typography
          variant="subtitle1"
          sx={{ fontWeight: 700, color: "#1E293B" }}
        >
          {label}
        </Typography>
      </Box>

      {/* Search Input */}
      <Box sx={{ position: "relative", mb: 2 }}>
        <TextField
          fullWidth
          size="small"
          placeholder="Search for a location in Ethiopia..."
          value={searchQuery}
          onChange={handleSearchChange}
          disabled={disabled || loading}
          slotProps={{
            input: {
              endAdornment: (
                <>
                  {loading && <CircularProgress size={16} sx={{ mr: 1 }} />}
                  {searchQuery && !disabled && (
                    <IconButton
                      size="small"
                      onClick={clearLocation}
                      sx={{ mr: 0.5 }}
                    >
                      <Clear fontSize="small" />
                    </IconButton>
                  )}
                  <IconButton
                    size="small"
                    onClick={useCurrentLocation}
                    disabled={disabled || loading}
                    title="Use my current location"
                  >
                    <MyLocation fontSize="small" sx={{ color: "#0F8B6C" }} />
                  </IconButton>
                </>
              ),
            },
          }}
          sx={{
            "& .MuiOutlinedInput-root": {
              borderRadius: 2,
              bgcolor: "rgba(255,255,255,0.9)",
            },
          }}
        />

        {/* Search Results Dropdown */}
        {searchResults.length > 0 && (
          <Paper
            elevation={4}
            sx={{
              position: "absolute",
              top: "100%",
              left: 0,
              right: 0,
              zIndex: 10,
              mt: 0.5,
              borderRadius: 2,
              border: "1px solid rgba(0,0,0,0.1)",
              bgcolor: "white",
              maxHeight: 200,
              overflow: "auto",
            }}
          >
            {searchResults.map((place) => (
              <Box
                key={place.place_id}
                onClick={() => handleSelectPlace(place)}
                sx={{
                  p: 1.5,
                  cursor: "pointer",
                  "&:hover": { bgcolor: "rgba(15, 139, 108, 0.08)" },
                  borderBottom: "1px solid rgba(0,0,0,0.06)",
                  "&:last-child": { borderBottom: "none" },
                }}
              >
                <Typography variant="body2" sx={{ fontWeight: 500 }}>
                  {place.description}
                </Typography>
              </Box>
            ))}
          </Paper>
        )}
      </Box>

      {/* Map Container */}
      <Box
        ref={setMapContainer}
        sx={{
          width: "100%",
          height: 200,
          borderRadius: 2,
          border: "1px solid rgba(0,0,0,0.1)",
          bgcolor: "rgba(23, 35, 31, 0.04)",
          mb: 2,
          position: "relative",
          overflow: "hidden",
        }}
      >
        {mapError && (
          <Box
            sx={{
              position: "absolute",
              inset: 0,
              display: "grid",
              placeItems: "center",
              bgcolor: "rgba(255,255,255,0.9)",
              zIndex: 1,
            }}
          >
            <Alert severity="warning" sx={{ maxWidth: 280 }}>
              {mapError}
            </Alert>
          </Box>
        )}
        {!window.google?.maps && !mapError && (
          <Box
            sx={{
              position: "absolute",
              inset: 0,
              display: "grid",
              placeItems: "center",
              bgcolor: "rgba(255,255,255,0.9)",
              zIndex: 1,
            }}
          >
            <Stack spacing={1} sx={{ alignItems: "center" }}>
              <CircularProgress size={24} />
              <Typography variant="caption" color="text.secondary">
                Loading map...
              </Typography>
            </Stack>
          </Box>
        )}
      </Box>

      {/* Coordinates Display */}
      {value && (
        <Box sx={{ mb: 2 }}>
          <Stack
            direction="row"
            spacing={1}
            sx={{ alignItems: "center", flexWrap: "wrap" }}
          >
            <Chip
              label={`Lat: ${value.lat.toFixed(4)}`}
              size="small"
              sx={{
                bgcolor: "rgba(15, 139, 108, 0.12)",
                color: "#0F8B6C",
                fontWeight: 600,
                fontSize: "0.75rem",
              }}
            />
            <Chip
              label={`Lng: ${value.lng.toFixed(4)}`}
              size="small"
              sx={{
                bgcolor: "rgba(15, 139, 108, 0.12)",
                color: "#0F8B6C",
                fontWeight: 600,
                fontSize: "0.75rem",
              }}
            />
            {!disabled && (
              <Chip
                label="Click map or drag marker to adjust"
                size="small"
                variant="outlined"
                sx={{
                  borderColor: "rgba(15, 139, 108, 0.3)",
                  color: "text.secondary",
                  fontSize: "0.7rem",
                }}
              />
            )}
          </Stack>
        </Box>
      )}

      {/* Helper Text / Error */}
      {error ? (
        <Alert severity="error" sx={{ borderRadius: 2, mt: 1 }}>
          {error}
        </Alert>
      ) : helperText ? (
        <Typography
          variant="caption"
          color="text.secondary"
          sx={{ display: "block", mt: 1 }}
        >
          {helperText}
        </Typography>
      ) : null}
    </Paper>
  );
};
