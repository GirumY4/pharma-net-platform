import { Box, Paper, Stack, Typography } from "@mui/material";
import { alpha } from "@mui/material/styles";
import { kpiTones, surface, tokens } from "../../../styles/theme";
import type { DashboardKpi } from "../types";

const getToneColors = (tone: DashboardKpi["tone"]) => {
  const resolved = kpiTones[tone] ?? kpiTones.green;
  return { main: resolved.main, soft: resolved.soft };
};

export const DashboardKpiCard = ({ kpi }: { kpi: DashboardKpi }) => {
  const tone = getToneColors(kpi.tone);

  return (
    <Paper
      elevation={0}
      sx={{
        p: { xs: 2.25, sm: 2.5 },
        height: "100%",
        borderRadius: 4,
        border: `1px solid rgba(255, 255, 255, 0.8)`,
        backgroundColor: "rgba(255, 255, 255, 0.7)",
        backdropFilter: surface.blur,
        boxShadow: "0 8px 32px rgba(0, 0, 0, 0.04)",
        position: "relative",
        overflow: "hidden",
        transition: `transform ${tokens.transition.fast}, box-shadow ${tokens.transition.fast}`,
        "&:hover": {
          transform: "translateY(-2px)",
          boxShadow: "0 12px 40px rgba(0, 0, 0, 0.08)",
        },
      }}
    >
      {/* Subtle colour glow — matches Reports KPICard */}
      <Box
        sx={{
          position: "absolute",
          top: -20,
          right: -20,
          width: 90,
          height: 90,
          borderRadius: "50%",
          background: tone.main,
          filter: "blur(40px)",
          opacity: 0.25,
          pointerEvents: "none",
        }}
      />

      <Box sx={{ position: "relative", zIndex: 1 }}>
        {/* Icon + label row */}
        <Stack
          direction="row"
          spacing={1.5}
          sx={{ alignItems: "center", mb: 2 }}
        >
          <Box
            sx={{
              bgcolor: "white",
              color: tone.main,
              p: 1.25,
              borderRadius: 2,
              display: "flex",
              boxShadow: "0 4px 12px rgba(0,0,0,0.05)",
              border: `1px solid ${alpha(tone.main, 0.08)}`,
              "& .MuiSvgIcon-root": { fontSize: "1.2rem" },
            }}
          >
            {kpi.icon}
          </Box>
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: "0.05em",
              fontSize: { xs: "0.68rem", sm: "0.72rem" },
              lineHeight: 1.3,
            }}
          >
            {kpi.title}
          </Typography>
        </Stack>

        {/* Primary value */}
        <Typography
          variant="h4"
          sx={{
            color: "text.primary",
            fontWeight: 800,
            lineHeight: 1,
            mb: 0.75,
            fontSize: { xs: "1.5rem", sm: "1.65rem", md: "1.75rem" },
            letterSpacing: "-0.01em",
          }}
        >
          {kpi.value}
        </Typography>

        {/* Helper text */}
        {kpi.helper && (
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{
              mb: kpi.trendValue ? 1 : 0,
              fontSize: { xs: "0.78rem", sm: "0.82rem" },
              lineHeight: 1.5,
            }}
          >
            {kpi.helper}
          </Typography>
        )}

        {/* Trend indicator */}
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
              fontWeight: 600,
              display: "flex",
              alignItems: "center",
              gap: 0.5,
              fontSize: { xs: "0.68rem", sm: "0.72rem" },
            }}
          >
            {kpi.trend === "up"
              ? "↑"
              : kpi.trend === "down"
                ? "↓"
                : "→"}{" "}
            {kpi.trendValue}
          </Typography>
        )}
      </Box>
    </Paper>
  );
};
