import {
  Box,
  Button,
  CircularProgress,
  Fade,
  Grid,
  Grow,
  Paper,
  Stack,
  Typography,
  type ButtonProps,
  type SxProps,
  type Theme,
} from "@mui/material";
import type { ReactNode } from "react";

interface AuthBrandItem {
  icon: ReactNode;
  title: string;
  description: string;
}

interface AuthBrandContent {
  eyebrow: string;
  title: string;
  description: string;
  items: AuthBrandItem[];
  footer?: string;
}

interface AuthShellProps {
  brand: AuthBrandContent;
  children: ReactNode;
  formMaxWidth?: number;
  formSx?: SxProps<Theme>;
}

interface AuthFormHeaderProps {
  icon: ReactNode;
  eyebrow: string;
  title: string;
  description: string;
}

type AuthSubmitButtonProps = ButtonProps & {
  loading?: boolean;
  loadingText?: string;
};

import { Logo } from "../../../components/Logo";

export const AuthShell = ({
  brand,
  children,
  formMaxWidth = 500,
  formSx,
}: AuthShellProps) => {
  return (
    <Grid
      container
      sx={{
        minHeight: "100vh",
        background:
          "linear-gradient(135deg, #F7FAF9 0%, #EEF7F3 48%, #FBF8F0 100%)",
      }}
    >
      <Grid
        size={{ xs: 12, md: 5 }}
        sx={{
          minHeight: { xs: 420, md: "100vh" },
          color: "common.white",
          display: "flex",
          alignItems: "center",
          position: "relative",
          overflow: "hidden",
          p: { xs: 3, sm: 5, md: 7, lg: 9 },
          background:
            "linear-gradient(145deg, #042A2C 0%, #063C35 38%, #0F5E4D 67%, #2F3945 100%)",
          "&::before": {
            content: '""',
            position: "absolute",
            inset: 0,
            backgroundImage:
              "linear-gradient(rgba(255,255,255,0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.08) 1px, transparent 1px)",
            backgroundSize: "44px 44px",
            maskImage:
              "linear-gradient(145deg, rgba(0,0,0,0.75) 0%, rgba(0,0,0,0.18) 75%)",
          },
          "&::after": {
            content: '""',
            position: "absolute",
            right: { xs: -160, md: -130 },
            bottom: { xs: 22, md: "9%" },
            width: { xs: 340, md: 430 },
            height: { xs: 220, md: 310 },
            clipPath: "polygon(24% 0, 100% 18%, 76% 100%, 0 78%)",
            background:
              "linear-gradient(135deg, rgba(255,255,255,0.18) 0%, rgba(52,211,153,0.18) 54%, rgba(221,170,74,0.16) 100%)",
            border: "1px solid rgba(255,255,255,0.16)",
          },
        }}
      >
        <Fade in timeout={500}>
          <Box
            sx={{
              width: "100%",
              maxWidth: 560,
              position: "relative",
              zIndex: 1,
            }}
          >
            <Logo onDark />

            <Box sx={{ mt: { xs: 6, md: 9 }, mb: 4 }}>
              <Typography
                variant="overline"
                sx={{ color: "secondary.light", display: "block", mb: 1.5 }}
              >
                {brand.eyebrow}
              </Typography>
              <Typography
                variant="h3"
                component="h1"
                sx={{
                  mb: 2.5,
                  maxWidth: 540,
                  color: "common.white",
                  fontSize: { xs: "2.25rem", sm: "2.7rem", md: "3rem" },
                }}
              >
                {brand.title}
              </Typography>
              <Typography
                variant="body1"
                sx={{
                  maxWidth: 500,
                  color: "rgba(255,255,255,0.78)",
                  fontSize: { xs: "1rem", md: "1.05rem" },
                }}
              >
                {brand.description}
              </Typography>
            </Box>

            <Stack spacing={1.5} sx={{ maxWidth: 520 }}>
              {brand.items.map((item) => (
                <Box
                  key={item.title}
                  sx={{
                    display: "grid",
                    gridTemplateColumns: "42px 1fr",
                    gap: 1.5,
                    alignItems: "start",
                    p: 1.5,
                    borderRadius: 2,
                    border: "1px solid rgba(255,255,255,0.14)",
                    background: "rgba(255,255,255,0.08)",
                    backdropFilter: "blur(18px)",
                  }}
                >
                  <Box
                    sx={{
                      width: 42,
                      height: 42,
                      borderRadius: 2,
                      display: "grid",
                      placeItems: "center",
                      color: "secondary.light",
                      background: "rgba(255,255,255,0.1)",
                    }}
                  >
                    {item.icon}
                  </Box>
                  <Box sx={{ minWidth: 0 }}>
                    <Typography
                      variant="subtitle2"
                      sx={{ color: "common.white", mb: 0.35 }}
                    >
                      {item.title}
                    </Typography>
                    <Typography
                      variant="body2"
                      sx={{ color: "rgba(255,255,255,0.7)" }}
                    >
                      {item.description}
                    </Typography>
                  </Box>
                </Box>
              ))}
            </Stack>

            {brand.footer && (
              <Typography
                variant="body2"
                sx={{
                  mt: 4,
                  pt: 3,
                  color: "rgba(255,255,255,0.68)",
                  borderTop: "1px solid rgba(255,255,255,0.16)",
                  maxWidth: 520,
                }}
              >
                {brand.footer}
              </Typography>
            )}
          </Box>
        </Fade>
      </Grid>

      <Grid
        size={{ xs: 12, md: 7 }}
        sx={{
          minHeight: { xs: "auto", md: "100vh" },
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          p: { xs: 2.5, sm: 5, md: 7, lg: 9 },
        }}
      >
        <Grow in timeout={420}>
          <Paper
            elevation={0}
            sx={{
              width: "100%",
              maxWidth: formMaxWidth,
              p: { xs: 3, sm: 4.5, md: 5 },
              borderRadius: 2,
              border: "1px solid rgba(255,255,255,0.78)",
              backgroundColor: "rgba(255,255,255,0.84)",
              backdropFilter: "blur(22px)",
              boxShadow: 5,
              ...formSx,
            }}
          >
            {children}
          </Paper>
        </Grow>
      </Grid>
    </Grid>
  );
};

