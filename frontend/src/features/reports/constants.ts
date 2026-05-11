// src/features/reports/constants.ts
import type { ReportDatePreset } from "./types";

export const DATE_PRESETS: { label: string; value: ReportDatePreset }[] = [
  { label: "7 Days", value: "7d" },
  { label: "30 Days", value: "30d" },
  { label: "90 Days", value: "90d" },
  { label: "Custom", value: "custom" },
];

export const CHART_COLORS = {
  primary: "#0F8B6C",
  secondary: "#0A6B59",
  tertiary: "#064E3B",
  quaternary: "#0F8B6C80",
  success: "#10B981",
  warning: "#F59E0B",
  error: "#EF4444",
  info: "#3B82F6",
  neutral: "#6B7280",
  gradients: {
    green: ["#0F8B6C", "#0F8B6C00"],
    gold: ["#DDAA4A", "#DDAA4A00"],
    blue: ["#2563EB", "#2563EB00"],
  },
};
