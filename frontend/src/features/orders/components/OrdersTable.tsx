// src/features/orders/components/OrdersTable.tsx
import { InfoOutlined, Payments, Visibility } from "@mui/icons-material";
import {
  Box,
  Chip,
  IconButton,
  Paper,
  Skeleton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tooltip,
  Typography,
} from "@mui/material";
import { PAYMENT_STATUS_CONFIG } from "../constants";
import type { IOrder } from "../types";
import { StatusChip } from "./StatusChip";

interface OrdersTableProps {
  orders: IOrder[] | null;
  loading: boolean;
  error: string | null;
  onViewOrder: (order: IOrder) => void;
  onRecordPayment: (order: IOrder) => void;
}

export const OrdersTable = ({
  orders,
  loading,
  error,
  onViewOrder,
  onRecordPayment,
}: OrdersTableProps) => {
  if (loading) {
    return (
      <Paper
        elevation={0}
        sx={{
          p: 0,
          borderRadius: 4,
          border: "1px solid rgba(0,0,0,0.06)",
          overflow: "hidden",
        }}
      >
        <Box
          sx={{
            p: 3,
            borderBottom: "1px solid rgba(0,0,0,0.06)",
            bgcolor: "#FAFAFA",
          }}
        >
          <Skeleton variant="text" width={150} height={24} sx={{ mb: 1 }} />
          <Skeleton variant="text" width={250} height={18} />
        </Box>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                {[
                  "Order ID",
                  "Customer",
                  "Items",
                  "Total",
                  "Status",
                  "Payment",
                  "Actions",
                ].map((header) => (
                  <TableCell
                    key={header}
                    sx={{ fontWeight: 700, color: "text.secondary" }}
                  >
                    <Skeleton variant="text" width={80} height={20} />
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {[...Array(5)].map((_, row) => (
                <TableRow key={row}>
                  {[...Array(7)].map((_, cell) => (
                    <TableCell key={cell}>
                      <Skeleton variant="text" width={60} height={18} />
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
    );
  }

  if (error) {
    return (
      <Paper
        elevation={0}
        sx={{
          p: 4,
          borderRadius: 4,
          border: "1px solid rgba(0,0,0,0.06)",
          textAlign: "center",
        }}
      >
        <Typography color="error.main" sx={{ fontWeight: 600, mb: 1 }}>
          Unable to load orders
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          {error}
        </Typography>
      </Paper>
    );
  }

  if (!orders || orders.length === 0) {
    return (
      <Paper
        elevation={0}
        sx={{
          p: 6,
          borderRadius: 4,
          border: "1px dashed rgba(23, 35, 31, 0.1)",
          textAlign: "center",
        }}
      >
        <Box
          sx={{
            mb: 2,
            color: "primary.main",
            bgcolor: "rgba(15, 139, 108, 0.08)",
            p: 2,
            borderRadius: "50%",
            display: "inline-flex",
          }}
        >
          <InfoOutlined fontSize="large" />
        </Box>
        <Typography
          variant="h6"
          color="#1E293B"
          sx={{ fontWeight: 700, mb: 1 }}
        >
          No orders found
        </Typography>
        <Typography
          variant="body2"
          color="text.secondary"
          sx={{ maxWidth: 320, mx: "auto" }}
        >
          {orders === null
            ? "Loading orders..."
            : "There are no orders matching your current filters."}
        </Typography>
      </Paper>
    );
  }

  return (
    <TableContainer
      component={Paper}
      sx={{
        borderRadius: 4,
        border: "1px solid rgba(0,0,0,0.06)",
        overflow: "hidden",
        boxShadow: "0 10px 40px rgba(0,0,0,0.03)",
      }}
    >
      <Table>
        <TableHead sx={{ bgcolor: "rgba(0,0,0,0.02)" }}>
          <TableRow>
            <TableCell
              sx={{ fontWeight: 700, color: "text.secondary", width: 120 }}
            >
              Order ID
            </TableCell>
            <TableCell sx={{ fontWeight: 700, color: "text.secondary" }}>
              Customer
            </TableCell>
            <TableCell
              sx={{ fontWeight: 700, color: "text.secondary", width: 80 }}
              align="right"
            >
              Items
            </TableCell>
            <TableCell
              sx={{ fontWeight: 700, color: "text.secondary", width: 100 }}
              align="right"
            >
              Total
            </TableCell>
            <TableCell
              sx={{ fontWeight: 700, color: "text.secondary", width: 120 }}
            >
              Status
            </TableCell>
            <TableCell
              sx={{ fontWeight: 700, color: "text.secondary", width: 120 }}
            >
              Payment
            </TableCell>
            <TableCell
              sx={{ fontWeight: 700, color: "text.secondary", width: 100 }}
              align="right"
            >
              Actions
            </TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {orders.map((order) => {
            const paymentConfig = PAYMENT_STATUS_CONFIG[order.paymentStatus];
            return (
              <TableRow
                key={order._id}
                hover
                sx={{ "&:last-child td, &:last-child th": { border: 0 } }}
              >
                <TableCell
                  sx={{
                    fontWeight: 600,
                    fontFamily: "monospace",
                    color: "#0F5E4D",
                  }}
                >
                  {order._id.substring(0, 8)}...
                </TableCell>
                <TableCell>
                  <Box>
                    <Typography
                      variant="subtitle2"
                      sx={{ fontWeight: 600, color: "#1E293B" }}
                    >
                      {order.customerId.name}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {order.customerId.city || "—"}
                    </Typography>
                  </Box>
                </TableCell>
                <TableCell align="right">
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    {order.items.length}
                  </Typography>
                </TableCell>
                <TableCell align="right">
                  <Typography variant="body2" sx={{ fontWeight: 700 }}>
                    ETB {order.totalAmount.toFixed(2)}
                  </Typography>
                </TableCell>
                <TableCell>
                  <StatusChip status={order.status} />
                </TableCell>
                <TableCell>
                  <Chip
                    label={paymentConfig.label}
                    size="small"
                    sx={{
                      height: 24,
                      fontSize: "0.7rem",
                      fontWeight: 700,
                      bgcolor: paymentConfig.bg,
                      color: paymentConfig.color,
                    }}
                  />
                </TableCell>
                <TableCell align="right">
                  <Box
                    sx={{
                      display: "flex",
                      justifyContent: "flex-end",
                      gap: 0.5,
                    }}
                  >
                    <Tooltip title="View order details">
                      <IconButton
                        size="small"
                        onClick={() => onViewOrder(order)}
                        sx={{
                          color: "text.secondary",
                          "&:hover": { color: "primary.main" },
                        }}
                      >
                        <Visibility fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    {order.paymentStatus !== "paid" &&
                      order.status !== "rejected" && (
                        <Tooltip title="Record payment">
                          <IconButton
                            size="small"
                            onClick={() => onRecordPayment(order)}
                            sx={{
                              color: "text.secondary",
                              "&:hover": { color: "success.main" },
                            }}
                          >
                            <Payments fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      )}
                  </Box>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </TableContainer>
  );
};
