// src/features/users/pages/ProfileSettingsPage.tsx
import { Alert, Box, Grid, Stack, Typography } from "@mui/material";
import { AccountSettingsCard } from "../components/AccountSettingsCard";
import { PasswordChangeForm } from "../components/PasswordChangeForm";
import { ProfileForm } from "../components/ProfileForm";
import { ProfileHeader } from "../components/ProfileHeader";
import { ProfileSkeleton } from "../components/ProfileSkeleton";
import { useUserProfile } from "../hooks/useUserProfile";

export const ProfileSettingsPage = () => {
  const { profile, loading, error, refresh } = useUserProfile(true);

  if (loading) {
    return <ProfileSkeleton />;
  }

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error" sx={{ borderRadius: 2 }}>
          {error}
        </Alert>
      </Box>
    );
  }

  if (!profile) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="warning">Profile data not available.</Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ mb: 5, px: { xs: 2.5, sm: 4, md: 5 } }}>
      <Box
        sx={{
          display: "flex",
          flexDirection: { xs: "column", sm: "row", md: "column" },
          justifyContent: "space-between",
          alignItems: { xs: "stretch", sm: "flex-start" },
          gap: { xs: 1.5, sm: 3 },
          mb: 4,
        }}
      >
        <Stack spacing={0.5}>
          <Typography
            variant="h4"
            sx={{
              color: "primary.main",
              fontWeight: 800,
              letterSpacing: "-0.5px",
              fontSize: { xs: "1.5rem", sm: "1.75rem", md: "2.05rem" },
              lineHeight: 1.2,
            }}
          >
            Account Settings
          </Typography>
          <Typography
            variant="body1"
            color="text.secondary"
            sx={{ fontSize: { xs: "0.95rem", sm: "1.05rem" }, maxWidth: 600 }}
          >
            Manage your profile information, security settings, and account
            preferences.
          </Typography>
        </Stack>
      </Box>

      <ProfileHeader profile={profile} sx={{ mb: 4 }} />

      <Grid container spacing={4}>
        {/* Left Column: Profile & Password */}
        <Grid size={{ xs: 12, lg: 8 }}>
          <Stack spacing={4}>
            <ProfileForm profile={profile} onSuccess={refresh} />
            <PasswordChangeForm
              onSuccess={() => {
                // Optionally show success toast
              }}
            />
          </Stack>
        </Grid>

        {/* Right Column: Account Info */}
        <Grid size={{ xs: 12, lg: 4 }}>
          <AccountSettingsCard
            profile={profile}
            onDeactivate={async () => {
              // Handle account deactivation flow
            }}
          />
        </Grid>
      </Grid>
    </Box>
  );
};