// src/features/orders/components/StatusChip.tsx
import { Chip, Tooltip } from "@mui/material";
import { STATUS_CONFIG } from "../constants";
import type { OrderStatus } from "../types";

interface StatusChipProps {
  status: OrderStatus;
  showTooltip?: boolean;
}

export const StatusChip = ({ status, showTooltip = true }: StatusChipProps) => {
  const config = STATUS_CONFIG[status];

  const tooltipContent = `${config.icon} ${config.label}`;

  return showTooltip ? (
    <Tooltip title={tooltipContent} arrow>
      <Chip
        label={config.label}
        size="small"
        sx={{
          fontWeight: 700,
          fontSize: "0.7rem",
          height: 24,
          bgcolor: config.bg,
          color: config.color,
          border: `1px solid ${config.border}`,
          "& .MuiChip-label": { px: 1 },
        }}
      />
    </Tooltip>
  ) : (
    <Chip
      label={config.label}
      size="small"
      sx={{
        fontWeight: 700,
        fontSize: "0.7rem",
        height: 24,
        bgcolor: config.bg,
        color: config.color,
        border: `1px solid ${config.border}`,
        "& .MuiChip-label": { px: 1 },
      }}
    />
  );
};
