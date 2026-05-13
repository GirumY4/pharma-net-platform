// src/features/marketplace/pages/MarketplacePage.tsx
import { Alert, Box, Container, Snackbar } from "@mui/material";
import { useCallback, useState } from "react";
import { MarketplaceHero } from "../components/MarketplaceHero";
import { SearchResultsGrid } from "../components/SearchResultsGrid";
import { SmartFiltersSidebar } from "../components/SmartFiltersSidebar";
import { useMarketplaceSearch } from "../hooks/useMarketplaceSearch";
import type { MarketplaceFilters, MarketplaceMedicine } from "../types";

export const MarketplacePage = () => {
  const [filters, setFilters] = useState<MarketplaceFilters>({
    page: 1,
    limit: 12,
  });
  const [showFilters, setShowFilters] = useState(false);
  const [toast, setToast] = useState<{ open: boolean; message: string }>({
    open: false,
    message: "",
  });

  const { results, loading, error, pagination, search, loadMore } =
    useMarketplaceSearch(filters);

  const handleSearch = useCallback(
    (query: string) => {
      // Simple parser for quick filters like "category:Antibiotic"
      const categoryMatch = query.match(/category:(\w+)/i);
      const newFilters: MarketplaceFilters = { page: 1, limit: 12 };

      if (categoryMatch) {
        newFilters.category = categoryMatch[1];
      } else {
        newFilters.name = query;
      }

      setFilters((prev) => ({ ...prev, ...newFilters }));
      search(newFilters);
    },
    [search],
  );

  const handleFilterChange = useCallback(
    (newFilters: Partial<MarketplaceFilters>) => {
      setFilters((prev) => ({ ...prev, ...newFilters, page: 1 }));
      search({ ...filters, ...newFilters, page: 1 });
    },
    [filters, search],
  );

  const handleResetFilters = useCallback(() => {
    const resetFilters: MarketplaceFilters = { page: 1, limit: 12 };
    setFilters(resetFilters);
    search(resetFilters);
  }, [search]);

  const handleLocationUpdate = useCallback(
    (lat: number, lng: number) => {
      setFilters((prev) => ({ ...prev, userLat: lat, userLng: lng }));
      search({ ...filters, userLat: lat, userLng: lng });
      setToast({ open: true, message: "Showing results near your location" });
    },
    [filters, search],
  );

  const handleViewDetails = useCallback((medicine: MarketplaceMedicine) => {
    // For now, show a helpful toast since ordering isn't implemented for public users
    setToast({
      open: true,
      message: `"${medicine.name}" is available at ${medicine.pharmacyName}. Visit the pharmacy or contact them at ${medicine.pharmacyPhone || "the listed number"}.`,
    });
  }, []);

const handleGetDirections = useCallback(
    (location: { lat: number; lng: number } | undefined, pharmacyName: string) => {
      if (!location) return;
      // Open Google Maps with the pharmacy location
      const url = `https://www.google.com/maps?q=${location.lat},${location.lng}`;
      window.open(url, "_blank");
      setToast({
        open: true,
        message: `Opening directions to ${pharmacyName} in Google Maps`,
      });
    },
    [],
  );

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "#F7FAF9" }}>
      {/* Hero Search Section */}
      <MarketplaceHero
        onSearch={handleSearch}
        onFilterToggle={() => setShowFilters(!showFilters)}
        onLocationUpdate={handleLocationUpdate}
      />

      {/* Main Content */}
      <Container maxWidth="xl" sx={{ py: { xs: 3, md: 5 } }}>
        {/* Smart Filters Sidebar */}
        <SmartFiltersSidebar
          open={showFilters}
          onClose={() => setShowFilters(false)}
          filters={{
            category: filters.category,
            maxPrice: filters.maxPrice,
            minStock: filters.minStock,
          }}
          onFilterChange={handleFilterChange}
          onReset={handleResetFilters}
        />

        {/* Search Results */}
        <SearchResultsGrid
          results={results}
          loading={loading}
          error={error}
          searchQuery={filters.name || filters.genericName || ""}
          onViewDetails={handleViewDetails}
          onGetDirections={handleGetDirections}
          onLoadMore={loadMore}
          hasMore={pagination.page < pagination.totalPages}
        />
      </Container>

      {/* Toast Notifications */}
      <Snackbar
        open={toast.open}
        autoHideDuration={5000}
        onClose={() => setToast({ ...toast, open: false })}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert
          severity="info"
          onClose={() => setToast({ ...toast, open: false })}
          sx={{
            width: "100%",
            borderRadius: 2,
            bgcolor: "rgba(255, 255, 255, 0.95)",
            border: "1px solid rgba(23, 35, 31, 0.1)",
            boxShadow: "0 8px 32px rgba(0,0,0,0.08)",
          }}
        >
          {toast.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};
