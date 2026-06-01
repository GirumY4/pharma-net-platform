// src/components/layout/Footer.tsx
import {
  Facebook as FacebookIcon,
  Instagram as InstagramIcon,
  Language as WebsiteIcon,
  LinkedIn as LinkedInIcon,
  MusicNote as TikTokIcon,
  Telegram as TelegramIcon,
  VerifiedUser as VerifiedIcon,
} from "@mui/icons-material";
import {
  Box,
  Button,
  Container,
  Divider,
  Grid,
  IconButton,
  Stack,
  Typography,
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import { Logo } from "../Logo";

const ALYAH_LINKS = [
  {
    icon: <LinkedInIcon />,
    label: "LinkedIn",
    href: "https://www.linkedin.com/company/alyah-software",
  },
  {
    icon: <TelegramIcon />,
    label: "Telegram",
    href: "https://t.me/alyahsoftware2",
  },
  {
    icon: <FacebookIcon />,
    label: "Facebook",
    href: "https://www.facebook.com/profile.php?id=100065420744158",
  },
  {
    icon: <WebsiteIcon />,
    label: "Website",
    href: "http://alyahsoftware.com/",
  },
];

const PARENT_SOCIAL_LINKS = [
  {
    icon: <TikTokIcon />,
    text: "TikTok",
    href: "https://www.tiktok.com/@alyah_group?_r=1&_t=ZS-95dSQrUMOuL",
  },
  {
    icon: <InstagramIcon />,
    text: "Instagram",
    href: "https://www.instagram.com/alyah_software?igsh=MXJveTNtbXR3c2h2YQ==",
  },
  {
    icon: <LinkedInIcon />,
    text: "LinkedIn",
    href: "https://www.linkedin.com/company/alyah-software/",
  },
  {
    icon: <FacebookIcon />,
    text: "Facebook",
    href: "https://www.facebook.com/profile.php?id=100065420744158",
  },
  {
    icon: <WebsiteIcon />,
    text: "Website",
    href: "http://alyahsoftware.com/",
  },
];

export const Footer = () => {
  const navigate = useNavigate();

  const linkButtonSx = {
    color: "rgba(255, 255, 255, 0.55)",
    p: 0,
    minHeight: 0,
    fontWeight: 500,
    fontSize: "0.9rem",
    textTransform: "none",
    transition: "color 0.2s ease",
    "&:hover": {
      color: "#DDAA4A",
      bgcolor: "transparent",
      transform: "translateX(4px)",
    },
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
          <Grid size={{ xs: 12, md: 4 }}>
            <Stack spacing={3} sx={{ alignItems: "flex-start" }}>
              <Logo onDark />
              <Typography
                variant="body2"
                sx={{
                  color: "rgba(255, 255, 255, 0.55)",
                  lineHeight: 1.7,
                  fontSize: "0.925rem",
                  maxWidth: 340,
                }}
              >
                Multi-tenant pharmaceutical inventory, batch tracking,
                marketplace discovery, and audit-ready operations for Ethiopian
                healthcare teams.
              </Typography>
              <Stack direction="row" spacing={1.5}>
                {ALYAH_LINKS.map((social) => (
                  <IconButton
                    key={social.label}
                    aria-label={social.label}
                    component="a"
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer"
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
                  sx={linkButtonSx}
                >
                  {link.text}
                </Button>
              ))}
            </Stack>
          </Grid>

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
                { text: "Privacy Policy", path: "/privacy-policy" },
                { text: "Terms of Service", path: "/terms-of-service" },
                { text: "Auditing & Compliance", path: "/auditing-compliance" },
                { text: "Contact Support", path: "/#contact" },
              ].map((link) => (
                <Button
                  key={link.text}
                  onClick={() => navigate(link.path)}
                  sx={linkButtonSx}
                >
                  {link.text}
                </Button>
              ))}
            </Stack>
          </Grid>

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
              Alyah Social Platform
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
              Follow our parent company channels for product updates, software
              work, and company news.
            </Typography>
            <Stack spacing={1.25} sx={{ alignItems: "flex-start" }}>
              {PARENT_SOCIAL_LINKS.map((link) => (
                <Button
                  key={link.text}
                  component="a"
                  href={link.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  startIcon={link.icon}
                  sx={{
                    ...linkButtonSx,
                    fontWeight: 600,
                  }}
                >
                  {link.text}
                </Button>
              ))}
            </Stack>
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
            &copy; {new Date().getFullYear()} Alyah Pharma Net. All rights
            reserved.
          </Typography>

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
            <Typography
              variant="caption"
              sx={{ fontWeight: 700, color: "rgba(255, 255, 255, 0.7)" }}
            >
              ALCOA+ audit-ready controls
            </Typography>
          </Stack>

          <Typography variant="body2" sx={{ fontSize: "inherit" }}>
            Connecting Ethiopian healthcare professionals
          </Typography>
        </Stack>
      </Container>
    </Box>
  );
};

export default Footer;
