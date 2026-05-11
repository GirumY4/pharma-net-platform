import {
  AddShoppingCartOutlined,
  CalendarMonthOutlined,
  GroupOutlined,
  Inventory2Outlined,
  LocalShippingOutlined,
  MedicationOutlined,
  PaymentsOutlined,
  PlaylistAddOutlined,
  RefreshOutlined,
  TrendingUpOutlined,
  WarningAmberOutlined,
} from "@mui/icons-material";
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Divider,
  Fab,
  Grid,
  ListItemIcon,
  Menu,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { alpha } from "@mui/material/styles";
import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../../contexts/useAuth";
import { DashboardKpiCard } from "../components/DashboardKpiCard";
import { ExpiryAlertList } from "../components/ExpiryAlertList";
import { OperationalInsightPanel } from "../components/OperationalInsightPanel";
import { RecentOrdersTable } from "../components/RecentOrdersTable";
import { useDashboardData } from "../hooks/useDashboardData";
import type { DashboardKpi } from "../types";

const toInputDate = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const getDefaultDateRange = () => {
  const end = new Date();
  const start = new Date();
  start.setDate(end.getDate() - 6);

  return {
    startDate: toInputDate(start),
    endDate: toInputDate(end),
  };
};

const formatCurrency = (value: number) =>
  `ETB ${Math.round(value).toLocaleString()}`;

const formatNumber = (value: number) => value.toLocaleString();

const formatRange = (startDate: string, endDate: string) => {
  const formatter = new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
  return `${formatter.format(
    new Date(`${startDate}T00:00:00`),
  )} - ${formatter.format(new Date(`${endDate}T00:00:00`))}`;
};

