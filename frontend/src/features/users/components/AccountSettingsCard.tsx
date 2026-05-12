// src/features/users/components/AccountSettingsCard.tsx
import {
  Business,
  InfoOutlined,
  Shield,
  WarningAmberOutlined,
} from "@mui/icons-material";
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  Paper,
  Stack,
  Tooltip,
  Typography,
} from "@mui/material";
import { useState } from "react";
import { handleApiError } from "../../../utils/errorMapper";
import { ROLE_LABELS } from "../constants";
import type { IUserProfile } from "../types";

interface AccountSettingsCardProps {
  profile: IUserProfile;
  onDeactivate?: () => Promise<void>;
}

export const AccountSettingsCard = ({
  profile,
  onDeactivate,
}: AccountSettingsCardProps) => {
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [deactivating, setDeactivating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isPharmacyManager = profile.role === "pharmacy_manager";
  const isAdmin = profile.role === "admin";

  const handleDeactivate = async () => {
    if (!onDeactivate) return;
    setDeactivating(true);
    setError(null);
    try {
      await onDeactivate();
      setConfirmDialogOpen(false);
    } catch (err) {
      const message = handleApiError(err);
      setError(message);
    } finally {
      setDeactivating(false);
    }
  };

  return (
    <>
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
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 2.5 }}>
          <Shield sx={{ color: "#0F8B6C" }} />
          <Typography variant="h6" color="#1E293B" sx={{ fontWeight: 800 }}>
            Account Settings
          </Typography>
        </Box>

        {/* Account Status */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
            Account Status
          </Typography>
          <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
            <Chip
              icon={
                profile.isActive ? <InfoOutlined /> : <WarningAmberOutlined />
              }
              label={profile.isActive ? "Active" : "Inactive"}
              size="small"
              sx={{
                bgcolor: profile.isActive
                  ? "rgba(5, 150, 105, 0.12)"
                  : "rgba(217, 119, 6, 0.12)",
                color: profile.isActive ? "#059669" : "#D97706",
                fontWeight: 700,
                height: 24,
                fontSize: "0.75rem",
              }}
            />
            {profile.isDeleted && (
              <Chip
                label="Soft-Deleted"
                size="small"
                variant="outlined"
                sx={{
                  borderColor: "rgba(220, 38, 38, 0.3)",
                  color: "#DC2626",
                  fontWeight: 600,
                  fontSize: "0.75rem",
                }}
              />
            )}
          </Stack>
        </Box>

        <Divider sx={{ my: 2.5 }} />

        {/* Role & Tenant Info */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
            Role
          </Typography>
          <Chip
            label={ROLE_LABELS[profile.role]}
            size="small"
            sx={{
              bgcolor: "rgba(15, 139, 108, 0.08)",
              color: "#0F8B6C",
              fontWeight: 700,
              fontSize: "0.75rem",
              mb: 2,
            }}
          />

          {isPharmacyManager && (
            <>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                Tenant Identity
              </Typography>
              <Box
                sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}
              >
                <Business fontSize="small" sx={{ color: "#DDAA4A" }} />
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                  {profile.pharmacyName || profile.name}
                </Typography>
              </Box>
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ display: "block", mb: 2 }}
              >
                Your user ID serves as the pharmacy tenant identifier for all
                inventory, orders, and payments.
              </Typography>
            </>
          )}
        </Box>

        <Divider sx={{ my: 2.5 }} />

        {/* Account Management */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
            Account Management
          </Typography>

          {isAdmin ? (
            <Alert
              severity="info"
              icon={<InfoOutlined fontSize="inherit" />}
              sx={{
                borderRadius: 2,
                bgcolor: "rgba(37, 99, 235, 0.08)",
                color: "#2563EB",
                border: "1px solid rgba(37, 99, 235, 0.2)",
              }}
            >
              <Typography variant="caption">
                System Administrators cannot deactivate their own accounts.
                Please contact another admin for account management.
              </Typography>
            </Alert>
          ) : (
            <Tooltip
              title={
                isPharmacyManager
                  ? "Deactivating your pharmacy tenant will disable all inventory, orders, and payments for this pharmacy. This action cannot be undone without admin intervention."
                  : "Deactivating your account will prevent login. Contact an admin to reactivate."
              }
              arrow
              placement="top"
            >
              <Box>
                <Button
                  variant="outlined"
                  color="error"
                  size="small"
                  onClick={() => setConfirmDialogOpen(true)}
                  disabled={deactivating}
                  startIcon={<WarningAmberOutlined />}
                  sx={{
                    fontWeight: 700,
                    borderColor: "rgba(220, 38, 38, 0.5)",
                    color: "#DC2626",
                    "&:hover": {
                      borderColor: "#DC2626",
                      bgcolor: "rgba(220, 38, 38, 0.04)",
                    },
                  }}
                >
                  Deactivate Account
                </Button>
              </Box>
            </Tooltip>
          )}
        </Box>

        {/* Security Notice */}
        <Alert
          severity="warning"
          icon={<InfoOutlined fontSize="inherit" />}
          sx={{
            borderRadius: 2,
            bgcolor: "rgba(217, 119, 6, 0.08)",
            color: "#854D0E",
            border: "1px solid rgba(217, 119, 6, 0.2)",
          }}
        >
          <Typography variant="caption" sx={{ display: "block", mb: 0.5 }}>
            Security Notice
          </Typography>
          <Typography variant="caption" color="text.secondary">
            All account changes are recorded in the immutable audit log.
            Deactivation requires admin approval for reactivation.
          </Typography>
        </Alert>
      </Paper>

      {/* Deactivation Confirmation Dialog */}
      <Dialog
        open={confirmDialogOpen}
        onClose={() => setConfirmDialogOpen(false)}
        slotProps={{
          paper: {
            sx: {
              borderRadius: 3,
              border: "1px solid rgba(0,0,0,0.08)",
              boxShadow: "0 20px 60px rgba(0,0,0,0.12)",
            },
          },
        }}
      >
        <DialogTitle sx={{ fontWeight: 800, color: "#1E293B", pb: 1 }}>
          Confirm Account Deactivation
        </DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          {error && (
            <Alert
              severity="error"
              sx={{ mb: 2, borderRadius: 2 }}
              onClose={() => setError(null)}
            >
              {error}
            </Alert>
          )}

          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            {isPharmacyManager
              ? "Deactivating your pharmacy tenant will:"
              : "Deactivating your account will:"}
          </Typography>

          <Box component="ul" sx={{ pl: 2.5, mb: 2 }}>
            {isPharmacyManager ? (
              <>
                <Typography
                  component="li"
                  variant="body2"
                  color="text.secondary"
                  sx={{ mb: 0.5 }}
                >
                  • Immediately disable login access for this pharmacy
                </Typography>
                <Typography
                  component="li"
                  variant="body2"
                  color="text.secondary"
                  sx={{ mb: 0.5 }}
                >
                  • Hide all medicines, orders, and payments from the global
                  marketplace
                </Typography>
                <Typography
                  component="li"
                  variant="body2"
                  color="text.secondary"
                  sx={{ mb: 0.5 }}
                >
                  • Preserve all historical data for audit compliance
                  (soft-delete)
                </Typography>
                <Typography
                  component="li"
                  variant="body2"
                  color="text.secondary"
                >
                  • Require System Administrator approval to reactivate
                </Typography>
              </>
            ) : (
              <>
                <Typography
                  component="li"
                  variant="body2"
                  color="text.secondary"
                  sx={{ mb: 0.5 }}
                >
                  • Immediately disable login access
                </Typography>
                <Typography
                  component="li"
                  variant="body2"
                  color="text.secondary"
                  sx={{ mb: 0.5 }}
                >
                  • Preserve order history and payment records for audit
                  compliance
                </Typography>
                <Typography
                  component="li"
                  variant="body2"
                  color="text.secondary"
                >
                  • Require System Administrator approval to reactivate
                </Typography>
              </>
            )}
          </Box>

          <Typography
            variant="body2"
            color="error.main"
            sx={{ fontWeight: 700 }}
          >
            This action cannot be undone automatically. Contact an admin to
            restore access.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button
            onClick={() => setConfirmDialogOpen(false)}
            disabled={deactivating}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            color="error"
            onClick={handleDeactivate}
            disabled={deactivating}
            startIcon={deactivating ? <CircularProgress size={16} /> : null}
            sx={{
              background: "linear-gradient(135deg, #DC2626 0%, #B91C1C 100%)",
              "&:hover": {
                background: "linear-gradient(135deg, #B91C1C 0%, #991B1B 100%)",
              },
            }}
          >
            {deactivating ? "Deactivating..." : "Confirm Deactivate"}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};
