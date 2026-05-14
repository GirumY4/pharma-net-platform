import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Snackbar,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { useCallback, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../../contexts/useAuth";
import { MarketplaceHero } from "../components/MarketplaceHero";
import { SearchResultsGrid } from "../components/SearchResultsGrid";
import { SmartFiltersSidebar } from "../components/SmartFiltersSidebar";
import { useMarketplaceSearch } from "../hooks/useMarketplaceSearch";
import {
  createMarketplaceOrder,
  fetchMedicinePublicDetails,
} from "../services/marketplaceApi";
import type { MarketplaceFilters, MarketplaceMedicine } from "../types";

const DEFAULT_FILTERS: MarketplaceFilters = {
  page: 1,
  limit: 12,
};

export const MarketplacePage = () => {
  const navigate = useNavigate();
  const { isAuthenticated, role } = useAuth();
  const [filters, setFilters] = useState<MarketplaceFilters>(DEFAULT_FILTERS);
  const [showFilters, setShowFilters] = useState(false);
  const [filterAnchorEl, setFilterAnchorEl] = useState<null | HTMLElement>(
    null,
  );
  const [selectedMedicine, setSelectedMedicine] =
    useState<MarketplaceMedicine | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [orderQuantity, setOrderQuantity] = useState(1);
  const [fulfillmentMethod, setFulfillmentMethod] = useState<
    "pickup" | "delivery"
  >("pickup");
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [submittingOrder, setSubmittingOrder] = useState(false);
  const [toast, setToast] = useState<{
    open: boolean;
    message: string;
    severity: "info" | "success" | "error";
  }>({
    open: false,
    message: "",
    severity: "info",
  });

  const { results, loading, error, pagination, search, retry, loadMore } =
    useMarketplaceSearch(DEFAULT_FILTERS);

  const runSearch = useCallback(
    (nextFilters: MarketplaceFilters) => {
      setFilters(nextFilters);
      search(nextFilters);
    },
    [search],
  );

  const handleSearch = useCallback(
    (query: string) => {
      const trimmedQuery = query.trim();
      if (!trimmedQuery) {
        runSearch(DEFAULT_FILTERS);
        return;
      }

      const categoryMatch = trimmedQuery.match(/^category:(.+)$/i);
      const cityMatch = trimmedQuery.match(/^city:(.+)$/i);

      const nextFilters: MarketplaceFilters = {
        ...filters,
        name: undefined,
        page: 1,
        limit: filters.limit || DEFAULT_FILTERS.limit,
      };

      if (categoryMatch?.[1]) {
        nextFilters.category = categoryMatch[1].trim();
      } else if (cityMatch?.[1]) {
        nextFilters.city = cityMatch[1].trim();
      } else {
        nextFilters.name = trimmedQuery;
      }

      runSearch(nextFilters);
    },
    [filters, runSearch],
  );

  const handleFilterChange = useCallback(
    (newFilters: Partial<MarketplaceFilters>) => {
      runSearch({
        ...filters,
        ...newFilters,
        page: 1,
        limit: filters.limit || DEFAULT_FILTERS.limit,
      });
    },
    [filters, runSearch],
  );

  const handleResetFilters = useCallback(() => {
    runSearch(DEFAULT_FILTERS);
  }, [runSearch]);

  const handleLocationUpdate = useCallback(
    (lat: number, lng: number) => {
      runSearch({
        ...filters,
        userLat: lat,
        userLng: lng,
        page: 1,
        limit: filters.limit || DEFAULT_FILTERS.limit,
      });
      setToast({
        open: true,
        message: "Showing marketplace listings nearest to your location.",
        severity: "success",
      });
    },
    [filters, runSearch],
  );

  const handleViewDetails = useCallback(
    async (medicine: MarketplaceMedicine) => {
      setSelectedMedicine(medicine);
      setDetailsOpen(true);
      setOrderQuantity(1);
      setFulfillmentMethod("pickup");
      setDeliveryAddress("");
      setDetailsLoading(true);

      try {
        const details = await fetchMedicinePublicDetails(medicine.medicineId);
        setSelectedMedicine(details);
      } catch {
        setToast({
          open: true,
          message: "Showing listing summary. Full details could not be loaded.",
          severity: "info",
        });
      } finally {
        setDetailsLoading(false);
      }
    },
    [],
  );

  const handleGetDirections = useCallback(
    (
      location: { lat: number; lng: number } | undefined,
      pharmacyName: string,
    ) => {
      if (!location) {
        setToast({
          open: true,
          message: "This pharmacy has not added map coordinates yet.",
          severity: "info",
        });
        return;
      }

      const url = `https://www.google.com/maps?q=${location.lat},${location.lng}`;
      window.open(url, "_blank", "noopener,noreferrer");
      setToast({
        open: true,
        message: `Opening directions to ${pharmacyName} in Google Maps.`,
        severity: "info",
      });
    },
    [],
  );

  const handlePlaceOrder = useCallback(async () => {
    if (!selectedMedicine) return;

    if (!isAuthenticated) {
      navigate("/login", { state: { from: { pathname: "/marketplace" } } });
      return;
    }

    if (role !== "public_user") {
      setToast({
        open: true,
        message: "Only public user accounts can place marketplace orders.",
        severity: "info",
      });
      return;
    }

    if (fulfillmentMethod === "delivery" && !deliveryAddress.trim()) {
      setToast({
        open: true,
        message: "Delivery address is required for delivery orders.",
        severity: "error",
      });
      return;
    }

    const quantity = Math.max(1, Math.floor(orderQuantity));
    if (quantity > selectedMedicine.totalStock) {
      setToast({
        open: true,
        message: `Only ${selectedMedicine.totalStock} units are available.`,
        severity: "error",
      });
      return;
    }

    setSubmittingOrder(true);
    try {
      const order = await createMarketplaceOrder({
        pharmacyId: selectedMedicine.pharmacyId,
        items: [{ medicineId: selectedMedicine.medicineId, quantity }],
        fulfillmentMethod,
        ...(fulfillmentMethod === "delivery"
          ? { deliveryAddress: deliveryAddress.trim() }
          : {}),
      });

      setToast({
        open: true,
        message: `Order ${order._id} placed successfully. Status: ${order.status}.`,
        severity: "success",
      });
      setDetailsOpen(false);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Unable to place order right now.";
      setToast({ open: true, message, severity: "error" });
    } finally {
      setSubmittingOrder(false);
    }
  }, [
    deliveryAddress,
    fulfillmentMethod,
    isAuthenticated,
    navigate,
    orderQuantity,
    role,
    selectedMedicine,
  ]);

  const lineTotal = selectedMedicine
    ? selectedMedicine.unitPrice * Math.max(1, Math.floor(orderQuantity))
    : 0;

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "#F7FAF9" }}>
      <MarketplaceHero
        onSearch={handleSearch}
        onFilterToggle={(e) => {
          setFilterAnchorEl(e.currentTarget);
          setShowFilters(true);
        }}
        onLocationUpdate={handleLocationUpdate}
      />

      <Container maxWidth="xl" sx={{ py: { xs: 3, md: 5 } }}>
        <SmartFiltersSidebar
          open={showFilters}
          anchorEl={filterAnchorEl}
          onClose={() => setShowFilters(false)}
          filters={{
            category: filters.category,
            city: filters.city,
            maxPrice: filters.maxPrice,
            minStock: filters.minStock,
          }}
          onFilterChange={handleFilterChange}
          onReset={handleResetFilters}
        />

        <SearchResultsGrid
          results={results}
          loading={loading}
          error={error}
          searchQuery={
            filters.name ||
            filters.genericName ||
            filters.category ||
            filters.city ||
            ""
          }
          onViewDetails={handleViewDetails}
          onGetDirections={handleGetDirections}
          onReset={handleResetFilters}
          onRetry={retry}
          onLoadMore={loadMore}
          hasMore={pagination.page < pagination.totalPages}
          totalResults={pagination.total}
        />
      </Container>

      <Dialog
        open={detailsOpen}
        onClose={() => setDetailsOpen(false)}
        fullWidth
        maxWidth="sm"
        slotProps={{
          paper: {
            sx: {
              borderRadius: 4,
              boxShadow: "0 24px 64px rgba(0,0,0,0.12)",
            },
          },
        }}
      >
        <DialogTitle sx={{ pb: 1 }}>
          <Stack spacing={1}>
            <Typography variant="h6" sx={{ fontWeight: 800 }}>
              {selectedMedicine?.name || "Medicine details"}
            </Typography>
            {selectedMedicine && (
              <Stack direction="row" spacing={1} sx={{ flexWrap: "wrap" }}>
                <Chip label={selectedMedicine.category} size="small" />
                <Chip
                  label={`${selectedMedicine.totalStock} in stock`}
                  size="small"
                  color="success"
                  variant="outlined"
                />
              </Stack>
            )}
          </Stack>
        </DialogTitle>
        <DialogContent>
          {detailsLoading && (
            <Box sx={{ display: "flex", justifyContent: "center", py: 2 }}>
              <CircularProgress size={24} />
            </Box>
          )}

          {selectedMedicine && (
            <Stack spacing={2.25} sx={{ pt: 1 }}>
              <Box>
                <Typography variant="body2" color="text.secondary">
                  Generic name
                </Typography>
                <Typography variant="body1" sx={{ fontWeight: 700 }}>
                  {selectedMedicine.genericName || "Not specified"}
                </Typography>
              </Box>

              {selectedMedicine.description && (
                <Typography variant="body2" color="text.secondary">
                  {selectedMedicine.description}
                </Typography>
              )}

              <Divider />

              <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
                <Box sx={{ flex: 1 }}>
                  <Typography variant="body2" color="text.secondary">
                    Price
                  </Typography>
                  <Typography
                    variant="h6"
                    color="#0F5E4D"
                    sx={{ fontWeight: 800 }}
                  >
                    ETB {selectedMedicine.unitPrice.toFixed(2)}
                    <Typography
                      component="span"
                      variant="caption"
                      sx={{ ml: 0.5 }}
                    >
                      / {selectedMedicine.unitOfMeasure}
                    </Typography>
                  </Typography>
                </Box>
                <Box sx={{ flex: 1 }}>
                  <Typography variant="body2" color="text.secondary">
                    Pharmacy
                  </Typography>
                  <Typography variant="body1" sx={{ fontWeight: 700 }}>
                    {selectedMedicine.pharmacyName}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {selectedMedicine.pharmacyAddress ||
                      selectedMedicine.pharmacyCity}
                  </Typography>
                </Box>
              </Stack>

              <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
                <TextField
                  label="Quantity"
                  type="number"
                  size="small"
                  value={orderQuantity}
                  onChange={(event) =>
                    setOrderQuantity(Number(event.target.value) || 1)
                  }
                  slotProps={{
                    htmlInput: {
                      min: 1,
                      max: selectedMedicine.totalStock,
                    },
                  }}
                  sx={{ flex: 1 }}
                />
                <FormControl size="small" sx={{ flex: 1 }}>
                  <InputLabel>Fulfillment</InputLabel>
                  <Select
                    label="Fulfillment"
                    value={fulfillmentMethod}
                    onChange={(event) =>
                      setFulfillmentMethod(
                        event.target.value as "pickup" | "delivery",
                      )
                    }
                  >
                    <MenuItem value="pickup">Pickup</MenuItem>
                    <MenuItem value="delivery">Delivery</MenuItem>
                  </Select>
                </FormControl>
              </Stack>

              {fulfillmentMethod === "delivery" && (
                <TextField
                  label="Delivery address"
                  size="small"
                  value={deliveryAddress}
                  onChange={(event) => setDeliveryAddress(event.target.value)}
                  fullWidth
                  multiline
                  minRows={2}
                />
              )}

              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  p: 1.5,
                  borderRadius: 2,
                  bgcolor: "rgba(15, 139, 108, 0.08)",
                }}
              >
                <Typography variant="body2" sx={{ fontWeight: 700 }}>
                  Estimated total
                </Typography>
                <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>
                  ETB {lineTotal.toFixed(2)}
                </Typography>
              </Box>
            </Stack>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button onClick={() => setDetailsOpen(false)}>Close</Button>
          {selectedMedicine?.pharmacyLocation && (
            <Button
              variant="outlined"
              onClick={() =>
                handleGetDirections(
                  selectedMedicine.pharmacyLocation,
                  selectedMedicine.pharmacyName,
                )
              }
            >
              Directions
            </Button>
          )}
          <Button
            variant="contained"
            onClick={handlePlaceOrder}
            disabled={submittingOrder || !selectedMedicine}
          >
            {submittingOrder ? "Placing..." : "Place Order"}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={toast.open}
        autoHideDuration={5000}
        onClose={() => setToast((prev) => ({ ...prev, open: false }))}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert
          severity={toast.severity}
          onClose={() => setToast((prev) => ({ ...prev, open: false }))}
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
