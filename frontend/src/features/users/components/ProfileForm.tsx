// src/features/users/components/ProfileForm.tsx
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Divider,
  Paper,
  TextField,
  Typography,
} from "@mui/material";
import { useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { handleApiError } from "../../../utils/errorMapper";
import { FORM_FIELD_RULES } from "../constants";
import { updateUserProfile } from "../services/usersApi";
import type { IUserProfile, UpdateProfilePayload } from "../types";

interface ProfileFormProps {
  profile: IUserProfile | null;
  onSuccess: () => void;
}

export const ProfileForm = ({ profile, onSuccess }: ProfileFormProps) => {
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors, isDirty },
    reset,
  } = useForm<UpdateProfilePayload>({
    defaultValues: {
      name: profile?.name || "",
      phoneNumber: profile?.phoneNumber || "",
      address: profile?.address || "",
      city: profile?.city || "",
      location: profile?.location || null,
    },
    mode: "onBlur",
  });

  // Reset form when profile changes
  useEffect(() => {
    if (profile) {
      reset({
        name: profile.name,
        phoneNumber: profile.phoneNumber || "",
        address: profile.address || "",
        city: profile.city || "",
        location: profile.location || null,
      });
    }
  }, [profile, reset]);

  const onFormSubmit = async (data: UpdateProfilePayload) => {
    setSubmitting(true);
    setError(null);
    try {
      await updateUserProfile(data);
      onSuccess();
    } catch (err) {
      const message = handleApiError(err);
      setError(message);
    } finally {
      setSubmitting(false);
    }
  };

  if (!profile) return null;

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
        Profile Information
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
          name="name"
          control={control}
          rules={FORM_FIELD_RULES.name}
          render={({ field }) => (
            <TextField
              {...field}
              label="Full Name *"
              fullWidth
              error={!!errors.name}
              helperText={errors.name?.message}
              size="small"
              disabled={submitting}
            />
          )}
        />

        <Controller
          name="phoneNumber"
          control={control}
          rules={FORM_FIELD_RULES.phoneNumber}
          render={({ field }) => (
            <TextField
              {...field}
              label="Phone Number"
              fullWidth
              error={!!errors.phoneNumber}
              helperText={errors.phoneNumber?.message}
              size="small"
              placeholder="+251 911 234 567"
              disabled={submitting}
            />
          )}
        />

        <Controller
          name="address"
          control={control}
          rules={FORM_FIELD_RULES.address}
          render={({ field }) => (
            <TextField
              {...field}
              label="Street Address"
              fullWidth
              error={!!errors.address}
              helperText={errors.address?.message}
              size="small"
              multiline
              rows={2}
              placeholder="Bole, Addis Ababa"
              disabled={submitting}
            />
          )}
        />

        <Controller
          name="city"
          control={control}
          rules={FORM_FIELD_RULES.city}
          render={({ field }) => (
            <TextField
              {...field}
              label="City"
              fullWidth
              error={!!errors.city}
              helperText={errors.city?.message}
              size="small"
              placeholder="Addis Ababa"
              disabled={submitting}
            />
          )}
        />

        <Divider sx={{ my: 1 }} />

        <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 2 }}>
          <Button
            variant="outlined"
            onClick={() => reset()}
            disabled={submitting || !isDirty}
          >
            Reset
          </Button>
          <Button
            type="submit"
            variant="contained"
            disabled={submitting || !isDirty}
            startIcon={submitting ? <CircularProgress size={16} /> : null}
            sx={{
              minWidth: 120,
              background: "linear-gradient(135deg, #0F8B6C 0%, #0A6B59 100%)",
              "&:hover": {
                background: "linear-gradient(135deg, #0A6B59 0%, #064E3B 100%)",
              },
            }}
          >
            {submitting ? "Saving..." : "Save Changes"}
          </Button>
        </Box>
      </Box>
    </Paper>
  );
};