export const AuthFormHeader = ({
  icon,
  eyebrow,
  title,
  description,
}: AuthFormHeaderProps) => (
  <Box sx={{ mb: 3.5 }}>
    <Box
      sx={{
        width: 50,
        height: 50,
        borderRadius: 2,
        display: "grid",
        placeItems: "center",
        mb: 3,
        color: "primary.main",
        background:
          "linear-gradient(135deg, rgba(15,139,108,0.12) 0%, rgba(221,170,74,0.14) 100%)",
        border: "1px solid rgba(15,139,108,0.14)",
      }}
    >
      {icon}
    </Box>
    <Typography
      variant="overline"
      sx={{ color: "primary.main", display: "block", mb: 0.75 }}
    >
      {eyebrow}
    </Typography>
    <Typography
      variant="h4"
      component="h2"
      sx={{
        mb: 1.25,
        color: "text.primary",
        fontSize: { xs: "1.9rem", sm: "2.15rem" },
      }}
    >
      {title}
    </Typography>
    <Typography variant="body1" color="text.secondary">
      {description}
    </Typography>
  </Box>
);

export const AuthSubmitButton = ({
  loading = false,
  loadingText,
  children,
  disabled,
  ...props
}: AuthSubmitButtonProps) => (
  <Button
    variant="contained"
    color="primary"
    fullWidth
    size="large"
    disabled={disabled || loading}
    {...props}
    sx={{
      py: 1.35,
      fontSize: "1rem",
      ...props.sx,
    }}
  >
    {loading ? (
      <Box
        component="span"
        sx={{
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 1,
        }}
      >
        <CircularProgress size={20} color="inherit" />
        {loadingText}
      </Box>
    ) : (
      children
    )}
  </Button>
);
