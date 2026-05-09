// src/features/inventory/components/StatusChip.tsx
import { Chip, Tooltip } from "@mui/material";
import { STOCK_STATUS_CONFIG } from "../constants";
import type { StockStatus } from "../types";

interface StatusChipProps {
  status: StockStatus;
  stockCount: number;
  reorderThreshold: number;
  showTooltip?: boolean;
}

export const StatusChip = ({
  status,
  stockCount,
  reorderThreshold,
  showTooltip = true,
}: StatusChipProps) => {
  const config = STOCK_STATUS_CONFIG[status];

  const tooltipContent = `Stock: ${stockCount} / Reorder at: ${reorderThreshold}`;

  return showTooltip ? (
    <Tooltip title={tooltipContent} arrow>
      <span>
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
      </span>
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
