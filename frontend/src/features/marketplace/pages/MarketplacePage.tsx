// src/features/marketplace/pages/MarketplacePage.tsx
import {
  Alert,
  AppBar,
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Collapse,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  FormControl,
  Grid,
  IconButton,
  InputLabel,
  List,
  ListItem,
  ListItemText,
  Menu,
  MenuItem,
  Paper,
  Select,
  Snackbar,
  Stack,
  Step,
  StepLabel,
  Stepper,
  TextField,
  Toolbar,
  Tooltip,
  Typography,
} from "@mui/material";
import {
  ExpandLess,
  ExpandMore,
  LocalShipping as ShippingIcon,
  Logout,
  MyLocation,
  Search,
  Settings as SettingsIcon,
} from "@mui/icons-material";
import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../../contexts/useAuth";
import SEO from "../../../components/SEO";
import { API_BASE_URL } from "../../../services/api";
import { Logo } from "../../../components/Logo";
import { Footer } from "../../../components/layout/Footer";
import { MarketplaceFloatingUtilities } from "../components/MarketplaceFloatingUtilities";
import { SearchResultsGrid } from "../components/SearchResultsGrid";
import { useMarketplaceSearch } from "../hooks/useMarketplaceSearch";
import {
  createMarketplaceOrder,
  fetchMedicinePublicDetails,
} from "../services/marketplaceApi";
import type { MarketplaceFilters, MarketplaceMedicine } from "../types";
import { fetchOrders } from "../../orders/services/ordersApi";
import type { IOrder, IOrderItem, OrderStatus } from "../../orders/types";

// Profile imports
import { ProfileForm, PasswordChangeForm, useUserProfile } from "../../users";
import { AccountSettingsCard } from "../../users/components/AccountSettingsCard";
import { ProfileHeader } from "../../users/components/ProfileHeader";
import { ProfilePictureUpload } from "../../users/components/ProfilePictureUpload";
import { deactivateAccount } from "../../users/services/usersApi";
import { CATEGORIES } from "../types";

const DEFAULT_FILTERS: MarketplaceFilters = {
  page: 1,
  limit: 12,
};

const ORDER_SYSTEM_ENABLED = false;
const TOP_BAR_HEIGHT = 72;

const ORDER_STEPS: { label: string; key: OrderStatus }[] = [
  { label: "Pending", key: "pending" },
  { label: "Approved", key: "approved" },
  { label: "Processing", key: "processing" },
  { label: "Ready", key: "ready" },
  { label: "Delivered", key: "delivered" },
];

interface MarketplaceCartItem {
  medicineId: string;
  name: string;
  pharmacyId: string;
  pharmacyName: string;
  unitPrice: number;
  unitOfMeasure: MarketplaceMedicine["unitOfMeasure"];
  quantity: number;
  maxQuantity: number;
  pharmacyPhone?: string;
}

