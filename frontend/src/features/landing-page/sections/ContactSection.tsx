// src/features/landing-page/sections/ContactSection.tsx
import { Apartment, Call, CheckCircleOutlined, Email } from "@mui/icons-material";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Container,
  Grid,
  Paper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { alpha } from "@mui/material/styles";
import { useState, type ChangeEvent, type FormEvent } from "react";
import { handleApiError } from "../../../utils/errorMapper";
import { sendContactMessage } from "../services/contactApi";

const WHY_CHOOSE_US = [
  "Tenant-isolated inventory and pharmacy operations",
  "Batch, expiry, and FEFO-aware stock tracking",
  "Immutable audit logs for accountable system activity",
  "Marketplace discovery without exposing sensitive pharmacy data",
];

interface ContactSectionProps {
  title?: string;
  subtitle?: string;
}

export const ContactSection = ({
  title = "Get in Touch",
  subtitle = "Have questions? We're here to help you succeed.",
}: ContactSectionProps) => {
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    message: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [notice, setNotice] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  const handleChange =
    (field: keyof typeof form) =>
    (event: ChangeEvent<HTMLInputElement>) => {
      setForm((prev) => ({ ...prev, [field]: event.target.value }));
    };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitting(true);
    setNotice(null);

    try {
      const message = await sendContactMessage(form);
      setNotice({ type: "success", message });
      setForm({ name: "", email: "", phone: "", message: "" });
    } catch (error) {
      setNotice({ type: "error", message: handleApiError(error) });
    } finally {
      setSubmitting(false);
    }
  };

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
              <Stack component="form" spacing={3} onSubmit={handleSubmit}>
                {notice && (
                  <Alert severity={notice.type} onClose={() => setNotice(null)}>
                    {notice.message}
                  </Alert>
                )}
                <TextField
                  fullWidth
                  label="Full Name"
                  variant="outlined"
                  value={form.name}
                  onChange={handleChange("name")}
                  required
                  disabled={submitting}
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
                  value={form.email}
                  onChange={handleChange("email")}
                  required
                  disabled={submitting}
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
                  value={form.phone}
                  onChange={handleChange("phone")}
                  disabled={submitting}
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
                  value={form.message}
                  onChange={handleChange("message")}
                  required
                  disabled={submitting}
                  sx={{
                    "& .MuiOutlinedInput-root": {
                      borderRadius: 2,
                    },
                  }}
                />
                <Button
                  variant="contained"
                  fullWidth
                  type="submit"
                  disabled={submitting}
                  startIcon={submitting ? <CircularProgress size={18} color="inherit" /> : null}
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
                  {submitting ? "Sending..." : "Send Message"}
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
                    Besides Bahir Dar Institute of Technology (Poly Campus),
                    Kebele 10, Bahir Dar, Ethiopia
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
                  <Typography
                    component="a"
                    href="tel:+251928775577"
                    variant="body1"
                    color="text.secondary"
                    sx={{ textDecoration: "none", "&:hover": { color: "#0F5E4D" } }}
                  >
                    +251-92-877-5577
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
                  <Typography
                    component="a"
                    href="mailto:groomyas8@gmail.com"
                    variant="body1"
                    color="text.secondary"
                    sx={{ textDecoration: "none", "&:hover": { color: "#0F5E4D" } }}
                  >
                    groomyas8@gmail.com
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
