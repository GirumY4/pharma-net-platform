import {
  Add as AddIcon,
  LocalMall as CartIcon,
  Close as CloseIcon,
  DeleteOutlined as DeleteIcon,
  Phone as PhoneIcon,
  Remove as RemoveIcon,
  MyLocation as TrackerIcon,
  NotificationsNone as NotificationsIcon,
} from "@mui/icons-material";
import {
  Alert,
  Badge,
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogContent,
  DialogTitle,
  Divider,
  Drawer,
  Fab,
  IconButton,
  Snackbar,
  Stack,
  Step,
  StepLabel,
  Stepper,
  TextField,
  Typography,
  Zoom,
} from "@mui/material";
import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../../contexts/useAuth";
import { fetchOrderById, fetchOrders } from "../../orders/services/ordersApi";
import type { IOrder, OrderStatus } from "../../orders/types";
import { createMarketplaceOrder } from "../services/marketplaceApi";
import {
  type AppNotification,
  deleteNotification,
  fetchNotifications,
  markAllNotificationsAsRead,
  markNotificationAsRead,
} from "../../../services/notificationApi";

export interface CartItem {
  medicineId: string;
  name: string;
  pharmacyId: string; // Added for real checkout
  pharmacyName: string;
  unitPrice: number;
  unitOfMeasure: string;
  quantity: number;
  maxQuantity: number;
  pharmacyPhone?: string;
}

const ORDER_STEPS: { label: string; key: OrderStatus }[] = [
  { label: "Pending", key: "pending" },
  { label: "Approved", key: "approved" },
  { label: "Processing", key: "processing" },
  { label: "Ready", key: "ready" },
];

const isUnauthorizedNotificationError = (err: unknown) =>
  typeof err === "object" &&
  err !== null &&
  (("status" in err && err.status === 401) ||
    ("code" in err && err.code === "UNAUTHORIZED"));

type ErrorWithResponse = {
  response?: {
    data?: {
      message?: string;
      error?: {
        message?: string;
      };
    };
  };
};

const hasResponse = (err: unknown): err is ErrorWithResponse =>
  typeof err === "object" && err !== null && "response" in err;

const getErrorMessage = (err: unknown, fallback: string) => {
  if (hasResponse(err)) {
    return err.response?.data?.message || err.response?.data?.error?.message || fallback;
  }

  return err instanceof Error && err.message ? err.message : fallback;
};

