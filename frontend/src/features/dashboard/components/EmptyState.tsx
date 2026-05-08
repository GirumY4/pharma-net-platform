import { CheckCircleOutlined } from "@mui/icons-material";
import { Box, Stack, Typography } from "@mui/material";
import { alpha } from "@mui/material/styles";
import type { ReactNode } from "react";

interface EmptyStateProps {
  title: string;
  description: string;
  icon?: ReactNode;
  action?: ReactNode;
}

export const EmptyState = ({
  title,
  description,
  icon,
  action,
}: EmptyStateProps) => (
  <Stack
    spacing={2}
    sx={(theme) => ({
      alignItems: "center",
      justifyContent: "center",
      minHeight: 280,
      py: 6,
      px: 3,
      textAlign: "center",
      bgcolor: "rgba(255, 255, 255, 0.7)",
      borderRadius: 2,
      border: "1px dashed rgba(15, 94, 77, 0.2)",
      backdropFilter: "blur(18px)",
      boxShadow: "inset 0 1px 0 rgba(255,255,255,0.7)",
      color: "text.secondary",
      "&:hover": {
        borderColor: alpha(theme.palette.primary.main, 0.34),
      },
    })}
  >
    <Box
      sx={(theme) => ({
        width: 52,
        height: 52,
        borderRadius: 2,
        display: "grid",
        placeItems: "center",
        color: "primary.main",
        bgcolor: alpha(theme.palette.primary.main, 0.1),
        border: `1px solid ${alpha(theme.palette.primary.main, 0.16)}`,
      })}
    >
      {icon || <CheckCircleOutlined fontSize="medium" />}
    </Box>
    <Box>
      <Typography variant="h6" sx={{ color: "text.primary", mb: 0.75 }}>
        {title}
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 360 }}>
        {description}
      </Typography>
    </Box>
    {action}
  </Stack>
);
