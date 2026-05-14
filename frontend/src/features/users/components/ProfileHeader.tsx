import { Business, Verified } from "@mui/icons-material";
import { Avatar, Box, Chip, Stack, Typography } from "@mui/material";
import type { SxProps, Theme } from "@mui/material/styles";
import { API_BASE_URL } from "../../../services/api";
import { ROLE_LABELS } from "../constants";
import type { IUserProfile } from "../types";

const apiHost = API_BASE_URL.replace(/\/api\/?$/, "");

const getProfileImageUrl = (url?: string | null) => {
  if (!url) return undefined;
  if (/^https?:\/\//i.test(url)) return url;
  return `${apiHost}${url}`;
};

export const ProfileHeader = ({
  profile,
  sx,
}: {
  profile: IUserProfile;
  sx?: SxProps<Theme>;
}) => {
  const roleLabel = ROLE_LABELS[profile.role];
  const isPharmacyManager = profile.role === "pharmacy_manager";

  return (
    <Box
      sx={{
        display: "flex",
        alignItems: { xs: "flex-start", sm: "center" },
        flexDirection: { xs: "column", sm: "row" },
        gap: 3,
        p: { xs: 2.5, sm: 3 },
        borderRadius: 3,
        border: "1px solid rgba(23, 35, 31, 0.08)",
        bgcolor: "rgba(255, 255, 255, 0.78)",
        backdropFilter: "blur(24px)",
        boxShadow: "0 10px 40px rgba(0,0,0,0.03)",
        ...sx,
      }}
    >
      <Avatar
        src={getProfileImageUrl(profile.profilePictureUrl)}
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

      <Box sx={{ flexGrow: 1, minWidth: 0 }}>
        <Stack
          direction="row"
          spacing={1.5}
          sx={{ alignItems: "center", flexWrap: "wrap", mb: 0.5 }}
        >
          <Typography
            variant="h5"
            color="#1E293B"
            sx={{ fontWeight: 800, overflowWrap: "anywhere" }}
          >
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

        <Typography
          variant="body1"
          color="text.secondary"
          sx={{ mb: 1, overflowWrap: "anywhere" }}
        >
          {profile.email}
        </Typography>

        <Stack direction="row" spacing={1} sx={{ alignItems: "center", flexWrap: "wrap" }}>
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
                maxWidth: "100%",
              }}
            />
          )}
        </Stack>
      </Box>
    </Box>
  );
};
