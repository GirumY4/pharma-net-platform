import {
  ArrowDownwardOutlined,
  ArrowUpwardOutlined,
  Inventory2Outlined,
  MedicationOutlined,
  TimelineOutlined,
} from "@mui/icons-material";
import {
  Box,
  Chip,
  Divider,
  Grid,
  LinearProgress,
  Paper,
  Stack,
  Typography,
} from "@mui/material";
import { alpha } from "@mui/material/styles";
import { ORDER_STATUSES } from "../services/dashboardApi";
import type {
  DashboardData,
  InventoryTransaction,
  LowStockItem,
  OrderStatus,
  TopMedicine,
} from "../types";

interface OperationalInsightPanelProps {
  data: DashboardData | null;
}

const STATUS_LABELS: Record<OrderStatus, string> = {
  pending: "Pending",
  approved: "Approved",
  processing: "Processing",
  ready: "Ready",
  delivered: "Delivered",
  rejected: "Rejected",
};

const STATUS_COLORS: Record<OrderStatus, string> = {
  pending: "#B7791F",
  approved: "#2563EB",
  processing: "#4F46E5",
  ready: "#0F766E",
  delivered: "#0F8B6C",
  rejected: "#C2413B",
};

const currency = (value: number) => `ETB ${Math.round(value).toLocaleString()}`;

const getMedicineLabel = (transaction: InventoryTransaction) => {
  if (typeof transaction.medicineId === "object" && transaction.medicineId) {
    return `${transaction.medicineId.name} (${transaction.medicineId.sku})`;
  }
  return "Inventory item";
};

const MiniMedicineList = ({
  title,
  items,
  empty,
  mode,
}: {
  title: string;
  items: LowStockItem[] | TopMedicine[];
  empty: string;
  mode: "stock" | "sales";
}) => (
  <Box>
    <Typography variant="subtitle2" sx={{ color: "text.primary", mb: 1.25 }}>
      {title}
    </Typography>
    <Stack spacing={1.25}>
      {items.length === 0 ? (
        <Typography variant="body2" color="text.secondary">
          {empty}
        </Typography>
      ) : (
        items.slice(0, 4).map((item) => (
          <Stack
            key={`${item._id}-${item.sku}`}
            direction="row"
            spacing={2}
            sx={{ justifyContent: "space-between" }}
          >
            <Box sx={{ minWidth: 0 }}>
              <Typography variant="body2" sx={{ fontWeight: 750 }} noWrap>
                {item.name}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {item.sku}
              </Typography>
            </Box>
            <Typography variant="body2" sx={{ fontWeight: 850 }}>
              {mode === "stock"
                ? (item as LowStockItem).totalStock
                : currency((item as TopMedicine).revenue)}
            </Typography>
          </Stack>
        ))
      )}
    </Stack>
  </Box>
);

