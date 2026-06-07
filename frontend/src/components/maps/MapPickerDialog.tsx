import { MyLocation } from "@mui/icons-material";
import {
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { useCallback, useEffect, useState } from "react";
import {
  MapContainer,
  Marker,
  TileLayer,
  useMap,
  useMapEvents,
} from "react-leaflet";
import { DEFAULT_MAP_CENTER } from "./leafletSetup";
import { searchNominatim } from "./nominatim";

interface MapPickerDialogProps {
  open: boolean;
  onClose: () => void;
  onSelectLocation: (lat: number, lng: number) => void;
  initialLat?: number;
  initialLng?: number;
}

const MapClickHandler = ({
  onCoordsChange,
}: {
  onCoordsChange: (lat: number, lng: number) => void;
}) => {
  useMapEvents({
    click(e) {
      onCoordsChange(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
};

const MapViewSync = ({
  center,
  zoom,
}: {
  center: [number, number];
  zoom: number;
}) => {
  const map = useMap();
  useEffect(() => {
    map.setView(center, zoom);
  }, [map, center, zoom]);
  return null;
};

export const MapPickerDialog = ({
  open,
  onClose,
  onSelectLocation,
  initialLat,
  initialLng,
}: MapPickerDialogProps) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [searching, setSearching] = useState(false);
  const [selectedCoords, setSelectedCoords] = useState<{
    lat: number;
    lng: number;
  } | null>(
    initialLat != null && initialLng != null
      ? { lat: initialLat, lng: initialLng }
      : null,
  );

  useEffect(() => {
    if (!open) return;
    setSelectedCoords(
      initialLat != null && initialLng != null
        ? { lat: initialLat, lng: initialLng }
        : null,
    );
    setSearchQuery("");
  }, [open, initialLat, initialLng]);

  const mapCenter: [number, number] = selectedCoords
    ? [selectedCoords.lat, selectedCoords.lng]
    : [DEFAULT_MAP_CENTER[0], DEFAULT_MAP_CENTER[1]];
  const mapZoom = selectedCoords ? 15 : 13;

  const handleCoordsChange = useCallback((lat: number, lng: number) => {
    setSelectedCoords({ lat, lng });
  }, []);

  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser.");
      return;
    }
    setLoading(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        setSelectedCoords({ lat, lng });
        setLoading(false);
      },
      () => {
        setLoading(false);
        alert(
          "Could not get your current location. Please select it manually on the map.",
        );
      },
      { enableHighAccuracy: true, timeout: 10000 },
    );
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    setSearching(true);
    try {
      const results = await searchNominatim(searchQuery, 1);
      if (results.length > 0 && results[0]) {
        const lat = parseFloat(results[0].lat);
        const lng = parseFloat(results[0].lon);
        setSelectedCoords({ lat, lng });
      } else {
        alert("No locations found. Try a different search term.");
      }
    } catch {
      alert("Search failed. Please try again.");
    } finally {
      setSearching(false);
    }
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
        Locate on Map
      </DialogTitle>
      <DialogContent dividers>
        <Stack spacing={2}>
          <Typography variant="body2" color="text.secondary">
            Search for your address or click on the map to place a pin. Drag the
            pin to adjust your position.
          </Typography>
          <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
            <TextField
              size="small"
              fullWidth
              placeholder="Search city, neighborhood, or building..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && void handleSearch()}
            />
            <Button
              variant="contained"
              onClick={() => void handleSearch()}
              disabled={searching}
              sx={{ bgcolor: "#0F5E4D", minWidth: { sm: 100 } }}
            >
              {searching ? <CircularProgress size={20} color="inherit" /> : "Search"}
            </Button>
          </Stack>
          <Box
            sx={{
              width: "100%",
              height: 350,
              borderRadius: 2,
              border: "1px solid rgba(23,35,31,0.12)",
              overflow: "hidden",
              "& .leaflet-container": { height: "100%", width: "100%" },
            }}
          >
            {open && (
              <MapContainer
                center={mapCenter}
                zoom={mapZoom}
                style={{ height: "100%", width: "100%" }}
                scrollWheelZoom
              >
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                <MapViewSync center={mapCenter} zoom={mapZoom} />
                <MapClickHandler onCoordsChange={handleCoordsChange} />
                {selectedCoords && (
                  <Marker
                    position={[selectedCoords.lat, selectedCoords.lng]}
                    draggable
                    eventHandlers={{
                      dragend: (e) => {
                        const { lat, lng } = e.target.getLatLng();
                        handleCoordsChange(lat, lng);
                      },
                    }}
                  />
                )}
              </MapContainer>
            )}
          </Box>
          <Button
            variant="outlined"
            onClick={handleUseCurrentLocation}
            disabled={loading}
            startIcon={
              loading ? <CircularProgress size={16} /> : <MyLocation />
            }
            sx={{ borderColor: "#0F5E4D", color: "#0F5E4D" }}
          >
            {loading ? "Locating..." : "Use Current Location"}
          </Button>
          {selectedCoords && (
            <Typography variant="caption" color="text.secondary">
              Selected: {selectedCoords.lat.toFixed(5)},{" "}
              {selectedCoords.lng.toFixed(5)}
            </Typography>
          )}
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
