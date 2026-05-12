// src/features/users/components/ProfileHeader.tsx
import { Business, Verified } from "@mui/icons-material";
import { Avatar, Box, Chip, Stack, Typography } from "@mui/material";
import { ROLE_LABELS } from "../constants";
import type { IUserProfile } from "../types";

interface ProfileHeaderProps {
  profile: IUserProfile;
}

export const ProfileHeader = ({ profile }: ProfileHeaderProps) => {
  const roleLabel = ROLE_LABELS[profile.role];
  const isPharmacyManager = profile.role === "pharmacy_manager";

  return (
    <Box sx={{ display: "flex", alignItems: "center", gap: 3, mb: 4 }}>
      <Avatar
        sx={{
          width: 72,
          height: 72,
          bgcolor: "primary.main",
          fontWeight: 800,
          fontSize: "1.5rem",
          border: "3px solid white",
          boxShadow: "0 4px 20px rgba(15, 139, 108, 0.25)",
        }}
      >
        {profile.name?.charAt(0).toUpperCase()}
      </Avatar>

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
      </Box>
    </Box>
  );
};
