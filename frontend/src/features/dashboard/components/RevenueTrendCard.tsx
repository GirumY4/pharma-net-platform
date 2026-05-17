import { Box, Paper, Skeleton, Typography, useTheme } from "@mui/material";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { surface, tokens } from "../../../styles/theme";
import type { RevenueTrendPoint } from "../types";

interface RevenueTrendCardProps {
  data: RevenueTrendPoint[];
  loading: boolean;
  rangeLabel: string;
}

const formatCurrency = (value: number) =>
  `ETB ${Math.round(value).toLocaleString()}`;

const formatDate = (date: string) => {
  if (!date) return "";
  const d = new Date(date);
  if (isNaN(d.getTime())) return String(date);
  return d.toLocaleDateString("en", { month: "short", day: "numeric" });
};

export const RevenueTrendCard = ({
  data,
  loading,
  rangeLabel,
}: RevenueTrendCardProps) => {
  const theme = useTheme();
  const primary = theme.palette.primary.main;

  if (loading) {
    return (
      <Paper
        elevation={0}
        sx={{
          p: { xs: 2.5, sm: 3 },
          borderRadius: 4,
          border: "1px solid rgba(0,0,0,0.06)",
          bgcolor: "rgba(255, 255, 255, 0.7)",
          backdropFilter: surface.blur,
          minHeight: 260,
        }}
      >
        <Skeleton variant="text" width={180} height={24} sx={{ mb: 1 }} />
        <Skeleton variant="text" width={120} height={16} sx={{ mb: 2 }} />
        <Skeleton
          variant="rectangular"
          height={180}
          sx={{ borderRadius: 2 }}
        />
      </Paper>
    );
  }

  if (!data || data.length === 0) {
    return (
      <Paper
        elevation={0}
        sx={{
          p: { xs: 3, sm: 4 },
          borderRadius: 4,
          border: `1px dashed ${surface.border}`,
          bgcolor: "rgba(255, 255, 255, 0.7)",
          backdropFilter: surface.blur,
          textAlign: "center",
          minHeight: 260,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Typography color="text.secondary">
          No revenue data for selected period
        </Typography>
      </Paper>
    );
  }

  return (
    <Paper
      elevation={0}
      sx={{
        p: { xs: 2.5, sm: 3 },
        borderRadius: 4,
        border: "1px solid rgba(255, 255, 255, 0.8)",
        bgcolor: "rgba(255, 255, 255, 0.7)",
        backdropFilter: surface.blur,
        boxShadow: "0 8px 32px rgba(0, 0, 0, 0.04)",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Header */}
      <Box sx={{ mb: 2.5 }}>
        <Typography
          variant="h6"
          sx={{
            color: "text.primary",
            fontWeight: 800,
            fontSize: { xs: "1rem", sm: "1.1rem" },
            mb: 0.25,
          }}
        >
          Revenue Trend
        </Typography>
        <Typography
          variant="caption"
          color="text.secondary"
          sx={{ fontSize: { xs: "0.7rem", sm: "0.75rem" } }}
        >
          {rangeLabel}
        </Typography>
      </Box>

      {/* Chart */}
      <Box sx={{ height: { xs: 180, sm: 210, md: 220 }, width: "100%", minHeight: 0 }}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={data}
            margin={{ top: 8, right: 12, left: 0, bottom: 0 }}
          >
            <defs>
              <linearGradient
                id="dashboard-revenue-gradient"
                x1="0"
                y1="0"
                x2="0"
                y2="1"
              >
                <stop offset="5%" stopColor={primary} stopOpacity={0.3} />
                <stop offset="95%" stopColor={primary} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid
              strokeDasharray="4 4"
              stroke="rgba(23, 35, 31, 0.08)"
              vertical={false}
            />
            <XAxis
              dataKey="label"
              tickFormatter={formatDate}
              tick={{
                fontSize: 10,
                fill: theme.palette.text.secondary,
              }}
              axisLine={false}
              tickLine={false}
              interval={Math.max(0, Math.floor(data.length / 6))}
            />
            <YAxis
              tickFormatter={(v) =>
                v >= 1000 ? `${(v / 1000).toFixed(0)}k` : String(v)
              }
              tick={{
                fontSize: 10,
                fill: theme.palette.text.secondary,
              }}
              axisLine={false}
              tickLine={false}
              width={38}
            />
            <Tooltip
              cursor={false}
              contentStyle={{
                backgroundColor: "rgba(255, 255, 255, 0.95)",
                border: `1px solid ${surface.border}`,
                borderRadius: tokens.radius.sm,
                boxShadow: tokens.shadow.elevated,
                backdropFilter: "blur(8px)",
                fontFamily: theme.typography.fontFamily as string,
                fontSize: 12,
              }}
              labelFormatter={(_, payload) => payload?.[0]?.payload?.label}
              formatter={(value) => [formatCurrency(Number(value)), "Revenue"]}
            />
            <Area
              type="monotone"
              dataKey="revenue"
              stroke={primary}
              strokeWidth={2}
              fill="url(#dashboard-revenue-gradient)"
              dot={false}
              activeDot={{
                r: 4,
                fill: primary,
                stroke: "#fff",
                strokeWidth: 2,
              }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </Box>
    </Paper>
  );
};
