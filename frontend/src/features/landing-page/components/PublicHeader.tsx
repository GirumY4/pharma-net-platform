// src/features/landing-page/components/PublicHeader.tsx
import { LockOutlined, PersonAddOutlined } from "@mui/icons-material";
import { AppBar, Box, Button, Stack, Toolbar } from "@mui/material";
import { alpha } from "@mui/material/styles";
import { useNavigate } from "react-router-dom";
import { Logo } from "../../../components/Logo";

interface PublicHeaderProps {
  onNavigateToSection?: (id: string) => void;
}

export const PublicHeader = ({ onNavigateToSection }: PublicHeaderProps) => {
  const navigate = useNavigate();

  const handleScrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <AppBar
      position="sticky"
      elevation={0}
      sx={{
        top: 0,
        bgcolor: alpha("#F7FAF9", 0.82),
        backdropFilter: "blur(20px)",
        borderBottom: `1px solid ${alpha("#17231F", 0.08)}`,
        zIndex: (theme) => theme.zIndex.drawer + 10,
      }}
    >
      <Toolbar
        sx={{
          minHeight: 72,
          px: { xs: 2, md: 4 },
          display: "flex",
          justifyContent: "space-between",
        }}
      >
        {/* Left: Logo */}
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            cursor: "pointer",
          }}
          onClick={handleScrollToTop}
        >
          <Logo />
        </Box>

        {/* Center: Navigation Links */}
        <Stack
          direction="row"
          spacing={1}
          sx={{
            display: { xs: "none", md: "flex" },
            alignItems: "center",
          }}
        >
          <Button
            onClick={() => onNavigateToSection?.("features")}
            sx={{
              color: "text.secondary",
              fontWeight: 600,
              borderRadius: 2,
              px: 2,
              "&:hover": {
                bgcolor: alpha("#0F5E4D", 0.08),
                color: "primary.main",
              },
            }}
          >
            Features
          </Button>
          <Button
            onClick={() => onNavigateToSection?.("pricing")}
            sx={{
              color: "text.secondary",
              fontWeight: 600,
              borderRadius: 2,
              px: 2,
              "&:hover": {
                bgcolor: alpha("#0F5E4D", 0.08),
                color: "primary.main",
              },
            }}
          >
            Billing
          </Button>
          <Button
            onClick={() => onNavigateToSection?.("contact")}
            sx={{
              color: "text.secondary",
              fontWeight: 600,
              borderRadius: 2,
              px: 2,
              "&:hover": {
                bgcolor: alpha("#0F5E4D", 0.08),
                color: "primary.main",
              },
            }}
          >
            Contact
          </Button>
        </Stack>

        {/* Right: Auth Entry Points */}
        <Stack direction="row" spacing={1.5} sx={{ alignItems: "center" }}>
          <Button
            variant="outlined"
            onClick={() => navigate("/login")}
            startIcon={<LockOutlined />}
            sx={{
              borderColor: "#DDAA4A",
              color: "#8A5F16",
              fontWeight: 700,
              borderRadius: 2,
              px: 2.5,
              "&:hover": {
                borderColor: "#DDAA4A",
                bgcolor: alpha("#DDAA4A", 0.08),
                color: "#8A5F16",
              },
            }}
          >
            Login
          </Button>
          <Button
            variant="contained"
            onClick={() => navigate("/register")}
            startIcon={<PersonAddOutlined />}
            sx={{
              bgcolor: "#0F5E4D",
              color: "#FFFFFF",
              fontWeight: 700,
              borderRadius: 2,
              px: 2.5,
              "&:hover": {
                bgcolor: "#0A6B59",
              },
            }}
          >
            Register
          </Button>
        </Stack>
      </Toolbar>
    </AppBar>
  );
};

export default PublicHeader;