export const DashboardPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [draftRange, setDraftRange] = useState(getDefaultDateRange);
  const [appliedRange, setAppliedRange] = useState(getDefaultDateRange);
  const [quickActionAnchor, setQuickActionAnchor] =
    useState<null | HTMLElement>(null);

  const dashboardFilters = useMemo(
    () => ({
      ordersLimit: 6,
      expiryWindowDays: 90,
      transactionsLimit: 5,
      lowStockLimit: 5,
      startDate: appliedRange.startDate,
      endDate: appliedRange.endDate,
    }),
    [appliedRange.endDate, appliedRange.startDate],
  );

  const {
    data,
    loading,
    refreshing,
    error,
    actionError,
    actionLoadingId,
    refresh,
    approveOrder,
  } = useDashboardData(dashboardFilters);

  const showManagerActions = user?.role === "pharmacy_manager";
  const dateRangeInvalid = draftRange.startDate > draftRange.endDate;
  const rangeLabel = formatRange(appliedRange.startDate, appliedRange.endDate);

  const kpis: DashboardKpi[] = [
    {
      id: "total-inventory",
      title: "Total Inventory",
      value: formatNumber(data?.totalMedicines ?? 0),
      icon: <Inventory2Outlined />,
      tone: "green",
      helper: `${formatCurrency(data?.totalStockValue ?? 0)} stock value`,
      trend: "neutral",
      trendValue: "Tenant-scoped catalog",
    },
    {
      id: "range-revenue",
      title: "Revenue",
      value: formatCurrency(data?.totalRevenue ?? 0),
      icon: <PaymentsOutlined />,
      tone: "gold",
      helper: `${formatNumber(data?.totalOrders ?? 0)} fulfilled orders`,
      trend: "neutral",
      trendValue: rangeLabel,
      chartData: data?.revenueTrend ?? [],
    },
    {
      id: "pending-orders",
      title: "Pending Queue",
      value: formatNumber(data?.pendingOrdersCount ?? 0),
      icon: <LocalShippingOutlined />,
      tone: "blue",
      helper: "Orders awaiting pharmacy approval",
      trend: data?.pendingOrdersCount ? "up" : "neutral",
      trendValue: data?.pendingOrdersCount ? "Actionable now" : "Queue clear",
    },
    {
      id: "low-stock",
      title: "Low Stock",
      value: formatNumber(data?.lowStockCount ?? 0),
      icon: <WarningAmberOutlined />,
      tone: data?.lowStockCount ? "red" : "green",
      helper: "Below reorder threshold",
      trend: data?.lowStockCount ? "down" : "neutral",
      trendValue: data?.lowStockCount ? "Restock review needed" : "Healthy",
    },
    {
      id: "active-customers",
      title: "Active Customers",
      value: formatNumber(data?.activeCustomersCount ?? 0),
      icon: <GroupOutlined />,
      tone: "slate",
      helper: `${formatNumber(data?.rangeCustomersCount ?? 0)} in range`,
      trend: "neutral",
      trendValue: "Distinct ordering customers",
    },
    {
      id: "stock-movement",
      title: "Stock Movement",
      value: `${formatNumber(data?.stockMovement.stockIn ?? 0)} / ${formatNumber(
        data?.stockMovement.stockOut ?? 0,
      )}`,
      icon: <TrendingUpOutlined />,
      tone: "green",
      helper: "Units in / out",
      trend: "neutral",
      trendValue: `${formatNumber(
        (data?.stockMovement.stockInTransactions ?? 0) +
          (data?.stockMovement.stockOutTransactions ?? 0),
      )} ledger entries`,
    },
  ];

  const applyDateRange = () => {
    if (!dateRangeInvalid) {
      setAppliedRange(draftRange);
    }
  };

  const resetDateRange = () => {
    const nextRange = getDefaultDateRange();
    setDraftRange(nextRange);
    setAppliedRange(nextRange);
  };

  return (
    <Box sx={{ pb: showManagerActions ? 10 : 0 }}>
      <Stack
        direction={{ xs: "column", lg: "row" }}
        spacing={3}
        sx={{
          mb: 4,
          justifyContent: "space-between",
          alignItems: { xs: "stretch", lg: "flex-end" },
        }}
      >
        <Box sx={{ maxWidth: 760 }}>
          <Typography
            variant="overline"
            sx={{
              color: "primary.main",
              display: "block",
              mb: 0.75,
              fontWeight: 700,
              letterSpacing: "0.08em",
            }}
          >
            PHARMACY OPERATIONS DASHBOARD
          </Typography>
          <Typography
            variant="h4"
            color="text.primary"
            gutterBottom
            sx={{ fontSize: { xs: "2rem", md: "2.35rem" }, fontWeight: 800 }}
          >
            Welcome back, {user?.name?.split(" ")[0] ?? "Manager"}
          </Typography>
          <Typography
            variant="body1"
            color="text.secondary"
            sx={{ maxWidth: 680, mt: 1, lineHeight: 1.6 }}
          >
            Monitor your current inventory, process pending orders, identify low
            stock items, and track revenue. Use the date filters to narrow down
            metrics to a specific timeframe. Quick actions are available at the
            bottom right.
          </Typography>
        </Box>

        <Stack
          spacing={1.25}
          sx={{
            width: { xs: "100%", lg: "auto" },
            p: 1.25,
            borderRadius: 0,
            bgcolor: "rgba(255,255,255,0.74)",
            border: "1px solid rgba(23, 35, 31, 0.12)",
          }}
        >
          <Stack
            direction={{ xs: "column", sm: "row" }}
            spacing={1.25}
            sx={{ alignItems: { xs: "stretch", sm: "center" } }}
          >
            <TextField
              label="Start date"
              type="date"
              size="small"
              value={draftRange.startDate}
              error={dateRangeInvalid}
              onChange={(event) =>
                setDraftRange((current) => ({
                  ...current,
                  startDate: event.target.value,
                }))
              }
              slotProps={{ inputLabel: { shrink: true } }}
            />
            <TextField
              label="End date"
              type="date"
              size="small"
              value={draftRange.endDate}
              error={dateRangeInvalid}
              onChange={(event) =>
                setDraftRange((current) => ({
                  ...current,
                  endDate: event.target.value,
                }))
              }
              slotProps={{ inputLabel: { shrink: true } }}
            />
            <Button
              variant="contained"
              startIcon={
                refreshing ? (
                  <CircularProgress size={16} color="inherit" />
                ) : (
                  <CalendarMonthOutlined />
                )
              }
              disabled={dateRangeInvalid || refreshing}
              onClick={applyDateRange}
            >
              Apply
            </Button>
            <Button
              variant="outlined"
              startIcon={<RefreshOutlined />}
              disabled={refreshing}
              onClick={resetDateRange}
            >
              7 days
            </Button>
          </Stack>
          <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
            <Chip
              size="small"
              label={rangeLabel}
              sx={{ fontWeight: 800, bgcolor: "rgba(15, 94, 77, 0.08)" }}
            />
            {data?.generatedAt && (
              <Typography variant="caption" color="text.secondary">
                Synced {new Date(data.generatedAt).toLocaleTimeString()}
              </Typography>
            )}
          </Stack>
          {dateRangeInvalid && (
            <Typography variant="caption" color="error.main">
              Start date must be before end date.
            </Typography>
          )}
        </Stack>
      </Stack>

      {/* Divider */}
      <Divider
        sx={{
          mb: 4,
          maxWidth: 200,
          borderWidth: 2,
          borderColor: "primary.main",
        }}
      />

      {error && data && (
        <Alert
          severity="warning"
          action={
            <Button color="inherit" size="small" onClick={refresh}>
              Retry
            </Button>
          }
          sx={{ mb: 3 }}
        >
          {error}
        </Alert>
      )}

      <Grid container spacing={2.5} sx={{ mb: 3 }}>
        {kpis.map((kpi) => (
          <Grid size={{ xs: 12, sm: 6, lg: 4, xl: 2 }} key={kpi.id}>
            <DashboardKpiCard kpi={kpi} />
          </Grid>
        ))}
      </Grid>

      <Grid container spacing={2.5}>
        <Grid size={{ xs: 12, lg: 8 }}>
          <RecentOrdersTable
            orders={data?.recentOrders ?? null}
            loading={loading}
            refreshing={refreshing}
            error={error && !data ? error : null}
            actionError={actionError}
            actionLoadingId={actionLoadingId}
            onRefresh={refresh}
            onApproveOrder={approveOrder}
          />
        </Grid>
        <Grid size={{ xs: 12, lg: 4 }}>
          <ExpiryAlertList
            batches={data?.expiringBatches ?? null}
            loading={loading}
            refreshing={refreshing}
            error={error && !data ? error : null}
            onRefresh={refresh}
          />
        </Grid>
        <Grid size={{ xs: 12 }}>
          <OperationalInsightPanel data={data} />
        </Grid>
      </Grid>

      {showManagerActions && (
        <>
          <Fab
            color="primary"
            variant="extended"
            onClick={(event) => setQuickActionAnchor(event.currentTarget)}
            sx={{
              position: "fixed",
              bottom: { xs: 20, md: 32 },
              right: { xs: 20, md: 32 },
              boxShadow: (theme) =>
                `0 12px 40px ${alpha(theme.palette.primary.main, 0.25)}`,
              zIndex: 1000,
              textTransform: "none",
              fontWeight: 700,
              px: 3,
              py: 1.5,
              borderRadius: "50px",
              "& .MuiSvgIcon-root": {
                mr: 1,
                fontSize: "1.35rem",
              },
              transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
              "&:hover": {
                transform: "translateY(-4px)",
                boxShadow: (theme) =>
                  `0 16px 48px ${alpha(theme.palette.primary.main, 0.35)}`,
              },
            }}
          >
            <PlaylistAddOutlined />
            Quick Action
          </Fab>
          <Menu
            anchorEl={quickActionAnchor}
            open={Boolean(quickActionAnchor)}
            onClose={() => setQuickActionAnchor(null)}
            transformOrigin={{ horizontal: "right", vertical: "bottom" }}
            anchorOrigin={{ horizontal: "right", vertical: "top" }}
            slotProps={{
              paper: {
                elevation: 0,
                sx: {
                  mb: 1.5,
                  minWidth: 240,
                  borderRadius: 2,
                  border: "1px solid rgba(255,255,255,0.78)",
                  backgroundColor: "rgba(255,255,255,0.88)",
                  backdropFilter: "blur(22px)",
                  boxShadow: "0 18px 54px rgba(18, 32, 28, 0.16)",
                },
              },
            }}
          >
            <MenuItem
              onClick={() => {
                setQuickActionAnchor(null);
                navigate("/inventory?new=medicine");
              }}
              sx={{ py: 1.5 }}
            >
              <ListItemIcon>
                <MedicationOutlined fontSize="small" color="primary" />
              </ListItemIcon>
              Add Medicine
            </MenuItem>
            <MenuItem
              onClick={() => {
                setQuickActionAnchor(null);
                navigate("/inventory?new=stock");
              }}
              sx={{ py: 1.5 }}
            >
              <ListItemIcon>
                <Inventory2Outlined fontSize="small" color="primary" />
              </ListItemIcon>
              Record Stock
            </MenuItem>
            <MenuItem
              onClick={() => {
                setQuickActionAnchor(null);
                navigate("/orders?status=pending");
              }}
              sx={{ py: 1.5 }}
            >
              <ListItemIcon>
                <AddShoppingCartOutlined fontSize="small" color="primary" />
              </ListItemIcon>
              Review Orders
            </MenuItem>
          </Menu>
        </>
      )}
    </Box>
  );
};