export const MarketplacePage = () => {
  const navigate = useNavigate();
  const { isAuthenticated, user, role, logout, refreshUser } = useAuth();

  // Tab State: "listings" | "orders" | "profile"
  const [activeTab, setActiveTab] = useState<"listings" | "orders" | "profile">("listings");

  // User Profile Anchor
  const [userMenuAnchor, setUserMenuAnchor] = useState<null | HTMLElement>(null);

  // Filter & Search states
  const [filters, setFilters] = useState<MarketplaceFilters>(DEFAULT_FILTERS);
  const [showFiltersMobile, setShowFiltersMobile] = useState(false);
  const [sortBy, setSortBy] = useState<string>("price_asc");

  // Medicine Details Modal State
  const [selectedMedicine, setSelectedMedicine] = useState<MarketplaceMedicine | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [orderQuantity, setOrderQuantity] = useState(1);
  const [fulfillmentMethod, setFulfillmentMethod] = useState<"pickup" | "delivery">("pickup");
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [submittingOrder, setSubmittingOrder] = useState(false);

  // Orders State
  const [orders, setOrders] = useState<IOrder[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [ordersError, setOrdersError] = useState<string | null>(null);
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);

  // Toast notifications
  const [toast, setToast] = useState<{
    open: boolean;
    message: string;
    severity: "info" | "success" | "error";
  }>({
    open: false,
    message: "",
    severity: "info",
  });
  const [accountNotice, setAccountNotice] = useState<string | null>(null);

  const { results, loading, error, pagination, search, retry, loadMore } =
    useMarketplaceSearch(DEFAULT_FILTERS);

  // Fetch detailed user profile when profile tab is active
  const {
    profile,
    loading: profileLoading,
    error: profileError,
    refresh: refreshProfile,
  } = useUserProfile(activeTab === "profile");

  // Fetch orders when tab is orders
  const loadUserOrders = useCallback(async () => {
    if (!isAuthenticated) return;
    setOrdersLoading(true);
    setOrdersError(null);
    try {
      const response = await fetchOrders({ limit: 50 });
      setOrders(response.data);
    } catch {
      setOrdersError("Failed to retrieve order history.");
    } finally {
      setOrdersLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (activeTab === "orders" && ORDER_SYSTEM_ENABLED) {
      loadUserOrders();
    }
  }, [activeTab, loadUserOrders]);

  const refreshAccountState = async () => {
    await Promise.all([refreshProfile(), refreshUser()]);
  };

  const handleDeactivate = async () => {
    const response = await deactivateAccount();
    setAccountNotice(response.message);
  };

  const handleLogout = () => {
    setUserMenuAnchor(null);
    logout();
    navigate("/login");
  };

  const runSearch = useCallback(
    (nextFilters: MarketplaceFilters) => {
      setFilters(nextFilters);
      search(nextFilters);
    },
    [search],
  );

  const handleSearchChange = (query: string) => {
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
  };

  const handleFilterChange = (newFilters: Partial<MarketplaceFilters>) => {
    runSearch({
      ...filters,
      ...newFilters,
      page: 1,
      limit: filters.limit || DEFAULT_FILTERS.limit,
    });
  };

  const handleResetFilters = () => {
    runSearch(DEFAULT_FILTERS);
  };

  const handleLocationUpdate = (lat: number, lng: number) => {
    runSearch({
      ...filters,
      userLat: lat,
      userLng: lng,
      page: 1,
      limit: filters.limit || DEFAULT_FILTERS.limit,
    });
    setToast({
      open: true,
      message: "Showing listings closest to you.",
      severity: "success",
    });
  };

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
    (location: { lat: number; lng: number } | undefined, pharmacyName: string) => {
      if (!location) {
        setToast({
          open: true,
          message: `${pharmacyName} has not added map coordinates yet.`,
          severity: "info",
        });
        return;
      }
      const url = `https://www.google.com/maps?q=${location.lat},${location.lng}`;
      window.open(url, "_blank", "noopener,noreferrer");
    },
    [],
  );

  const handlePlaceOrder = useCallback(async () => {
    if (!selectedMedicine) return;
    if (!ORDER_SYSTEM_ENABLED) return;

    if (!isAuthenticated) {
      navigate("/login", { state: { from: { pathname: "/marketplace" } } });
      return;
    }
    if (role !== "public_user") return;

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
        message: `Order placed successfully. Order ID: ${order._id}`,
        severity: "success",
      });
      setDetailsOpen(false);
      loadUserOrders();
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
    loadUserOrders,
  ]);

  const handleAddToCart = useCallback(() => {
    if (!selectedMedicine) return;
    if (!ORDER_SYSTEM_ENABLED) return;

    const quantity = Math.max(1, Math.floor(orderQuantity));
    if (quantity > selectedMedicine.totalStock) {
      setToast({
        open: true,
        message: `Only ${selectedMedicine.totalStock} units are available.`,
        severity: "error",
      });
      return;
    }

    try {
      const saved = localStorage.getItem("pharma_net_cart");
      const cart = (saved ? JSON.parse(saved) : []) as MarketplaceCartItem[];

      const existingIdx = cart.findIndex(
        (item) => item.medicineId === selectedMedicine.medicineId,
      );
      if (existingIdx >= 0) {
        cart[existingIdx].quantity = Math.min(
          cart[existingIdx].quantity + quantity,
          selectedMedicine.totalStock,
        );
      } else {
        cart.push({
          medicineId: selectedMedicine.medicineId,
          name: selectedMedicine.name,
          pharmacyId: selectedMedicine.pharmacyId,
          pharmacyName: selectedMedicine.pharmacyName,
          unitPrice: selectedMedicine.unitPrice,
          unitOfMeasure: selectedMedicine.unitOfMeasure,
          quantity: quantity,
          maxQuantity: selectedMedicine.totalStock,
          pharmacyPhone: selectedMedicine.pharmacyPhone,
        });
      }

      localStorage.setItem("pharma_net_cart", JSON.stringify(cart));
      window.dispatchEvent(new Event("cart_updated"));

      setToast({
        open: true,
        message: `Added ${quantity} ${selectedMedicine.name} to cart.`,
        severity: "success",
      });
      setDetailsOpen(false);
    } catch {
      setToast({
        open: true,
        message: "Failed to add item to cart.",
        severity: "error",
      });
    }
  }, [orderQuantity, selectedMedicine]);

  const lineTotal = selectedMedicine
    ? selectedMedicine.unitPrice * Math.max(1, Math.floor(orderQuantity))
    : 0;
  const ordersDisabledReason =
    "Marketplace orders are frozen while the ordering workflow is being prepared.";

  // Sorting logic on client results
  const sortedResults = [...results].sort((a, b) => {
    if (sortBy === "price_asc") return a.unitPrice - b.unitPrice;
    if (sortBy === "price_desc") return b.unitPrice - a.unitPrice;
    if (sortBy === "stock_desc") return b.totalStock - a.totalStock;
    if (sortBy === "name_asc") return a.name.localeCompare(b.name);
    if (sortBy === "distance_asc") {
      const distA = a.distanceKm ?? 999999;
      const distB = b.distanceKm ?? 999999;
      return distA - distB;
    }
    return 0;
  });

  const marketplaceSchema = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "Alyah Pharma Net Marketplace",
    url: import.meta.env.VITE_SITE_URL || "https://alyah-pharma-net.vercel.app",
    description: "Search real-time medicine availability across pharmacies in Ethiopia",
  };

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "#F7FAF9", display: "flex", flexDirection: "column" }}>
      <SEO
        title="Alyah Pharma Net - B2B & Public Medicine Marketplace"
        description="Search real-time medicine availability across Ethiopian pharmacies. Transparent B2B and public medicine access with geolocation tracking."
        structuredData={marketplaceSchema}
      />

      {/* STICKY GLASSMORPHIC TOP NAVBAR */}
      <AppBar
        position="sticky"
        elevation={0}
        sx={{
          top: 0,
          bgcolor: "rgba(247, 250, 249, 0.82)",
          backdropFilter: "blur(20px)",
          borderBottom: "1px solid rgba(23, 35, 31, 0.08)",
          color: "text.primary",
          zIndex: (theme) => theme.zIndex.drawer + 5,
        }}
      >
        <Toolbar sx={{ minHeight: TOP_BAR_HEIGHT, px: { xs: 2, md: 4 }, display: "flex", justifyContent: "space-between" }}>
          <Box sx={{ display: "flex", alignItems: "center", cursor: "pointer" }} onClick={() => navigate("/")}>
            <Logo />
          </Box>

          <Stack direction="row" spacing={1} sx={{ display: { xs: "none", md: "flex" } }}>
            <Button
              onClick={() => {
                setActiveTab("listings");
                window.scrollTo({ top: 0, behavior: "smooth" });
              }}
              sx={{
                fontWeight: 700,
                color: activeTab === "listings" ? "primary.main" : "text.secondary",
                bgcolor: activeTab === "listings" ? "rgba(15, 139, 108, 0.08)" : "transparent",
                borderRadius: 2,
                px: 2.25,
                "&:hover": { bgcolor: "rgba(15, 139, 108, 0.06)" },
              }}
            >
              Browse Medicine
            </Button>
            {isAuthenticated && (
              <>
                <Tooltip title={ordersDisabledReason}>
                  <span>
                    <Button
                      disabled
                      startIcon={<ShippingIcon />}
                      sx={{
                        fontWeight: 700,
                        borderRadius: 2,
                        px: 2.25,
                      }}
                    >
                      My Orders
                    </Button>
                  </span>
                </Tooltip>
                <Button
                  onClick={() => setActiveTab("profile")}
                  sx={{
                    fontWeight: 700,
                    color: activeTab === "profile" ? "primary.main" : "text.secondary",
                    bgcolor: activeTab === "profile" ? "rgba(15, 139, 108, 0.08)" : "transparent",
                    borderRadius: 2,
                    px: 2.25,
                    "&:hover": { bgcolor: "rgba(15, 139, 108, 0.06)" },
                  }}
                >
                  Profile Settings
                </Button>
              </>
            )}
            {isAuthenticated && role !== "public_user" && (
              <Button
                onClick={() => navigate("/dashboard")}
                sx={{
                  fontWeight: 700,
                  color: "secondary.dark",
                  border: "1px solid rgba(221, 170, 74, 0.5)",
                  borderRadius: 2,
                  px: 2,
                  "&:hover": { bgcolor: "rgba(221, 170, 74, 0.08)" },
                }}
              >
                SaaS Console
              </Button>
            )}
          </Stack>

          <Stack direction="row" spacing={1.5} sx={{ alignItems: "center" }}>
            {isAuthenticated ? (
              <Stack direction="row" spacing={1.5} sx={{ alignItems: "center" }}>
                <Box sx={{ textAlign: "right", display: { xs: "none", md: "block" } }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>
                    {user?.name}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ textTransform: "uppercase", fontWeight: 700 }}>
                    {role?.replace("_", " ")}
                  </Typography>
                </Box>
                <IconButton
                  onClick={(e) => setUserMenuAnchor(e.currentTarget)}
                  size="small"
                  sx={{
                    p: 0.5,
                    border: "1px solid rgba(15, 139, 108, 0.2)",
                  }}
                >
                  <Avatar
                    src={
                      user?.profilePictureUrl
                        ? `${API_BASE_URL.replace(/\/api\/?$/, "")}${user.profilePictureUrl}`
                        : undefined
                    }
                    sx={{ bgcolor: "primary.main", width: 34, height: 34, fontWeight: 700 }}
                  >
                    {user?.name?.charAt(0).toUpperCase()}
                  </Avatar>
                </IconButton>
              </Stack>
            ) : (
              <Stack direction="row" spacing={1.5}>
                <Button variant="outlined" size="small" onClick={() => navigate("/login")}>
                  Sign In
                </Button>
                <Button variant="contained" size="small" onClick={() => navigate("/register")}>
                  Register
                </Button>
              </Stack>
            )}
          </Stack>
        </Toolbar>

        {/* User Dropdown Menu */}
        <Menu
          anchorEl={userMenuAnchor}
          open={Boolean(userMenuAnchor)}
          onClose={() => setUserMenuAnchor(null)}
          slotProps={{
            paper: {
              sx: {
                mt: 1.5,
                minWidth: 200,
                borderRadius: 3,
                boxShadow: "0 18px 48px rgba(18,32,28,0.12)",
                border: "1px solid rgba(23,35,31,0.08)",
              },
            },
          }}
          transformOrigin={{ horizontal: "right", vertical: "top" }}
          anchorOrigin={{ horizontal: "right", vertical: "bottom" }}
        >
          <Box sx={{ px: 2, py: 1.5, borderBottom: "1px solid rgba(23,35,31,0.08)" }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 750 }}>
              {user?.name}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {user?.email || ""}
            </Typography>
          </Box>
          <MenuItem
            onClick={() => {
              setUserMenuAnchor(null);
              setActiveTab("profile");
            }}
            sx={{ py: 1.25 }}
          >
            <SettingsIcon fontSize="small" sx={{ mr: 1.5, color: "text.secondary" }} />
            Profile Settings
          </MenuItem>
          <Tooltip title={ordersDisabledReason} placement="left">
            <span>
              <MenuItem disabled sx={{ py: 1.25 }}>
                <ShippingIcon fontSize="small" sx={{ mr: 1.5, color: "text.secondary" }} />
                My Orders
              </MenuItem>
            </span>
          </Tooltip>
          {role !== "public_user" && (
            <MenuItem
              onClick={() => {
                setUserMenuAnchor(null);
                navigate("/dashboard");
              }}
              sx={{ py: 1.25 }}
            >
              <SettingsIcon fontSize="small" sx={{ mr: 1.5, color: "text.secondary" }} />
              SaaS Console
            </MenuItem>
          )}
          <Divider />
          <MenuItem onClick={handleLogout} sx={{ color: "error.main", py: 1.25 }}>
            <Logout fontSize="small" sx={{ mr: 1.5, color: "error.main" }} />
            Sign Out
          </MenuItem>
        </Menu>
      </AppBar>

      {/* MAIN CONTAINER */}
      <Box sx={{ flexGrow: 1, pb: { xs: 6, md: 10 } }}>
        {/* TAB 1: LISTINGS VIEW */}
        {activeTab === "listings" && (
          <Box>
            {/* HERO OVERVIEW */}
            <Box
              sx={{
                py: { xs: 6, md: 8 },
                px: 2,
                textAlign: "center",
                background: "linear-gradient(135deg, rgba(15, 139, 108, 0.04) 0%, rgba(221, 170, 74, 0.04) 100%)",
                borderBottom: "1px solid rgba(23, 35, 31, 0.08)",
                mb: 4,
              }}
            >
              <Container maxWidth="md">
                <Typography
                  variant="h3"
                  color="primary.main"
                  sx={{ fontWeight: 800, letterSpacing: "-0.5px", mb: 1.5 }}
                >
                  Ethiopian Pharmaceutical Marketplace
                </Typography>
                <Typography variant="body1" color="text.secondary" sx={{ mb: 3, maxWidth: 600, mx: "auto" }}>
                  Search real-time medicine inventory, track available FEFO batches, and locate nearby pharmacies across Ethiopia.
                </Typography>
              </Container>
            </Box>

            <Container maxWidth="xl">
              {isAuthenticated && role === "pharmacy_manager" && (
                <Alert severity="info" sx={{ mb: 3, borderRadius: 2.5 }}>
                  Pharmacy managers can browse marketplace availability to find medicines across partner pharmacies. Purchasing and order tracking remain frozen until the ordering workflow is released.
                </Alert>
              )}
              <Grid container spacing={4}>
                {/* FILTER SIDEBAR (DESKTOP) */}
                <Grid size={{ xs: 12, md: 3 }} sx={{ display: { xs: "none", md: "block" } }}>
                  <Paper
                    elevation={0}
                    sx={{
                      p: 3,
                      borderRadius: 4,
                      border: "1px solid rgba(23, 35, 31, 0.08)",
                      bgcolor: "rgba(255, 255, 255, 0.8)",
                      backdropFilter: "blur(20px)",
                      position: "sticky",
                      top: TOP_BAR_HEIGHT + 24,
                    }}
                  >
                    <Typography variant="subtitle1" sx={{ fontWeight: 800, mb: 2, color: "#17231F" }}>
                      Filters & Search
                    </Typography>

                    <Stack spacing={3}>
                      {/* Search Bar */}
                      <Box>
                        <Typography variant="caption" sx={{ fontWeight: 700, color: "text.secondary", mb: 1, display: "block" }}>
                          Keywords
                        </Typography>
                        <TextField
                          fullWidth
                          size="small"
                          placeholder="Medicine, generic, etc..."
                          onChange={(e) => handleSearchChange(e.target.value)}
                          slotProps={{
                            input: {
                              startAdornment: <Search fontSize="small" sx={{ mr: 1, color: "text.secondary" }} />,
                            },
                          }}
                        />
                      </Box>

                      {/* Sort Options */}
                      <Box>
                        <Typography variant="caption" sx={{ fontWeight: 700, color: "text.secondary", mb: 1, display: "block" }}>
                          Sort Results By
                        </Typography>
                        <FormControl fullWidth size="small">
                          <Select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
                            <MenuItem value="price_asc">Price: Low to High</MenuItem>
                            <MenuItem value="price_desc">Price: High to Low</MenuItem>
                            <MenuItem value="stock_desc">Stock: High to Low</MenuItem>
                            <MenuItem value="name_asc">Name: A to Z</MenuItem>
                            <MenuItem value="distance_asc">Distance: Nearest First</MenuItem>
                          </Select>
                        </FormControl>
                      </Box>

                      {/* Geolocation Button */}
                      <Box>
                        <Typography variant="caption" sx={{ fontWeight: 700, color: "text.secondary", mb: 1, display: "block" }}>
                          Your Location
                        </Typography>
                        <Button
                          fullWidth
                          variant="outlined"
                          size="small"
                          startIcon={<MyLocation />}
                          onClick={() => {
                            navigator.geolocation.getCurrentPosition(
                              (pos) => handleLocationUpdate(pos.coords.latitude, pos.coords.longitude),
                              () => setToast({ open: true, message: "Geolocation denied by browser.", severity: "error" })
                            );
                          }}
                        >
                          Find Medicines Near Me
                        </Button>
                      </Box>

                      {/* Categories Dropdown */}
                      <Box>
                        <Typography variant="caption" sx={{ fontWeight: 700, color: "text.secondary", mb: 1, display: "block" }}>
                          Category
                        </Typography>
                        <FormControl fullWidth size="small">
                          <Select
                            value={filters.category || ""}
                            onChange={(e) => handleFilterChange({ category: e.target.value || undefined })}
                          >
                            <MenuItem value="">All Categories</MenuItem>
                            {CATEGORIES.map((cat) => (
                              <MenuItem key={cat} value={cat}>
                                {cat}
                              </MenuItem>
                            ))}
                          </Select>
                        </FormControl>
                      </Box>

                      {/* City Textfield */}
                      <Box>
                        <Typography variant="caption" sx={{ fontWeight: 700, color: "text.secondary", mb: 1, display: "block" }}>
                          City Selection
                        </Typography>
                        <TextField
                          fullWidth
                          size="small"
                          placeholder="e.g. Addis Ababa"
                          value={filters.city || ""}
                          onChange={(e) => handleFilterChange({ city: e.target.value || undefined })}
                        />
                      </Box>

                      <Divider />

                      {/* Reset Button */}
                      <Button fullWidth variant="text" size="small" onClick={handleResetFilters} sx={{ color: "text.secondary" }}>
                        Clear All Filters
                      </Button>
                    </Stack>
                  </Paper>
                </Grid>

                {/* RESULTS GRID (RIGHT COLUMN) */}
                <Grid size={{ xs: 12, md: 9 }}>
                  <Box sx={{ mb: 3, display: { xs: "block", md: "none" } }}>
                    <Box
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        gap: 1,
                        border: "1px solid rgba(23, 35, 31, 0.12)",
                        bgcolor: "rgba(255, 255, 255, 0.82)",
                        backdropFilter: "blur(16px)",
                        borderRadius: 2.5,
                        px: 1.25,
                        py: 0.75,
                      }}
                    >
                      <Search fontSize="small" sx={{ color: "text.secondary", flexShrink: 0 }} />
                      <TextField
                        fullWidth
                        variant="standard"
                        placeholder="Search medicine or pharmacy city"
                        value={filters.name || ""}
                        onChange={(e) => handleSearchChange(e.target.value)}
                        slotProps={{
                          input: {
                            disableUnderline: true,
                            sx: { fontWeight: 650 },
                          },
                        }}
                      />
                      <Tooltip title={showFiltersMobile ? "Hide filters" : "Show filters"}>
                        <IconButton
                          size="small"
                          onClick={() => setShowFiltersMobile((open) => !open)}
                          aria-label={showFiltersMobile ? "Hide marketplace filters" : "Show marketplace filters"}
                          sx={{
                            border: "1px solid rgba(15, 139, 108, 0.18)",
                            color: "primary.main",
                            bgcolor: "rgba(15, 139, 108, 0.06)",
                          }}
                        >
                          {showFiltersMobile ? <ExpandLess /> : <ExpandMore />}
                        </IconButton>
                      </Tooltip>
                    </Box>

                    <Collapse in={showFiltersMobile} timeout="auto" unmountOnExit>
                      <Box
                        sx={{
                          mt: 1.25,
                          p: 2.25,
                          border: "1px solid rgba(23, 35, 31, 0.1)",
                          borderTop: "3px solid rgba(15, 139, 108, 0.32)",
                          bgcolor: "rgba(255, 255, 255, 0.9)",
                          backdropFilter: "blur(18px)",
                          borderRadius: 2.5,
                        }}
                      >
                        <Stack spacing={2.5}>
                          <Box>
                            <Typography variant="caption" sx={{ fontWeight: 700, color: "text.secondary", mb: 1, display: "block" }}>
                              Sort Results By
                            </Typography>
                            <FormControl fullWidth size="small">
                              <Select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
                                <MenuItem value="price_asc">Price: Low to High</MenuItem>
                                <MenuItem value="price_desc">Price: High to Low</MenuItem>
                                <MenuItem value="stock_desc">Stock: High to Low</MenuItem>
                                <MenuItem value="name_asc">Name: A to Z</MenuItem>
                                <MenuItem value="distance_asc">Distance: Nearest First</MenuItem>
                              </Select>
                            </FormControl>
                          </Box>

                          <Box>
                            <Typography variant="caption" sx={{ fontWeight: 700, color: "text.secondary", mb: 1, display: "block" }}>
                              Your Location
                            </Typography>
                            <Button
                              fullWidth
                              variant="outlined"
                              size="small"
                              startIcon={<MyLocation />}
                              onClick={() => {
                                navigator.geolocation.getCurrentPosition(
                                  (pos) => handleLocationUpdate(pos.coords.latitude, pos.coords.longitude),
                                  () => setToast({ open: true, message: "Geolocation denied by browser.", severity: "error" })
                                );
                              }}
                            >
                              Find Medicines Near Me
                            </Button>
                          </Box>

                          <Box>
                            <Typography variant="caption" sx={{ fontWeight: 700, color: "text.secondary", mb: 1, display: "block" }}>
                              Category
                            </Typography>
                            <FormControl fullWidth size="small">
                              <Select
                                value={filters.category || ""}
                                onChange={(e) => handleFilterChange({ category: e.target.value || undefined })}
                              >
                                <MenuItem value="">All Categories</MenuItem>
                                {CATEGORIES.map((cat) => (
                                  <MenuItem key={cat} value={cat}>
                                    {cat}
                                  </MenuItem>
                                ))}
                              </Select>
                            </FormControl>
                          </Box>

                          <Box>
                            <Typography variant="caption" sx={{ fontWeight: 700, color: "text.secondary", mb: 1, display: "block" }}>
                              City Selection
                            </Typography>
                            <TextField
                              fullWidth
                              size="small"
                              placeholder="e.g. Addis Ababa"
                              value={filters.city || ""}
                              onChange={(e) => handleFilterChange({ city: e.target.value || undefined })}
                            />
                          </Box>

                          <Divider />

                          <Button fullWidth variant="text" size="small" onClick={handleResetFilters} sx={{ color: "text.secondary" }}>
                            Clear All Filters
                          </Button>
                        </Stack>
                      </Box>
                    </Collapse>
                  </Box>

                  {/* Filter Status */}
                  <Stack direction="row" spacing={1} sx={{ mb: 2, flexWrap: "wrap" }}>
                    {filters.category && (
                      <Chip
                        label={`Category: ${filters.category}`}
                        size="small"
                        onDelete={() => handleFilterChange({ category: undefined })}
                      />
                    )}
                    {filters.city && (
                      <Chip
                        label={`City: ${filters.city}`}
                        size="small"
                        onDelete={() => handleFilterChange({ city: undefined })}
                      />
                    )}
                    {filters.name && (
                      <Chip
                        label={`Keywords: ${filters.name}`}
                        size="small"
                        onDelete={() => handleFilterChange({ name: undefined })}
                      />
                    )}
                  </Stack>

                  <SearchResultsGrid
                    results={sortedResults}
                    loading={loading}
                    error={error}
                    searchQuery={filters.name || filters.category || filters.city || ""}
                    onViewDetails={handleViewDetails}
                    onGetDirections={handleGetDirections}
                    onReset={handleResetFilters}
                    onRetry={retry}
                    onLoadMore={loadMore}
                    hasMore={pagination.page < pagination.totalPages}
                    totalResults={pagination.total}
                  />
                </Grid>
              </Grid>
            </Container>
          </Box>
        )}

        {/* TAB 2: MY ORDERS & TRACKING */}
        {activeTab === "orders" && isAuthenticated && (
          <Container maxWidth="lg" sx={{ pt: 4 }}>
            <Typography variant="h4" sx={{ fontWeight: 800, mb: 1, color: "primary.main" }}>
              My Orders & Requests
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 4 }}>
              Track medicine reservations and order histories placed with local pharmacies.
            </Typography>

            {!ORDER_SYSTEM_ENABLED ? (
              <Box
                sx={{
                  py: 8,
                  px: 3,
                  textAlign: "center",
                  border: "1px solid rgba(23, 35, 31, 0.08)",
                  borderRadius: 3,
                  bgcolor: "rgba(255, 255, 255, 0.78)",
                }}
              >
                <ShippingIcon sx={{ fontSize: 42, color: "text.secondary", opacity: 0.45, mb: 1.5 }} />
                <Typography variant="h6" sx={{ fontWeight: 800, color: "#17231F" }}>
                  Orders are not available yet
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1, maxWidth: 520, mx: "auto" }}>
                  Marketplace ordering and request tracking are frozen while the fulfillment workflow is being prepared.
                </Typography>
                <Button variant="contained" sx={{ mt: 3 }} onClick={() => setActiveTab("listings")}>
                  Browse Marketplace
                </Button>
              </Box>
            ) : ordersLoading && orders.length === 0 ? (
              <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
                <CircularProgress />
              </Box>
            ) : ordersError ? (
              <Alert severity="error" sx={{ mb: 4, borderRadius: 2 }}>
                {ordersError}
              </Alert>
            ) : orders.length === 0 ? (
              <Box sx={{ py: 8, textAlign: "center" }}>
                <Typography color="text.secondary">You have not placed any orders yet.</Typography>
                <Button variant="contained" sx={{ mt: 3 }} onClick={() => setActiveTab("listings")}>
                  Browse Marketplace
                </Button>
              </Box>
            ) : (
              <Stack spacing={3}>
                {orders.map((order) => {
                  const isExpanded = expandedOrderId === order._id;
                  const activeStep = ORDER_STEPS.findIndex((s) => s.key === order.status);

                  return (
                    <Card
                      key={order._id}
                      elevation={0}
                      sx={{
                        border: "1px solid rgba(23, 35, 31, 0.08)",
                        borderRadius: 4,
                        bgcolor: "white",
                        overflow: "hidden",
                        boxShadow: "0 4px 12px rgba(0,0,0,0.02)",
                      }}
                    >
                      <CardContent sx={{ p: 3 }}>
                        <Grid container spacing={2} sx={{ alignItems: "center" }}>
                          <Grid size={{ xs: 12, sm: 3 }}>
                            <Typography variant="caption" color="text.secondary" sx={{ display: "block" }}>
                              ORDER ID
                            </Typography>
                            <Typography variant="body2" sx={{ fontWeight: 700 }}>
                              {order._id.substring(0, 10)}...
                            </Typography>
                          </Grid>
                          <Grid size={{ xs: 6, sm: 2.5 }}>
                            <Typography variant="caption" color="text.secondary" sx={{ display: "block" }}>
                              DATE
                            </Typography>
                            <Typography variant="body2" sx={{ fontWeight: 600 }}>
                              {new Date(order.createdAt).toLocaleDateString()}
                            </Typography>
                          </Grid>
                          <Grid size={{ xs: 6, sm: 2.5 }}>
                            <Typography variant="caption" color="text.secondary" sx={{ display: "block" }}>
                              TOTAL PRICE
                            </Typography>
                            <Typography variant="body2" sx={{ fontWeight: 800, color: "primary.main" }}>
                              ETB {order.totalAmount.toFixed(2)}
                            </Typography>
                          </Grid>
                          <Grid size={{ xs: 6, sm: 2 }}>
                            <Chip
                              label={order.status.toUpperCase()}
                              size="small"
                              color={
                                order.status === "pending"
                                  ? "warning"
                                  : order.status === "approved"
                                    ? "info"
                                    : order.status === "processing"
                                      ? "primary"
                                      : order.status === "ready"
                                        ? "success"
                                        : order.status === "delivered"
                                          ? "success"
                                          : "error"
                              }
                              sx={{ fontWeight: 800, height: 22 }}
                            />
                          </Grid>
                          <Grid size={{ xs: 6, sm: 2 }} sx={{ textAlign: "right" }}>
                            <Button
                              variant="outlined"
                              size="small"
                              onClick={() => setExpandedOrderId(isExpanded ? null : order._id)}
                            >
                              {isExpanded ? "Hide Details" : "Track Order"}
                            </Button>
                          </Grid>
                        </Grid>

                        {/* Order timeline and item list (Expanded state) */}
                        {isExpanded && (
                          <Box sx={{ mt: 4, pt: 3, borderTop: "1px solid rgba(23,35,31,0.08)" }}>
                            <Typography variant="subtitle2" sx={{ fontWeight: 800, mb: 3 }}>
                              Fulfillment Tracking Timeline
                            </Typography>

                            {order.status === "rejected" ? (
                              <Alert severity="error" sx={{ mb: 4, borderRadius: 2 }}>
                                Order was rejected by the pharmacy. Reason: {order.rejectionReason || "Inventory discrepancy."}
                              </Alert>
                            ) : (
                              <Box sx={{ width: "100%", mb: 4, overflowX: "auto" }}>
                                <Stepper activeStep={activeStep} alternativeLabel sx={{ minWidth: 500 }}>
                                  {ORDER_STEPS.map((step) => (
                                    <Step key={step.label}>
                                      <StepLabel>{step.label}</StepLabel>
                                    </Step>
                                  ))}
                                </Stepper>
                              </Box>
                            )}

                            <Typography variant="subtitle2" sx={{ fontWeight: 800, mb: 1.5 }}>
                              Items Reserved
                            </Typography>
                            <List disablePadding>
                              {order.items.map((item: IOrderItem) => (
                                <ListItem
                                  key={item.medicineId}
                                  sx={{
                                    px: 2,
                                    py: 1.5,
                                    mb: 1,
                                    borderRadius: 2,
                                    bgcolor: "#F7FAF9",
                                    border: "1px solid rgba(23,35,31,0.04)",
                                  }}
                                >
                                  <ListItemText
                                    primary={
                                      <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                                        {item.medicineName || "Medicine listing"}
                                      </Typography>
                                    }
                                    secondary={
                                      <Typography variant="caption" color="text.secondary">
                                        Qty: {item.quantity} | Price: ETB {item.unitPrice.toFixed(2)} each
                                      </Typography>
                                    }
                                  />
                                  <Typography variant="subtitle2" sx={{ fontWeight: 800, color: "text.primary" }}>
                                    ETB {item.lineTotal.toFixed(2)}
                                  </Typography>
                                </ListItem>
                              ))}
                            </List>

                            {/* Pharmacy contact & fulfillment notes */}
                            <Box sx={{ mt: 3, p: 2, borderRadius: 2.5, bgcolor: "rgba(221,170,74,0.08)", border: "1px solid rgba(221,170,74,0.18)" }}>
                              <Typography variant="subtitle2" sx={{ fontWeight: 700, color: "secondary.dark", mb: 0.5 }}>
                                Pharmacy Fulfillment Details
                              </Typography>
                              <Typography variant="body2" color="text.secondary">
                                Method: <strong>{order.fulfillmentMethod.toUpperCase()}</strong>
                              </Typography>
                              {order.fulfillmentMethod === "delivery" && order.deliveryAddress && (
                                <Typography variant="body2" color="text.secondary">
                                  Delivery Address: {order.deliveryAddress}
                                </Typography>
                              )}
                              {order.pharmacyId && (
                                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                                  Need assistance? Contact {order.pharmacyId.name}
                                  {order.pharmacyId.phoneNumber ? ` at ${order.pharmacyId.phoneNumber}` : ""}.
                                </Typography>
                              )}
                            </Box>
                          </Box>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </Stack>
            )}
          </Container>
        )}

        {/* TAB 3: USER PROFILE MANAGEMENT */}
        {activeTab === "profile" && isAuthenticated && (
          <Container maxWidth="lg" sx={{ pt: 4 }}>
            <Typography variant="h4" sx={{ fontWeight: 800, mb: 1, color: "primary.main" }}>
              My Profile Settings
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 4 }}>
              Update your contact info, street address, profile photo, and password credentials.
            </Typography>

            {profileLoading ? (
              <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
                <CircularProgress />
              </Box>
            ) : profileError ? (
              <Alert severity="error" sx={{ mb: 4, borderRadius: 2 }}>
                {profileError}
              </Alert>
            ) : profile ? (
              <>
                <ProfileHeader profile={profile} sx={{ mb: 4 }} />
                <Grid container spacing={4}>
                  <Grid size={{ xs: 12, md: 8 }}>
                    <Stack spacing={4}>
                      <ProfileForm profile={profile} onSuccess={refreshAccountState} />
                      <PasswordChangeForm onSuccess={refreshAccountState} />
                    </Stack>
                  </Grid>

                  <Grid size={{ xs: 12, md: 4 }}>
                    <Stack spacing={4}>
                      <ProfilePictureUpload
                        currentUser={profile}
                        onUploadSuccess={refreshAccountState}
                        onRemoveSuccess={refreshAccountState}
                      />
                      <AccountSettingsCard
                        profile={profile}
                        onDeactivate={handleDeactivate}
                      />
                    </Stack>
                  </Grid>
                </Grid>
              </>
            ) : (
              <Alert severity="warning">Profile data not available.</Alert>
            )}
          </Container>
        )}
      </Box>

      {/* MEDICINE DETAILS MODAL DIALOG */}
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
              {selectedMedicine?.name || "Medicine Details"}
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
                  Generic Name
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
                  <Typography variant="h6" color="#0F5E4D" sx={{ fontWeight: 800 }}>
                    ETB {selectedMedicine.unitPrice.toFixed(2)}
                    <Typography component="span" variant="caption" sx={{ ml: 0.5 }}>
                      / {selectedMedicine.unitOfMeasure}
                    </Typography>
                  </Typography>
                </Box>
                <Box sx={{ flex: 1 }}>
                  <Typography variant="body2" color="text.secondary">
                    Pharmacy Partner
                  </Typography>
                  <Typography variant="body1" sx={{ fontWeight: 700 }}>
                    {selectedMedicine.pharmacyName}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {selectedMedicine.pharmacyAddress || selectedMedicine.pharmacyCity}
                  </Typography>
                </Box>
              </Stack>

              <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
                <TextField
                  label="Quantity"
                  type="number"
                  size="small"
                  value={orderQuantity}
                  onChange={(e) => setOrderQuantity(Number(e.target.value) || 1)}
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
                    onChange={(e) => setFulfillmentMethod(e.target.value as "pickup" | "delivery")}
                  >
                    <MenuItem value="pickup">Pickup</MenuItem>
                    <MenuItem value="delivery">Delivery</MenuItem>
                  </Select>
                </FormControl>
              </Stack>

              {fulfillmentMethod === "delivery" && (
                <TextField
                  label="Delivery Address"
                  size="small"
                  value={deliveryAddress}
                  onChange={(e) => setDeliveryAddress(e.target.value)}
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
                <Typography variant="body2" sx={{ fontWeight: 750 }}>
                  Estimated Total
                </Typography>
                <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>
                  ETB {lineTotal.toFixed(2)}
                </Typography>
              </Box>

              {/* DEMONSTRATIVE ERROR / STATUS ALERTS */}
              {!ORDER_SYSTEM_ENABLED && (
                <Alert severity="info" sx={{ borderRadius: 2 }}>
                  The B2B Ordering system is offline for system maintenance. You can view pharmacy details or get directions.
                </Alert>
              )}
              {ORDER_SYSTEM_ENABLED && !isAuthenticated && (
                <Alert severity="warning" sx={{ borderRadius: 2 }}>
                  You are browsing as a guest. Please log in to complete checkout or add items to your cart.
                </Alert>
              )}
              {ORDER_SYSTEM_ENABLED && isAuthenticated && role !== "public_user" && (
                <Alert severity="warning" sx={{ borderRadius: 2 }}>
                  Only consumer accounts (Public Users) can purchase items from this marketplace. Currently logged in as <strong>{role?.replace("_", " ")}</strong>.
                </Alert>
              )}
              {ORDER_SYSTEM_ENABLED && isAuthenticated && role === "public_user" && selectedMedicine.totalStock === 0 && (
                <Alert severity="error" sx={{ borderRadius: 2 }}>
                  This listing is currently out of stock.
                </Alert>
              )}
            </Stack>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button onClick={() => setDetailsOpen(false)}>Close</Button>
          {selectedMedicine?.pharmacyLocation && (
            <Button
              variant="outlined"
              onClick={() =>
                handleGetDirections(selectedMedicine.pharmacyLocation, selectedMedicine.pharmacyName)
              }
            >
              Directions
            </Button>
          )}

          {/* ADD TO CART ACTION WITH DISABLED REASON TOOLTIP */}
          <Tooltip
            title={
              !ORDER_SYSTEM_ENABLED
                ? "Ordering is offline for maintenance"
                : selectedMedicine && selectedMedicine.totalStock === 0
                  ? "Out of Stock"
                  : "Add this item to your reservation cart"
            }
          >
            <span>
              <Button
                variant="outlined"
                onClick={handleAddToCart}
                disabled={!ORDER_SYSTEM_ENABLED || !selectedMedicine || selectedMedicine.totalStock === 0}
              >
                Add to Cart
              </Button>
            </span>
          </Tooltip>

          {/* BUY NOW ACTION WITH DISABLED REASON TOOLTIP */}
          <Tooltip
            title={
              !ORDER_SYSTEM_ENABLED
                ? "Ordering is offline for maintenance"
                : !isAuthenticated
                  ? "Login required to checkout"
                  : role !== "public_user"
                    ? "Only Public Users can purchase"
                    : selectedMedicine && selectedMedicine.totalStock === 0
                      ? "Out of Stock"
                      : "Instantly buy this medicine"
            }
          >
            <span>
              <Button
                variant="contained"
                onClick={handlePlaceOrder}
                disabled={
                  !ORDER_SYSTEM_ENABLED ||
                  submittingOrder ||
                  !selectedMedicine ||
                  !isAuthenticated ||
                  role !== "public_user" ||
                  selectedMedicine.totalStock === 0
                }
              >
                {!ORDER_SYSTEM_ENABLED
                  ? "Ordering Unavailable"
                  : submittingOrder
                    ? "Placing..."
                    : "Buy Now"}
              </Button>
            </span>
          </Tooltip>
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

      <Snackbar
        open={!!accountNotice}
        autoHideDuration={7000}
        onClose={() => setAccountNotice(null)}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert
          severity="success"
          variant="filled"
          onClose={() => setAccountNotice(null)}
          sx={{ width: "100%" }}
        >
          {accountNotice}
        </Alert>
      </Snackbar>

      <MarketplaceFloatingUtilities />

      {/* FOOTER */}
      <Footer />
    </Box>
  );
};
