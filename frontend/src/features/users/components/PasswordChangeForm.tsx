// src/features/users/components/PasswordChangeForm.tsx
import { Visibility, VisibilityOff } from "@mui/icons-material";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  IconButton,
  InputAdornment,
  Paper,
  TextField,
  Typography,
} from "@mui/material";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { handleApiError } from "../../../utils/errorMapper";
import { FORM_FIELD_RULES } from "../constants";
import { changePassword } from "../services/usersApi";
import type { ChangePasswordPayload } from "../types";

interface PasswordChangeFormProps {
  onSuccess: () => void;
}

export const PasswordChangeForm = ({ onSuccess }: PasswordChangeFormProps) => {
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const {
    control,
    handleSubmit,
    watch,
    formState: { errors },
    reset,
  } = useForm<ChangePasswordPayload>({
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
    mode: "onBlur",
  });

  const newPassword = watch("newPassword");

  const onFormSubmit = async (data: ChangePasswordPayload) => {
    setSubmitting(true);
    setError(null);
    try {
      await changePassword(data);
      reset();
      onSuccess();
    } catch (err) {
      const message = handleApiError(err);
      setError(message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
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
      <Typography variant="h6" color="#1E293B" sx={{ fontWeight: 800, mb: 3 }}>
        Change Password
      </Typography>

      {error && (
        <Alert
          severity="error"
          sx={{ mb: 3, borderRadius: 2 }}
          onClose={() => setError(null)}
        >
          {error}
        </Alert>
      )}

      <Box
        component="form"
        onSubmit={handleSubmit(onFormSubmit)}
        sx={{ display: "grid", gap: 2.5 }}
      >
        <Controller
          name="currentPassword"
          control={control}
          rules={{ required: "Current password is required" }}
          render={({ field }) => (
            <TextField
              {...field}
              label="Current Password *"
              type={showCurrent ? "text" : "password"}
              fullWidth
              error={!!errors.currentPassword}
              helperText={errors.currentPassword?.message}
              size="small"
              disabled={submitting}
              slotProps={{
                input: {
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={() => setShowCurrent(!showCurrent)}
                        edge="end"
                        size="small"
                        tabIndex={-1}
                      >
                        {showCurrent ? (
                          <VisibilityOff fontSize="small" />
                        ) : (
                          <Visibility fontSize="small" />
                        )}
                      </IconButton>
                    </InputAdornment>
                  ),
                },
              }}
            />
          )}
        />

        <Controller
          name="newPassword"
          control={control}
          rules={FORM_FIELD_RULES.password}
          render={({ field }) => (
            <TextField
              {...field}
              label="New Password *"
              type={showNew ? "text" : "password"}
              fullWidth
              error={!!errors.newPassword}
              helperText={errors.newPassword?.message}
              size="small"
              disabled={submitting}
              slotProps={{
                input: {
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={() => setShowNew(!showNew)}
                        edge="end"
                        size="small"
                        tabIndex={-1}
                      >
                        {showNew ? (
                          <VisibilityOff fontSize="small" />
                        ) : (
                          <Visibility fontSize="small" />
                        )}
                      </IconButton>
                    </InputAdornment>
                  ),
                },
              }}
            />
          )}
        />

        <Controller
          name="confirmPassword"
          control={control}
          rules={{
            required: "Please confirm your new password",
            validate: (value) =>
              value === newPassword || "Passwords do not match",
          }}
          render={({ field }) => (
            <TextField
              {...field}
              label="Confirm New Password *"
              type={showConfirm ? "text" : "password"}
              fullWidth
              error={!!errors.confirmPassword}
              helperText={errors.confirmPassword?.message}
              size="small"
              disabled={submitting}
              slotProps={{
                input: {
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={() => setShowConfirm(!showConfirm)}
                        edge="end"
                        size="small"
                        tabIndex={-1}
                      >
                        {showConfirm ? (
                          <VisibilityOff fontSize="small" />
                        ) : (
                          <Visibility fontSize="small" />
                        )}
                      </IconButton>
                    </InputAdornment>
                  ),
                },
              }}
            />
          )}
        />

        <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 2 }}>
          <Button
            variant="outlined"
            onClick={() => reset()}
            disabled={submitting}
          >
            Reset
          </Button>
          <Button
            type="submit"
            variant="contained"
            disabled={submitting}
            startIcon={submitting ? <CircularProgress size={16} /> : null}
            sx={{
              minWidth: 120,
              background: "linear-gradient(135deg, #0F8B6C 0%, #0A6B59 100%)",
              "&:hover": {
                background: "linear-gradient(135deg, #0A6B59 0%, #064E3B 100%)",
              },
            }}
          >
            {submitting ? "Updating..." : "Update Password"}
          </Button>
        </Box>
      </Box>
    </Paper>
  );
};
