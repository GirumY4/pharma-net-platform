import {
  CheckCircleOutlined,
  LocalShippingOutlined,
  RefreshOutlined,
} from "@mui/icons-material";
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Paper,
  Skeleton,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import { alpha } from "@mui/material/styles";
import type { OrderStatus, RecentOrder } from "../types";
import { EmptyState } from "./EmptyState";

interface RecentOrdersTableProps {
  orders: RecentOrder[] | null;
  loading: boolean;
  refreshing: boolean;
  error: string | null;
  actionError?: string | null;
  actionLoadingId?: string | null;
  onRefresh: () => void;
  onApproveOrder?: (orderId: string) => void;
}

const STATUS_CONFIG: Record<
  OrderStatus,
  { label: string; color: string; bg: string; border: string }
> = {
  pending: {
    label: "Pending",
    color: "#B7791F",
    bg: "#FFF7E6",
    border: "#F2D18A",
  },
  approved: {
    label: "Approved",
    color: "#2563EB",
    bg: "#EAF1FF",
    border: "#BFD2FF",
  },
  processing: {
    label: "Processing",
    color: "#4F46E5",
    bg: "#EEF2FF",
    border: "#C7D2FE",
  },
  ready: {
    label: "Ready",
    color: "#0F766E",
    bg: "#E7F7F2",
    border: "#B8E4D7",
  },
  delivered: {
    label: "Delivered",
    color: "#0F8B6C",
    bg: "#DFF8EC",
    border: "#B7E8D0",
  },
  rejected: {
    label: "Rejected",
    color: "#C2413B",
    bg: "#FDEBE9",
    border: "#F6C7C3",
  },
};

