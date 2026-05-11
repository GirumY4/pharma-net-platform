// src/features/reports/components/ReportsHeader.tsx
import { CalendarToday, Download, FilterList } from "@mui/icons-material";
import {
  Box,
  Button,
  IconButton,
  Menu,
  MenuItem,
  ToggleButton,
  ToggleButtonGroup,
  Tooltip,
  Typography,
} from "@mui/material";
import { useState } from "react";
import type { DateRange, ReportDatePreset } from "../types";
import { DATE_PRESETS } from "../constants";

interface ReportsHeaderProps {
  dateRange: DateRange;
  onDateRangeChange: (range: DateRange) => void;
  onExport: (format: "csv" | "pdf") => void;
  loading?: boolean;
}

export const ReportsHeader = ({
  dateRange,
  onDateRangeChange,
  onExport,
  loading,
}: ReportsHeaderProps) => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  const handlePresetChange = (
    _: React.MouseEvent,
    newPreset: ReportDatePreset | null,
  ) => {
    if (!newPreset) return;

    const now = new Date();
    let startDate: Date;

    switch (newPreset) {
      case "7d":
        startDate = new Date(now);
        startDate.setDate(startDate.getDate() - 7);
        break;
      case "30d":
        startDate = new Date(now);
        startDate.setDate(startDate.getDate() - 30);
        break;
      case "90d":
        startDate = new Date(now);
        startDate.setDate(startDate.getDate() - 90);
        break;
      default:
        startDate = dateRange.startDate;
    }

    onDateRangeChange({
      startDate,
      endDate: now,
      preset: newPreset,
    });
  };

  return (
    <Box sx={{ mb: 4 }}>
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 3,
        }}
      >
        <Box>
          <Typography
            variant="h4"
            color="#0F5E4D"
            sx={{ fontWeight: 800, letterSpacing: "-0.5px" }}
          >
            Analytics & Reports
          </Typography>
          <Typography
            variant="body1"
            color="text.secondary"
            sx={{ fontSize: "1.1rem", maxWidth: 600 }}
          >
            Track your pharmacy's performance with actionable insights and
            exportable reports.
          </Typography>
        </Box>

        <Box sx={{ display: "flex", gap: 1.5 }}>
          <Tooltip title="Export report">
            <span>
              <Button
                variant="outlined"
                startIcon={<Download />}
                onClick={(e) => setAnchorEl(e.currentTarget)}
                disabled={loading}
                sx={{
                  borderColor: "#DDAA4A",
                  color: "#8A5F16",
                  fontWeight: 700,
                  "&:hover": {
                    borderColor: "#8A5F16",
                    bgcolor: "rgba(221, 170, 74, 0.08)",
                  },
                }}
              >
                Export
              </Button>
            </span>
          </Tooltip>

          <Menu
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={() => setAnchorEl(null)}
            slotProps={{
              paper: {
                elevation: 0,
                sx: {
                  mt: 1.5,
                  minWidth: 160,
                  borderRadius: 3,
                  border: "1px solid rgba(0,0,0,0.08)",
                  boxShadow: "0 10px 40px rgba(0,0,0,0.08)",
                },
              },
            }}
          >
            <MenuItem
              onClick={() => {
                onExport("csv");
                setAnchorEl(null);
              }}
            >
              Export as CSV
            </MenuItem>
            <MenuItem
              onClick={() => {
                onExport("pdf");
                setAnchorEl(null);
              }}
            >
              Export as PDF
            </MenuItem>
          </Menu>
        </Box>
      </Box>

      {/* Date Range Controls */}
      <Box
        sx={{ display: "flex", gap: 2, alignItems: "center", flexWrap: "wrap" }}
      >
        <ToggleButtonGroup
          value={dateRange.preset}
          exclusive
          onChange={handlePresetChange}
          size="small"
          sx={{
            "& .MuiToggleButton-root": {
              borderRadius: 2,
              border: "1px solid rgba(23, 35, 31, 0.2)",
              color: "text.secondary",
              fontWeight: 600,
              fontSize: "0.85rem",
              py: 0.75,
              px: 2,
              "&.Mui-selected": {
                bgcolor: "rgba(15, 139, 108, 0.12)",
                color: "#0F8B6C",
                border: "1px solid #0F8B6C",
                "&:hover": {
                  bgcolor: "rgba(15, 139, 108, 0.16)",
                },
              },
            },
          }}
        >
          {DATE_PRESETS.map((preset) => (
            <ToggleButton key={preset.value} value={preset.value}>
              {preset.label}
            </ToggleButton>
          ))}
        </ToggleButtonGroup>

        {dateRange.preset === "custom" && (
          <>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <CalendarToday
                fontSize="small"
                sx={{ color: "text.secondary" }}
              />
              <Typography variant="body2" color="text.secondary">
                {dateRange.startDate.toLocaleDateString()} —{" "}
                {dateRange.endDate.toLocaleDateString()}
              </Typography>
            </Box>
            <IconButton size="small" sx={{ color: "text.secondary" }}>
              <FilterList fontSize="small" />
            </IconButton>
          </>
        )}

        <Box sx={{ flexGrow: 1 }} />

        <Typography variant="caption" color="text.secondary">
          Last updated: {new Date().toLocaleTimeString()}
        </Typography>
      </Box>
    </Box>
  );
};
