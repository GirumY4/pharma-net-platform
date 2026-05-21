import {
  AddShoppingCartOutlined,
  CalendarMonthOutlined,
  GroupOutlined,
  Inventory2Outlined,
  LocalShippingOutlined,
  MedicationOutlined,
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
  Fab,
  Grid,
  ListItemIcon,
  Menu,
  MenuItem,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import { alpha } from "@mui/material/styles";
import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { surface, tokens } from "../../../styles/theme";
import { useAuth } from "../../../contexts/useAuth";
import { DashboardKpiCard } from "../components/DashboardKpiCard";
import { ExpiryAlertList } from "../components/ExpiryAlertList";
import { OperationalInsightPanel } from "../components/OperationalInsightPanel";
import { RecentOrdersTable } from "../components/RecentOrdersTable";
import { RevenueTrendCard } from "../components/RevenueTrendCard";
import { useDashboardData } from "../hooks/useDashboardData";
import type { DashboardKpi } from "../types";
import SEO from "../../../components/SEO";


/* ── helpers ────────────────────────────────────────────── */

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
  return { startDate: toInputDate(start), endDate: toInputDate(end) };
};

const formatCurrency = (value: number) =>
  `ETB ${Math.round(value).toLocaleString()}`;

const formatNumber = (value: number) => value.toLocaleString();

const formatRange = (startDate: string, endDate: string) => {
  const fmt = new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
  return `${fmt.format(new Date(`${startDate}T00:00:00`))} – ${fmt.format(
    new Date(`${endDate}T00:00:00`),
  )}`;
};

