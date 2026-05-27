// src/components/layout/Footer.tsx
import {
  Facebook as FacebookIcon,
  LinkedIn as LinkedInIcon,
  Send as SendIcon,
  Telegram as TelegramIcon,
  Twitter as TwitterIcon,
  VerifiedUser as VerifiedIcon,
} from "@mui/icons-material";
import {
  Box,
  Button,
  Container,
  Divider,
  Grid,
  IconButton,
  InputAdornment,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Logo } from "../Logo";

export const Footer = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [subscribed, setSubscribed] = useState(false);

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (email.trim()) {
      setSubscribed(true);
      setEmail("");
      setTimeout(() => setSubscribed(false), 5000);
    }
  };

  return (
    <Box
      component="footer"
      sx={{
        background: "linear-gradient(180deg, #0A1311 0%, #031412 100%)",
        color: "rgba(255, 255, 255, 0.75)",
        pt: { xs: 8, md: 10 },
        pb: 4,
        borderTop: "1px solid rgba(255, 255, 255, 0.08)",
      }}
    >
      <Container maxWidth="xl">
        <Grid container spacing={{ xs: 5, md: 8 }}>
          {/* Brand Column */}
          <Grid size={{ xs: 12, md: 4 }}>
            <Stack spacing={3} sx={{ alignItems: "flex-start" }}>
              <Logo onDark />
              <Typography
                variant="body2"
                sx={{
                  color: "rgba(255, 255, 255, 0.55)",
                  lineHeight: 1.7,
                  fontSize: "0.925rem",
                  maxWidth: 320,
                }}
              >
                Ethiopia's leading multi-tenant B2B pharmaceutical inventory, batch tracking, and compliance management platform.
              </Typography>
              <Stack direction="row" spacing={1.5}>
                {[
                  { icon: <LinkedInIcon />, label: "LinkedIn" },
                  { icon: <TwitterIcon />, label: "Twitter" },
                  { icon: <TelegramIcon />, label: "Telegram" },
                  { icon: <FacebookIcon />, label: "Facebook" },
                ].map((social) => (
                  <IconButton
                    key={social.label}
                    aria-label={social.label}
                    size="small"
                    sx={{
                      color: "rgba(255, 255, 255, 0.5)",
                      bgcolor: "rgba(255, 255, 255, 0.03)",
                      border: "1px solid rgba(255, 255, 255, 0.08)",
                      transition: "all 0.2s ease",
                      "&:hover": {
                        color: "#DDAA4A",
                        bgcolor: "rgba(221, 170, 74, 0.1)",
                        borderColor: "#DDAA4A",
                        transform: "translateY(-3px)",
                      },
                    }}
                  >
                    {social.icon}
                  </IconButton>
                ))}
              </Stack>
            </Stack>
          </Grid>

          {/* Quick Links Column */}
          <Grid size={{ xs: 6, sm: 4, md: 2.5 }}>
            <Typography
              variant="subtitle2"
              sx={{
                color: "white",
                fontWeight: 800,
                letterSpacing: "0.05em",
                textTransform: "uppercase",
                mb: 3,
              }}
            >
              Platform
            </Typography>
            <Stack spacing={2} sx={{ alignItems: "flex-start" }}>
              {[
                { text: "Browse Medicine", path: "/marketplace" },
                { text: "Features & Auditing", path: "/#features" },
                { text: "Pricing & Plans", path: "/#pricing" },
                { text: "System Login", path: "/login" },
              ].map((link) => (
                <Button
                  key={link.text}
                  onClick={() => navigate(link.path)}
                  sx={{
                    color: "rgba(255, 255, 255, 0.55)",
                    p: 0,
                    minHeight: 0,
                    fontWeight: 500,
                    fontSize: "0.9rem",
                    transition: "color 0.2s ease",
                    "&:hover": {
                      color: "#DDAA4A",
                      bgcolor: "transparent",
                      transform: "translateX(4px)",
                    },
                  }}
                >
                  {link.text}
                </Button>
              ))}
            </Stack>
          </Grid>

          {/* Legal & Support Column */}
          <Grid size={{ xs: 6, sm: 4, md: 2.5 }}>
            <Typography
              variant="subtitle2"
              sx={{
                color: "white",
                fontWeight: 800,
                letterSpacing: "0.05em",
                textTransform: "uppercase",
                mb: 3,
              }}
            >
              Support & Legal
            </Typography>
            <Stack spacing={2} sx={{ alignItems: "flex-start" }}>
              {[
                { text: "Privacy Policy", path: "#" },
                { text: "Terms of Service", path: "#" },
                { text: "Auditing & Compliance", path: "#" },
                { text: "Contact Support", path: "/#contact" },
              ].map((link) => (
                <Button
                  key={link.text}
                  onClick={() => navigate(link.path)}
                  sx={{
                    color: "rgba(255, 255, 255, 0.55)",
                    p: 0,
                    minHeight: 0,
                    fontWeight: 500,
                    fontSize: "0.9rem",
                    transition: "color 0.2s ease",
                    "&:hover": {
                      color: "#DDAA4A",
                      bgcolor: "transparent",
                      transform: "translateX(4px)",
                    },
                  }}
                >
                  {link.text}
                </Button>
              ))}
            </Stack>
          </Grid>

          {/* Newsletter Column */}
          <Grid size={{ xs: 12, sm: 4, md: 3 }}>
            <Typography
              variant="subtitle2"
              sx={{
                color: "white",
                fontWeight: 800,
                letterSpacing: "0.05em",
                textTransform: "uppercase",
                mb: 3,
              }}
            >
              Stay Updated
            </Typography>
            <Typography
              variant="body2"
              sx={{
                color: "rgba(255, 255, 255, 0.55)",
                mb: 2.5,
                lineHeight: 1.6,
                fontSize: "0.9rem",
              }}
            >
              Subscribe to get news about pharmaceuticals and platform updates.
            </Typography>
            {subscribed ? (
              <Box
                sx={{
                  p: 1.5,
                  borderRadius: 2,
                  bgcolor: "rgba(15, 139, 108, 0.1)",
                  border: "1px solid rgba(15, 139, 108, 0.2)",
                  color: "#0F8B6C",
                }}
              >
                <Typography variant="body2" sx={{ fontWeight: 700 }}>
                  ✓ Subscribed successfully!
                </Typography>
              </Box>
            ) : (
              <Box component="form" onSubmit={handleSubscribe}>
                <TextField
                  fullWidth
                  variant="outlined"
                  size="small"
                  placeholder="name@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  type="email"
                  required
                  slotProps={{
                    input: {
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton type="submit" size="small" sx={{ color: "#DDAA4A" }}>
                            <SendIcon fontSize="small" />
                          </IconButton>
                        </InputAdornment>
                      ),
                      sx: {
                        color: "white",
                        bgcolor: "rgba(255, 255, 255, 0.04)",
                        border: "1px solid rgba(255, 255, 255, 0.08)",
                        "&:hover": {
                          borderColor: "rgba(255, 255, 255, 0.15)",
                        },
                        "&.Mui-focused": {
                          bgcolor: "rgba(255, 255, 255, 0.06)",
                          borderColor: "#DDAA4A",
                        },
                      },
                    },
                  }}
                  sx={{
                    "& .MuiOutlinedInput-notchedOutline": { border: "none" },
                  }}
                />
              </Box>
            )}
          </Grid>
        </Grid>

        <Divider sx={{ my: 6, borderColor: "rgba(255, 255, 255, 0.08)" }} />

        <Stack
          direction={{ xs: "column", md: "row" }}
          spacing={3}
          sx={{
            justifyContent: "space-between",
            alignItems: "center",
            fontSize: "0.85rem",
            color: "rgba(255, 255, 255, 0.45)",
          }}
        >
          <Typography variant="body2" sx={{ fontSize: "inherit" }}>
            © {new Date().getFullYear()} Alyah Pharma Net. All rights reserved.
          </Typography>

          {/* Compliance & Verification Badges */}
          <Stack
            direction="row"
            spacing={2}
            sx={{
              alignItems: "center",
              bgcolor: "rgba(255, 255, 255, 0.03)",
              px: 2,
              py: 1,
              borderRadius: 2.5,
              border: "1px solid rgba(255, 255, 255, 0.06)",
            }}
          >
            <VerifiedIcon sx={{ color: "#DDAA4A", fontSize: "1.1rem" }} />
            <Typography variant="caption" sx={{ fontWeight: 700, color: "rgba(255, 255, 255, 0.7)" }}>
              ALCOA+ & FDA 21 CFR Part 11 Compliant
            </Typography>
          </Stack>

          <Typography variant="body2" sx={{ fontSize: "inherit" }}>
            Connecting Ethiopian Healthcare Professionals
          </Typography>
        </Stack>
      </Container>
    </Box>
  );
};

export default Footer;
