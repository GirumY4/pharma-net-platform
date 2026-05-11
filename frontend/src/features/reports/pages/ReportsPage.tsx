// src/features/reports/pages/ReportsPage.tsx
import {
  Assessment,
  LocalShippingOutlined,
  TrendingUp,
  WarningAmberOutlined,
} from "@mui/icons-material";
import { Alert, Box, Grid, Typography } from "@mui/material";
import { useCallback, useState } from "react";
import { useAuth } from "../../../contexts/useAuth";
import { handleApiError } from "../../../utils/errorMapper";
import { DetailedLogsTable } from "../components/DetailedLogsTable";
import { ExpiryForecastTable } from "../components/ExpiryForecastTable";
import { KPICard } from "../components/KPICard";
import { ReportsHeader } from "../components/ReportsHeader";
import { RevenueChart } from "../components/RevenueChart";
import { StockDistributionChart } from "../components/StockDistributionChart";
import { TopMedicinesChart } from "../components/TopMedicinesChart";
import { useReports } from "../hooks/useReports";
import { exportReport } from "../services/reportsApi";
import type { DateRange } from "../types";

export const ReportsPage = () => {
  const { user } = useAuth();
  const isPharmacyManager = user?.role === "pharmacy_manager";

  const [dateRange, setDateRange] = useState<DateRange>({
    startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
    endDate: new Date(),
    preset: "7d",
  });

  const { report, loading, error, updateDateRange } = useReports(
    dateRange,
    true,
  );

  const handleDateRangeChange = useCallback(
    (newRange: DateRange) => {
      setDateRange(newRange);
      updateDateRange(newRange);
    },
    [updateDateRange],
  );

  const handleExport = useCallback(
    async (format: "csv" | "pdf") => {
      try {
        const blob = await exportReport({
          format,
          reportType: "dashboard",
          dateRange,
        });

        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `pharma-net-report-${dateRange.preset}-${new Date().toISOString().split("T")[0]}.${format}`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } catch (err) {
        const message = handleApiError(err);
        alert(message);
      }
    },
    [dateRange],
  );

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error" sx={{ borderRadius: 2 }}>
          {error}
        </Alert>
      </Box>
    );
  }

  return (
    <Box>
      <ReportsHeader
        dateRange={dateRange}
        onDateRangeChange={handleDateRangeChange}
        onExport={handleExport}
        loading={loading}
      />

      {/* KPI Cards Grid */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <KPICard
            title="Total Revenue"
            value={report ? `ETB ${report.totalRevenue.toLocaleString()}` : "—"}
            subtitle={report ? `${report.totalOrders} orders` : ""}
            trend={report ? { value: 12, direction: "up" } : undefined}
            icon={<TrendingUp sx={{ color: "#0F8B6C" }} />}
            colorGlow="#00ED64"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <KPICard
            title="Avg. Order Value"
            value={report ? `ETB ${report.averageOrderValue.toFixed(2)}` : "—"}
            subtitle="Per completed order"
            trend={report ? { value: 5, direction: "up" } : undefined}
            icon={<Assessment sx={{ color: "#DDAA4A" }} />}
            colorGlow="#F5D796"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <KPICard
            title="Fulfillment Rate"
            value={report ? `${report.fulfillmentRate}%` : "—"}
            subtitle="Orders delivered on time"
            progress={report?.fulfillmentRate}
            icon={<LocalShippingOutlined sx={{ color: "#2563EB" }} />}
            colorGlow="#3B82F6"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <KPICard
            title="Low Stock Alerts"
            value={report?.lowStockCount ?? 0}
            subtitle="Items below reorder threshold"
            trend={
              report?.lowStockCount === 0
                ? { value: 0, direction: "neutral" }
                : undefined
            }
            icon={<WarningAmberOutlined sx={{ color: "#D97706" }} />}
            colorGlow="#F59E0B"
          />
        </Grid>
      </Grid>

      {/* Charts Section */}
      <Grid container spacing={4} sx={{ mb: 4 }}>
        {/* Revenue Trend Chart */}
        <Grid size={{ xs: 12, lg: 8 }}>
          <RevenueChart
            data={report?.revenueTrend || []}
            loading={loading}
            title="Daily Revenue Trend"
          />
        </Grid>

        {/* Stock Distribution Chart */}
        <Grid size={{ xs: 12, lg: 4 }}>
          <StockDistributionChart
            data={
              report?.stockHealth || { healthy: 0, low: 0, critical: 0, out: 0 }
            }
            loading={loading}
            title="Stock Health Distribution"
          />
        </Grid>
      </Grid>

      {/* Top Medicines & Expiry Forecast */}
      <Grid container spacing={4} sx={{ mb: 4 }}>
        <Grid size={{ xs: 12, lg: 6 }}>
          <TopMedicinesChart
            data={report?.topMedicines || []}
            loading={loading}
            title="Top 5 Medicines by Volume"
          />
        </Grid>

        <Grid size={{ xs: 12, lg: 6 }}>
          <ExpiryForecastTable
            data={report?.expiringBatches || []}
            loading={loading}
            title="Expiring Batches (FEFO)"
            onViewAll={() => {
              // Navigate to detailed expiry report
            }}
          />
        </Grid>
      </Grid>

      {/* Detailed Logs Table */}
      <DetailedLogsTable
        transactions={report?.recentTransactions || []}
        loading={loading}
        title="Recent Inventory Transactions"
        onViewAll={() => {
          // Navigate to inventory transactions page
        }}
      />

      {/* Creative License: Expiry Forecast Insight */}
      {isPharmacyManager &&
        report?.nearExpiryCount &&
        report.nearExpiryCount > 0 && (
          <Alert
            severity="warning"
            sx={{
              mt: 4,
              borderRadius: 2,
              bgcolor: "rgba(217, 119, 6, 0.08)",
              border: "1px solid rgba(217, 119, 6, 0.3)",
              color: "#854D0E",
            }}
          >
            <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
              ⚠️ Expiry Forecast Alert
            </Typography>
            <Typography variant="body2">
              {report.nearExpiryCount} batch
              {report.nearExpiryCount !== 1 ? "es" : ""} expiring within 90
              days. Consider promotions or transfers to minimize waste.
            </Typography>
          </Alert>
        )}
    </Box>
  );
};
