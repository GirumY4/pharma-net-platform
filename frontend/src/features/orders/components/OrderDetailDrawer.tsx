// src/features/orders/components/OrderDetailDrawer.tsx
import {
  Cancel,
  CheckCircle,
  Close,
  Home,
  LocalShipping,
} from "@mui/icons-material";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  Drawer,
  IconButton,
  List,
  ListItem,
  ListItemText,
  Stack,
  Typography,
} from "@mui/material";
import { useState } from "react";
import { handleApiError } from "../../../utils/errorMapper";
import { ALLOWED_TRANSITIONS, STATUS_CONFIG } from "../constants";
import type { IOrder, OrderStatus, UpdateOrderStatusPayload } from "../types";
import { StatusChip } from "./StatusChip";
import { StatusStepper } from "./StatusStepper";

interface OrderDetailDrawerProps {
  open: boolean;
  onClose: () => void;
  order: IOrder | null;
  isPharmacyManager: boolean;
  onUpdateStatus: (
    orderId: string,
    payload: UpdateOrderStatusPayload,
  ) => Promise<void>;
  onRecordPayment: (order: IOrder) => void;
  loading: boolean;
}

export const OrderDetailDrawer = ({
  open,
  onClose,
  order,
  isPharmacyManager,
  onUpdateStatus,
  onRecordPayment,
  loading,
}: OrderDetailDrawerProps) => {
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    newStatus: OrderStatus | null;
    reason: string;
  }>({ open: false, newStatus: null, reason: "" });

  if (!order) return null;

  const handleStatusAction = (newStatus: OrderStatus) => {
    if (newStatus === "rejected") {
      setConfirmDialog({ open: true, newStatus, reason: "" });
    } else {
      handleUpdateStatus(newStatus);
    }
  };

  const handleUpdateStatus = async (newStatus: OrderStatus) => {
    try {
      await onUpdateStatus(order._id, {
        status: newStatus,
        ...(newStatus === "rejected" && {
          rejectionReason: confirmDialog.reason,
        }),
      });
      setConfirmDialog({ open: false, newStatus: null, reason: "" });
    } catch (err) {
      const message = handleApiError(err);
      alert(message);
    }
  };

  const allowedActions = isPharmacyManager
    ? ALLOWED_TRANSITIONS[order.status].filter((s) => s !== "rejected")
    : [];
  const canReject =
    isPharmacyManager && ALLOWED_TRANSITIONS[order.status].includes("rejected");

  return (
    <>
      <Drawer
        anchor="right"
        open={open}
        onClose={onClose}
        sx={{
          "& .MuiDrawer-paper": {
            width: { xs: "100%", sm: 520 },
            maxWidth: "100vw",
            borderRadius: "16px 0 0 16px",
            borderLeft: "none",
            bgcolor: "#FFFFFF",
            boxShadow: "-8px 0 40px rgba(0,0,0,0.08)",
          },
        }}
      >
        {/* Header */}
        <Box
          sx={{
            p: 3,
            borderBottom: "1px solid rgba(0,0,0,0.06)",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 800, color: "#1E293B" }}>
              Order #{order._id.substring(0, 8)}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Created {new Date(order.createdAt).toLocaleDateString()}
            </Typography>
          </Box>
          <IconButton
            onClick={onClose}
            size="small"
            sx={{ color: "text.secondary" }}
          >
            <Close />
          </IconButton>
        </Box>

        <Box sx={{ p: 3, overflowY: "auto", flexGrow: 1 }}>
          {/* Status Stepper */}
          <StatusStepper
            currentStatus={order.status}
          />

          <Divider sx={{ my: 3 }} />

          {/* Customer Info */}
          <Typography
            variant="subtitle1"
            sx={{ fontWeight: 700, color: "#1E293B", mb: 2 }}
          >
            Customer Details
          </Typography>
          <Box
            sx={{
              p: 2,
              bgcolor: "rgba(247, 250, 249, 0.6)",
              borderRadius: 2,
              mb: 3,
            }}
          >
            <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
              {order.customerId.name}
            </Typography>
            {order.customerId.email && (
              <Typography variant="body2" color="text.secondary">
                {order.customerId.email}
              </Typography>
            )}
            {order.customerId.phoneNumber && (
              <Typography variant="body2" color="text.secondary">
                {order.customerId.phoneNumber}
              </Typography>
            )}
            {(order.customerId.address || order.customerId.city) && (
              <Typography variant="body2" color="text.secondary">
                {[order.customerId.address, order.customerId.city]
                  .filter(Boolean)
                  .join(", ")}
              </Typography>
            )}
          </Box>

          {/* Fulfillment Method */}
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 3 }}>
            {order.fulfillmentMethod === "delivery" ? (
              <LocalShipping fontSize="small" sx={{ color: "primary.main" }} />
            ) : (
              <Home fontSize="small" sx={{ color: "primary.main" }} />
            )}
            <Typography
              variant="body2"
              sx={{ fontWeight: 600, textTransform: "capitalize" }}
            >
              {order.fulfillmentMethod}
            </Typography>
            {order.fulfillmentMethod === "delivery" &&
              order.deliveryAddress && (
                <Typography variant="body2" color="text.secondary">
                  • {order.deliveryAddress}
                </Typography>
              )}
          </Box>

          {/* Order Notes from Customer */}
          {order.notes && (
            <Box sx={{ mb: 3 }}>
              <Typography
                variant="subtitle2"
                sx={{ fontWeight: 700, color: "text.secondary", mb: 0.5 }}
              >
                Notes from Customer
              </Typography>
              <Typography
                variant="body2"
                sx={{
                  p: 1.5,
                  bgcolor: "#FFFBEB",
                  border: "1px solid #FEF3C7",
                  borderRadius: 1.5,
                  color: "#92400E",
                  fontStyle: "italic",
                }}
              >
                "{order.notes}"
              </Typography>
            </Box>
          )}

          {/* Order Items */}
          <Typography
            variant="subtitle1"
            sx={{ fontWeight: 700, color: "#1E293B", mb: 2 }}
          >
            Order Items
          </Typography>
          <List sx={{ p: 0, mb: 3 }}>
            {order.items.map((item, index) => (
              <Box key={item._id}>
                <ListItem sx={{ px: 0, py: 1 }}>
                  <ListItemText
                    primary={
                      <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                        {item.medicineName}
                      </Typography>
                    }
                    secondary={
                      <Typography variant="caption" color="text.secondary">
                        SKU: {item.sku} • {item.unitPrice.toFixed(2)} ETB ×{" "}
                        {item.quantity}
                      </Typography>
                    }
                  />
                  <Typography variant="body2" sx={{ fontWeight: 700 }}>
                    {item.lineTotal.toFixed(2)} ETB
                  </Typography>
                </ListItem>
                {index < order.items.length - 1 && <Divider />}
              </Box>
            ))}
          </List>

          {/* Totals */}
          <Box
            sx={{
              p: 2,
              bgcolor: "rgba(15, 139, 108, 0.08)",
              borderRadius: 2,
              mb: 3,
            }}
          >
            <Box
              sx={{ display: "flex", justifyContent: "space-between", mb: 1 }}
            >
              <Typography variant="body2" color="text.secondary">
                Subtotal
              </Typography>
              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                {order.totalAmount.toFixed(2)} ETB
              </Typography>
            </Box>
            <Divider sx={{ my: 1 }} />
            <Box sx={{ display: "flex", justifyContent: "space-between" }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                Total
              </Typography>
              <Typography
                variant="subtitle2"
                sx={{ fontWeight: 800, color: "#0F5E4D" }}
              >
                {order.totalAmount.toFixed(2)} ETB
              </Typography>
            </Box>
          </Box>

          {/* Payment Status */}
          <Box sx={{ mb: 3 }}>
            <Typography
              variant="subtitle1"
              sx={{ fontWeight: 700, color: "#1E293B", mb: 2 }}
            >
              Payment Status
            </Typography>
            <StatusChip status={order.status} showTooltip={false} />
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              {order.paymentStatus === "paid"
                ? "✓ Fully paid"
                : order.paymentStatus === "partially_paid"
                  ? "⚠ Partially paid"
                  : "○ Unpaid"}
            </Typography>
          </Box>

          {/* Status History Timeline */}
          <Typography
            variant="subtitle1"
            sx={{ fontWeight: 700, color: "#1E293B", mb: 2 }}
          >
            Order Activity
          </Typography>
          <Box sx={{ mb: 4 }}>
            {order.statusHistory && order.statusHistory.length > 0 ? (
              <List sx={{ p: 0 }}>
                {order.statusHistory.map((event, idx) => (
                  <ListItem
                    key={idx}
                    sx={{
                      px: 0,
                      py: 1,
                      alignItems: "flex-start",
                      borderLeft: "2px solid rgba(15, 139, 108, 0.2)",
                      ml: 1,
                      pl: 3,
                      position: "relative",
                      "&::before": {
                        content: '""',
                        position: "absolute",
                        left: -6,
                        top: 12,
                        width: 10,
                        height: 10,
                        borderRadius: "50%",
                        bgcolor: idx === 0 ? "#0F8B6C" : "rgba(15, 139, 108, 0.4)",
                        border: "2px solid white",
                      },
                    }}
                  >
                    <ListItemText
                      primary={
                        <Stack
                          direction="row"
                          sx={{ justifyContent: "space-between", alignItems: "center" }}
                        >
                          <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                            {STATUS_CONFIG[event.status].label}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {new Date(event.changedAt).toLocaleString()}
                          </Typography>
                        </Stack>
                      }
                      secondary={
                        <Box sx={{ mt: 0.5 }}>
                          <Typography variant="caption" sx={{ display: "block", color: "text.primary", fontWeight: 600 }}>
                            By {event.changedBy.name}
                          </Typography>
                          {event.note && (
                            <Typography
                              variant="body2"
                              sx={{
                                mt: 0.5,
                                fontStyle: "italic",
                                color: "text.secondary",
                                bgcolor: "rgba(0,0,0,0.03)",
                                p: 1,
                                borderRadius: 1,
                              }}
                            >
                              "{event.note}"
                            </Typography>
                          )}
                        </Box>
                      }
                    />
                  </ListItem>
                ))}
              </List>
            ) : (
              <Typography variant="body2" color="text.secondary">
                No activity recorded yet.
              </Typography>
            )}
          </Box>

          {/* Rejection Reason */}
          {order.status === "rejected" && order.rejectionReason && (
            <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                Rejection Reason
              </Typography>
              <Typography variant="body2">{order.rejectionReason}</Typography>
            </Alert>
          )}

          {/* Action Buttons */}
          {isPharmacyManager &&
            order.status !== "rejected" &&
            order.status !== "delivered" && (
              <Box sx={{ mt: 4, display: "flex", gap: 2, flexWrap: "wrap" }}>
                {allowedActions.map((action) => {
                  const config = STATUS_CONFIG[action];
                  return (
                    <Button
                      key={action}
                      variant="contained"
                      size="small"
                      onClick={() => handleStatusAction(action)}
                      disabled={loading}
                      startIcon={loading && <CircularProgress size={16} />}
                      sx={{
                        bgcolor: config.color,
                        "&:hover": { bgcolor: config.color + "CC" },
                        fontWeight: 700,
                        textTransform: "capitalize",
                      }}
                    >
                      {config.label}
                    </Button>
                  );
                })}
                {canReject && (
                  <Button
                    variant="outlined"
                    size="small"
                    color="error"
                    onClick={() =>
                      setConfirmDialog({
                        open: true,
                        newStatus: "rejected",
                        reason: "",
                      })
                    }
                    disabled={loading}
                    startIcon={<Cancel />}
                    sx={{ fontWeight: 700, textTransform: "capitalize" }}
                  >
                    Reject
                  </Button>
                )}
                {order.paymentStatus !== "paid" && (
                  <Button
                    variant="outlined"
                    size="small"
                    color="success"
                    onClick={() => onRecordPayment(order)}
                    disabled={loading}
                    startIcon={<CheckCircle />}
                    sx={{ fontWeight: 700 }}
                  >
                    Record Payment
                  </Button>
                )}
              </Box>
            )}
        </Box>
      </Drawer>

      {/* Rejection Confirmation Dialog */}
      <Dialog
        open={confirmDialog.open}
        onClose={() => setConfirmDialog({ ...confirmDialog, open: false })}
      >
        <DialogTitle sx={{ fontWeight: 700 }}>Confirm Rejection</DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ mb: 2 }}>
            Please provide a reason for rejecting this order:
          </Typography>
          <textarea
            value={confirmDialog.reason}
            onChange={(e) =>
              setConfirmDialog({ ...confirmDialog, reason: e.target.value })
            }
            placeholder="e.g., Item out of stock, invalid address, etc."
            style={{
              width: "100%",
              minHeight: 80,
              padding: 12,
              borderRadius: 8,
              border: "1px solid rgba(23, 35, 31, 0.2)",
              fontFamily: "inherit",
              fontSize: "0.9rem",
            }}
          />
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setConfirmDialog({ ...confirmDialog, open: false })}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            color="error"
            onClick={() => handleUpdateStatus("rejected")}
            disabled={!confirmDialog.reason.trim()}
          >
            Confirm Reject
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};