export const MarketplaceFloatingUtilities = () => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  // Floating Actions visibility
  const [showFabs, setShowFabs] = useState(false);

  // Notifications State
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  // Cart State
  const [cartOpen, setCartOpen] = useState(false);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);

  // Tracker State
  const [trackerOpen, setTrackerOpen] = useState(false);
  const [trackerId, setTrackerId] = useState("");
  const [trackerLoading, setTrackerLoading] = useState(false);
  const [trackedOrder, setTrackedOrder] = useState<IOrder | null>(null);
  const [recentOrders, setRecentOrders] = useState<IOrder[]>([]);
  const [trackerError, setTrackerError] = useState("");
  const [checkoutLoading, setCheckoutLoading] = useState(false);

  // Toast State
  const [toast, setToast] = useState<{
    open: boolean;
    message: string;
    severity: "success" | "error" | "info" | "warning";
  }>({ open: false, message: "", severity: "success" });

  // Appearance Logic: Scroll delay + helpful assistant vibe
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 300) {
        setShowFabs(true);
      }
    };
    window.addEventListener("scroll", handleScroll);
    // Also show after a fallback timer if they don't scroll
    const timer = setTimeout(() => setShowFabs(true), 2500);
    return () => {
      window.removeEventListener("scroll", handleScroll);
      clearTimeout(timer);
    };
  }, []);

  // Notifications logic
  const loadNotifications = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      const data = await fetchNotifications();
      setNotifications(data);
      setUnreadCount(data.filter((n) => !n.isRead).length);
    } catch (err: unknown) {
      if (!isUnauthorizedNotificationError(err)) {
        console.error("Failed to load notifications", err);
      }
    }
  }, [isAuthenticated]);

  useEffect(() => {
    const initialLoad = window.setTimeout(() => {
      void loadNotifications();
    }, 0);
    const interval = window.setInterval(() => {
      void loadNotifications();
    }, 30000); // Poll every 30s
    return () => {
      window.clearTimeout(initialLoad);
      window.clearInterval(interval);
    };
  }, [loadNotifications]);

  const handleNotificationClick = async (id: string, link?: string) => {
    try {
      await markNotificationAsRead(id);
      await loadNotifications();
      if (link) {
        setNotificationsOpen(false);
        navigate(link);
      }
    } catch (err) {
      console.error("Failed to mark as read", err);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await markAllNotificationsAsRead();
      loadNotifications();
    } catch (err) {
      console.error("Failed to mark all as read", err);
    }
  };

  const handleDeleteNotif = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await deleteNotification(id);
      loadNotifications();
    } catch (err) {
      console.error("Failed to delete notification", err);
    }
  };

  // Load cart from local storage
  const loadCart = useCallback(() => {
    const saved = localStorage.getItem("pharma_net_cart");
    if (saved) {
      try {
        setCartItems(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to parse cart items", e);
      }
    }
  }, []);

  useEffect(() => {
    loadCart();
    window.addEventListener("cart_updated", loadCart);
    return () => window.removeEventListener("cart_updated", loadCart);
  }, [loadCart]);

  // Save cart to local storage whenever it changes
  useEffect(() => {
    localStorage.setItem("pharma_net_cart", JSON.stringify(cartItems));
  }, [cartItems]);

  const handleUpdateQuantity = (medicineId: string, delta: number) => {
    setCartItems((prev) =>
      prev.map((item) => {
        if (item.medicineId === medicineId) {
          const newQ = Math.max(
            1,
            Math.min(item.quantity + delta, item.maxQuantity),
          );
          return { ...item, quantity: newQ };
        }
        return item;
      }),
    );
  };

  const handleRemoveItem = (medicineId: string) => {
    setCartItems((prev) =>
      prev.filter((item) => item.medicineId !== medicineId),
    );
  };

  const handleClearCart = () => {
    setCartItems([]);
    setToast({
      open: true,
      message: "Cart cleared successfully.",
      severity: "info",
    });
  };

  const handleCheckout = async () => {
    if (!isAuthenticated) {
      setCartOpen(false);
      navigate("/login", {
        state: { from: { pathname: "/marketplace" } },
      });
      return;
    }

    // Group items by pharmacy
    const groups: Record<string, CartItem[]> = {};
    cartItems.forEach((item) => {
      if (!groups[item.pharmacyId]) groups[item.pharmacyId] = [];
      groups[item.pharmacyId].push(item);
    });

    setCheckoutLoading(true);
    let successCount = 0;
    const errors: string[] = [];

    try {
      // We process checkouts sequentially for simplicity, or Promise.all for speed
      for (const pharmacyId of Object.keys(groups)) {
        try {
          const items = groups[pharmacyId].map((item) => ({
            medicineId: item.medicineId,
            quantity: item.quantity,
          }));

          await createMarketplaceOrder({
            pharmacyId,
            items,
            fulfillmentMethod: "pickup", // Defaulting to pickup for bulk checkout
          });
          successCount++;
        } catch (err: unknown) {
          errors.push(
            getErrorMessage(err, `Failed for pharmacy ${pharmacyId}`),
          );
        }
      }

      if (successCount > 0) {
        setCartItems([]);
        setCartOpen(false);
        setToast({
          open: true,
          message: `Successfully placed ${successCount} order(s). Check tracker for updates!`,
          severity: "success",
        });
        // Trigger tracker update
        loadRecentOrders();
      }

      if (errors.length > 0) {
        setToast({
          open: true,
          message: `Some orders failed: ${errors.join(", ")}`,
          severity: "error",
        });
      }
    } catch {
      setToast({
        open: true,
        message: "An unexpected error occurred during checkout.",
        severity: "error",
      });
    } finally {
      setCheckoutLoading(false);
    }
  };

  const handleTrackOrder = async (id?: string) => {
    const targetId = id || trackerId.trim();
    if (!targetId) {
      setTrackerError("Please enter an Order ID.");
      return;
    }
    setTrackerError("");
    setTrackerLoading(true);
    setTrackedOrder(null);
    try {
      const order = await fetchOrderById(targetId);
      setTrackedOrder(order);
      setTrackerId(targetId);
    } catch (err: unknown) {
      setTrackerError(
        getErrorMessage(err, "Order not found or access denied."),
      );
    } finally {
      setTrackerLoading(false);
    }
  };

  const loadRecentOrders = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      const response = await fetchOrders({ limit: 5 });
      setRecentOrders(response.data);
    } catch (err) {
      console.error("Failed to fetch recent orders", err);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (trackerOpen && isAuthenticated) {
      loadRecentOrders();
    }
  }, [trackerOpen, isAuthenticated, loadRecentOrders]);

  const totalCartValue = cartItems.reduce(
    (acc, item) => acc + item.unitPrice * item.quantity,
    0,
  );
  const totalItemsCount = cartItems.reduce(
    (acc, item) => acc + item.quantity,
    0,
  );

  const getActiveStep = (status: OrderStatus) => {
    if (status === "delivered") return 4;
    if (status === "rejected") return -1;
    return ORDER_STEPS.findIndex((s) => s.key === status);
  };

  return (
    <>
      {/* Floating Action Buttons Hub */}
      <Stack
        spacing={2}
        sx={{
          position: "fixed",
          bottom: { xs: 24, md: 40 },
          right: { xs: 24, md: 40 },
          zIndex: 1000,
        }}
      >
        <Zoom
          in={showFabs}
          style={{ transitionDelay: showFabs ? "100ms" : "0ms" }}
        >
          <Fab
            aria-label="tracker"
            onClick={() => setTrackerOpen(true)}
            sx={{
              bgcolor: "rgba(255, 255, 255, 0.7)",
              backdropFilter: "blur(12px)",
              border: "1px solid #0F8B6C",
              boxShadow: "0 8px 32px rgba(15, 139, 108, 0.2)",
              color: "#0F8B6C",
              "&:hover": {
                bgcolor: "rgba(255, 255, 255, 0.9)",
              },
            }}
          >
            <TrackerIcon />
          </Fab>
        </Zoom>

        {isAuthenticated && (
          <Zoom
            in={showFabs}
            style={{ transitionDelay: showFabs ? "150ms" : "0ms" }}
          >
            <Fab
              aria-label="notifications"
              onClick={() => {
                setNotificationsOpen(true);
                loadNotifications();
              }}
              sx={{
                bgcolor: "rgba(255, 255, 255, 0.75)",
                backdropFilter: "blur(12px)",
                border: "1px solid #3B82F6",
                boxShadow: "0 8px 32px rgba(59, 130, 246, 0.25)",
                color: "#3B82F6",
                transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                "&:hover": {
                  bgcolor: "rgba(255, 255, 255, 0.95)",
                  transform: "translateY(-4px)",
                },
              }}
            >
              <Badge
                badgeContent={unreadCount}
                color="error"
                sx={{ "& .MuiBadge-badge": { fontWeight: 700 } }}
              >
                <NotificationsIcon />
              </Badge>
            </Fab>
          </Zoom>
        )}

        <Zoom
          in={showFabs}
          style={{ transitionDelay: showFabs ? "200ms" : "0ms" }}
        >
          <Fab
            aria-label="cart"
            onClick={() => setCartOpen(true)}
            sx={{
              bgcolor: "rgba(255, 255, 255, 0.75)",
              backdropFilter: "blur(12px)",
              border: "1px solid #DDAA4A",
              boxShadow: "0 8px 32px rgba(221, 170, 74, 0.25)",
              color: "#DDAA4A",
              transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
              "&:hover": {
                bgcolor: "rgba(255, 255, 255, 0.95)",
                transform: "translateY(-4px)",
              },
            }}
          >
            <Badge
              badgeContent={totalItemsCount}
              color="warning"
              sx={{ "& .MuiBadge-badge": { fontWeight: 700 } }}
            >
              <CartIcon />
            </Badge>
          </Fab>
        </Zoom>
      </Stack>

      {/* The Sliding Cart Drawer */}
      <Drawer
        anchor="right"
        open={cartOpen}
        onClose={() => setCartOpen(false)}
        slotProps={{
          paper: {
            sx: {
              width: { xs: "100%", sm: 400 },
              p: 3,
              bgcolor: "rgba(255, 255, 255, 0.95)",
              backdropFilter: "blur(20px)",
            },
          },
        }}
      >
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            mb: 1,
          }}
        >
          <Typography
            variant="h5"
            sx={{ fontWeight: 900, color: "#17231F", letterSpacing: "-0.02em" }}
          >
            Cart Hub
          </Typography>
          <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
            {cartItems.length > 0 && (
              <Button
                size="small"
                color="inherit"
                onClick={handleClearCart}
                sx={{ opacity: 0.6, fontSize: "0.75rem", fontWeight: 700 }}
              >
                Clear All
              </Button>
            )}
            <IconButton
              onClick={() => setCartOpen(false)}
              sx={{ bgcolor: "rgba(0,0,0,0.04)" }}
            >
              <CloseIcon />
            </IconButton>
          </Stack>
        </Box>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          {totalItemsCount} items saved for checkout
        </Typography>
        <Divider sx={{ mb: 2 }} />

        {cartItems.length === 0 ? (
          <Box
            sx={{
              flex: 1,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Typography color="text.secondary">Your cart is empty.</Typography>
          </Box>
        ) : (
          <Stack spacing={3} sx={{ flex: 1, overflowY: "auto" }}>
            {cartItems.map((item) => (
              <Box
                key={item.medicineId}
                sx={{
                  display: "flex",
                  gap: 2,
                  p: 2,
                  bgcolor: "white",
                  borderRadius: 3,
                  boxShadow: "0 4px 12px rgba(0,0,0,0.04)",
                  border: "1px solid rgba(23, 35, 31, 0.05)",
                }}
              >
                <Box
                  sx={{
                    width: 64,
                    height: 64,
                    borderRadius: 2,
                    bgcolor: "rgba(15, 139, 108, 0.08)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <CartIcon sx={{ color: "#0F8B6C", opacity: 0.5 }} />
                </Box>
                <Box sx={{ flex: 1 }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                    {item.name}
                  </Typography>
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{ display: "block" }}
                  >
                    {item.pharmacyName}
                  </Typography>
                  <Typography
                    variant="subtitle2"
                    color="#0F8B6C"
                    sx={{ fontWeight: 800, mt: 0.5 }}
                  >
                    ETB {(item.unitPrice * item.quantity).toFixed(2)}
                  </Typography>

                  <Stack
                    direction="row"
                    sx={{
                      mt: 1,
                      alignItems: "center",
                      justifyContent: "space-between",
                    }}
                  >
                    <Box
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        gap: 1,
                        bgcolor: "#F7FAF9",
                        borderRadius: 2,
                        p: 0.5,
                      }}
                    >
                      <IconButton
                        size="small"
                        onClick={() =>
                          handleUpdateQuantity(item.medicineId, -1)
                        }
                      >
                        <RemoveIcon fontSize="small" />
                      </IconButton>
                      <Typography
                        variant="body2"
                        sx={{
                          fontWeight: 600,
                          minWidth: 20,
                          textAlign: "center",
                        }}
                      >
                        {item.quantity}
                      </Typography>
                      <IconButton
                        size="small"
                        onClick={() => handleUpdateQuantity(item.medicineId, 1)}
                      >
                        <AddIcon fontSize="small" />
                      </IconButton>
                    </Box>
                    <IconButton
                      size="small"
                      color="error"
                      onClick={() => handleRemoveItem(item.medicineId)}
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </Stack>
                </Box>
              </Box>
            ))}
          </Stack>
        )}

        {cartItems.length > 0 && (
          <Box sx={{ mt: "auto", pt: 3 }}>
            <Box
              sx={{
                p: 2,
                mb: 2,
                borderRadius: 3,
                bgcolor: "rgba(15, 139, 108, 0.05)",
                border: "1px dashed rgba(15, 139, 108, 0.2)",
              }}
            >
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  mb: 0.5,
                }}
              >
                <Typography variant="body2" color="text.secondary">
                  Subtotal
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                  ETB {totalCartValue.toFixed(2)}
                </Typography>
              </Box>
              <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                  Total
                </Typography>
                <Typography
                  variant="h6"
                  sx={{ fontWeight: 900, color: "#0F8B6C" }}
                >
                  ETB {totalCartValue.toFixed(2)}
                </Typography>
              </Box>
            </Box>
            <Button
              variant="contained"
              fullWidth
              size="large"
              disabled={checkoutLoading}
              sx={{
                bgcolor: "#0F8B6C",
                "&:hover": { bgcolor: "#0B6D55" },
                borderRadius: 3,
                py: 2,
                fontWeight: 800,
                boxShadow: "0 12px 32px rgba(15, 139, 108, 0.3)",
                textTransform: "none",
                fontSize: "1rem",
              }}
              onClick={handleCheckout}
            >
              {checkoutLoading ? (
                <CircularProgress size={24} color="inherit" />
              ) : isAuthenticated ? (
                "Checkout & Reserve"
              ) : (
                "Login to Checkout"
              )}
            </Button>
          </Box>
        )}
      </Drawer>

      {/* Notifications Drawer */}
      <Drawer
        anchor="right"
        open={notificationsOpen}
        onClose={() => setNotificationsOpen(false)}
        slotProps={{
          paper: {
            sx: {
              width: { xs: "100%", sm: 400 },
              p: 3,
              bgcolor: "rgba(255, 255, 255, 0.95)",
              backdropFilter: "blur(20px)",
              display: "flex",
              flexDirection: "column",
            },
          },
        }}
      >
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            mb: 2,
          }}
        >
          <Typography
            variant="h5"
            sx={{ fontWeight: 900, color: "#17231F", letterSpacing: "-0.02em" }}
          >
            Notifications
          </Typography>
          <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
            {unreadCount > 0 && (
              <Button
                size="small"
                onClick={handleMarkAllRead}
                sx={{ fontSize: "0.75rem", fontWeight: 700 }}
              >
                Mark all read
              </Button>
            )}
            <IconButton
              onClick={() => setNotificationsOpen(false)}
              sx={{ bgcolor: "rgba(0,0,0,0.04)" }}
            >
              <CloseIcon />
            </IconButton>
          </Stack>
        </Box>
        <Divider sx={{ mb: 2 }} />

        {notifications.length === 0 ? (
          <Box
            sx={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <NotificationsIcon sx={{ fontSize: 48, color: "text.secondary", opacity: 0.3, mb: 2 }} />
            <Typography color="text.secondary">No notifications yet.</Typography>
          </Box>
        ) : (
          <Stack spacing={2} sx={{ flex: 1, overflowY: "auto", pr: 1 }}>
            {notifications.map((notif) => (
              <Box
                key={notif._id}
                onClick={() => handleNotificationClick(notif._id, notif.link)}
                sx={{
                  p: 2,
                  bgcolor: notif.isRead ? "white" : "rgba(59, 130, 246, 0.05)",
                  borderRadius: 3,
                  boxShadow: "0 4px 12px rgba(0,0,0,0.04)",
                  border: notif.isRead
                    ? "1px solid rgba(23, 35, 31, 0.05)"
                    : "1px solid rgba(59, 130, 246, 0.2)",
                  cursor: "pointer",
                  transition: "all 0.2s ease",
                  display: "flex",
                  gap: 2,
                  position: "relative",
                  "&:hover": {
                    bgcolor: notif.isRead ? "rgba(0,0,0,0.02)" : "rgba(59, 130, 246, 0.08)",
                  },
                }}
              >
                <Box
                  sx={{
                    width: 40,
                    height: 40,
                    borderRadius: 2,
                    bgcolor: notif.isRead ? "rgba(0,0,0,0.05)" : "rgba(59, 130, 246, 0.1)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  <NotificationsIcon
                    sx={{ color: notif.isRead ? "text.secondary" : "#3B82F6" }}
                  />
                </Box>
                <Box sx={{ flex: 1 }}>
                  <Typography
                    variant="subtitle2"
                    sx={{ fontWeight: notif.isRead ? 600 : 800, color: "text.primary" }}
                  >
                    {notif.title}
                  </Typography>
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ mb: 0.5, fontWeight: notif.isRead ? 400 : 500 }}
                  >
                    {notif.message}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {new Date(notif.createdAt).toLocaleDateString()} at{" "}
                    {new Date(notif.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </Typography>
                </Box>
                <IconButton
                  size="small"
                  onClick={(e) => handleDeleteNotif(notif._id, e)}
                  sx={{
                    position: "absolute",
                    top: 8,
                    right: 8,
                    opacity: 0,
                    ".MuiBox-root:hover > &": { opacity: 0.5 },
                    "&:hover": { opacity: "1 !important", color: "error.main" },
                  }}
                >
                  <DeleteIcon fontSize="small" />
                </IconButton>
              </Box>
            ))}
          </Stack>
        )}
      </Drawer>

      {/* The Order Status Tracker Modal */}
      <Dialog
        open={trackerOpen}
        onClose={() => setTrackerOpen(false)}
        fullWidth
        maxWidth="sm"
        slotProps={{
          paper: {
            sx: {
              borderRadius: 4,
              bgcolor: "rgba(255, 255, 255, 0.95)",
              backdropFilter: "blur(20px)",
              boxShadow: "0 24px 64px rgba(0,0,0,0.12)",
            },
          },
        }}
      >
        <DialogTitle
          sx={{
            pb: 1,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <Typography variant="h6" sx={{ fontWeight: 800 }}>
            Order Tracker
          </Typography>
          <IconButton onClick={() => setTrackerOpen(false)} size="small">
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          {!isAuthenticated ? (
            <Box sx={{ textAlign: "center", py: 4 }}>
              <TrackerIcon
                sx={{
                  fontSize: 48,
                  color: "text.secondary",
                  mb: 2,
                  opacity: 0.5,
                }}
              />
              <Typography variant="h6" gutterBottom>
                Login Required
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Please log in to track your marketplace requests and view recent
                orders.
              </Typography>
              <Button
                variant="contained"
                onClick={() => {
                  setTrackerOpen(false);
                  navigate("/login", {
                    state: { from: { pathname: "/marketplace" } },
                  });
                }}
              >
                Log In
              </Button>
            </Box>
          ) : (
            <Stack spacing={3} sx={{ pt: 1 }}>
              <Box>
                <Typography
                  variant="subtitle2"
                  gutterBottom
                  sx={{ fontWeight: 700 }}
                >
                  Track by Order ID
                </Typography>
                <Box sx={{ display: "flex", gap: 2 }}>
                  <TextField
                    fullWidth
                    size="small"
                    placeholder="e.g. 6643..."
                    value={trackerId}
                    onChange={(e) => setTrackerId(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleTrackOrder()}
                    sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2 } }}
                  />
                  <Button
                    variant="contained"
                    onClick={() => handleTrackOrder()}
                    disabled={trackerLoading}
                    sx={{ minWidth: 100, borderRadius: 2, bgcolor: "#17231F" }}
                  >
                    {trackerLoading ? (
                      <CircularProgress size={20} color="inherit" />
                    ) : (
                      "Track"
                    )}
                  </Button>
                </Box>
              </Box>

              {trackerError && (
                <Alert severity="error" sx={{ borderRadius: 2 }}>
                  {trackerError}
                </Alert>
              )}

              {!trackedOrder && recentOrders.length > 0 && (
                <Box>
                  <Typography
                    variant="subtitle2"
                    gutterBottom
                    sx={{ fontWeight: 700, mt: 1 }}
                  >
                    Recent Marketplace Requests
                  </Typography>
                  <Stack spacing={1.5}>
                    {recentOrders.map((order) => (
                      <Box
                        key={order._id}
                        onClick={() => handleTrackOrder(order._id)}
                        sx={{
                          p: 2,
                          borderRadius: 2,
                          border: "1px solid rgba(0,0,0,0.06)",
                          cursor: "pointer",
                          transition: "all 0.2s",
                          "&:hover": {
                            bgcolor: "rgba(15, 139, 108, 0.04)",
                            borderColor: "#0F8B6C",
                          },
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                        }}
                      >
                        <Box>
                          <Typography variant="body2" sx={{ fontWeight: 700 }}>
                            {order.pharmacyId.name}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            ID: {order._id.substring(0, 8).toUpperCase()} •{" "}
                            {new Date(order.createdAt).toLocaleDateString()}
                          </Typography>
                        </Box>
                        <Badge
                          badgeContent={
                            order.status.charAt(0).toUpperCase() +
                            order.status.slice(1)
                          }
                          sx={{
                            "& .MuiBadge-badge": {
                              position: "static",
                              transform: "none",
                              bgcolor:
                                order.status === "pending"
                                  ? "#FEF3C7"
                                  : "#D1FAE5",
                              color:
                                order.status === "pending"
                                  ? "#D97706"
                                  : "#059669",
                              fontWeight: 700,
                              fontSize: "0.65rem",
                              px: 1,
                              height: 20,
                              borderRadius: 1,
                            },
                          }}
                        />
                      </Box>
                    ))}
                  </Stack>
                </Box>
              )}

              {trackedOrder && (
                <Box
                  sx={{
                    p: 3,
                    borderRadius: 3,
                    bgcolor: "white",
                    border: "1px solid rgba(0,0,0,0.08)",
                  }}
                >
                  <Typography
                    variant="subtitle2"
                    color="text.secondary"
                    gutterBottom
                  >
                    Order Status for{" "}
                    {trackedOrder._id.substring(0, 8).toUpperCase()}
                  </Typography>
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      gap: 1,
                      mb: 4,
                    }}
                  >
                    <Button
                      size="small"
                      onClick={() => setTrackedOrder(null)}
                      sx={{
                        minWidth: "auto",
                        p: 0.5,
                        borderRadius: 1.5,
                        bgcolor: "rgba(0,0,0,0.05)",
                      }}
                    >
                      <CloseIcon fontSize="small" />
                    </Button>
                    <Typography variant="h6" sx={{ fontWeight: 700 }}>
                      {trackedOrder.pharmacyId.name}
                    </Typography>
                  </Box>

                  {trackedOrder.status === "rejected" ? (
                    <Alert severity="error" sx={{ mb: 3 }}>
                      This order was rejected. {trackedOrder.rejectionReason}
                    </Alert>
                  ) : (
                    <Stepper
                      activeStep={getActiveStep(trackedOrder.status)}
                      alternativeLabel
                      sx={{ mb: 4 }}
                    >
                      {ORDER_STEPS.map((step) => (
                        <Step key={step.label}>
                          <StepLabel>{step.label}</StepLabel>
                        </Step>
                      ))}
                    </Stepper>
                  )}

                  <Divider sx={{ my: 2 }} />

                  <Box
                    sx={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <Box>
                      <Typography variant="body2" color="text.secondary">
                        Total Amount
                      </Typography>
                      <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>
                        ETB {trackedOrder.totalAmount.toFixed(2)}
                      </Typography>
                    </Box>
                    <Button
                      variant="outlined"
                      startIcon={<PhoneIcon />}
                      size="small"
                      onClick={() => {
                        if (trackedOrder.pharmacyId.phoneNumber) {
                          window.location.href = `tel:${trackedOrder.pharmacyId.phoneNumber}`;
                        } else {
                          setToast({
                            open: true,
                            message: "Pharmacy phone number not available.",
                            severity: "info",
                          });
                        }
                      }}
                    >
                      Contact Pharmacy
                    </Button>
                  </Box>
                </Box>
              )}
            </Stack>
          )}
        </DialogContent>
      </Dialog>

      <Snackbar
        open={toast.open}
        autoHideDuration={6000}
        onClose={() => setToast((prev) => ({ ...prev, open: false }))}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
        sx={{ zIndex: 3000 }}
      >
        <Alert
          onClose={() => setToast((prev) => ({ ...prev, open: false }))}
          severity={toast.severity}
          variant="filled"
          sx={{ width: "100%", borderRadius: 2, fontWeight: 600 }}
        >
          {toast.message}
        </Alert>
      </Snackbar>
    </>
  );
};
