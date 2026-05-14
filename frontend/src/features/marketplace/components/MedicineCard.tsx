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
     pharmacy: MarketplaceMedicine["pharmacyLocation"] | undefined,
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
          border: "1px solid rgba(0,0,0,0.06)",
          bgcolor: "rgba(255, 255, 255, 0.7)",
          backdropFilter: "blur(24px)",
          boxShadow: "0 10px 40px rgba(0,0,0,0.03)",
          transition: "transform 200ms cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 200ms ease, border-color 200ms ease",
          cursor: "pointer",
          "&:hover": {
            transform: "translateY(-6px)",
            boxShadow: "0 20px 60px rgba(15, 139, 108, 0.15)",
            borderColor: "rgba(15, 139, 108, 0.4)",
          },
        }}
        onClick={() => onViewDetails(medicine)}
      >
        {/* Header: Name + Category */}
        <Box sx={{ mb: 2 }}>
          <Typography
            variant="subtitle1"
            sx={{ fontWeight: 700, color: "#1E293B", mb: 0.5 }}
          >
            {medicine.name}
          </Typography>
          {medicine.genericName && (
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ display: "block" }}
            >
              {medicine.genericName}
            </Typography>
          )}
          <Chip
            label={medicine.category}
            size="small"
            sx={{
              mt: 1,
              bgcolor: "rgba(15, 139, 108, 0.08)",
              color: "#0F8B6C",
              fontWeight: 600,
              fontSize: "0.7rem",
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
          <Typography variant="h6" color="#0F5E4D" sx={{ fontWeight: 800 }}>
            ETB {medicine.unitPrice.toFixed(2)}
            <Typography
              component="span"
              variant="caption"
              color="text.secondary"
              sx={{ ml: 0.5, fontWeight: 500 }}
            >
              / {medicine.unitOfMeasure}
            </Typography>
          </Typography>
          <Chip
            label={
              isAvailable
                ? isLowStock
                  ? `Low Stock (${medicine.totalStock})`
                  : `In Stock (${medicine.totalStock})`
                : "Out of Stock"
            }
            size="small"
            sx={{
              bgcolor: isAvailable
                ? isLowStock
                  ? "rgba(217, 119, 6, 0.12)"
                  : "rgba(5, 150, 105, 0.12)"
                : "rgba(107, 114, 128, 0.12)",
              color: isAvailable
                ? isLowStock
                  ? "#D97706"
                  : "#059669"
                : "#6B7280",
              fontWeight: 700,
              fontSize: "0.7rem",
            }}
          />
        </Box>

        {/* Pharmacy Info */}
        <Box sx={{ mb: 2 }}>
          <Stack
             direction="row"
             spacing={1}
             sx={{ alignItems: "center", mb: 0.5 }}
           >
            <LocalPharmacy fontSize="small" sx={{ color: "#DDAA4A" }} />
            <Typography variant="body2" sx={{ fontWeight: 600 }}>
              {medicine.pharmacyName}
            </Typography>
          </Stack>
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{ display: "block", mb: 0.5 }}
          >
            {medicine.pharmacyCity}
          </Typography>
          {medicine.distanceKm !== undefined && (
            <Stack direction="row" spacing={0.5} sx={{ alignItems: "center" }}>
              <LocationOn
                fontSize="small"
                sx={{ color: "primary.main", fontSize: "1rem" }}
              />
              <Typography variant="caption" color="text.secondary">
                {medicine.distanceKm.toFixed(1)} km away
              </Typography>
            </Stack>
          )}
        </Box>

        {/* Actions */}
        <Stack direction="row" spacing={1}>
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
              borderColor: "rgba(15, 139, 108, 0.5)",
              color: "#0F8B6C",
              fontWeight: 600,
              "&:hover": {
                borderColor: "#0F8B6C",
                bgcolor: "rgba(15, 139, 108, 0.04)",
              },
            }}
          >
            View Details
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
                  px: 2,
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
