// src/features/marketplace/components/MarketplaceHero.tsx
import { FilterList, MyLocation, Search } from "@mui/icons-material";
import {
  Box,
  Chip,
  Fade,
  IconButton,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { useCallback, useEffect, useState } from "react";
import { useGeolocation } from "../hooks/useGeolocation";

interface MarketplaceHeroProps {
  onSearch: (query: string) => void;
  onFilterToggle: (event: React.MouseEvent<HTMLElement>) => void;
  onLocationUpdate: (lat: number, lng: number) => void;
}

export const MarketplaceHero = ({
  onSearch,
  onFilterToggle,
  onLocationUpdate,
}: MarketplaceHeroProps) => {
  const [query, setQuery] = useState("");
  const {
    lat,
    lng,
    loading: locationLoading,
    requestLocation,
  } = useGeolocation(false);

  const handleSearch = useCallback(() => {
    if (query.trim()) {
      onSearch(query.trim());
    }
  }, [query, onSearch]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  const handleLocationClick = () => {
    requestLocation();
  };

  // Update parent when location changes
  useEffect(() => {
    if (lat && lng) {
      onLocationUpdate(lat, lng);
    }
  }, [lat, lng, onLocationUpdate]);

  return (
    <Box
      sx={{
        py: { xs: 6, md: 10 },
        px: { xs: 2, md: 4 },
        textAlign: "center",
        background:
          "linear-gradient(135deg, rgba(15, 139, 108, 0.08) 0%, rgba(221, 170, 74, 0.08) 100%)",
        borderBottom: "1px solid rgba(23, 35, 31, 0.08)",
      }}
    >
      <Fade in timeout={600}>
        <Box sx={{ maxWidth: 800, mx: "auto" }}>
          <Typography
            variant="h3"
            color="#0F5E4D"
            sx={{
              fontWeight: 800,
              letterSpacing: "-0.5px",
              mb: 2,
              lineHeight: 1.1,
            }}
          >
            Find Medicine Near You
          </Typography>
          <Typography
            variant="body1"
            color="text.secondary"
            sx={{ mb: 4, fontSize: "1.1rem", maxWidth: 600, mx: "auto" }}
          >
            Search across all pharmacies in Ethiopia. Real-time availability,
            transparent pricing.
          </Typography>

          {/* Search Bar */}
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              bgcolor: "white",
              borderRadius: 4,
              border: "1px solid rgba(23, 35, 31, 0.12)",
              boxShadow: "0 8px 32px rgba(18, 32, 28, 0.08)",
              px: 2,
              py: 1,
              mb: 3,
              transition: "box-shadow 160ms ease, border-color 160ms ease",
              "&:focus-within": {
                boxShadow: "0 12px 40px rgba(15, 139, 108, 0.15)",
                borderColor: "primary.main",
              },
            }}
          >
            <Search sx={{ color: "text.secondary", mr: 1 }} />
            <TextField
              fullWidth
              variant="standard"
              placeholder="Search medicine, generic name, or category..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              slotProps={{
                input: {
                  disableUnderline: true,
                  sx: { fontSize: "1.05rem" },
                },
              }}
              sx={{ "& .MuiInputBase-input": { py: 1.5 } }}
            />
            <Stack direction="row" spacing={0.5}>
              <IconButton
                size="medium"
                onClick={handleLocationClick}
                disabled={locationLoading}
                title="Use my location"
                sx={{
                  color: lat && lng ? "primary.main" : "text.secondary",
                  "&:hover": { bgcolor: "rgba(15, 139, 108, 0.08)" },
                }}
              >
                {locationLoading ? (
                  <Box
                    sx={{
                      width: 20,
                      height: 20,
                      border: "2px solid currentColor",
                      borderRadius: "50%",
                      borderTopColor: "transparent",
                      animation: "spin 1s linear infinite",
                    }}
                  />
                ) : (
                  <MyLocation />
                )}
              </IconButton>
              <IconButton
                size="medium"
                onClick={(e) => onFilterToggle(e)}
                title="Open filters"
                sx={{
                  color: "text.secondary",
                  "&:hover": { bgcolor: "rgba(15, 139, 108, 0.08)" },
                }}
              >
                <FilterList />
              </IconButton>
            </Stack>
          </Box>

          {/* Quick Category Chips */}
          <Stack
            direction="row"
            spacing={1}
            sx={{ justifyContent: "center", flexWrap: "wrap" }}
          >
            {["Antibiotic", "Analgesic", "Antimalarial", "Vitamin"].map(
              (cat) => (
                <Chip
                  key={cat}
                  label={cat}
                  size="small"
                  onClick={() => onSearch(`category:${cat}`)}
                  sx={{
                    bgcolor: "rgba(255,255,255,0.8)",
                    border: "1px solid rgba(23, 35, 31, 0.12)",
                    fontWeight: 600,
                    "&:hover": {
                      bgcolor: "rgba(15, 139, 108, 0.12)",
                      borderColor: "primary.main",
                    },
                  }}
                />
              ),
            )}
          </Stack>
        </Box>
      </Fade>
    </Box>
  );
};
