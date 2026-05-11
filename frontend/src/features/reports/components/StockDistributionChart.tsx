// src/features/reports/components/StockDistributionChart.tsx
import { Box, Paper, Skeleton, Typography } from "@mui/material";
import {
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
} from "recharts";

interface StockDistributionChartProps {
  data: {
    healthy: number;
    low: number;
    critical: number;
    out: number;
  };
  loading: boolean;
  title?: string;
}

const STOCK_HEALTH_CONFIG = {
  healthy: { label: "Healthy", color: "#059669", bg: "#D1FAE5" },
  low: { label: "Low Stock", color: "#D97706", bg: "#FEF3C7" },
  critical: { label: "Critical", color: "#DC2626", bg: "#FEE2E2" },
  out: { label: "Out of Stock", color: "#6B7280", bg: "#F3F4F6" },
};

const renderCustomizedLabel = ({
  cx,
  cy,
  midAngle,
  innerRadius,
  outerRadius,
  percent,
}: any) => {
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + radius * Math.cos((-midAngle * Math.PI) / 180);
  const y = cy + radius * Math.sin((-midAngle * Math.PI) / 180);

  return percent > 0.05 ? (
    <text
      x={x}
      y={y}
      fill="white"
      textAnchor={x > cx ? "start" : "end"}
      dominantBaseline="central"
      fontSize={11}
      fontWeight={600}
    >
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  ) : null;
};

export const StockDistributionChart = ({
  data,
  loading,
  title = "Stock Health Distribution",
}: StockDistributionChartProps) => {

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
        <Skeleton variant="text" width={200} height={24} sx={{ mb: 2 }} />
        <Box
          sx={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            height: 240,
          }}
        >
          <Skeleton variant="circular" width={200} height={200} />
        </Box>
      </Paper>
    );
  }

  const chartData = [
    {
      name: STOCK_HEALTH_CONFIG.healthy.label,
      value: data.healthy,
      color: STOCK_HEALTH_CONFIG.healthy.color,
    },
    {
      name: STOCK_HEALTH_CONFIG.low.label,
      value: data.low,
      color: STOCK_HEALTH_CONFIG.low.color,
    },
    {
      name: STOCK_HEALTH_CONFIG.critical.label,
      value: data.critical,
      color: STOCK_HEALTH_CONFIG.critical.color,
    },
    {
      name: STOCK_HEALTH_CONFIG.out.label,
      value: data.out,
      color: STOCK_HEALTH_CONFIG.out.color,
    },
  ].filter((item) => item.value > 0);

  if (chartData.length === 0) {
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
          No stock data available for selected period
        </Typography>
      </Paper>
    );
  }

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
      <Typography variant="h6" color="#1E293B" sx={{ fontWeight: 800, mb: 3 }}>
        {title}
      </Typography>

      <Box sx={{ height: 280, width: "100%" }}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={90}
              paddingAngle={2}
              dataKey="value"
              label={renderCustomizedLabel}
              labelLine={false}
            >
              {chartData.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={entry.color}
                  stroke="white"
                  strokeWidth={2}
                />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                backgroundColor: "rgba(255, 255, 255, 0.95)",
                border: "1px solid rgba(0,0,0,0.1)",
                borderRadius: 8,
                boxShadow: "0 4px 20px rgba(0,0,0,0.1)",
                backdropFilter: "blur(8px)",
              }}
              formatter={(value: any, name: any) => [`${value} items`, name]}
            />
            <Legend
              verticalAlign="bottom"
              height={36}
              iconType="circle"
              formatter={(value) => (
                <Typography
                  variant="caption"
                  sx={{ color: "text.secondary", ml: 1 }}
                >
                  {value}
                </Typography>
              )}
            />
          </PieChart>
        </ResponsiveContainer>
      </Box>
    </Paper>
  );
};
