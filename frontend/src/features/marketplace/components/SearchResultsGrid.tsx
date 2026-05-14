// src/features/marketplace/components/SearchResultsGrid.tsx
import { Box, Button, CircularProgress, Grid, Typography } from "@mui/material";
import type { MarketplaceMedicine } from "../types";
import { EmptySearchState } from "./EmptySearchState";
import { MedicineCard } from "./MedicineCard";

interface SearchResultsGridProps {
  results: MarketplaceMedicine[];
  loading: boolean;
  error: string | null;
  searchQuery: string;
  onViewDetails: (medicine: MarketplaceMedicine) => void;
  onGetDirections: (
    location: { lat: number; lng: number } | undefined,
    pharmacyName: string,
  ) => void;
  onReset: () => void;
  onRetry: () => void;
  onLoadMore: () => void;
  hasMore: boolean;
  totalResults: number;
}

export const SearchResultsGrid = ({
  results,
  loading,
  error,
  searchQuery,
  onViewDetails,
  onGetDirections,
  onReset,
  onRetry,
  onLoadMore,
  hasMore,
  totalResults,
}: SearchResultsGridProps) => {
  if (loading && results.length === 0) {
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
        <Button variant="outlined" onClick={onRetry}>
          Try Again
        </Button>
      </Box>
    );
  }

  if (results.length === 0) {
    return (
      <EmptySearchState
        query={searchQuery}
        onReset={onReset}
        onBrowseAll={onReset}
      />
    );
  }

  return (
    <Box>
      <Box sx={{ display: "flex", justifyContent: "space-between", mb: 2 }}>
        <Typography variant="subtitle2" color="text.secondary">
          {totalResults} matching {totalResults === 1 ? "listing" : "listings"}
        </Typography>
        {searchQuery && (
          <Button size="small" onClick={onReset}>
            Clear search
          </Button>
        )}
      </Box>

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
