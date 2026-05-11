// src/features/reports/components/EmptyReportState.tsx
import {
  Assessment,
  Inventory2Outlined,
  TrendingUp,
  WarningAmberOutlined,
} from "@mui/icons-material";
import { Box, Button, Typography } from "@mui/material";

interface EmptyReportStateProps {
  reportType: "inventory" | "sales" | "expiring" | "dashboard";
  onAction?: () => void;
  actionLabel?: string;
}

const REPORT_CONFIG = {
  inventory: {
    icon: <Inventory2Outlined fontSize="large" />,
    title: "No inventory data available",
    description:
      "Add medicines to your catalog or record stock adjustments to generate inventory reports.",
    color: "#0F8B6C",
    bg: "rgba(15, 139, 108, 0.08)",
  },
  sales: {
    icon: <TrendingUp fontSize="large" />,
    title: "No sales data for selected period",
    description:
      "Complete order fulfillments to generate sales analytics and revenue reports.",
    color: "#2563EB",
    bg: "rgba(37, 99, 235, 0.08)",
  },
  expiring: {
    icon: <WarningAmberOutlined fontSize="large" />,
    title: "No expiring batches found",
    description:
      "Great news! No medicines in your catalog are expiring within the selected timeframe.",
    color: "#D97706",
    bg: "rgba(217, 119, 6, 0.08)",
  },
  dashboard: {
    icon: <Assessment fontSize="large" />,
    title: "Dashboard data loading",
    description:
      "Gathering your pharmacy metrics. This may take a moment if this is your first report.",
    color: "#7C3AED",
    bg: "rgba(124, 58, 237, 0.08)",
  },
};

export const EmptyReportState = ({
  reportType,
  onAction,
  actionLabel = "Take Action",
}: EmptyReportStateProps) => {
  const config = REPORT_CONFIG[reportType];

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        py: 8,
        px: 3,
        textAlign: "center",
        bgcolor: "rgba(255, 255, 255, 0.6)",
        borderRadius: 3,
        border: `1px dashed ${config.color}33`,
      }}
    >
      <Box
        sx={{
          mb: 3,
          color: config.color,
          bgcolor: config.bg,
          p: 3,
          borderRadius: "50%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {config.icon}
      </Box>
      <Typography variant="h6" color="#1E293B" sx={{ fontWeight: 700, mb: 1 }}>
        {config.title}
      </Typography>
      <Typography
        variant="body2"
        color="text.secondary"
        sx={{ maxWidth: 360, mb: 3 }}
      >
        {config.description}
      </Typography>
      {onAction && (
        <Button
          variant="contained"
          size="small"
          onClick={onAction}
          sx={{
            background: `linear-gradient(135deg, ${config.color} 0%, ${config.color}CC 100%)`,
            "&:hover": {
              background: `linear-gradient(135deg, ${config.color}CC 0%, ${config.color} 100%)`,
            },
            fontWeight: 700,
            px: 3,
          }}
        >
          {actionLabel}
        </Button>
      )}
    </Box>
  );
};
