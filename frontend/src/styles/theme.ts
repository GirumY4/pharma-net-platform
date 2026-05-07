// src/styles/theme.ts
import { alpha, createTheme } from "@mui/material/styles";

const displayFont =
  '"Source Serif 4", Georgia, "Times New Roman", Times, serif';
const interfaceFont =
  '"Inter Tight", "Inter", "Segoe UI", system-ui, -apple-system, sans-serif';
const bodyFont =
  '"Inter", "Segoe UI", system-ui, -apple-system, BlinkMacSystemFont, sans-serif';

export const theme = createTheme({
  palette: {
    mode: "light",
    primary: {
      main: "#0F8B6C",
      light: "#34D399",
      dark: "#063C35",
      contrastText: "#FFFFFF",
    },
    secondary: {
      main: "#DDAA4A",
      light: "#F5D796",
      dark: "#8A5F16",
      contrastText: "#13201C",
    },
    background: {
      default: "#F7FAF9",
      paper: "#FFFFFF",
    },
    text: {
      primary: "#17231F",
      secondary: "#587067",
    },
    divider: "rgba(23, 35, 31, 0.12)",
    success: {
      main: "#0F8B6C",
      light: "#D9FBEA",
      dark: "#064E3B",
      contrastText: "#FFFFFF",
    },
    error: {
      main: "#C2413B",
    },
  },
  typography: {
    fontFamily: bodyFont,
    h1: {
      fontFamily: displayFont,
      fontWeight: 700,
      letterSpacing: 0,
      lineHeight: 1.04,
    },
    h2: {
      fontFamily: displayFont,
      fontWeight: 700,
      letterSpacing: 0,
      lineHeight: 1.08,
    },
    h3: {
      fontFamily: displayFont,
      fontWeight: 700,
      letterSpacing: 0,
      lineHeight: 1.1,
    },
    h4: {
      fontFamily: interfaceFont,
      fontWeight: 800,
      letterSpacing: 0,
      lineHeight: 1.16,
    },
    h5: {
      fontFamily: interfaceFont,
      fontWeight: 760,
      letterSpacing: 0,
      lineHeight: 1.22,
    },
    h6: {
      fontFamily: interfaceFont,
      fontWeight: 700,
      letterSpacing: 0,
      lineHeight: 1.35,
    },
    subtitle1: {
      fontFamily: interfaceFont,
      fontWeight: 700,
      letterSpacing: 0,
    },
    subtitle2: {
      fontFamily: interfaceFont,
      fontWeight: 700,
      letterSpacing: 0,
    },
    body1: {
      fontFamily: bodyFont,
      lineHeight: 1.7,
    },
    body2: {
      fontFamily: bodyFont,
      lineHeight: 1.65,
    },
    button: {
      fontFamily: interfaceFont,
      fontWeight: 750,
      letterSpacing: 0,
      textTransform: "none",
    },
    overline: {
      fontFamily: interfaceFont,
      fontWeight: 800,
      letterSpacing: "0.08em",
      lineHeight: 1.8,
      textTransform: "uppercase",
    },
  },
  shape: {
    borderRadius: 8,
  },
  shadows: [
    "none",
    "0 1px 2px rgba(18, 32, 28, 0.04)",
    "0 4px 10px rgba(18, 32, 28, 0.06)",
    "0 8px 22px rgba(18, 32, 28, 0.08)",
    "0 16px 44px rgba(18, 32, 28, 0.12)",
    "0 24px 70px rgba(18, 32, 28, 0.14)",
    "0 28px 80px rgba(18, 32, 28, 0.16)",
    "0 32px 90px rgba(18, 32, 28, 0.18)",
    "0 36px 100px rgba(18, 32, 28, 0.2)",
    "0 40px 110px rgba(18, 32, 28, 0.22)",
    "0 44px 120px rgba(18, 32, 28, 0.24)",
    "0 48px 130px rgba(18, 32, 28, 0.26)",
    "0 52px 140px rgba(18, 32, 28, 0.28)",
    "0 56px 150px rgba(18, 32, 28, 0.3)",
    "0 60px 160px rgba(18, 32, 28, 0.32)",
    "0 64px 170px rgba(18, 32, 28, 0.34)",
    "0 68px 180px rgba(18, 32, 28, 0.36)",
    "0 72px 190px rgba(18, 32, 28, 0.38)",
    "0 76px 200px rgba(18, 32, 28, 0.4)",
    "0 80px 210px rgba(18, 32, 28, 0.42)",
    "0 84px 220px rgba(18, 32, 28, 0.44)",
    "0 88px 230px rgba(18, 32, 28, 0.46)",
    "0 92px 240px rgba(18, 32, 28, 0.48)",
    "0 96px 250px rgba(18, 32, 28, 0.5)",
    "0 100px 260px rgba(18, 32, 28, 0.52)",
  ],
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          backgroundColor: "#F7FAF9",
          color: "#17231F",
          textRendering: "optimizeLegibility",
          WebkitFontSmoothing: "antialiased",
          MozOsxFontSmoothing: "grayscale",
        },
      },
    },
    MuiButton: {
      defaultProps: {
        disableElevation: true,
      },
      styleOverrides: {
        root: ({ theme }) => ({
          borderRadius: 8,
          minHeight: 44,
          padding: "10px 20px",
          transition:
            "transform 160ms ease, box-shadow 160ms ease, background-color 160ms ease, color 160ms ease",
          "&:hover": {
            transform: "translateY(-1px)",
          },
          "&:active": {
            transform: "translateY(0)",
          },
          "&.Mui-disabled": {
            transform: "none",
          },
          "&.MuiButton-containedPrimary": {
            background:
              "linear-gradient(135deg, #0F8B6C 0%, #0A6B59 100%)",
            boxShadow: `0 14px 30px ${alpha(theme.palette.primary.main, 0.24)}`,
            "&:hover": {
              boxShadow: `0 18px 38px ${alpha(theme.palette.primary.main, 0.3)}`,
            },
          },
          "&.MuiButton-text": {
            minHeight: 0,
          },
        }),
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: "none",
        },
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: ({ theme }) => ({
          borderRadius: 8,
          backgroundColor: "rgba(255, 255, 255, 0.92)",
          transition:
            "box-shadow 160ms ease, background-color 160ms ease, border-color 160ms ease",
          "& .MuiOutlinedInput-notchedOutline": {
            borderColor: "rgba(23, 35, 31, 0.16)",
          },
          "&:hover .MuiOutlinedInput-notchedOutline": {
            borderColor: alpha(theme.palette.primary.main, 0.55),
          },
          "&.Mui-focused": {
            backgroundColor: "#FFFFFF",
            boxShadow: `0 0 0 4px ${alpha(theme.palette.primary.main, 0.12)}`,
          },
          "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
            borderColor: theme.palette.primary.main,
            borderWidth: 1,
          },
        }),
      },
    },
    MuiInputAdornment: {
      styleOverrides: {
        root: ({ theme }) => ({
          color: theme.palette.text.secondary,
        }),
      },
    },
    MuiInputLabel: {
      styleOverrides: {
        root: {
          fontWeight: 650,
        },
      },
    },
    MuiFormHelperText: {
      styleOverrides: {
        root: {
          marginLeft: 2,
          lineHeight: 1.45,
        },
      },
    },
    MuiAlert: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          alignItems: "center",
        },
      },
    },
    MuiDivider: {
      styleOverrides: {
        root: {
          borderColor: "rgba(23, 35, 31, 0.1)",
        },
      },
    },
  },
});
