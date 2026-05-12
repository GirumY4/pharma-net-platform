// src/features/users/components/ProfilePictureUpload.tsx
import {
  Check,
  Close,
  Crop,
  DeleteOutlined,
  PhotoCamera,
  ZoomIn,
  ZoomOut,
} from "@mui/icons-material";
import {
  Alert,
  Avatar,
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Paper,
  Slider,
  Stack,
  Typography,
} from "@mui/material";
import "cropperjs/dist/cropper.css";
import { useCallback, useRef, useState } from "react";
import Cropper, { type ReactCropperElement } from "react-cropper";
import { handleApiError } from "../../../utils/errorMapper";
import type { IUserProfile } from "../types";

interface ProfilePictureUploadProps {
  currentUser: IUserProfile | null;
  onUploadSuccess: (imageUrl: string) => void;
  onRemoveSuccess: () => void;
  disabled?: boolean;
}

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];

export const ProfilePictureUpload = ({
  currentUser,
  onUploadSuccess,
  onRemoveSuccess,
  disabled = false,
}: ProfilePictureUploadProps) => {
  const [previewUrl, setPreviewUrl] = useState<string | null>(
    currentUser?.profilePictureUrl || null,
  );
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cropDialogOpen, setCropDialogOpen] = useState(false);
  const [cropZoom, setCropZoom] = useState(1);
  const cropperRef = useRef<ReactCropperElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateFile = useCallback((file: File): string | null => {
    if (!ALLOWED_TYPES.includes(file.type)) {
      return "Only JPG, PNG, or WebP images are allowed.";
    }
    if (file.size > MAX_FILE_SIZE) {
      return `File size must be under ${MAX_FILE_SIZE / 1024 / 1024}MB.`;
    }
    return null;
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validationError = validateFile(file);
    if (validationError) {
      setError(validationError);
      return;
    }

    setError(null);
    setSelectedFile(file);

    // Create preview URL
    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);
    setCropDialogOpen(true);

    // Cleanup object URL on unmount or new selection
    return () => URL.revokeObjectURL(objectUrl);
  };

  const handleCrop = useCallback(() => {
    const cropper = cropperRef.current?.cropper;
    if (!cropper) return;

    cropper
      .getCroppedCanvas({
        width: 400,
        height: 400,
        imageSmoothingEnabled: true,
        imageSmoothingQuality: "high",
      })
      .toBlob(
        (blob) => {
          if (blob && selectedFile) {
            // Create a new File from the cropped blob
            const croppedFile = new File([blob], selectedFile.name, {
              type: "image/jpeg",
              lastModified: Date.now(),
            });
            setSelectedFile(croppedFile);
            setPreviewUrl(URL.createObjectURL(croppedFile));
            setCropDialogOpen(false);
          }
        },
        "image/jpeg",
        0.9,
      );
  }, [selectedFile]);

  const handleUpload = async () => {
    if (!selectedFile) return;

    setUploading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("profilePicture", selectedFile);

      // Call backend upload endpoint (to be implemented)
      const response = await fetch("/api/users/me/profile-picture", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || "Upload failed");
      }

      const result = await response.json();
      onUploadSuccess(result.data.profilePictureUrl);
      setSelectedFile(null);
    } catch (err) {
      const message = handleApiError(err);
      setError(message);
    } finally {
      setUploading(false);
    }
  };

  const handleRemove = async () => {
    if (!currentUser?.profilePictureUrl) return;

    setUploading(true);
    setError(null);

    try {
      const response = await fetch("/api/users/me/profile-picture", {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || "Remove failed");
      }

      onRemoveSuccess();
      setPreviewUrl(null);
    } catch (err) {
      const message = handleApiError(err);
      setError(message);
    } finally {
      setUploading(false);
    }
  };

  const triggerFileInput = () => {
    if (!disabled) {
      fileInputRef.current?.click();
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
        <Box sx={{ display: "flex", alignItems: "center", gap: 3 }}>
          {/* Avatar Preview */}
          <Box sx={{ position: "relative" }}>
            <Avatar
              src={previewUrl || undefined}
              sx={{
                width: 96,
                height: 96,
                bgcolor: "primary.main",
                fontWeight: 800,
                fontSize: "2rem",
                border: "3px solid white",
                boxShadow: "0 4px 20px rgba(15, 139, 108, 0.25)",
              }}
            >
              {!previewUrl && currentUser?.name?.charAt(0).toUpperCase()}
            </Avatar>

            {/* Overlay Actions */}
            {!disabled && (
              <Box
                sx={{
                  position: "absolute",
                  bottom: 0,
                  right: 0,
                  display: "flex",
                  gap: 0.5,
                }}
              >
                <IconButton
                  size="small"
                  onClick={triggerFileInput}
                  disabled={uploading}
                  sx={{
                    bgcolor: "white",
                    boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                    "&:hover": { bgcolor: "#f5f5f5" },
                  }}
                  title="Change photo"
                >
                  <PhotoCamera fontSize="small" sx={{ color: "#0F8B6C" }} />
                </IconButton>

                {previewUrl && (
                  <IconButton
                    size="small"
                    onClick={handleRemove}
                    disabled={uploading}
                    sx={{
                      bgcolor: "white",
                      boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                      "&:hover": { bgcolor: "#f5f5f5" },
                    }}
                    title="Remove photo"
                  >
                    <DeleteOutlined
                      fontSize="small"
                      sx={{ color: "#DC2626" }}
                    />
                  </IconButton>
                )}
              </Box>
            )}
          </Box>

          {/* Info & Actions */}
          <Box sx={{ flexGrow: 1 }}>
            <Typography
              variant="subtitle1"
              sx={{ fontWeight: 700, color: "#1E293B", mb: 0.5 }}
            >
              Profile Picture
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Upload a professional photo. Recommended: square image, at least
              400×400px.
            </Typography>

            <Stack direction="row" spacing={1.5} sx={{ flexWrap: "wrap" }}>
              <Button
                variant="outlined"
                size="small"
                startIcon={<PhotoCamera />}
                onClick={triggerFileInput}
                disabled={disabled || uploading}
                sx={{
                  borderColor: "rgba(15, 139, 108, 0.5)",
                  color: "#0F8B6C",
                  fontWeight: 600,
                  "&:hover": {
                    borderColor: "#0F8B6C",
                    bgcolor: "rgba(15, 139, 108, 0.04)",
                  },
                }}
              >
                {previewUrl ? "Change Photo" : "Upload Photo"}
              </Button>

              {previewUrl && !currentUser?.profilePictureUrl && (
                <Button
                  variant="contained"
                  size="small"
                  startIcon={
                    uploading ? <CircularProgress size={16} /> : <Check />
                  }
                  onClick={handleUpload}
                  disabled={uploading}
                  sx={{
                    background:
                      "linear-gradient(135deg, #0F8B6C 0%, #0A6B59 100%)",
                    "&:hover": {
                      background:
                        "linear-gradient(135deg, #0A6B59 0%, #064E3B 100%)",
                    },
                  }}
                >
                  {uploading ? "Uploading..." : "Save Photo"}
                </Button>
              )}

              {currentUser?.profilePictureUrl && !previewUrl && (
                <Typography variant="caption" color="text.secondary">
                  ✓ Photo uploaded
                </Typography>
              )}
            </Stack>

            {/* Validation Guidelines */}
            <Box
              sx={{
                mt: 2,
                p: 1.5,
                bgcolor: "rgba(23, 35, 31, 0.04)",
                borderRadius: 2,
              }}
            >
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ display: "block", mb: 0.5 }}
              >
                Requirements:
              </Typography>
              <Stack direction="row" spacing={2} sx={{ flexWrap: "wrap" }}>
                <Typography variant="caption" color="text.secondary">
                  • JPG, PNG, or WebP
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  • Max 5MB
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  • Min 200×200px
                </Typography>
              </Stack>
            </Box>

            {/* Error Display */}
            {error && (
              <Alert
                severity="error"
                sx={{ mt: 2, borderRadius: 2 }}
                onClose={() => setError(null)}
              >
                {error}
              </Alert>
            )}
          </Box>
        </Box>
      </Paper>

      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept={ALLOWED_TYPES.join(",")}
        onChange={handleFileSelect}
        style={{ display: "none" }}
        disabled={disabled}
      />

      {/* Crop Dialog */}
      <Dialog
        open={cropDialogOpen}
        onClose={() => setCropDialogOpen(false)}
        maxWidth="sm"
        fullWidth
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
          Adjust Profile Picture
        </DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          {previewUrl && (
            <Box
              sx={{ width: "100%", display: "flex", justifyContent: "center" }}
            >
              <Cropper
                ref={cropperRef}
                src={previewUrl}
                style={{ height: 300, width: "100%" }}
                aspectRatio={1}
                guides={true}
                viewMode={1}
                dragMode="move"
                autoCropArea={0.8}
                background={false}
                zoomable={true}
                scalable={true}
                checkCrossOrigin={false}
              />
            </Box>
          )}

          {/* Zoom Controls */}
          <Box sx={{ mt: 2, display: "flex", alignItems: "center", gap: 2 }}>
            <IconButton
              size="small"
              onClick={() => {
                const cropper = cropperRef.current?.cropper;
                if (cropper) {
                  cropper.zoom(-0.1);
                  setCropZoom((z) => Math.max(0.1, z - 0.1));
                }
              }}
            >
              <ZoomOut fontSize="small" />
            </IconButton>
            <Slider
              value={cropZoom}
              onChange={(_, value) => {
                const cropper = cropperRef.current?.cropper;
                if (cropper) {
                  cropper.zoomTo(value as number);
                  setCropZoom(value as number);
                }
              }}
              min={0.1}
              max={3}
              step={0.1}
              sx={{ width: "100%", color: "#0F8B6C" }}
            />
            <IconButton
              size="small"
              onClick={() => {
                const cropper = cropperRef.current?.cropper;
                if (cropper) {
                  cropper.zoom(0.1);
                  setCropZoom((z) => Math.min(3, z + 0.1));
                }
              }}
            >
              <ZoomIn fontSize="small" />
            </IconButton>
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button
            onClick={() => setCropDialogOpen(false)}
            startIcon={<Close />}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleCrop}
            startIcon={<Crop />}
            sx={{
              background: "linear-gradient(135deg, #0F8B6C 0%, #0A6B59 100%)",
              "&:hover": {
                background: "linear-gradient(135deg, #0A6B59 0%, #064E3B 100%)",
              },
            }}
          >
            Apply Crop
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};
