import {
  Inventory2Outlined,
  RefreshOutlined,
  WarningAmberOutlined,
} from "@mui/icons-material";
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Divider,
  List,
  Paper,
  Skeleton,
  Stack,
  Typography,
} from "@mui/material";
import { alpha } from "@mui/material/styles";
import type { ExpiringBatch } from "../types";
import { EmptyState } from "./EmptyState";

interface ExpiryAlertListProps {
  batches: ExpiringBatch[] | null;
  loading: boolean;
  refreshing: boolean;
  error: string | null;
  onRefresh: () => void;
}

const formatDate = (value: string) =>
  new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value));

const getExpiryTone = (daysUntilExpiry: number) => {
  if (daysUntilExpiry < 0) {
    return { label: "Expired", color: "#C2413B", bg: "#FDEBE9" };
  }
  if (daysUntilExpiry <= 30) {
    return { label: "Critical", color: "#C2413B", bg: "#FDEBE9" };
  }
  if (daysUntilExpiry <= 60) {
    return { label: "Watch", color: "#B7791F", bg: "#FFF7E6" };
  }
  return { label: "Scheduled", color: "#0F766E", bg: "#E7F7F2" };
};

const Header = ({
  refreshing,
  onRefresh,
}: {
  refreshing: boolean;
  onRefresh: () => void;
}) => (
  <Stack
    direction="row"
    spacing={2}
    sx={{
      justifyContent: "space-between",
      alignItems: "center",
      p: { xs: 2, sm: 2.5 },
      borderBottom: "1px solid rgba(23, 35, 31, 0.08)",
      background:
        "linear-gradient(135deg, rgba(255,255,255,0.72) 0%, rgba(247,250,249,0.76) 100%)",
    }}
  >
    <Box>
      <Typography
        variant="h6"
        sx={{ color: "text.primary", fontSize: { xs: "1rem", sm: "1.1rem" } }}
      >
        FEFO Alerts
      </Typography>
      <Typography
        variant="body2"
        color="text.secondary"
        sx={{ fontSize: { xs: "0.78rem", sm: "0.82rem" } }}
      >
        Earliest expiring batches with available stock.
      </Typography>
    </Box>
    <Button
      variant="outlined"
      size="small"
      startIcon={
        refreshing ? <CircularProgress size={16} /> : <RefreshOutlined />
      }
      disabled={refreshing}
      onClick={onRefresh}
    >
      Refresh
    </Button>
  </Stack>
);

export const ExpiryAlertList = ({
  batches,
  loading,
  refreshing,
  error,
  onRefresh,
}: ExpiryAlertListProps) => {
  if (loading) {
    return (
      <Paper
        elevation={0}
        sx={{
          borderRadius: 4,
          border: "1px solid rgba(255, 255, 255, 0.8)",
          backgroundColor: "rgba(255, 255, 255, 0.7)",
          backdropFilter: "blur(24px)",
          overflow: "hidden",
          boxShadow: "0 8px 32px rgba(0, 0, 0, 0.04)",
        }}
      >
        <Header refreshing={false} onRefresh={onRefresh} />
        <List sx={{ p: 0 }}>
          {[...Array(4)].map((_, i) => (
            <Box key={i}>
              <Stack spacing={1} sx={{ p: 2.5 }}>
                <Skeleton variant="text" width="68%" height={24} />
                <Skeleton variant="text" width="46%" height={18} />
                <Skeleton variant="rounded" width={92} height={24} />
              </Stack>
              {i < 3 && <Divider />}
            </Box>
          ))}
        </List>
      </Paper>
    );
  }

  if (error) {
    return (
      <Paper
        elevation={0}
        sx={{
          p: 3,
          borderRadius: 4,
          border: "1px solid rgba(255, 255, 255, 0.8)",
          backgroundColor: "rgba(255, 255, 255, 0.7)",
          backdropFilter: "blur(24px)",
          boxShadow: "0 8px 32px rgba(0, 0, 0, 0.04)",
        }}
      >
        <Alert
          severity="error"
          action={
            <Button color="inherit" size="small" onClick={onRefresh}>
              Retry
            </Button>
          }
        >
          {error}
        </Alert>
      </Paper>
    );
  }

  if (!batches || batches.length === 0) {
    return (
      <EmptyState
        title="No expiry risk"
        description="No stocked batches are inside the selected FEFO alert window."
        icon={<Inventory2Outlined fontSize="medium" />}
      />
    );
  }

  return (
    <Paper
      elevation={0}
      sx={{
        borderRadius: 4,
        border: "1px solid rgba(255, 255, 255, 0.8)",
        backgroundColor: "rgba(255, 255, 255, 0.7)",
        backdropFilter: "blur(24px)",
        overflow: "hidden",
        boxShadow: "0 8px 32px rgba(0, 0, 0, 0.04)",
      }}
    >
      <Header refreshing={refreshing} onRefresh={onRefresh} />
      <List sx={{ p: 0 }}>
        {batches.map((item, index) => {
          const tone = getExpiryTone(item.daysUntilExpiry);

          return (
            <Box key={`${item.medicineId}-${item.batchNumber}`}>
              <Stack
                direction="row"
                spacing={2}
                sx={(theme) => ({
                  justifyContent: "space-between",
                  alignItems: "center",
                  p: 2.5,
                  transition: "background-color 150ms ease",
                  "&:hover": {
                    bgcolor: alpha(theme.palette.primary.main, 0.035),
                  },
                })}
              >
                <Stack direction="row" spacing={1.5} sx={{ minWidth: 0 }}>
                  <Box
                    sx={{
                      width: 40,
                      height: 40,
                      flex: "0 0 auto",
                      borderRadius: 2,
                      display: "grid",
                      placeItems: "center",
                      color: tone.color,
                      bgcolor: tone.bg,
                    }}
                  >
                    <WarningAmberOutlined fontSize="small" />
                  </Box>
                  <Box sx={{ minWidth: 0 }}>
                    <Typography
                      variant="subtitle2"
                      sx={{ color: "text.primary" }}
                    >
                      {item.medicineName}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Batch {item.batchNumber}
                      {item.shelfLocation ? ` - ${item.shelfLocation}` : ""}
                    </Typography>
                    <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
                      <Chip
                        label={`Qty ${item.quantity}`}
                        size="small"
                        variant="outlined"
                        sx={{ height: 24, fontWeight: 750 }}
                      />
                      <Chip
                        label={tone.label}
                        size="small"
                        sx={{
                          height: 24,
                          fontWeight: 800,
                          bgcolor: tone.bg,
                          color: tone.color,
                        }}
                      />
                    </Stack>
                  </Box>
                </Stack>
                <Box sx={{ textAlign: "right", flex: "0 0 auto" }}>
                  <Typography variant="caption" color="text.secondary">
                    Expires
                  </Typography>
                  <Typography
                    variant="body2"
                    sx={{ color: tone.color, fontWeight: 850 }}
                  >
                    {formatDate(item.expiryDate)}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {item.daysUntilExpiry < 0
                      ? `${Math.abs(item.daysUntilExpiry)}d overdue`
                      : `${item.daysUntilExpiry}d left`}
                  </Typography>
                </Box>
              </Stack>
              {index < batches.length - 1 && <Divider />}
            </Box>
          );
        })}
      </List>
    </Paper>
  );
};
