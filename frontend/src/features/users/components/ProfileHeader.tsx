// src/features/users/components/ProfileHeader.tsx
import Box from "@mui/material/Box";
import { Business, CloudUpload, Delete, Verified } from "@mui/icons-material";
import {
  Avatar,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  IconButton,
  Stack,
  Typography,
} from "@mui/material";
import type { IUserProfile } from "../types";
import type { SxProps, Theme } from "@mui/material/styles";
import { API_BASE_URL } from "../../../services/api";
import { ROLE_LABELS } from "../constants";
import { removeProfilePicture, uploadProfilePicture } from "../services/usersApi";
import { useRef, useState } from "react";

export const ProfileHeader = ({
  profile,
  sx,
}: {
  profile: IUserProfile;
  sx?: SxProps<Theme>;
}) => {
  const roleLabel = ROLE_LABELS[profile.role];
  const isPharmacyManager = profile.role === "pharmacy_manager";
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [uploading, setUploading] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const handleFileChange = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      await uploadProfilePicture(file);
      // Reload page or trigger refetch by firing an event
      window.location.reload();
    } catch (error) {
      console.error("Failed to upload profile picture:", error);
      alert("Failed to upload profile picture. Please try again.");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleDeletePicture = async () => {
    setUploading(true);
    try {
      await removeProfilePicture();
      window.location.reload();
    } catch (error) {
      console.error("Failed to remove profile picture:", error);
      alert("Failed to remove profile picture. Please try again.");
    } finally {
      setUploading(false);
      setDeleteDialogOpen(false);
    }
  };

  return (
    <Box sx={{ display: "flex", alignItems: "center", gap: 3, mb: 4, ...sx }}>
      <Box sx={{ position: "relative" }}>
        <Avatar
          src={
            profile.profilePictureUrl
              ? `${API_BASE_URL.replace("/api", "")}${profile.profilePictureUrl}`
              : undefined
          }
          sx={{
            width: 84,
            height: 84,
            bgcolor: "primary.main",
            fontWeight: 800,
            fontSize: "2rem",
            border: "4px solid white",
            boxShadow: "0 4px 20px rgba(15, 139, 108, 0.25)",
          }}
        >
          {profile.name?.charAt(0).toUpperCase()}
        </Avatar>

        {uploading && (
          <CircularProgress
            size={84}
            sx={{
              position: "absolute",
              top: 0,
              left: 0,
              color: "primary.main",
              zIndex: 1,
            }}
          />
        )}
      </Box>

      <input
        type="file"
        ref={fileInputRef}
        hidden
        accept="image/jpeg,image/png,image/webp"
        onChange={handleFileChange}
      />

      <Box sx={{ flexGrow: 1 }}>
        <Stack
          direction="row"
          spacing={1.5}
          sx={{ alignItems: "center", mb: 0.5 }}
        >
          <Typography variant="h5" color="#1E293B" sx={{ fontWeight: 800 }}>
            {profile.name}
          </Typography>
          {profile.isActive && (
            <Chip
              icon={<Verified fontSize="small" />}
              label="Active"
              size="small"
              sx={{
                bgcolor: "rgba(5, 150, 105, 0.12)",
                color: "#059669",
                fontWeight: 700,
                height: 24,
                fontSize: "0.75rem",
              }}
            />
          )}
        </Stack>

        <Typography variant="body1" color="text.secondary" sx={{ mb: 1 }}>
          {profile.email}
        </Typography>

        <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
          <Chip
            label={roleLabel}
            size="small"
            sx={{
              bgcolor: "rgba(15, 139, 108, 0.08)",
              color: "#0F8B6C",
              fontWeight: 700,
              fontSize: "0.75rem",
            }}
          />
          {isPharmacyManager && profile.pharmacyName && (
            <Chip
              icon={<Business fontSize="small" />}
              label={profile.pharmacyName}
              size="small"
              variant="outlined"
              sx={{
                borderColor: "rgba(221, 170, 74, 0.5)",
                color: "#8A5F16",
                fontWeight: 600,
                fontSize: "0.75rem",
              }}
            />
          )}
        </Stack>
        <Stack
          direction="row"
          spacing={1}
          sx={{ alignItems: "center", mt: 1.5 }}
        >
          <Button
            size="small"
            variant="outlined"
            startIcon={<CloudUpload />}
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            sx={{
              borderRadius: 2,
              textTransform: "none",
              fontWeight: 600,
            }}
          >
            Upload Photo
          </Button>
          {profile.profilePictureUrl && (
            <IconButton
              size="small"
              color="error"
              onClick={() => setDeleteDialogOpen(true)}
              disabled={uploading}
              sx={{
                border: "1px solid rgba(239, 68, 68, 0.3)",
                borderRadius: 2,
              }}
            >
              <Delete fontSize="small" />
            </IconButton>
          )}
        </Stack>
      </Box>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        sx={{ "& .MuiDialog-paper": { borderRadius: 3, p: 1 } }}
      >
        <DialogTitle sx={{ fontWeight: 800 }}>
          Remove Profile Picture
        </DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to remove your profile picture? This action
            cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button
            onClick={() => setDeleteDialogOpen(false)}
            color="inherit"
            sx={{ fontWeight: 600 }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleDeletePicture}
            color="error"
            variant="contained"
            disableElevation
            sx={{ fontWeight: 600, borderRadius: 2 }}
          >
            Remove
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};
