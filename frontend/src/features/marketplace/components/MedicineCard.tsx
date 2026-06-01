// src/features/marketplace/components/MedicineCard.tsx
import { LocalPharmacy, LocationOn, NavigateNext } from "@mui/icons-material";
import {
  Box,
  Button,
  Chip,
  Fade,
  Paper,
  Stack,
  Tooltip,
  Typography,
} from "@mui/material";
import type { MarketplaceMedicine } from "../types";

interface MedicineCardProps {
  medicine: MarketplaceMedicine;
  index: number;
  onViewDetails: (medicine: MarketplaceMedicine) => void;
  onGetDirections: (
    location: { lat: number; lng: number } | undefined,
    pharmacyName: string,
  ) => void;
}

export const MedicineCard = ({
  medicine,
  index,
  onViewDetails,
  onGetDirections,
}: MedicineCardProps) => {
  const isAvailable = medicine.totalStock > 0;
  const isLowStock = medicine.totalStock > 0 && medicine.totalStock < 50;

  return (
    <Fade in timeout={300 + index * 50}>
      <Paper
        elevation={0}
        sx={{
          p: 2.5,
          borderRadius: 4,
          border: "1px solid rgba(23, 35, 31, 0.08)",
          bgcolor: "rgba(255, 255, 255, 0.8)",
          backdropFilter: "blur(24px)",
          boxShadow: "0 4px 18px rgba(18, 32, 28, 0.02)",
          transition: "all 0.25s cubic-bezier(0.4, 0, 0.2, 1)",
          cursor: "pointer",
          display: "flex",
          flexDirection: "column",
          height: "100%",
          justifyContent: "space-between",
          "&:hover": {
            transform: "translateY(-4px)",
            boxShadow: "0 12px 32px rgba(15, 139, 108, 0.12)",
            borderColor: "rgba(15, 139, 108, 0.3)",
          },
        }}
        onClick={() => onViewDetails(medicine)}
      >
        <Box>
          {/* Header: Name + Category */}
          <Box sx={{ mb: 1.5 }}>
            <Typography
              variant="subtitle1"
              sx={{ fontWeight: 800, color: "#17231F", mb: 0.5 }}
            >
              {medicine.name}
            </Typography>
            {medicine.genericName && (
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ display: "block", fontStyle: "italic", mb: 1 }}
              >
                {medicine.genericName}
              </Typography>
            )}
            <Chip
              label={medicine.category}
              size="small"
              sx={{
                bgcolor: "rgba(15, 139, 108, 0.06)",
                color: "#0F8B6C",
                fontWeight: 700,
                fontSize: "0.68rem",
                height: 20,
              }}
            />
          </Box>

          {/* Price + Availability */}
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              mb: 2,
            }}
          >
            <Typography variant="h6" color="#0F5E4D" sx={{ fontWeight: 850 }}>
              ETB {medicine.unitPrice.toFixed(2)}
              <Typography
                component="span"
                variant="caption"
                color="text.secondary"
                sx={{ ml: 0.5, fontWeight: 600 }}
              >
                / {medicine.unitOfMeasure}
              </Typography>
            </Typography>
            <Chip
              label={
                isAvailable
                  ? isLowStock
                    ? `Low Stock (${medicine.totalStock})`
                    : `In Stock`
                  : "Out of Stock"
              }
              size="small"
              sx={{
                bgcolor: isAvailable
                  ? isLowStock
                    ? "rgba(217, 119, 6, 0.1)"
                    : "rgba(15, 139, 108, 0.1)"
                  : "rgba(194, 65, 59, 0.1)",
                color: isAvailable
                  ? isLowStock
                    ? "#D97706"
                    : "#0F8B6C"
                  : "#C2413B",
                fontWeight: 800,
                fontSize: "0.68rem",
                height: 22,
              }}
            />
          </Box>

          {/* Pharmacy Info */}
          <Box sx={{ mb: 2.5, p: 1.5, borderRadius: 2, bgcolor: "rgba(23, 35, 31, 0.03)" }}>
            <Stack
              direction="row"
              spacing={1}
              sx={{ alignItems: "center", mb: 0.5 }}
            >
              <LocalPharmacy fontSize="small" sx={{ color: "#DDAA4A", fontSize: "1.1rem" }} />
              <Typography variant="body2" sx={{ fontWeight: 700, color: "#17231F" }}>
                {medicine.pharmacyName}
              </Typography>
            </Stack>
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ display: "block", mb: 0.5, pl: 2.5 }}
            >
              {medicine.pharmacyCity}
            </Typography>
            {medicine.distanceKm !== undefined && (
              <Stack direction="row" spacing={0.5} sx={{ alignItems: "center", pl: 2.5 }}>
                <LocationOn
                  fontSize="small"
                  sx={{ color: "primary.main", fontSize: "0.9rem" }}
                />
                <Typography variant="caption" color="text.secondary">
                  {medicine.distanceKm.toFixed(1)} km away
                </Typography>
              </Stack>
            )}
          </Box>
        </Box>

        {/* Actions */}
        <Stack direction="row" spacing={1} sx={{ mt: "auto" }}>
          <Button
            size="small"
            variant="outlined"
            onClick={(e) => {
              e.stopPropagation();
              onViewDetails(medicine);
            }}
            endIcon={<NavigateNext fontSize="small" />}
            sx={{
              flexGrow: 1,
              borderColor: "rgba(15, 139, 108, 0.3)",
              color: "#0F8B6C",
              fontWeight: 700,
              fontSize: "0.8rem",
              minHeight: 38,
              "&:hover": {
                borderColor: "#0F8B6C",
                bgcolor: "rgba(15, 139, 108, 0.04)",
              },
            }}
          >
            Details
          </Button>
          {medicine.pharmacyLocation && (
            <Tooltip title={`Get directions to ${medicine.pharmacyName}`}>
              <Button
                size="small"
                variant="contained"
                onClick={(e) => {
                  e.stopPropagation();
                  onGetDirections(
                    medicine.pharmacyLocation!,
                    medicine.pharmacyName,
                  );
                }}
                sx={{
                  minWidth: "auto",
                  px: 1.75,
                  minHeight: 38,
                  background:
                    "linear-gradient(135deg, #0F8B6C 0%, #0A6B59 100%)",
                  "&:hover": {
                    background:
                      "linear-gradient(135deg, #0A6B59 0%, #064E3B 100%)",
                  },
                }}
              >
                <LocationOn fontSize="small" />
              </Button>
            </Tooltip>
          )}
        </Stack>
      </Paper>
    </Fade>
  );
};
