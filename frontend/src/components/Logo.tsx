import { LocalPharmacy } from "@mui/icons-material";
import { Box, Stack, Typography } from "@mui/material";

interface LogoProps {
  compact?: boolean;
  onDark?: boolean;
}

export const Logo = ({ compact = false, onDark = false }: LogoProps) => (
  <Stack direction="row" spacing={1} sx={{ minWidth: 0, alignItems: "center" }}>
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        width: compact ? 32 : { xs: 36, sm: 44 },
        height: compact ? 32 : { xs: 36, sm: 44 },
        borderRadius: compact ? "8px" : { xs: "10px", sm: "12px" },
        background: onDark
          ? "linear-gradient(135deg, #0F5E4D 0%, #DDAA4A 100%)"
          : "linear-gradient(135deg, #0F5E4D 0%, #042A2C 100%)",
        color: "white",
        boxShadow: onDark
          ? "0 4px 14px rgba(0,0,0,0.3)"
          : "0 4px 14px rgba(15,139,108,0.25)",
      }}
    >
      <LocalPharmacy sx={{ fontSize: compact ? 20 : { xs: 22, sm: 28 } }} />
    </Box>
    <Typography
      variant={compact ? "h6" : "h5"}
      sx={{
        fontWeight: 900,
        fontSize: compact
          ? { xs: "1.05rem", sm: "1.25rem" }
          : { xs: "1.25rem", sm: "1.5rem" },
        letterSpacing: "-0.03em",
        background: onDark
          ? "white"
          : "linear-gradient(90deg, #042A2C 0%, #0F5E4D 100%)",
        WebkitBackgroundClip: "text",
        WebkitTextFillColor: "transparent",
        display: "flex",
        alignItems: "center",
        whiteSpace: "nowrap",
      }}
    >
      Alyah
      <Typography
        component="span"
        sx={{
          fontWeight: 400,
          ml: 0.6,
          color: onDark ? "rgba(255,255,255,0.75)" : "text.secondary",
          fontSize: compact
            ? { xs: "0.85rem", sm: "1.05rem" }
            : { xs: "1.05rem", sm: "1.25rem" },
          display: { xs: "none", sm: "inline" },
        }}
      >
        Pharma-Net
      </Typography>
    </Typography>
  </Stack>
);
