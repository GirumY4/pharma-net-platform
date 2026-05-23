// src/features/landing-page/sections/FeaturesSection.tsx
import {
  Apartment,
  LocalShipping,
  LockOutlined,
  Security,
  Speed,
  Support,
} from "@mui/icons-material";
import { Box, Card, CardContent, Container, Grid, Typography } from "@mui/material";
import { alpha } from "@mui/material/styles";

const FEATURES = [
  {
    icon: <Speed sx={{ fontSize: 32 }} />,
    title: "Real-Time Inventory",
    description:
      "Live tracking of quantities, category cataloging, and automated low-stock threshold alerts.",
  },
  {
    icon: <Security sx={{ fontSize: 32 }} />,
    title: "FEFO Batch Tracking",
    description:
      "Manufacturer batch tracking with expiry dates, GS1 GTIN barcodes, and storage locations.",
  },
  {
    icon: <LockOutlined sx={{ fontSize: 32 }} />,
    title: "Compliance & Audit Logs",
    description:
      "Attributable, contemporaneous, and immutable audit logs satisfying ALCOA+ standards.",
  },
  {
    icon: <Apartment sx={{ fontSize: 32 }} />,
    title: "Immutable Ledgers",
    description:
      "Tamper-proof transaction logging for Goods Received (GRN) and Goods Issued (GIN) adjustments.",
  },
  {
    icon: <Support sx={{ fontSize: 32 }} />,
    title: "Operations & Reporting",
    description:
      "Tenant-scoped dashboards for sales summaries, inventory values, and expiry forecasts.",
  },
  {
    icon: <LocalShipping sx={{ fontSize: 32 }} />,
    title: "Secure Tenant Isolation",
    description:
      "Strict application-layer database segregation ensures absolute privacy for every pharmacy tenant.",
  },
];

interface FeaturesSectionProps {
  title?: string;
  subtitle?: string;
}

export const FeaturesSection = ({
  title = "Powerful Features for Modern Pharmacies",
  subtitle = "Everything you need to run your pharmacy efficiently, maintain regulatory compliance, and track stock in real-time.",
}: FeaturesSectionProps) => {
  return (
    <Container id="features" maxWidth="xl" sx={{ py: { xs: 8, md: 12 } }}>
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

      <Grid container spacing={3}>
        {FEATURES.map((feature, index) => (
          <Grid size={{ xs: 12, sm: 6, md: 4 }} key={index}>
            <Card
              sx={{
                height: "100%",
                borderRadius: 3,
                border: `1px solid ${alpha("#17231F", 0.08)}`,
                transition: "all 240ms cubic-bezier(0.4, 0, 0.2, 1)",
                "&:hover": {
                  transform: "translateY(-6px)",
                  boxShadow: `0 24px 64px ${alpha("#0F5E4D", 0.12)}`,
                  borderColor: alpha("#0F5E4D", 0.3),
                },
              }}
            >
              <CardContent sx={{ p: 3.5 }}>
                <Box
                  sx={{
                    width: 64,
                    height: 64,
                    borderRadius: 3,
                    bgcolor: alpha("#0F5E4D", 0.08),
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#0F5E4D",
                    mb: 2.5,
                  }}
                >
                  {feature.icon}
                </Box>
                <Typography
                  variant="h5"
                  sx={{ fontWeight: 800, mb: 1.5, color: "#0F5E4D" }}
                >
                  {feature.title}
                </Typography>
                <Typography variant="body1" color="text.secondary">
                  {feature.description}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Container>
  );
};

export default FeaturesSection;