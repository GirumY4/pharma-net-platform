// src/features/reports/components/KPICard.tsx
import { Box, LinearProgress, Paper, Typography } from "@mui/material";

interface KPICardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  trend?: {
    value: number;
    direction: "up" | "down" | "neutral";
  };
  icon?: React.ReactNode;
  colorGlow?: string;
  progress?: number; // 0-100 for progress bar
}

export const KPICard = ({
  title,
  value,
  subtitle,
  trend,
  icon,
  colorGlow = "#00ED64",
  progress,
}: KPICardProps) => (
  <Paper
    elevation={0}
    sx={{
      p: 3,
      borderRadius: 4,
      border: "1px solid rgba(255, 255, 255, 0.8)",
      backgroundColor: "rgba(255, 255, 255, 0.7)",
      backdropFilter: "blur(24px)",
      boxShadow: "0 8px 32px rgba(0, 0, 0, 0.04)",
      position: "relative",
      overflow: "hidden",
      transition: "transform 160ms ease, box-shadow 160ms ease",
      "&:hover": {
        transform: "translateY(-2px)",
        boxShadow: "0 12px 40px rgba(0, 0, 0, 0.08)",
      },
    }}
  >
    {/* Subtle Background Glow */}
    {colorGlow && (
      <Box
        sx={{
          position: "absolute",
          top: -20,
          right: -20,
          width: 100,
          height: 100,
          borderRadius: "50%",
          background: colorGlow,
          filter: "blur(40px)",
          opacity: 0.3,
          pointerEvents: "none",
        }}
      />
    )}

    <Box sx={{ position: "relative", zIndex: 1 }}>
      <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 2 }}>
        {icon && (
          <Box
            sx={{
              bgcolor: "white",
              color: "text.primary",
              p: 1.5,
              borderRadius: 2,
              display: "flex",
              boxShadow: "0 4px 12px rgba(0,0,0,0.05)",
              border: "1px solid rgba(0,0,0,0.04)",
            }}
          >
            {icon}
          </Box>
        )}
        <Typography
          variant="body2"
          color="text.secondary"
          sx={{
            fontWeight: 700,
            textTransform: "uppercase",
            letterSpacing: "0.05em",
          }}
        >
          {title}
        </Typography>
      </Box>

      <Typography
        variant="h4"
        color="#1E293B"
        sx={{ fontWeight: 800, lineHeight: 1, mb: 1 }}
      >
        {value}
      </Typography>

      {subtitle && (
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          {subtitle}
        </Typography>
      )}

      {trend && (
        <Typography
          variant="caption"
          sx={{
            color:
              trend.direction === "up"
                ? "success.main"
                : trend.direction === "down"
                  ? "error.main"
                  : "text.secondary",
            fontWeight: 600,
            display: "flex",
            alignItems: "center",
            gap: 0.5,
          }}
        >
          {trend.direction === "up"
            ? "↑"
            : trend.direction === "down"
              ? "↓"
              : "→"}{" "}
          {Math.abs(trend.value)}% vs previous period
        </Typography>
      )}

      {progress !== undefined && (
        <Box sx={{ mt: 2 }}>
          <LinearProgress
            variant="determinate"
            value={progress}
            sx={{
              height: 6,
              borderRadius: 3,
              bgcolor: "rgba(23, 35, 31, 0.1)",
              "& .MuiLinearProgress-bar": {
                bgcolor: colorGlow,
                borderRadius: 3,
              },
            }}
          />
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{ mt: 0.5, display: "block" }}
          >
            {progress}% of target
          </Typography>
        </Box>
      )}
    </Box>
  </Paper>
);
