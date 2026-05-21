// src/features/orders/pages/OrdersPage.tsx
import { Refresh, Search } from "@mui/icons-material";
import {
  Box,
  Button,
  Chip,
  FormControl,
  InputAdornment,
  InputLabel,
  MenuItem,
  Pagination,
  Select,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import { useCallback, useState } from "react";
import { useAuth } from "../../../contexts/useAuth";
import { OrderDetailDrawer } from "../components/OrderDetailDrawer";
import { OrdersTable } from "../components/OrdersTable";
import { PaymentRecordForm } from "../components/PaymentRecordForm";
import { useOrders } from "../hooks/useOrders";
import { updateOrderStatus } from "../services/ordersApi";
import type {
  IOrder,
  OrderStatus,
  PaymentStatus,
  UpdateOrderStatusPayload,
} from "../types";
import SEO from "../../../components/SEO";

export const OrdersPage = () => {
  const { user } = useAuth();
  const isPharmacyManager = user?.role === "pharmacy_manager";
  const isAdmin = user?.role === "admin";
  const isManagement = isPharmacyManager || isAdmin;

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [paymentStatusFilter, setPaymentStatusFilter] = useState<string>("");
  const [selectedOrder, setSelectedOrder] = useState<IOrder | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  const { orders, loading, error, pagination, refresh, updateFilters } =
    useOrders({ page: 1, limit: 20 });

  const handleSearch = useCallback((value: string) => {
    setSearchTerm(value);
    // Note: Backend doesn't support text search on orders yet; this is UI-only for now
  }, []);

  const handleStatusFilterChange = useCallback(
    (value: string) => {
      setStatusFilter(value);
      updateFilters({ status: (value as OrderStatus) || undefined });
    },
    [updateFilters],
  );

  const handlePaymentStatusFilterChange = useCallback(
    (value: string) => {
      setPaymentStatusFilter(value);
      updateFilters({ paymentStatus: (value as PaymentStatus) || undefined });
    },
    [updateFilters],
  );

  const handleViewOrder = (order: IOrder) => {
    setSelectedOrder(order);
    setDrawerOpen(true);
  };

  // Add state for payment drawer
  const [paymentDrawerOpen, setPaymentDrawerOpen] = useState(false);
  const [paymentOrder, setPaymentOrder] = useState<IOrder | null>(null);

  // Update handler
  const handleRecordPayment = (order: IOrder) => {
    setPaymentOrder(order);
    setPaymentDrawerOpen(true);
  };

  // Success callback
  const handlePaymentSuccess = async () => {
    await refresh(); // Refresh orders list to reflect updated paymentStatus
    // Optionally show toast notification
  };

  const handleUpdateStatus = async (
    orderId: string,
    payload: UpdateOrderStatusPayload,
  ) => {
    setActionLoading(true);
    try {
      await updateOrderStatus(orderId, payload);
      await refresh();
      // Update local state if drawer is open
      if (selectedOrder?._id === orderId) {
        setSelectedOrder((prev) => (prev ? { ...prev, ...payload } : prev));
      }
    } finally {
      setActionLoading(false);
    }
  };

  const handlePageChange = (_: React.ChangeEvent<unknown>, page: number) => {
    updateFilters({ page });
  };

  return (
    <Box>
      <SEO title="Orders" noIndex={true} />
      {/* Page Header */}
      <Box sx={{ mb: 4 }}>
        <Box
          sx={{
            display: "flex",
            flexDirection: { xs: "column", sm: "row" },
            justifyContent: "space-between",
            alignItems: { xs: "stretch", sm: "flex-start" },
            gap: { xs: 2, sm: 3 },
            mb: 3,
          }}
        >
          <Box>
            <Typography
              variant="h4"
              sx={{
                color: "primary.main",
                fontWeight: 800,
                letterSpacing: "-0.5px",
                fontSize: { xs: "1.5rem", sm: "1.75rem", md: "2.05rem" },
                mb: 0.5,
              }}
            >
              {isManagement ? "Incoming Orders" : "Order History"}
            </Typography>
            <Typography
              variant="body1"
              color="text.secondary"
              sx={{ fontSize: "1.1rem", maxWidth: 600 }}
            >
              {isManagement
                ? "Review and fulfill consumer orders targeting your pharmacy."
                : "Track your order history and payment status."}
            </Typography>
          </Box>
          <Tooltip title="Fetch latest orders">
            <span>
              <Button
                variant="outlined"
                startIcon={<Refresh />}
                onClick={refresh}
                disabled={loading}
                sx={{
                  fontWeight: 700,
                  color: "text.secondary",
                  borderColor: "rgba(23, 35, 31, 0.15)",
                  textTransform: "none",
                  "&:hover": {
                    bgcolor: "rgba(15, 139, 108, 0.05)",
                    borderColor: "primary.main",
                    color: "primary.main",
                  },
                }}
              >
                Refresh
              </Button>
            </span>
          </Tooltip>
        </Box>

        {/* Search & Filters */}
        <Box
          sx={{
            display: "flex",
            gap: 2,
            alignItems: "center",
            flexWrap: "wrap",
          }}
        >
          <TextField
            placeholder="Search orders..."
            value={searchTerm}
            onChange={(e) => handleSearch(e.target.value)}
            size="small"
            sx={{ minWidth: 240 }}
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <Search sx={{ color: "text.secondary" }} />
                  </InputAdornment>
                ),
              },
            }}
          />

          <FormControl size="small" sx={{ minWidth: 140 }}>
            <InputLabel>Status</InputLabel>
            <Select
              value={statusFilter}
              label="Status"
              onChange={(e) => handleStatusFilterChange(e.target.value)}
            >
              <MenuItem value="">All</MenuItem>
              <MenuItem value="pending">Pending</MenuItem>
              <MenuItem value="approved">Approved</MenuItem>
              <MenuItem value="processing">Processing</MenuItem>
              <MenuItem value="ready">Ready</MenuItem>
              <MenuItem value="delivered">Delivered</MenuItem>
              <MenuItem value="rejected">Rejected</MenuItem>
            </Select>
          </FormControl>

          <FormControl size="small" sx={{ minWidth: 160 }}>
            <InputLabel>Payment</InputLabel>
            <Select
              value={paymentStatusFilter}
              label="Payment"
              onChange={(e) => handlePaymentStatusFilterChange(e.target.value)}
            >
              <MenuItem value="">All</MenuItem>
              <MenuItem value="unpaid">Unpaid</MenuItem>
              <MenuItem value="partially_paid">Partially Paid</MenuItem>
              <MenuItem value="paid">Paid</MenuItem>
            </Select>
          </FormControl>

          <Box sx={{ flexGrow: 1 }} />

          {(statusFilter || paymentStatusFilter) && (
            <Chip
              label="Clear filters"
              size="small"
              onClick={() => {
                setStatusFilter("");
                setPaymentStatusFilter("");
                updateFilters({ status: undefined, paymentStatus: undefined });
              }}
              variant="outlined"
            />
          )}
        </Box>
      </Box>

      {/* Orders Table */}
      <OrdersTable
        orders={orders}
        loading={loading}
        error={error}
        onViewOrder={handleViewOrder}
        onRecordPayment={handleRecordPayment}
      />

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <Box sx={{ display: "flex", justifyContent: "center", mt: 4 }}>
          <Pagination
            count={pagination.totalPages}
            page={pagination.page}
            onChange={handlePageChange}
            color="primary"
            showFirstButton
            showLastButton
          />
        </Box>
      )}

      {/* Order Detail Drawer */}
      <OrderDetailDrawer
        open={drawerOpen}
        onClose={() => {
          setDrawerOpen(false);
          setSelectedOrder(null);
        }}
        order={selectedOrder}
        isPharmacyManager={!!isManagement}
        onUpdateStatus={handleUpdateStatus}
        onRecordPayment={handleRecordPayment}
        loading={actionLoading}
      />

      {/* Payment Record Drawer */}
      <PaymentRecordForm
        open={paymentDrawerOpen}
        onClose={() => {
          setPaymentDrawerOpen(false);
          setPaymentOrder(null);
        }}
        order={paymentOrder}
        onSuccess={handlePaymentSuccess}
        loading={actionLoading}
      />
    </Box>
  );
};
