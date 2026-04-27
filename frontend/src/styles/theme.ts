// src/styles/theme.ts
import { createTheme } from "@mui/material/styles";

export const theme = createTheme({
  palette: {
    primary: {
      main: "#00684A", // Deep professional green (MongoDB inspired)
      light: "#00ED64", // Vibrant green for accents
      dark: "#001E2B", // Very dark slate for contrast
      contrastText: "#ffffff",
    },
    secondary: {
      main: "#F9EBDF", // Soft accent color
      contrastText: "#001E2B",
    },
    background: {
      default: "#F9FAFB", // Soft light gray background
      paper: "#ffffff",
    },
    text: {
      primary: "#001E2B",
      secondary: "#3D4F58",
    },
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    h1: { fontWeight: 800 },
    h2: { fontWeight: 700 },
    h3: { fontWeight: 700 },
    h4: { fontWeight: 700 },
    h5: { fontWeight: 600 },
    h6: { fontWeight: 600 },
    button: {
      fontWeight: 600,
      textTransform: "none", // Modern buttons
    },
  },
  shape: {
    borderRadius: 12, // More rounded corners
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          padding: "10px 24px",
          boxShadow: "none",
          "&:hover": {
            boxShadow: "0px 4px 8px rgba(0, 0, 0, 0.1)",
          },
        },
        containedPrimary: {
          "&:hover": {
            backgroundColor: "#00593f",
          },
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          "& .MuiOutlinedInput-root": {
            borderRadius: 8,
          },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          boxShadow: "0px 10px 30px rgba(0, 0, 0, 0.05)",
        },
      },
    },
  },
});
