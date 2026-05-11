// src/features/reports/index.ts
// Public API exports for the Reports feature module

// Pages
export { ReportsPage } from "./pages/ReportsPage";

// Components (for advanced usage)
export { DetailedLogsTable } from "./components/DetailedLogsTable";
export { ExpiryForecastTable } from "./components/ExpiryForecastTable";
export { KPICard } from "./components/KPICard";
export { ReportsHeader } from "./components/ReportsHeader";
export { RevenueChart } from "./components/RevenueChart";
export { StockDistributionChart } from "./components/StockDistributionChart";
export { TopMedicinesChart } from "./components/TopMedicinesChart";

// Hooks
export { useReports } from "./hooks/useReports";

// Services
export {
  exportReport,
  fetchDashboardReport,
  fetchExpiringReport,
  fetchInventoryReport,
  fetchPlatformReport,
  fetchSalesReport,
} from "./services/reportsApi";

// Types
export type {
  DashboardReport,
  DateRange,
  ExpiringReport,
  ExportOptions,
  InventoryReport,
  PlatformReport,
  ReportDatePreset,
  SalesReport,
} from "./types";

// Constants
export { CHART_COLORS, DATE_PRESETS } from "./constants";
