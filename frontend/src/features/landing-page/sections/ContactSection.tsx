// src/features/landing-page/sections/ContactSection.tsx
import { Apartment, Call, CheckCircleOutlined, Email } from "@mui/icons-material";
import {
  Box,
  Button,
  Container,
  Grid,
  Paper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { alpha } from "@mui/material/styles";

const WHY_CHOOSE_US = [
  "Trusted by 500+ pharmacies across Ethiopia",
  "Real-time inventory with 99.9% uptime",
  "Compliant with EFDA regulations",
  "Dedicated support team",
];

interface ContactSectionProps {
  title?: string;
  subtitle?: string;
}

export const ContactSection = ({
  title = "Get in Touch",
  subtitle = "Have questions? We're here to help you succeed.",
}: ContactSectionProps) => {
  return (
    <Box
      id="contact"
      sx={{
        py: { xs: 8, md: 12 },
        bgcolor: alpha("#0F5E4D", 0.04),
        borderTop: `1px solid ${alpha("#17231F", 0.06)}`,
      }}
    >
      <Container maxWidth="xl">
        <Box sx={{ textAlign: "center", mb: 8 }}>
          <Typography
            variant="h2"
            color="#0F5E4D"
            sx={{
              fontWeight: 800,
              mb: 2,
              fontSize: { xs: "2rem", md: "3rem" },
            }}
          >
            {title}
          </Typography>
          <Typography
            variant="body1"
            color="text.secondary"
            sx={{ maxWidth: 600, mx: "auto", fontSize: "1.1rem" }}
          >
            {subtitle}
          </Typography>
        </Box>

        <Grid container spacing={6}>
          {/* Contact Form */}
          <Grid size={{ xs: 12, md: 6 }}>
            <Paper
              elevation={0}
              sx={{
                p: { xs: 3, md: 5 },
                borderRadius: 4,
                bgcolor: alpha("#FFFFFF", 0.85),
                backdropFilter: "blur(20px)",
                border: `1px solid ${alpha("#17231F", 0.08)}`,
              }}
            >
              <Typography
                variant="h5"
                sx={{ fontWeight: 800, mb: 3, color: "#0F5E4D" }}
              >
                Send us a Message
              </Typography>
              <Stack spacing={3}>
                <TextField
                  fullWidth
                  label="Full Name"
                  variant="outlined"
                  slotProps={{
                    htmlInput: { autoComplete: "name" },
                  }}
                  sx={{
                    "& .MuiOutlinedInput-root": {
                      borderRadius: 2,
                    },
                  }}
                />
                <TextField
                  fullWidth
                  label="Email Address"
                  type="email"
                  variant="outlined"
                  slotProps={{
                    htmlInput: { autoComplete: "email" },
                  }}
                  sx={{
                    "& .MuiOutlinedInput-root": {
                      borderRadius: 2,
                    },
                  }}
                />
                <TextField
                  fullWidth
                  label="Phone Number"
                  type="tel"
                  variant="outlined"
                  slotProps={{
                    htmlInput: { autoComplete: "tel" },
                  }}
                  sx={{
                    "& .MuiOutlinedInput-root": {
                      borderRadius: 2,
                    },
                  }}
                />
                <TextField
                  fullWidth
                  label="Message"
                  multiline
                  rows={5}
                  variant="outlined"
                  sx={{
                    "& .MuiOutlinedInput-root": {
                      borderRadius: 2,
                    },
                  }}
                />
                <Button
                  variant="contained"
                  fullWidth
                  sx={{
                    bgcolor: "#0F5E4D",
                    color: "#FFFFFF",
                    fontWeight: 700,
                    py: 1.75,
                    borderRadius: 2,
                    "&:hover": {
                      bgcolor: "#0A6B59",
                    },
                  }}
                >
                  Send Message
                </Button>
              </Stack>
            </Paper>
          </Grid>

          {/* Contact Information Cards */}
          <Grid size={{ xs: 12, md: 6 }}>
            <Stack spacing={3}>
              {/* Office Location */}
              <Paper
                elevation={0}
                sx={{
                  p: 4,
                  borderRadius: 3,
                  bgcolor: alpha("#FFFFFF", 0.85),
                  backdropFilter: "blur(20px)",
                  border: `1px solid ${alpha("#17231F", 0.08)}`,
                  display: "flex",
                  alignItems: "flex-start",
                  gap: 2.5,
                }}
              >
                <Box
                  sx={{
                    width: 56,
                    height: 56,
                    borderRadius: 2.5,
                    bgcolor: alpha("#0F5E4D", 0.1),
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#0F5E4D",
                    flexShrink: 0,
                  }}
                >
                  <Apartment sx={{ fontSize: 28 }} />
                </Box>
                <Box>
                  <Typography
                    variant="h6"
                    sx={{ fontWeight: 800, mb: 1, color: "#0F5E4D" }}
                  >
                    Office Location
                  </Typography>
                  <Typography variant="body1" color="text.secondary">
                    Bole Subcity, Woreda 03
                    <br />
                    Addis Ababa, Ethiopia
                  </Typography>
                </Box>
              </Paper>

              {/* Phone */}
              <Paper
                elevation={0}
                sx={{
                  p: 4,
                  borderRadius: 3,
                  bgcolor: alpha("#FFFFFF", 0.85),
                  backdropFilter: "blur(20px)",
                  border: `1px solid ${alpha("#17231F", 0.08)}`,
                  display: "flex",
                  alignItems: "flex-start",
                  gap: 2.5,
                }}
              >
                <Box
                  sx={{
                    width: 56,
                    height: 56,
                    borderRadius: 2.5,
                    bgcolor: alpha("#DDAA4A", 0.1),
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#8A5F16",
                    flexShrink: 0,
                  }}
                >
                  <Call sx={{ fontSize: 28 }} />
                </Box>
                <Box>
                  <Typography
                    variant="h6"
                    sx={{ fontWeight: 800, mb: 1, color: "#0F5E4D" }}
                  >
                    Phone
                  </Typography>
                  <Typography variant="body1" color="text.secondary">
                    +251 11 666 8899
                    <br />
                    <Typography
                      component="span"
                      variant="caption"
                      color="text.secondary"
                    >
                      Mon-Fri, 8:00 AM - 6:00 PM EAT
                    </Typography>
                  </Typography>
                </Box>
              </Paper>

              {/* Email */}
              <Paper
                elevation={0}
                sx={{
                  p: 4,
                  borderRadius: 3,
                  bgcolor: alpha("#FFFFFF", 0.85),
                  backdropFilter: "blur(20px)",
                  border: `1px solid ${alpha("#17231F", 0.08)}`,
                  display: "flex",
                  alignItems: "flex-start",
                  gap: 2.5,
                }}
              >
                <Box
                  sx={{
                    width: 56,
                    height: 56,
                    borderRadius: 2.5,
                    bgcolor: alpha("#0F5E4D", 0.1),
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#0F5E4D",
                    flexShrink: 0,
                  }}
                >
                  <Email sx={{ fontSize: 28 }} />
                </Box>
                <Box>
                  <Typography
                    variant="h6"
                    sx={{ fontWeight: 800, mb: 1, color: "#0F5E4D" }}
                  >
                    Support Email
                  </Typography>
                  <Typography variant="body1" color="text.secondary">
                    support@alyapharmanet.com
                    <br />
                    <Typography
                      component="span"
                      variant="caption"
                      color="text.secondary"
                    >
                      We typically respond within 24 hours
                    </Typography>
                  </Typography>
                </Box>
              </Paper>

              {/* Additional Info Card */}
              <Paper
                elevation={0}
                sx={{
                  p: 4,
                  borderRadius: 3,
                  bgcolor: alpha("#0F5E4D", 0.08),
                  backdropFilter: "blur(20px)",
                  border: `1px solid ${alpha("#0F5E4D", 0.2)}`,
                }}
              >
                <Typography
                  variant="h6"
                  sx={{ fontWeight: 800, mb: 2, color: "#0F5E4D" }}
                >
                  Why Choose Alyah Pharma Net?
                </Typography>
                <Stack spacing={1.5}>
                  {WHY_CHOOSE_US.map((item, idx) => (
                    <Stack
                      key={idx}
                      direction="row"
                      spacing={1.5}
                      sx={{ alignItems: "center" }}
                    >
                      <CheckCircleOutlined
                        sx={{ color: "#0F5E4D", fontSize: 20, flexShrink: 0 }}
                      />
                      <Typography variant="body2" color="text.secondary">
                        {item}
                      </Typography>
                    </Stack>
                  ))}
                </Stack>
              </Paper>
            </Stack>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
};

export default ContactSection;