export const OperationalInsightPanel = ({
  data,
}: OperationalInsightPanelProps) => {
  const ordersByStatus = data?.ordersByStatus;
  const totalStatusCount = ORDER_STATUSES.reduce(
    (sum, status) => sum + (ordersByStatus?.[status] ?? 0),
    0,
  );
  const transactions = data?.recentInventoryTransactions ?? [];

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
            Operational Intelligence
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Order lifecycle, stock ledger, and product movement signals.
          </Typography>
        </Box>
        <Stack direction="row" spacing={1}>
          <Chip
            icon={<ArrowUpwardOutlined />}
            label={`${data?.stockMovement.stockIn ?? 0} in`}
            sx={{
              bgcolor: "rgba(15, 139, 108, 0.1)",
              color: "#0F5E4D",
              fontWeight: 800,
            }}
          />
          <Chip
            icon={<ArrowDownwardOutlined />}
            label={`${data?.stockMovement.stockOut ?? 0} out`}
            sx={{
              bgcolor: "rgba(221, 170, 74, 0.16)",
              color: "#8A5F16",
              fontWeight: 800,
            }}
          />
        </Stack>
      </Stack>

      <Grid container>
        <Grid
          size={{ xs: 12, md: 6 }}
          sx={{ p: 2.5, borderRight: { md: "1px solid rgba(23,35,31,0.08)" } }}
        >
          <Stack
            direction="row"
            spacing={1.25}
            sx={{ mb: 2, alignItems: "center" }}
          >
            <TimelineOutlined color="primary" />
            <Typography variant="subtitle2" sx={{ color: "text.primary" }}>
              Order Lifecycle
            </Typography>
          </Stack>
          <Stack spacing={1.5}>
            {ORDER_STATUSES.map((status) => {
              const count = ordersByStatus?.[status] ?? 0;
              const value = totalStatusCount > 0 ? (count / totalStatusCount) * 100 : 0;

              return (
                <Box key={status}>
                  <Stack
                    direction="row"
                    sx={{ mb: 0.6, justifyContent: "space-between" }}
                  >
                    <Typography variant="body2" sx={{ fontWeight: 750 }}>
                      {STATUS_LABELS[status]}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {count}
                    </Typography>
                  </Stack>
                  <LinearProgress
                    variant="determinate"
                    value={value}
                    sx={{
                      height: 7,
                      borderRadius: 99,
                      bgcolor: "rgba(23,35,31,0.07)",
                      "& .MuiLinearProgress-bar": {
                        borderRadius: 99,
                        bgcolor: STATUS_COLORS[status],
                      },
                    }}
                  />
                </Box>
              );
            })}
          </Stack>
        </Grid>

        <Grid size={{ xs: 12, md: 6 }} sx={{ p: 2.5 }}>
          <Stack
            direction="row"
            spacing={1.25}
            sx={{ mb: 2, alignItems: "center" }}
          >
            <Inventory2Outlined color="primary" />
            <Typography variant="subtitle2" sx={{ color: "text.primary" }}>
              Recent Stock Ledger
            </Typography>
          </Stack>
          <Stack divider={<Divider />} spacing={1.25}>
            {transactions.length === 0 ? (
              <Typography variant="body2" color="text.secondary">
                No stock movements in this period.
              </Typography>
            ) : (
              transactions.slice(0, 5).map((transaction) => {
                const isIn = transaction.transactionType === "GRN";
                return (
                  <Stack
                    key={transaction._id}
                    direction="row"
                    spacing={1.5}
                    sx={(theme) => ({
                      justifyContent: "space-between",
                      alignItems: "center",
                      py: 1,
                      "&:hover": {
                        bgcolor: alpha(theme.palette.primary.main, 0.03),
                      },
                    })}
                  >
                    <Box sx={{ minWidth: 0 }}>
                      <Typography variant="body2" sx={{ fontWeight: 750 }} noWrap>
                        {getMedicineLabel(transaction)}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Batch {transaction.batchNumber}
                      </Typography>
                    </Box>
                    <Chip
                      size="small"
                      label={`${isIn ? "+" : ""}${transaction.quantityChanged}`}
                      icon={isIn ? <ArrowUpwardOutlined /> : <ArrowDownwardOutlined />}
                      sx={{
                        bgcolor: isIn
                          ? "rgba(15, 139, 108, 0.1)"
                          : "rgba(221, 170, 74, 0.16)",
                        color: isIn ? "#0F5E4D" : "#8A5F16",
                        fontWeight: 850,
                      }}
                    />
                  </Stack>
                );
              })
            )}
          </Stack>
        </Grid>
      </Grid>

      <Divider />

      <Grid container>
        <Grid
          size={{ xs: 12, md: 6 }}
          sx={{ p: 2.5, borderRight: { md: "1px solid rgba(23,35,31,0.08)" } }}
        >
          <MiniMedicineList
            title="Lowest Stock"
            items={data?.lowStockItems ?? []}
            empty="No medicines are below reorder threshold."
            mode="stock"
          />
        </Grid>
        <Grid size={{ xs: 12, md: 6 }} sx={{ p: 2.5 }}>
          <Stack
            direction="row"
            spacing={1.25}
            sx={{ mb: 2, alignItems: "center" }}
          >
            <MedicationOutlined color="primary" />
            <Typography variant="subtitle2" sx={{ color: "text.primary" }}>
              Top Medicines
            </Typography>
          </Stack>
          <MiniMedicineList
            title=""
            items={data?.topMedicines ?? []}
            empty="No sales recorded in this range."
            mode="sales"
          />
        </Grid>
      </Grid>
    </Paper>
  );
};
