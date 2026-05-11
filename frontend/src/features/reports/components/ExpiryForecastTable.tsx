// src/features/reports/components/ExpiryForecastTable.tsx
import { InfoOutlined, WarningAmberOutlined } from "@mui/icons-material";
import {
  Box,
  Chip,
  IconButton,
  Paper,
  Skeleton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tooltip,
  Typography,
} from "@mui/material";

import type { ExpiringBatch } from "../types";

interface ExpiryForecastTableProps {
  data: ExpiringBatch[] | null;
  loading: boolean;
  title?: string;
  onViewAll?: () => void;
}

export const ExpiryForecastTable = ({
  data,
  loading,
  title = "Expiring Batches (FEFO)",
  onViewAll,
}: ExpiryForecastTableProps) => {
  if (loading) {
    return (
      <Paper
        elevation={0}
        sx={{
          p: 0,
          borderRadius: 4,
          border: "1px solid rgba(0,0,0,0.06)",
          overflow: "hidden",
        }}
      >
        <Box
          sx={{
            p: 3,
            borderBottom: "1px solid rgba(0,0,0,0.06)",
            bgcolor: "#FAFAFA",
          }}
        >
          <Skeleton variant="text" width={180} height={24} sx={{ mb: 1 }} />
          <Skeleton variant="text" width={220} height={18} />
        </Box>
        <TableContainer>
          <Table>
            <TableBody>
              {[...Array(3)].map((_, i) => (
                <TableRow key={i}>
                  {[...Array(5)].map((_, cell) => (
                    <TableCell key={cell}>
                      <Skeleton variant="text" width={60} height={18} />
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
    );
  }

  if (!data || data.length === 0) {
    return (
      <Paper
        elevation={0}
        sx={{
          p: 6,
          borderRadius: 4,
          border: "1px dashed rgba(23, 35, 31, 0.1)",
          textAlign: "center",
        }}
      >
        <Box
          sx={{
            mb: 2,
            color: "primary.main",
            bgcolor: "rgba(15, 139, 108, 0.08)",
            p: 2,
            borderRadius: "50%",
            display: "inline-flex",
          }}
        >
          <WarningAmberOutlined fontSize="large" />
        </Box>
        <Typography
          variant="h6"
          color="#1E293B"
          sx={{ fontWeight: 700, mb: 1 }}
        >
          No expiring batches found
        </Typography>
        <Typography
          variant="body2"
          color="text.secondary"
          sx={{ maxWidth: 320, mx: "auto" }}
        >
          Great news! No medicines in your catalog are expiring within the
          selected timeframe.
        </Typography>
      </Paper>
    );
  }

  const getExpiryStatus = (days: number) => {
    if (days < 0) return { label: "Expired", color: "#6B7280", bg: "#F3F4F6" };
    if (days <= 30)
      return { label: "Critical", color: "#DC2626", bg: "#FEE2E2" };
    if (days <= 90)
      return { label: "Warning", color: "#D97706", bg: "#FEF3C7" };
    return { label: "Valid", color: "#059669", bg: "#D1FAE5" };
  };

  return (
    <Paper
      elevation={0}
      sx={{
        p: 0,
        borderRadius: 4,
        border: "1px solid rgba(0,0,0,0.06)",
        overflow: "hidden",
        boxShadow: "0 10px 40px rgba(0,0,0,0.03)",
      }}
    >
      <Box
        sx={{
          p: 3,
          borderBottom: "1px solid rgba(0,0,0,0.06)",
          bgcolor: "#FAFAFA",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <Box>
          <Typography variant="h6" color="#1E293B" sx={{ fontWeight: 800 }}>
            {title}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Batches expiring soon — prioritize dispensing or transfer.
          </Typography>
        </Box>
        {onViewAll && (
          <Tooltip title="View full expiry report">
            <IconButton
              size="small"
              onClick={onViewAll}
              sx={{
                color: "text.secondary",
                "&:hover": { color: "primary.main" },
              }}
            >
              <InfoOutlined fontSize="small" />
            </IconButton>
          </Tooltip>
        )}
      </Box>

      <TableContainer>
        <Table>
          <TableHead sx={{ bgcolor: "rgba(0,0,0,0.02)" }}>
            <TableRow>
              <TableCell sx={{ fontWeight: 700, color: "text.secondary" }}>
                Medicine
              </TableCell>
              <TableCell sx={{ fontWeight: 700, color: "text.secondary" }}>
                Batch
              </TableCell>
              <TableCell
                sx={{ fontWeight: 700, color: "text.secondary" }}
                align="right"
              >
                Qty
              </TableCell>
              <TableCell sx={{ fontWeight: 700, color: "text.secondary" }}>
                Expiry
              </TableCell>
              <TableCell sx={{ fontWeight: 700, color: "text.secondary" }}>
                Status
              </TableCell>
              <TableCell sx={{ fontWeight: 700, color: "text.secondary" }}>
                Location
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {data.slice(0, 5).map((item) => {
              const status = getExpiryStatus(item.daysUntilExpiry);
              return (
                <TableRow key={`${item.medicineId}-${item.batchNumber}`} hover>
                  <TableCell>
                    <Typography
                      variant="subtitle2"
                      sx={{ fontWeight: 600, color: "#1E293B" }}
                    >
                      {item.medicineName}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      SKU: {item.sku}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography
                      variant="body2"
                      sx={{ fontFamily: "monospace", fontSize: "0.85rem" }}
                    >
                      {item.batchNumber}
                    </Typography>
                    {item.gtin && (
                      <Typography
                        variant="caption"
                        color="text.secondary"
                        sx={{ display: "block", fontFamily: "monospace" }}
                      >
                        GTIN: {item.gtin}
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell align="right">
                    <Typography variant="body2" sx={{ fontWeight: 700 }}>
                      {item.quantity}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography
                      variant="body2"
                      sx={{
                        fontWeight: 600,
                        color: status.color,
                      }}
                    >
                      {new Date(item.expiryDate).toLocaleDateString()}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {item.daysUntilExpiry} days
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={status.label}
                      size="small"
                      sx={{
                        height: 24,
                        fontSize: "0.7rem",
                        fontWeight: 700,
                        bgcolor: status.bg,
                        color: status.color,
                        border: `1px solid ${status.color}33`,
                      }}
                    />
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" color="text.secondary">
                      {item.shelfLocation || "—"}
                    </Typography>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>
    </Paper>
  );
};
