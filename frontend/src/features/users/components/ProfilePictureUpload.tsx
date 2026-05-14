import {
  Check,
  Close,
  Crop,
  DeleteOutlined,
  PhotoCamera,
  RestartAlt,
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
  Snackbar,
  Stack,
  Tooltip,
  Typography,
} from "@mui/material";
import "react-cropper/node_modules/cropperjs/dist/cropper.css";
import { useCallback, useEffect, useRef, useState } from "react";
import Cropper, { type ReactCropperElement } from "react-cropper";
import { API_BASE_URL } from "../../../services/api";
import { handleApiError } from "../../../utils/errorMapper";
import {
  removeProfilePicture,
  uploadProfilePicture,
} from "../services/usersApi";
import type { IUserProfile } from "../types";

interface ProfilePictureUploadProps {
  currentUser: IUserProfile | null;
  onUploadSuccess: (imageUrl: string) => void | Promise<void>;
  onRemoveSuccess: () => void | Promise<void>;
  disabled?: boolean;
}

const MAX_FILE_SIZE = 5 * 1024 * 1024;
const MIN_IMAGE_SIZE = 200;
const OUTPUT_IMAGE_SIZE = 512;
const OUTPUT_IMAGE_QUALITY = 0.82;
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];

const apiHost = API_BASE_URL.replace(/\/api\/?$/, "");

const getDisplayImageUrl = (url?: string | null) => {
  if (!url) return null;
  if (/^(blob:|data:|https?:\/\/)/i.test(url)) return url;
  return `${apiHost}${url}`;
};

const getImageDimensions = (file: File) =>
  new Promise<{ width: number; height: number }>((resolve, reject) => {
    const imageUrl = URL.createObjectURL(file);
    const image = new Image();

    image.onload = () => {
      URL.revokeObjectURL(imageUrl);
      resolve({ width: image.naturalWidth, height: image.naturalHeight });
    };
    image.onerror = () => {
      URL.revokeObjectURL(imageUrl);
      reject(new Error("We could not read that image. Please try another file."));
    };
    image.src = imageUrl;
  });

const compressImageBlob = (
  blob: Blob,
  fileName = "profile-picture.jpg",
): Promise<File> =>
  new Promise((resolve, reject) => {
    const imageUrl = URL.createObjectURL(blob);
    const image = new Image();

    image.onload = () => {
      const scale = Math.min(
        1,
        OUTPUT_IMAGE_SIZE / Math.max(image.naturalWidth, image.naturalHeight),
      );
      const width = Math.max(1, Math.round(image.naturalWidth * scale));
      const height = Math.max(1, Math.round(image.naturalHeight * scale));
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;

      const context = canvas.getContext("2d");
      if (!context) {
        URL.revokeObjectURL(imageUrl);
        reject(new Error("Image compression is not available in this browser."));
        return;
      }

      context.drawImage(image, 0, 0, width, height);
      canvas.toBlob(
        (compressedBlob) => {
          URL.revokeObjectURL(imageUrl);
          if (!compressedBlob) {
            reject(new Error("Image compression failed. Please try another image."));
            return;
          }

          resolve(
            new File([compressedBlob], fileName.replace(/\.[^.]+$/, ".jpg"), {
              type: "image/jpeg",
              lastModified: Date.now(),
            }),
          );
        },
        "image/jpeg",
        OUTPUT_IMAGE_QUALITY,
      );
    };

    image.onerror = () => {
      URL.revokeObjectURL(imageUrl);
      reject(new Error("Image compression failed. Please try another image."));
    };
    image.src = imageUrl;
  });

const StatusPill = ({ text }: { text: string }) => (
  <Typography
    variant="caption"
    sx={{
      alignSelf: "center",
      bgcolor: "rgba(15, 139, 108, 0.08)",
      borderRadius: 1,
      color: "success.dark",
      fontWeight: 800,
      px: 1,
      py: 0.5,
    }}
  >
    {text}
  </Typography>
);