/* ── component ──────────────────────────────────────────── */

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

  /* 5 compact KPIs (revenue chart is separate) */
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
      id: "pending-orders",
      title: "Pending Queue",
      value: formatNumber(data?.pendingOrdersCount ?? 0),
      icon: <LocalShippingOutlined />,
      tone: "blue",
      helper: "Orders awaiting approval",
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
    if (!dateRangeInvalid) setAppliedRange(draftRange);
  };

  const resetDateRange = () => {
    const next = getDefaultDateRange();
    setDraftRange(next);
    setAppliedRange(next);
  };

  /* ── render ─────────────────────────────────────────── */

  return (
    <Box sx={{ pb: showManagerActions ? 10 : 0 }}>
      <SEO title="Dashboard" noIndex={true} />
      {/* ─────────────────── Header ─────────────────── */}
      <Box
        sx={{
          display: "flex",
          flexDirection: { xs: "column", md: "row" },
          justifyContent: "space-between",
          alignItems: { xs: "stretch", md: "flex-start" },
          gap: { xs: 2.5, md: 3 },
          mb: 4,
        }}
      >
        {/* Title block — mirrors Reports / Inventory / Orders header */}
        <Box>
          <Typography
            variant="h4"
            sx={{
              color: "primary.main",
              fontWeight: 800,
              letterSpacing: "-0.5px",
              fontSize: { xs: "1.6rem", sm: "1.85rem", md: "2.05rem" },
              mb: 0.5,
            }}
          >
            Welcome back, {user?.name?.split(" ")[0] ?? "Manager"}
          </Typography>
          <Typography
            variant="body1"
            color="text.secondary"
            sx={{
              maxWidth: 560,
              fontSize: { xs: "0.92rem", sm: "1rem", md: "1.05rem" },
              lineHeight: 1.65,
            }}
          >
            Monitor inventory, process pending orders, identify low-stock items,
            and track revenue across your pharmacy.
          </Typography>
        </Box>

        {/* Refresh */}
        <Tooltip title="Fetch latest data">
          <span>
            <Button
              variant="outlined"
              startIcon={
                refreshing ? (
                  <CircularProgress size={16} />
                ) : (
                  <RefreshOutlined />
                )
              }
              onClick={refresh}
              disabled={refreshing}
              sx={{
                alignSelf: { xs: "flex-start", md: "center" },
                fontWeight: 700,
                color: "text.secondary",
                borderColor: surface.border,
                textTransform: "none",
                "&:hover": {
                  bgcolor: (t) => alpha(t.palette.primary.main, 0.05),
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

      {/* ─────────────── Date-range filter ───────────── */}
      <Box
        sx={{
          display: "flex",
          gap: 2,
          alignItems: "center",
          flexWrap: "wrap",
          mb: 4,
        }}
      >
        <TextField
          label="Start date"
          type="date"
          size="small"
          value={draftRange.startDate}
          error={dateRangeInvalid}
          onChange={(e) =>
            setDraftRange((c) => ({ ...c, startDate: e.target.value }))
          }
          slotProps={{ inputLabel: { shrink: true } }}
          sx={{ minWidth: { xs: "100%", sm: 160 } }}
        />
        <TextField
          label="End date"
          type="date"
          size="small"
          value={draftRange.endDate}
          error={dateRangeInvalid}
          onChange={(e) =>
            setDraftRange((c) => ({ ...c, endDate: e.target.value }))
          }
          slotProps={{ inputLabel: { shrink: true } }}
          sx={{ minWidth: { xs: "100%", sm: 160 } }}
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
        <Tooltip title="Reset to last 7 days">
          <span>
            <Button
              variant="outlined"
              startIcon={<RefreshOutlined />}
              disabled={refreshing}
              onClick={resetDateRange}
              sx={{
                borderColor: surface.border,
                color: "text.secondary",
                "&:hover": {
                  borderColor: "primary.main",
                  color: "primary.main",
                  bgcolor: (t) => alpha(t.palette.primary.main, 0.04),
                },
              }}
            >
              7 days
            </Button>
          </span>
        </Tooltip>

        <Box sx={{ flexGrow: 1 }} />

        {/* Range chip + sync time */}
        <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
          <Chip
            size="small"
            label={rangeLabel}
            sx={(t) => ({
              fontWeight: 700,
              bgcolor: alpha(t.palette.primary.main, 0.07),
              color: "primary.dark",
              fontSize: { xs: "0.68rem", sm: "0.72rem" },
            })}
          />
          {data?.generatedAt && (
            <Typography
              variant="caption"
              sx={{
                color: "text.secondary",
                fontSize: { xs: "0.65rem", sm: "0.72rem" },
              }}
            >
              Synced {new Date(data.generatedAt).toLocaleTimeString()}
            </Typography>
          )}
        </Stack>

        {dateRangeInvalid && (
          <Typography
            variant="caption"
            color="error.main"
            sx={{ width: "100%" }}
          >
            Start date must be before end date.
          </Typography>
        )}
      </Box>

      {/* Stale-data warning */}
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

      {/* ────────────────── KPI cards ───────────────── */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        {kpis.map((kpi) => (
          <Grid size={{ xs: 12, sm: 6, md: 4, lg: 2.4 }} key={kpi.id}>
            <DashboardKpiCard kpi={kpi} />
          </Grid>
        ))}
      </Grid>

      {/* ───────────── Revenue trend (full width) ───── */}
      <Box sx={{ mb: 3 }}>
        <RevenueTrendCard
          data={data?.revenueTrend ?? []}
          loading={loading}
          rangeLabel={`${formatCurrency(data?.totalRevenue ?? 0)} total · ${formatNumber(data?.totalOrders ?? 0)} orders · ${rangeLabel}`}
        />
      </Box>

      {/* ─────────────── Detail panels ──────────────── */}
      <Grid container spacing={3}>
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

      {/* ─────────── Quick-action FAB (manager) ─────── */}
      {showManagerActions && (
        <>
          <Fab
            color="primary"
            variant="extended"
            onClick={(e) => setQuickActionAnchor(e.currentTarget)}
            sx={{
              position: "fixed",
              bottom: { xs: 20, md: 32 },
              right: { xs: 20, md: 32 },
              boxShadow: (t) => tokens.shadow.fab(t.palette.primary.main),
              zIndex: 1000,
              textTransform: "none",
              fontWeight: 700,
              px: 3,
              py: 1.5,
              borderRadius: `${tokens.radius.pill}px`,
              "& .MuiSvgIcon-root": { mr: 1, fontSize: "1.35rem" },
              transition: `all ${tokens.transition.normal}`,
              "&:hover": {
                transform: "translateY(-4px)",
                boxShadow: (t) =>
                  tokens.shadow.fabHover(t.palette.primary.main),
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
                  borderRadius: 3,
                  border: `1px solid ${surface.border}`,
                  backgroundColor: surface.glass,
                  backdropFilter: surface.blur,
                  boxShadow: tokens.shadow.panel,
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
