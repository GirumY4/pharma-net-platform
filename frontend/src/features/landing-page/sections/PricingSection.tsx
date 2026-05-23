// src/features/landing-page/sections/PricingSection.tsx
import { CheckCircleOutlined } from "@mui/icons-material";
import {
  Box,
  Button,
  Container,
  Grid,
  Paper,
  Stack,
  Typography,
} from "@mui/material";
import { alpha } from "@mui/material/styles";
import { useNavigate } from "react-router-dom";

const PRICING_PLANS = [
  {
    name: "Single Pharmacy",
    price: "ETB 2,500",
    period: "/month",
    description:
      "Perfect for independent pharmacies starting their digital journey",
    features: [
      "Up to 5,000 SKUs",
      "Basic inventory tracking",
      "Sales reporting",
      "Expiry alerts",
      "Email support",
    ],
    highlighted: false,
  },
  {
    name: "Professional",
    price: "ETB 5,000",
    period: "/month",
    description: "Ideal for growing pharmacies with advanced needs",
    features: [
      "Unlimited SKUs",
      "FEFO batch management",
      "Advanced analytics",
      "Multi-user access (up to 5)",
      "Priority email & phone support",
      "API access",
    ],
    highlighted: true,
  },
  {
    name: "Enterprise Chain",
    price: "Custom",
    period: "",
    description: "For pharmacy chains and large-scale operations",
    features: [
      "Everything in Professional",
      "Multi-location management",
      "Centralized procurement",
      "Custom integrations",
      "Dedicated account manager",
      "SLA guarantees",
      "On-premise deployment option",
    ],
    highlighted: false,
  },
];

interface PricingSectionProps {
  title?: string;
  subtitle?: string;
}

export const PricingSection = ({
  title = "Transparent Pricing for Every Scale",
  subtitle = "Choose the plan that fits your pharmacy. All plans include core features with no hidden fees.",
}: PricingSectionProps) => {
  const navigate = useNavigate();

  return (
    <Box
      id="pricing"
      sx={{
        py: { xs: 8, md: 12 },
        bgcolor: alpha("#0F5E4D", 0.04),
        borderTop: `1px solid ${alpha("#17231F", 0.06)}`,
        borderBottom: `1px solid ${alpha("#17231F", 0.06)}`,
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
            sx={{ maxWidth: 650, mx: "auto", fontSize: "1.1rem" }}
          >
            {subtitle}
          </Typography>
        </Box>

        <Grid container spacing={4} sx={{ justifyContent: "center" }}>
          {PRICING_PLANS.map((plan, index) => (
            <Grid size={{ xs: 12, md: 4 }} key={index}>
              <Paper
                elevation={0}
                sx={{
                  height: "100%",
                  borderRadius: 4,
                  p: 4,
                  bgcolor: alpha("#FFFFFF", 0.8),
                  backdropFilter: "blur(20px)",
                  border: plan.highlighted
                    ? `2px solid #DDAA4A`
                    : `1px solid ${alpha("#17231F", 0.1)}`,
                  position: "relative",
                  transition: "all 240ms cubic-bezier(0.4, 0, 0.2, 1)",
                  "&:hover": {
                    transform: "translateY(-8px)",
                    boxShadow: `0 32px 80px ${alpha("#0F5E4D", 0.15)}`,
                  },
                }}
              >
                {plan.highlighted && (
                  <Box
                    sx={{
                      position: "absolute",
                      top: -12,
                      left: "50%",
                      transform: "translateX(-50%)",
                      bgcolor: "#DDAA4A",
                      color: "#13201C",
                      px: 2,
                      py: 0.5,
                      borderRadius: 2,
                      fontWeight: 800,
                      fontSize: "0.75rem",
                      textTransform: "uppercase",
                      letterSpacing: "0.08em",
                    }}
                  >
                    Most Popular
                  </Box>
                )}
                <Typography
                  variant="h5"
                  sx={{ fontWeight: 800, mb: 1, color: "#0F5E4D" }}
                >
                  {plan.name}
                </Typography>
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ mb: 3, minHeight: 48 }}
                >
                  {plan.description}
                </Typography>
                <Box sx={{ mb: 3 }}>
                  <Typography
                    component="span"
                    variant="h3"
                    sx={{
                      fontWeight: 900,
                      color: plan.highlighted ? "#DDAA4A" : "#0F5E4D",
                    }}
                  >
                    {plan.price}
                  </Typography>
                  <Typography
                    component="span"
                    variant="body1"
                    color="text.secondary"
                    sx={{ ml: 0.5 }}
                  >
                    {plan.period}
                  </Typography>
                </Box>
                <Button
                  variant={plan.highlighted ? "contained" : "outlined"}
                  fullWidth
                  onClick={() => navigate("/register")}
                  sx={{
                    mb: 3,
                    py: 1.5,
                    fontWeight: 700,
                    ...(plan.highlighted
                      ? {
                          bgcolor: "#0F5E4D",
                          "&:hover": { bgcolor: "#0A6B59" },
                        }
                      : {
                          borderColor: "#0F5E4D",
                          color: "#0F5E4D",
                          "&:hover": {
                            bgcolor: alpha("#0F5E4D", 0.08),
                          },
                        }),
                  }}
                >
                  Get Started
                </Button>
                <Stack spacing={1.5}>
                  {plan.features.map((feature, fIndex) => (
                    <Stack
                      key={fIndex}
                      direction="row"
                      spacing={1.5}
                      sx={{ alignItems: "flex-start" }}
                    >
                      <CheckCircleOutlined
                        sx={{
                          color: plan.highlighted ? "#DDAA4A" : "#0F5E4D",
                          fontSize: 20,
                          flexShrink: 0,
                          mt: 0.2,
                        }}
                      />
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{ lineHeight: 1.6 }}
                      >
                        {feature}
                      </Typography>
                    </Stack>
                  ))}
                </Stack>
              </Paper>
            </Grid>
          ))}
        </Grid>
      </Container>
    </Box>
  );
};

export default PricingSection;
