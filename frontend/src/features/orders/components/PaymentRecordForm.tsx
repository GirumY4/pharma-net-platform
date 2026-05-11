// src/features/orders/components/PaymentRecordForm.tsx
import { Close, InfoOutlined, Payments } from "@mui/icons-material";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Divider,
  Drawer,
  FormControl,
  IconButton,
  InputLabel,
  MenuItem,
  Select,
  TextField,
  Typography,
} from "@mui/material";
import { useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { handleApiError } from "../../../utils/errorMapper";
import { PAYMENT_STATUS_CONFIG } from "../constants";
import { recordPayment } from "../services/ordersApi";
import type { CreatePaymentPayload, IOrder } from "../types";

interface PaymentRecordFormProps {
  open: boolean;
  onClose: () => void;
  order: IOrder | null;
  onSuccess: () => void;
  loading: boolean;
}

type PaymentMethod = "bank_transfer" | "cash" | "mobile_money";

interface PaymentFormValues extends Omit<CreatePaymentPayload, "orderId"> {
  amount: number;
  paymentMethod: PaymentMethod;
}

export const PaymentRecordForm = ({
  open,
  onClose,
  order,
  onSuccess,
  loading: externalLoading,
}: PaymentRecordFormProps) => {
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const {
    control,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<PaymentFormValues>({
    defaultValues: {
      amount: 0,
      paymentMethod: "cash",
      transactionId: "",
      note: "",
    },
  });

  const paymentMethod = watch("paymentMethod");
  const amount = watch("amount");

  // Reset form when order changes or drawer opens
  useEffect(() => {
    if (open && order) {
      const remainingBalance =
        order.totalAmount -
        order.items.reduce((sum, item) => sum + item.lineTotal, 0) * 0; // Simplified; backend calculates
      reset({
        amount: remainingBalance > 0 ? remainingBalance : order.totalAmount,
        paymentMethod: "cash",
        transactionId: "",
        note: "",
      });
      setError(null);
    }
  }, [open, order, reset]);

  const calculateRemainingBalance = () => {
    if (!order) return 0;
    // In production, this would fetch existing payments from backend
    // For now, assume unpaid or use order.paymentStatus as hint
    if (order.paymentStatus === "paid") return 0;
    return order.totalAmount;
  };

  const remainingBalance = calculateRemainingBalance();

  const onFormSubmit = async (data: PaymentFormValues) => {
    if (!order) return;

    setSubmitting(true);
    setError(null);

    try {
      // Validate amount does not exceed remaining balance
      if (amount > remainingBalance + 0.01) {
        throw new Error(
          `OVERPAYMENT: Amount exceeds remaining balance of ${remainingBalance.toFixed(2)} ETB.`,
        );
      }

      const payload: CreatePaymentPayload = {
        orderId: order._id,
        ...data,
      };

      await recordPayment(payload);
      onSuccess();
      onClose();
    } catch (err) {
      const message = handleApiError(err);
      setError(message);
    } finally {
      setSubmitting(false);
    }
  };

  if (!order) return null;

  const isSubmitting = externalLoading || submitting;

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      sx={{
        "& .MuiDrawer-paper": {
          width: { xs: "100%", sm: 480 },
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
            Record Payment
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Order #{order._id.substring(0, 8)} • Total:{" "}
            {order.totalAmount.toFixed(2)} ETB
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

      <Box
        component="form"
        onSubmit={handleSubmit(onFormSubmit)}
        sx={{ p: 3, overflowY: "auto", flexGrow: 1 }}
      >
        {error && (
          <Alert
            severity="error"
            sx={{ mb: 3, borderRadius: 2 }}
            onClose={() => setError(null)}
          >
            {error}
          </Alert>
        )}

        {/* Order Summary */}
        <Box
          sx={{
            p: 2,
            bgcolor: "rgba(15, 139, 108, 0.08)",
            borderRadius: 2,
            mb: 3,
          }}
        >
          <Box sx={{ display: "flex", justifyContent: "space-between", mb: 1 }}>
            <Typography variant="body2" color="text.secondary">
              Order Total
            </Typography>
            <Typography variant="body2" sx={{ fontWeight: 600 }}>
              {order.totalAmount.toFixed(2)} ETB
            </Typography>
          </Box>
          <Box sx={{ display: "flex", justifyContent: "space-between", mb: 1 }}>
            <Typography variant="body2" color="text.secondary">
              Current Status
            </Typography>
            <Typography
              variant="body2"
              sx={{
                fontWeight: 600,
                color: PAYMENT_STATUS_CONFIG[order.paymentStatus].color,
              }}
            >
              {PAYMENT_STATUS_CONFIG[order.paymentStatus].label}
            </Typography>
          </Box>
          <Divider sx={{ my: 1 }} />
          <Box sx={{ display: "flex", justifyContent: "space-between" }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
              Remaining Balance
            </Typography>
            <Typography
              variant="subtitle2"
              sx={{ fontWeight: 800, color: "#0F5E4D" }}
            >
              {remainingBalance.toFixed(2)} ETB
            </Typography>
          </Box>
        </Box>

        {/* Payment Amount */}
        <Controller
          name="amount"
          control={control}
          rules={{
            required: "Amount is required",
            min: { value: 0.01, message: "Amount must be greater than 0" },
            validate: (value) =>
              value <= remainingBalance + 0.01 ||
              `Amount cannot exceed remaining balance of ${remainingBalance.toFixed(2)} ETB`,
          }}
          render={({ field }) => (
            <TextField
              {...field}
              label="Payment Amount (ETB) *"
              type="number"
              fullWidth
              error={!!errors.amount}
              helperText={errors.amount?.message}
              size="small"
              sx={{ mb: 2 }}
              slotProps={{ htmlInput: { step: "0.01", min: 0.01 } }}
              disabled={isSubmitting}
            />
          )}
        />

        {/* Payment Method */}
        <Controller
          name="paymentMethod"
          control={control}
          rules={{ required: "Payment method is required" }}
          render={({ field }) => (
            <FormControl
              fullWidth
              size="small"
              error={!!errors.paymentMethod}
              sx={{ mb: 2 }}
            >
              <InputLabel>Payment Method *</InputLabel>
              <Select
                {...field}
                label="Payment Method *"
                disabled={isSubmitting}
              >
                <MenuItem value="cash">💵 Cash</MenuItem>
                <MenuItem value="bank_transfer">🏦 Bank Transfer</MenuItem>
                <MenuItem value="mobile_money">📱 Mobile Money</MenuItem>
              </Select>
            </FormControl>
          )}
        />

        {/* Conditional: Transaction ID for bank_transfer */}
        {paymentMethod === "bank_transfer" && (
          <Controller
            name="transactionId"
            control={control}
            rules={{
              required: "Transaction ID is required for bank transfers",
            }}
            render={({ field }) => (
              <TextField
                {...field}
                label="Transaction ID / Reference *"
                fullWidth
                error={!!errors.transactionId}
                helperText={errors.transactionId?.message}
                size="small"
                sx={{ mb: 2 }}
                disabled={isSubmitting}
                placeholder="e.g., TXN-ETB-20260331-001"
              />
            )}
          />
        )}

        {/* Optional Note */}
        <Controller
          name="note"
          control={control}
          render={({ field }) => (
            <TextField
              {...field}
              label="Note (Optional)"
              fullWidth
              multiline
              rows={2}
              size="small"
              sx={{ mb: 3 }}
              placeholder="e.g., Partial payment. Balance due next week."
              disabled={isSubmitting}
            />
          )}
        />

        {/* Info Banner */}
        <Alert
          icon={<InfoOutlined fontSize="inherit" />}
          severity="info"
          sx={{
            mb: 3,
            borderRadius: 2,
            bgcolor: "rgba(37, 99, 235, 0.08)",
            color: "#2563EB",
          }}
        >
          <Typography variant="body2" sx={{ fontWeight: 600 }}>
            Payment Recording
          </Typography>
          <Typography variant="caption" color="text.secondary">
            This action will update the order's payment status and create an
            immutable audit record. Ensure the amount and method are accurate
            before submitting.
          </Typography>
        </Alert>

        {/* Action Buttons */}
        <Box
          sx={{ mt: 4, display: "flex", gap: 2, justifyContent: "flex-end" }}
        >
          <Button variant="outlined" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button
            type="submit"
            variant="contained"
            disabled={isSubmitting}
            startIcon={
              isSubmitting ? <CircularProgress size={16} /> : <Payments />
            }
            sx={{
              minWidth: 140,
              background: "linear-gradient(135deg, #0F8B6C 0%, #0A6B59 100%)",
              "&:hover": {
                background: "linear-gradient(135deg, #0A6B59 0%, #064E3B 100%)",
              },
            }}
          >
            {isSubmitting ? "Recording..." : "Record Payment"}
          </Button>
        </Box>
      </Box>
    </Drawer>
  );
};
