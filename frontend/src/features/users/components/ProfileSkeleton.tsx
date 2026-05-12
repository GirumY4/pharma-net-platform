// src/features/users/components/ProfileSkeleton.tsx
import { Box, Divider, Paper, Skeleton, Stack } from "@mui/material";

export const ProfileSkeleton = () => (
  <Box>
    {/* Header Section Skeleton */}
    <Box sx={{ mb: 4 }}>
      <Skeleton variant="text" width={200} height={32} sx={{ mb: 1 }} />
      <Skeleton variant="text" width={400} height={20} />
    </Box>

    {/* Profile Header Skeleton */}
    <Box sx={{ display: "flex", alignItems: "center", gap: 3, mb: 4 }}>
      <Skeleton variant="circular" width={72} height={72} />
      <Box sx={{ flexGrow: 1 }}>
        <Stack direction="row" spacing={1.5} sx={{ alignItems: "center", mb: 1 }}>
          <Skeleton variant="text" width={150} height={24} />
          <Skeleton
            variant="rectangular"
            width={60}
            height={24}
            sx={{ borderRadius: 1 }}
          />
        </Stack>
        <Skeleton variant="text" width={200} height={18} sx={{ mb: 1 }} />
        <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
          <Skeleton
            variant="rectangular"
            width={100}
            height={24}
            sx={{ borderRadius: 1 }}
          />
          <Skeleton
            variant="rectangular"
            width={120}
            height={24}
            sx={{ borderRadius: 1 }}
          />
        </Stack>
      </Box>
    </Box>

    {/* Content Grid Skeleton */}
    <Box
      sx={{
        display: "grid",
        gridTemplateColumns: { xs: "1fr", lg: "2fr 1fr" },
        gap: 4,
      }}
    >
      {/* Left Column: Forms */}
      <Box sx={{ display: "grid", gap: 4 }}>
        {/* Profile Form Skeleton */}
        <Paper
          elevation={0}
          sx={{
            p: 3,
            borderRadius: 4,
            border: "1px solid rgba(0,0,0,0.06)",
            bgcolor: "rgba(255, 255, 255, 0.7)",
            backdropFilter: "blur(24px)",
          }}
        >
          <Skeleton variant="text" width={180} height={24} sx={{ mb: 3 }} />

          <Box sx={{ display: "grid", gap: 2.5 }}>
            {[...Array(4)].map((_, i) => (
              <Box key={i}>
                <Skeleton
                  variant="text"
                  width={100}
                  height={16}
                  sx={{ mb: 1 }}
                />
                <Skeleton
                  variant="rectangular"
                  height={40}
                  sx={{ borderRadius: 1 }}
                />
              </Box>
            ))}
            <Skeleton
              variant="rectangular"
              height={80}
              sx={{ borderRadius: 1, mb: 1 }}
            />
          </Box>

          <Divider sx={{ my: 2 }} />

          <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 2 }}>
            <Skeleton
              variant="rectangular"
              width={80}
              height={36}
              sx={{ borderRadius: 2 }}
            />
            <Skeleton
              variant="rectangular"
              width={120}
              height={36}
              sx={{ borderRadius: 2 }}
            />
          </Box>
        </Paper>

        {/* Password Form Skeleton */}
        <Paper
          elevation={0}
          sx={{
            p: 3,
            borderRadius: 4,
            border: "1px solid rgba(0,0,0,0.06)",
            bgcolor: "rgba(255, 255, 255, 0.7)",
            backdropFilter: "blur(24px)",
          }}
        >
          <Skeleton variant="text" width={160} height={24} sx={{ mb: 3 }} />

          <Box sx={{ display: "grid", gap: 2.5 }}>
            {[...Array(3)].map((_, i) => (
              <Box key={i}>
                <Skeleton
                  variant="text"
                  width={140}
                  height={16}
                  sx={{ mb: 1 }}
                />
                <Skeleton
                  variant="rectangular"
                  height={40}
                  sx={{ borderRadius: 1 }}
                />
              </Box>
            ))}
          </Box>

          <Box
            sx={{ display: "flex", justifyContent: "flex-end", gap: 2, mt: 2 }}
          >
            <Skeleton
              variant="rectangular"
              width={80}
              height={36}
              sx={{ borderRadius: 2 }}
            />
            <Skeleton
              variant="rectangular"
              width={140}
              height={36}
              sx={{ borderRadius: 2 }}
            />
          </Box>
        </Paper>
      </Box>

      {/* Right Column: Account Settings */}
      <Box>
        <Paper
          elevation={0}
          sx={{
            p: 3,
            borderRadius: 4,
            border: "1px solid rgba(0,0,0,0.06)",
            bgcolor: "rgba(255, 255, 255, 0.7)",
            backdropFilter: "blur(24px)",
          }}
        >
          <Box
            sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 2.5 }}
          >
            <Skeleton variant="circular" width={20} height={20} />
            <Skeleton variant="text" width={140} height={24} />
          </Box>

          <Box sx={{ mb: 3 }}>
            <Skeleton variant="text" width={100} height={16} sx={{ mb: 1 }} />
            <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
              <Skeleton
                variant="rectangular"
                width={60}
                height={24}
                sx={{ borderRadius: 1 }}
              />
              <Skeleton
                variant="rectangular"
                width={90}
                height={24}
                sx={{ borderRadius: 1 }}
              />
            </Stack>
          </Box>

          <Divider sx={{ my: 2.5 }} />

          <Box sx={{ mb: 3 }}>
            <Skeleton variant="text" width={40} height={16} sx={{ mb: 1 }} />
            <Skeleton
              variant="rectangular"
              width={120}
              height={24}
              sx={{ borderRadius: 1, mb: 2 }}
            />
            <Skeleton variant="text" width={80} height={16} sx={{ mb: 1 }} />
            <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
              <Skeleton variant="circular" width={16} height={16} />
              <Skeleton variant="text" width={140} height={18} />
            </Box>
            <Skeleton variant="text" width={200} height={14} />
          </Box>

          <Divider sx={{ my: 2.5 }} />

          <Box sx={{ mb: 3 }}>
            <Skeleton variant="text" width={140} height={16} sx={{ mb: 1.5 }} />
            <Skeleton
              variant="rectangular"
              width={140}
              height={32}
              sx={{ borderRadius: 2 }}
            />
          </Box>

          <Skeleton
            variant="rectangular"
            height={60}
            sx={{
              borderRadius: 2,
              bgcolor: "rgba(217, 119, 6, 0.08)",
            }}
          />
        </Paper>
      </Box>
    </Box>
  </Box>
);
