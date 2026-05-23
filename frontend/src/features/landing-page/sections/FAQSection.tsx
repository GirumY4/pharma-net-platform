// src/features/landing-page/sections/FAQSection.tsx
import { ExpandMore } from "@mui/icons-material";
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  Container,
  Typography,
} from "@mui/material";
import { alpha } from "@mui/material/styles";

const FAQ_ITEMS = [
  {
    question: "What is Alyah Pharma Net?",
    answer:
      "Alyah Pharma Net is a B2B multi-tenant SaaS platform designed for pharmacies to manage their inventory, batch tracking, stock adjustments (GRN/GIN), and satisfy regulatory compliance requirements with audit logs.",
  },
  {
    question: "Does the platform support remote ordering or medicine delivery?",
    answer:
      "No, the platform is designed for pharmacy operations, inventory tracking, and compliance management. A public-facing search is available to check real-time stock availability for physical in-store pickup, but remote ordering and delivery are not supported at this time.",
  },
  {
    question: "How does the compliance audit trail work?",
    answer:
      "Every stock adjustment, user action, or inventory transaction creates an immutable, append-only log record. It captures the user, timestamp, IP address, user-agent, and before/after states of the data to help pharmacies meet ALCOA+ and FDA 21 CFR Part 11 guidelines.",
  },
  {
    question: "Is my pharmacy data isolated?",
    answer:
      "Yes. Alyah Pharma Net uses a secure multi-tenant database schema where all inventory, transaction, and report data are strictly segregated by a tenant ID. One pharmacy can never view or modify another's data.",
  },
];

interface FAQSectionProps {
  title?: string;
  subtitle?: string;
}

export const FAQSection = ({
  title = "Frequently Asked Questions",
  subtitle = "Find answers to common questions about our platform.",
}: FAQSectionProps) => {
  return (
    <Container maxWidth="lg" sx={{ py: { xs: 8, md: 12 } }}>
      <Box sx={{ textAlign: "center", mb: 6 }}>
        <Typography
          variant="h2"
          color="#0F5E4D"
          sx={{
            fontWeight: 800,
            mb: 2,
            fontSize: { xs: "2rem", md: "2.5rem" },
          }}
        >
          {title}
        </Typography>
        <Typography
          variant="body1"
          color="text.secondary"
          sx={{ maxWidth: 600, mx: "auto" }}
        >
          {subtitle}
        </Typography>
      </Box>

      <Box sx={{ maxWidth: 800, mx: "auto" }}>
        {FAQ_ITEMS.map((item, index) => (
          <Accordion
            key={index}
            sx={{
              mb: 2,
              borderRadius: 3,
              border: `1px solid ${alpha("#17231F", 0.1)}`,
              bgcolor: alpha("#FFFFFF", 0.6),
              backdropFilter: "blur(10px)",
              "&:before": { display: "none" },
              "&.Mui-expanded": {
                border: `1px solid ${alpha("#0F5E4D", 0.3)}`,
              },
            }}
          >
            <AccordionSummary
              expandIcon={<ExpandMore />}
              sx={{
                fontWeight: 700,
                color: "#0F5E4D",
                "& .MuiAccordionSummary-expandIconWrapper.Mui-expanded": {
                  transform: "rotate(180deg)",
                },
              }}
            >
              {item.question}
            </AccordionSummary>
            <AccordionDetails sx={{ pt: 0 }}>
              <Typography variant="body1" color="text.secondary">
                {item.answer}
              </Typography>
            </AccordionDetails>
          </Accordion>
        ))}
      </Box>
    </Container>
  );
};

export default FAQSection;