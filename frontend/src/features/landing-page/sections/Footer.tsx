// src/features/landing-page/sections/Footer.tsx
import { Box, Button, Container, Stack, Typography } from "@mui/material";
import { alpha } from "@mui/material/styles";
import { Logo } from "../../../components/Logo";

export const Footer = () => {
  return (
    <Box
      sx={{
        py: 5,
        px: { xs: 2, md: 4 },
        borderTop: `1px solid ${alpha("#17231F", 0.08)}`,
        bgcolor: alpha("#FFFFFF", 0.5),
      }}
    >
      <Container maxWidth="xl">
        <Stack
          direction={{ xs: "column", md: "row" }}
          sx={{ justifyContent: "space-between", alignItems: "center" }}
          spacing={3}
        >
          <Logo compact />
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ textAlign: { xs: "center", md: "left" } }}
          >
            © {new Date().getFullYear()} Alyah Pharma Net. All rights reserved.
          </Typography>
          <Stack direction="row" spacing={3}>
            <Button
              size="small"
              sx={{ color: "text.secondary", fontWeight: 600 }}
            >
              Privacy Policy
            </Button>
            <Button
              size="small"
              sx={{ color: "text.secondary", fontWeight: 600 }}
            >
              Terms of Service
            </Button>
          </Stack>
        </Stack>
      </Container>
    </Box>
  );
};

export default Footer;