export const ProfilePictureUpload = ({
  currentUser,
  onUploadSuccess,
  onRemoveSuccess,
  disabled = false,
}: ProfilePictureUploadProps) => {
  const [previewUrl, setPreviewUrl] = useState<string | null>(
    getDisplayImageUrl(currentUser?.profilePictureUrl),
  );
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [cropDialogOpen, setCropDialogOpen] = useState(false);
  const [cropZoom, setCropZoom] = useState(1);
  const cropperRef = useRef<ReactCropperElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const objectUrlRef = useRef<string | null>(null);

  const releaseObjectUrl = useCallback(() => {
    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current);
      objectUrlRef.current = null;
    }
  }, []);

  const setObjectPreview = useCallback(
    (file: File) => {
      releaseObjectUrl();
      const objectUrl = URL.createObjectURL(file);
      objectUrlRef.current = objectUrl;
      setPreviewUrl(objectUrl);
    },
    [releaseObjectUrl],
  );

  useEffect(() => {
    if (!selectedFile) {
      setPreviewUrl(getDisplayImageUrl(currentUser?.profilePictureUrl));
    }
  }, [currentUser?.profilePictureUrl, selectedFile]);

  useEffect(() => releaseObjectUrl, [releaseObjectUrl]);

  const validateFile = useCallback((file: File): string | null => {
    if (!ALLOWED_TYPES.includes(file.type)) {
      return "Only JPG, PNG, or WebP images are allowed.";
    }

    if (file.size > MAX_FILE_SIZE) {
      return `File size must be under ${MAX_FILE_SIZE / 1024 / 1024}MB.`;
    }

    return null;
  }, []);

  const clearSelection = useCallback(() => {
    releaseObjectUrl();
    setSelectedFile(null);
    setPreviewUrl(getDisplayImageUrl(currentUser?.profilePictureUrl));
    setCropDialogOpen(false);
    setCropZoom(1);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }, [currentUser?.profilePictureUrl, releaseObjectUrl]);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    const file = files?.[0];
    if (!file) return;

    if (files.length > 1) {
      setError("Please select one profile picture at a time.");
      event.target.value = "";
      return;
    }

    const validationError = validateFile(file);
    if (validationError) {
      setError(validationError);
      event.target.value = "";
      return;
    }

    try {
      const { width, height } = await getImageDimensions(file);
      if (width < MIN_IMAGE_SIZE || height < MIN_IMAGE_SIZE) {
        setError(`Image must be at least ${MIN_IMAGE_SIZE}x${MIN_IMAGE_SIZE}px.`);
        event.target.value = "";
        return;
      }

      setError(null);
      setSelectedFile(file);
      setObjectPreview(file);
      setCropZoom(1);
      setCropDialogOpen(true);
    } catch (err) {
      setError(handleApiError(err));
      event.target.value = "";
    }
  };

  const handleCrop = useCallback(() => {
    const cropper = cropperRef.current?.cropper;
    if (!cropper) return;

    cropper
      .getCroppedCanvas({
        width: 512,
        height: 512,
        imageSmoothingEnabled: true,
        imageSmoothingQuality: "high",
      })
      .toBlob(
        (blob) => {
          if (!blob) {
            setError("Image crop failed. Please try another image.");
            return;
          }

          compressImageBlob(blob, selectedFile?.name)
            .then((compressedFile) => {
              setSelectedFile(compressedFile);
              setObjectPreview(compressedFile);
              setSuccessMsg("Image prepared and compressed.");
              setCropDialogOpen(false);
            })
            .catch((err) => setError(handleApiError(err)));
        },
        "image/jpeg",
        0.92,
      );
  }, [selectedFile?.name, setObjectPreview]);

  const handleUpload = async () => {
    if (!selectedFile) return;

    setUploading(true);
    setError(null);

    try {
      const result = await uploadProfilePicture(selectedFile);
      await onUploadSuccess(result.profilePictureUrl);
      releaseObjectUrl();
      setPreviewUrl(getDisplayImageUrl(result.profilePictureUrl));
      setSelectedFile(null);
      setSuccessMsg("Profile picture updated.");
      if (fileInputRef.current) fileInputRef.current.value = "";
    } catch (err) {
      setError(handleApiError(err));
    } finally {
      setUploading(false);
    }
  };

  const handleRemove = async () => {
    if (selectedFile) {
      clearSelection();
      return;
    }

    if (!currentUser?.profilePictureUrl) return;

    setUploading(true);
    setError(null);

    try {
      await removeProfilePicture();
      await onRemoveSuccess();
      releaseObjectUrl();
      setPreviewUrl(null);
      setSuccessMsg("Profile picture removed.");
    } catch (err) {
      setError(handleApiError(err));
    } finally {
      setUploading(false);
    }
  };

  const triggerFileInput = () => {
    if (!disabled && !uploading) fileInputRef.current?.click();
  };

  return (
    <>
      <Paper
        elevation={0}
        sx={{
          p: { xs: 2.5, sm: 3 },
          borderRadius: 3,
          border: "1px solid rgba(0,0,0,0.06)",
          bgcolor: "rgba(255, 255, 255, 0.85)",
          backdropFilter: "blur(24px)",
          boxShadow: "0 10px 40px rgba(0,0,0,0.03)",
        }}
      >
        <Box
          sx={{
            display: "flex",
            alignItems: { xs: "flex-start", sm: "center" },
            flexDirection: { xs: "column", sm: "row" },
            gap: 3,
          }}
        >
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

            {uploading && (
              <CircularProgress
                size={96}
                sx={{
                  position: "absolute",
                  inset: 0,
                  color: "primary.main",
                }}
              />
            )}

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
                <Tooltip title="Choose photo">
                  <span>
                    <IconButton
                      size="small"
                      onClick={triggerFileInput}
                      disabled={uploading}
                      sx={{
                        bgcolor: "white",
                        boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                        "&:hover": { bgcolor: "#f5f5f5" },
                      }}
                    >
                      <PhotoCamera fontSize="small" sx={{ color: "#0F8B6C" }} />
                    </IconButton>
                  </span>
                </Tooltip>

                {previewUrl && (
                  <Tooltip
                    title={selectedFile ? "Discard selection" : "Remove photo"}
                  >
                    <span>
                      <IconButton
                        size="small"
                        onClick={handleRemove}
                        disabled={uploading}
                        sx={{
                          bgcolor: "white",
                          boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                          "&:hover": { bgcolor: "#f5f5f5" },
                        }}
                      >
                        <DeleteOutlined
                          fontSize="small"
                          sx={{ color: "#DC2626" }}
                        />
                      </IconButton>
                    </span>
                  </Tooltip>
                )}
              </Box>
            )}
          </Box>

          <Box sx={{ flexGrow: 1, width: "100%" }}>
            <Typography
              variant="subtitle1"
              sx={{ fontWeight: 800, color: "#1E293B", mb: 0.5 }}
            >
              Profile Picture
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Upload one professional profile picture. Images are cropped and
              compressed before they are saved.
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
                  fontWeight: 700,
                  "&:hover": {
                    borderColor: "#0F8B6C",
                    bgcolor: "rgba(15, 139, 108, 0.04)",
                  },
                }}
              >
                {previewUrl ? "Change Photo" : "Upload Photo"}
              </Button>

              {selectedFile && (
                <Button
                  variant="contained"
                  size="small"
                  startIcon={
                    uploading ? <CircularProgress size={16} /> : <Check />
                  }
                  onClick={handleUpload}
                  disabled={uploading}
                >
                  {uploading ? "Uploading..." : "Save Photo"}
                </Button>
              )}

              {selectedFile && (
                <Button
                  variant="text"
                  size="small"
                  startIcon={<RestartAlt />}
                  onClick={clearSelection}
                  disabled={uploading}
                >
                  Discard
                </Button>
              )}

              {currentUser?.profilePictureUrl && !selectedFile && (
                <StatusPill text="Photo in use" />
              )}
            </Stack>

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
                sx={{ display: "block", mb: 0.5, fontWeight: 700 }}
              >
                Requirements
              </Typography>
              <Stack direction="row" spacing={2} sx={{ flexWrap: "wrap" }}>
                <Typography variant="caption" color="text.secondary">
                  JPG, PNG, or WebP
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Max 5MB
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Min {MIN_IMAGE_SIZE}x{MIN_IMAGE_SIZE}px
                </Typography>
              </Stack>
            </Box>

            {error && (
              <Alert
                severity="error"
                sx={{ mt: 2 }}
                onClose={() => setError(null)}
              >
                {error}
              </Alert>
            )}
          </Box>
        </Box>
      </Paper>

      <input
        ref={fileInputRef}
        type="file"
        accept={ALLOWED_TYPES.join(",")}
        onChange={handleFileSelect}
        style={{ display: "none" }}
        disabled={disabled || uploading}
      />

      <Dialog
        open={cropDialogOpen}
        onClose={clearSelection}
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
                guides
                viewMode={1}
                dragMode="move"
                autoCropArea={0.8}
                background={false}
                zoomable
                scalable
                checkCrossOrigin={false}
              />
            </Box>
          )}

          <Box sx={{ mt: 2, display: "flex", alignItems: "center", gap: 2 }}>
            <IconButton
              size="small"
              aria-label="Zoom out"
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
              aria-label="Crop zoom"
              onChange={(_, value) => {
                const nextZoom = value as number;
                const cropper = cropperRef.current?.cropper;
                if (cropper) {
                  cropper.zoomTo(nextZoom);
                  setCropZoom(nextZoom);
                }
              }}
              min={0.1}
              max={3}
              step={0.1}
              sx={{ width: "100%", color: "#0F8B6C" }}
            />
            <IconButton
              size="small"
              aria-label="Zoom in"
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
          <Button onClick={clearSelection} startIcon={<Close />}>
            Cancel
          </Button>
          <Button variant="contained" onClick={handleCrop} startIcon={<Crop />}>
            Apply Crop
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={!!successMsg}
        autoHideDuration={3500}
        onClose={() => setSuccessMsg(null)}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert
          onClose={() => setSuccessMsg(null)}
          severity="success"
          variant="filled"
          sx={{ width: "100%" }}
        >
          {successMsg}
        </Alert>
      </Snackbar>
    </>
  );
};
