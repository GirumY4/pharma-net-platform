// src/features/reports/components/TopMedicinesChart.tsx
import {
  Box,
  Chip,
  Paper,
  Skeleton,
  Typography,
  useTheme,
} from "@mui/material";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { CHART_COLORS } from "../constants";

interface TopMedicinesChartProps {
  data: {
    name: string;
    sku: string;
    category: string;
    qtySold: number;
    revenue: number;
  }[];
  loading: boolean;
  title?: string;
}

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("en-ET", {
    style: "currency",
    currency: "ETB",
    minimumFractionDigits: 2,
  }).format(value);

export const TopMedicinesChart = ({
  data,
  loading,
  title = "Top Medicines by Volume",
}: TopMedicinesChartProps) => {
  const theme = useTheme();

  if (loading) {
    return (
      <Paper
        elevation={0}
        sx={{
          p: 3,
          borderRadius: 4,
          border: "1px solid rgba(0,0,0,0.06)",
          bgcolor: "rgba(255, 255, 255, 0.7)",
          backdropFilter: "blur(24px)",
          minHeight: 320,
        }}
      >
        <Skeleton variant="text" width={180} height={24} sx={{ mb: 2 }} />
        <Box sx={{ height: 240 }}>
          {[...Array(5)].map((_, i) => (
            <Box key={i} sx={{ display: "flex", alignItems: "center", mb: 2 }}>
              <Skeleton variant="text" width={120} height={18} sx={{ mr: 2 }} />
              <Skeleton
                variant="rectangular"
                height={24}
                sx={{ flexGrow: 1, borderRadius: 1 }}
              />
            </Box>
          ))}
        </Box>
      </Paper>
    );
  }

  if (!data || data.length === 0) {
    return (
      <Paper
        elevation={0}
        sx={{
          p: 4,
          borderRadius: 4,
          border: "1px dashed rgba(23, 35, 31, 0.1)",
          bgcolor: "rgba(255, 255, 255, 0.7)",
          backdropFilter: "blur(24px)",
          textAlign: "center",
          minHeight: 320,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Typography color="text.secondary">
          No sales data for selected period
        </Typography>
      </Paper>
    );
  }

  const chartData = data.slice(0, 5).map((item, index) => ({
    name:
      item.name.length > 20 ? `${item.name.substring(0, 17)}...` : item.name,
    qtySold: item.qtySold,
    revenue: item.revenue,
    sku: item.sku,
    fill:
      index === 0
        ? CHART_COLORS.primary
        : index === 1
          ? CHART_COLORS.secondary
          : index === 2
            ? CHART_COLORS.tertiary
            : CHART_COLORS.quaternary,
  }));

  return (
    <Paper
      elevation={0}
      sx={{
        p: 3,
        borderRadius: 4,
        border: "1px solid rgba(0,0,0,0.06)",
        bgcolor: "rgba(255, 255, 255, 0.7)",
        backdropFilter: "blur(24px)",
        boxShadow: "0 10px 40px rgba(0,0,0,0.03)",
      }}
    >
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 3,
        }}
      >
        <Typography variant="h6" color="#1E293B" sx={{ fontWeight: 800 }}>
          {title}
        </Typography>
        <Chip
          label="By Quantity Sold"
          size="small"
          sx={{
            bgcolor: "rgba(15, 139, 108, 0.08)",
            color: CHART_COLORS.primary,
            fontWeight: 600,
            fontSize: "0.75rem",
          }}
        />
      </Box>

      <Box sx={{ height: 280, width: "100%" }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={chartData}
            layout="vertical"
            margin={{ top: 10, right: 30, left: 20, bottom: 10 }}
          >
            <CartesianGrid
              strokeDasharray="4 4"
              stroke="rgba(23, 35, 31, 0.1)"
              horizontal={false}
            />
            <XAxis
              type="number"
              tick={{ fontSize: 11, fill: theme.palette.text.secondary }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(value) => `${value / 100}k`}
            />
            <YAxis
              dataKey="name"
              type="category"
              tick={{
                fontSize: 11,
                fill: theme.palette.text.primary,
                fontWeight: 600,
              }}
              axisLine={false}
              tickLine={false}
              width={120}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "rgba(255, 255, 255, 0.95)",
                border: "1px solid rgba(0,0,0,0.1)",
                borderRadius: 8,
                boxShadow: "0 4px 20px rgba(0,0,0,0.1)",
                backdropFilter: "blur(8px)",
              }}
              formatter={(value: any, name: any) =>
                name === "revenue"
                  ? [formatCurrency(Number(value) || 0), "Revenue"]
                  : [`${value} units`, "Quantity Sold"]
              }
              labelFormatter={(label) =>
                chartData.find((d) => d.name === label)?.sku || label
              }
            />
            <Bar dataKey="qtySold" radius={[0, 4, 4, 0]} barSize={24}>
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.fill} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </Box>

      {/* Revenue summary below chart */}
      <Box sx={{ mt: 2, pt: 2, borderTop: "1px solid rgba(0,0,0,0.06)" }}>
        <Typography
          variant="caption"
          color="text.secondary"
          sx={{ display: "block", mb: 1 }}
        >
          Total Revenue (Top 5)
        </Typography>
        <Typography
          variant="h6"
          color={CHART_COLORS.primary}
          sx={{ fontWeight: 800 }}
        >
          {formatCurrency(
            data.slice(0, 5).reduce((sum, item) => sum + item.revenue, 0),
          )}
        </Typography>
      </Box>
    </Paper>
  );
};
