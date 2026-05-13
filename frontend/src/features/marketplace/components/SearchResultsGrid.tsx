// src/features/marketplace/components/SearchResultsGrid.tsx
import { Box, Button, CircularProgress, Grid, Typography } from "@mui/material";
import type { MarketplaceMedicine } from "../types";
import { EmptySearchState } from "./EmptySearchState";
import { MedicineCard } from "./MedicineCard";

interface SearchResultsGridProps {
  results: MarketplaceMedicine[] | null;
  loading: boolean;
  error: string | null;
  searchQuery: string;
  onViewDetails: (medicine: MarketplaceMedicine) => void;
  onGetDirections: (
    location: { lat: number; lng: number } | undefined,
    pharmacyName: string,
  ) => void;
  onLoadMore: () => void;
  hasMore: boolean;
}

export const SearchResultsGrid = ({
  results,
  loading,
  error,
  searchQuery,
  onViewDetails,
  onGetDirections,
  onLoadMore,
  hasMore,
}: SearchResultsGridProps) => {
  if (loading && !results) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ textAlign: "center", py: 8 }}>
        <Typography color="error.main" sx={{ mb: 2 }}>
          {error}
        </Typography>
        <Button variant="outlined" onClick={onLoadMore}>
          Try Again
        </Button>
      </Box>
    );
  }

  if (!results || results.length === 0) {
    return (
      <EmptySearchState
        query={searchQuery}
        onReset={() => {
          // Trigger a reset of filters/search
          window.location.reload(); // Or call a parent callback to clear filters
        }}
        onBrowseAll={() => {
          // Trigger loading all results (remove filters)
          // This would be handled by lifting state to the parent page
        }}
      />
    );
  }

  return (
    <Box>
      <Grid container spacing={3}>
        {results.map((medicine, index) => (
          <Grid
            size={{ xs: 12, sm: 6, lg: 4 }}
            key={`${medicine.medicineId}-${medicine.pharmacyId}`}
          >
            <MedicineCard
              medicine={medicine}
              index={index}
              onViewDetails={onViewDetails}
              onGetDirections={onGetDirections}
            />
          </Grid>
        ))}
      </Grid>

      {/* Load More Button */}
      {hasMore && (
        <Box sx={{ display: "flex", justifyContent: "center", mt: 4 }}>
          <Button
            variant="outlined"
            onClick={onLoadMore}
            disabled={loading}
            startIcon={loading ? <CircularProgress size={16} /> : null}
            sx={{
              borderColor: "rgba(15, 139, 108, 0.5)",
              color: "#0F8B6C",
              fontWeight: 600,
              "&:hover": {
                borderColor: "#0F8B6C",
                bgcolor: "rgba(15, 139, 108, 0.04)",
              },
            }}
          >
            {loading ? "Loading..." : "Load More Results"}
          </Button>
        </Box>
      )}
    </Box>
  );
};
