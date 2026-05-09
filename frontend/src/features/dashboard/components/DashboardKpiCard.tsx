// src/features/dashboard/components/DashboardKpiCard.tsx
import { Box, Paper, Stack, Typography, useTheme } from "@mui/material";
import { alpha } from "@mui/material/styles";
import { Area, AreaChart, ResponsiveContainer, Tooltip, YAxis } from "recharts";
import type { DashboardKpi } from "../types";

const getToneColors = (tone: DashboardKpi["tone"], theme: any) => {
  if (tone === "red") {
    return {
      main: theme.palette.error.main,
      soft: alpha(theme.palette.error.main, 0.08),
    };
  }
  return {
    main: theme.palette.primary.main,
    soft: alpha(theme.palette.primary.main, 0.08),
  };
};

export const DashboardKpiCard = ({ kpi }: { kpi: DashboardKpi }) => {
  const theme = useTheme();
  const tone = getToneColors(kpi.tone, theme);
  const hasChart = Boolean(kpi.chartData?.length);

  return (
    <Paper
      elevation={0}
      sx={(theme) => ({
        p: 2.5,
        minHeight: hasChart ? 190 : 156,
        borderRadius: 2,
        border: "1px solid rgba(255, 255, 255, 0.8)",
        backgroundColor: "rgba(255, 255, 255, 0.78)",
        backdropFilter: "blur(22px)",
        boxShadow: "0 18px 48px rgba(18, 32, 28, 0.08)",
        position: "relative",
        overflow: "hidden",
        transition:
          "transform 180ms ease, box-shadow 180ms ease, border-color 180ms ease",
        "&::before": {
          content: '""',
          position: "absolute",
          inset: 0,
          background:
            "linear-gradient(135deg, rgba(255,255,255,0.7) 0%, rgba(247,250,249,0.28) 100%)",
          pointerEvents: "none",
        },
        "&:hover": {
          borderColor: alpha(theme.palette.primary.main, 0.28),
          boxShadow: "0 24px 64px rgba(18, 32, 28, 0.12)",
        },
      })}
    >
      <Stack spacing={2} sx={{ position: "relative", zIndex: 1 }}>
        <Stack direction="row" spacing={1.5} sx={{ alignItems: "flex-start" }}>
          <Box
            sx={{
              width: 44,
              height: 44,
              flex: "0 0 auto",
              borderRadius: 2,
              display: "grid",
              placeItems: "center",
              color: tone.main,
              bgcolor: tone.soft,
              border: `1px solid ${alpha(tone.main, 0.16)}`,
            }}
          >
            {kpi.icon}
          </Box>
          <Box sx={{ minWidth: 0, flex: 1 }}>
            <Typography
              variant="overline"
              sx={{
                color: "text.secondary",
                display: "block",
                lineHeight: 1.3,
              }}
            >
              {kpi.title}
            </Typography>
            <Typography
              variant="h4"
              sx={{
                color: "text.primary",
                fontSize: { xs: "1.7rem", md: "1.9rem" },
                overflowWrap: "anywhere",
              }}
            >
              {kpi.value}
            </Typography>
          </Box>
        </Stack>

        {(kpi.helper || kpi.trendValue) && (
          <Stack spacing={0.4}>
            {kpi.helper && (
              <Typography variant="body2" color="text.secondary">
                {kpi.helper}
              </Typography>
            )}
            {kpi.trendValue && (
              <Typography
                variant="caption"
                sx={{
                  color:
                    kpi.trend === "up"
                      ? "success.main"
                      : kpi.trend === "down"
                        ? "error.main"
                        : "text.secondary",
                  fontWeight: 750,
                }}
              >
                {kpi.trendValue}
              </Typography>
            )}
          </Stack>
        )}

        {hasChart && (
          <Box sx={{ width: "100%", height: 54 }}>
            <ResponsiveContainer
              width="100%"
              height="100%"
              minWidth={0}
              minHeight={0}
            >
              <AreaChart
                data={kpi.chartData}
                margin={{ top: 4, right: 0, bottom: 0, left: 0 }}
              >
                <defs>
                  <linearGradient
                    id={`${kpi.id}-chart`}
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop
                      offset="10%"
                      stopColor={tone.main}
                      stopOpacity={0.26}
                    />
                    <stop offset="90%" stopColor={tone.main} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <YAxis dataKey="revenue" hide domain={["auto", "auto"]} />
                <Tooltip
                  cursor={false}
                  formatter={(value) => [
                    `ETB ${Number(value).toLocaleString()}`,
                    "Revenue",
                  ]}
                  labelFormatter={(_, payload) => payload?.[0]?.payload?.label}
                  contentStyle={{
                    borderRadius: 8,
                    border: "1px solid rgba(15, 94, 77, 0.14)",
                    boxShadow: "0 14px 34px rgba(18, 32, 28, 0.14)",
                    fontSize: 12,
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke={tone.main}
                  strokeWidth={2.5}
                  fill={`url(#${kpi.id}-chart)`}
                  dot={false}
                  activeDot={{ r: 3.5 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </Box>
        )}
      </Stack>
    </Paper>
  );
};