const formatCurrency = (amount: number) =>
  `ETB ${amount.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

const formatDate = (value: string) =>
  new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));

const Header = ({
  refreshing,
  onRefresh,
}: {
  refreshing: boolean;
  onRefresh: () => void;
}) => (
  <Stack
    direction={{ xs: "column", sm: "row" }}
    spacing={2}
    sx={{
      justifyContent: "space-between",
      alignItems: { xs: "stretch", sm: "center" },
      p: 2.5,
      borderBottom: "1px solid rgba(23, 35, 31, 0.08)",
      background:
        "linear-gradient(135deg, rgba(255,255,255,0.72) 0%, rgba(247,250,249,0.76) 100%)",
    }}
  >
    <Box>
      <Typography variant="h6" sx={{ color: "text.primary" }}>
        Recent Orders
      </Typography>
      <Typography variant="body2" color="text.secondary">
        Live order flow for the selected reporting window.
      </Typography>
    </Box>
    <Button
      variant="outlined"
      size="small"
      startIcon={
        refreshing ? <CircularProgress size={16} /> : <RefreshOutlined />
      }
      disabled={refreshing}
      onClick={onRefresh}
      sx={{ alignSelf: { xs: "flex-start", sm: "center" } }}
    >
      Refresh
    </Button>
  </Stack>
);

export const RecentOrdersTable = ({
  orders,
  loading,
  refreshing,
  error,
  actionError,
  actionLoadingId,
  onRefresh,
  onApproveOrder,
}: RecentOrdersTableProps) => {
  if (loading) {
    return (
      <Paper
        elevation={0}
        sx={{
          borderRadius: 2,
          border: "1px solid rgba(255,255,255,0.78)",
          backgroundColor: "rgba(255,255,255,0.72)",
          backdropFilter: "blur(22px)",
          overflow: "hidden",
          boxShadow: "0 18px 48px rgba(18, 32, 28, 0.08)",
        }}
      >
        <Header refreshing={false} onRefresh={onRefresh} />
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                {[...Array(5)].map((_, i) => (
                  <TableCell key={i}>
                    <Skeleton variant="text" width={90} height={22} />
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {[...Array(5)].map((_, row) => (
                <TableRow key={row}>
                  {[...Array(5)].map((_, cell) => (
                    <TableCell key={cell}>
                      <Skeleton variant="rounded" width="72%" height={24} />
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
          p: 3,
          borderRadius: 2,
          border: "1px solid rgba(255,255,255,0.78)",
          backgroundColor: "rgba(255,255,255,0.74)",
          backdropFilter: "blur(22px)",
          boxShadow: "0 18px 48px rgba(18, 32, 28, 0.08)",
        }}
      >
        <Alert
          severity="error"
          action={
            <Button color="inherit" size="small" onClick={onRefresh}>
              Retry
            </Button>
          }
        >
          {error}
        </Alert>
      </Paper>
    );
  }

  if (!orders || orders.length === 0) {
    return (
      <EmptyState
        title="No orders in this window"
        description="The selected date range has no order activity. Current pending orders still appear in the KPI queue."
        icon={<LocalShippingOutlined fontSize="medium" />}
        action={
          <Button
            variant="contained"
            size="small"
            startIcon={<RefreshOutlined />}
            onClick={onRefresh}
          >
            Refresh
          </Button>
        }
      />
    );
  }

  return (
    <Paper
      elevation={0}
      sx={{
        borderRadius: 2,
        border: "1px solid rgba(255,255,255,0.78)",
        backgroundColor: "rgba(255,255,255,0.72)",
        backdropFilter: "blur(22px)",
        overflow: "hidden",
        boxShadow: "0 18px 48px rgba(18, 32, 28, 0.08)",
      }}
    >
      <Header refreshing={refreshing} onRefresh={onRefresh} />
      {actionError && (
        <Alert severity="error" sx={{ mx: 2.5, mt: 2 }}>
          {actionError}
        </Alert>
      )}
      <TableContainer>
        <Table>
          <TableHead
            sx={{
              bgcolor: "rgba(247, 250, 249, 0.78)",
              "& th": {
                color: "text.secondary",
                fontWeight: 800,
                borderBottom: "1px solid rgba(23, 35, 31, 0.08)",
              },
            }}
          >
            <TableRow>
              <TableCell>Order</TableCell>
              <TableCell>Customer</TableCell>
              <TableCell>Total</TableCell>
              <TableCell>Status</TableCell>
              <TableCell align="right">Action</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {orders.map((row) => {
              const status = STATUS_CONFIG[row.status];
              const approving = actionLoadingId === row._id;

              return (
                <TableRow
                  key={row._id}
                  hover
                  sx={(theme) => ({
                    transition: "background-color 150ms ease",
                    "& td": {
                      borderBottom: "1px solid rgba(23, 35, 31, 0.07)",
                    },
                    "&:last-child td": { borderBottom: 0 },
                    "&:hover": {
                      bgcolor: alpha(theme.palette.primary.main, 0.035),
                    },
                  })}
                >
                  <TableCell>
                    <Typography
                      variant="subtitle2"
                      sx={{ color: "primary.main" }}
                    >
                      #{row._id.substring(0, 8)}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {formatDate(row.createdAt)}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" sx={{ fontWeight: 700 }}>
                      {row.customerId?.name ?? "Unknown customer"}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {row.fulfillmentMethod ?? "pickup"}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" sx={{ fontWeight: 800 }}>
                      {formatCurrency(row.totalAmount)}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {row.paymentStatus?.replace("_", " ") ?? "unpaid"}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={status.label}
                      size="small"
                      sx={{
                        height: 26,
                        fontWeight: 800,
                        bgcolor: status.bg,
                        color: status.color,
                        border: `1px solid ${status.border}`,
                      }}
                    />
                  </TableCell>
                  <TableCell align="right">
                    {row.status === "pending" && onApproveOrder ? (
                      <Button
                        size="small"
                        variant="contained"
                        startIcon={
                          approving ? (
                            <CircularProgress size={16} color="inherit" />
                          ) : (
                            <CheckCircleOutlined />
                          )
                        }
                        disabled={approving}
                        onClick={() => onApproveOrder(row._id)}
                      >
                        Approve
                      </Button>
                    ) : (
                      <Typography variant="caption" color="text.secondary">
                        No action
                      </Typography>
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>
    </Paper>
  );
};
