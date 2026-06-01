import {
  AppBar,
  Box,
  Button,
  Chip,
  Container,
  Divider,
  Stack,
  Toolbar,
  Typography,
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import SEO from "../../components/SEO";
import { Footer } from "../../components/layout/Footer";
import { Logo } from "../../components/Logo";

type LegalPageKind = "privacy" | "terms" | "compliance";

interface LegalSection {
  title: string;
  body: string[];
}

const legalContent: Record<
  LegalPageKind,
  {
    title: string;
    eyebrow: string;
    description: string;
    sections: LegalSection[];
  }
> = {
  privacy: {
    title: "Privacy Policy",
    eyebrow: "Data protection",
    description:
      "How Alyah Pharma Net handles account, marketplace, inventory, and operational data inside a multi-tenant pharmacy platform.",
    sections: [
      {
        title: "Scope",
        body: [
          "This policy applies to the Alyah Pharma Net web dashboard, public marketplace discovery surfaces, and shared backend APIs documented for the project.",
          "The platform focuses on medicine discovery, inventory management, order coordination, payments, reports, and audit logs. It is not designed to store clinical records, insurance claims, or advanced patient medical histories.",
        ],
      },
      {
        title: "Information We Process",
        body: [
          "Account information may include name, email address, role, phone number, address, city, profile image, and account status.",
          "Pharmacy operations data may include medicine catalog records, batches, stock levels, expiry dates, inventory transactions, orders, payments, reports, notifications, and audit events.",
          "Marketplace responses expose only public discovery fields such as medicine name, category, availability, price, pharmacy name, and pharmacy contact/location data. Sensitive internal batch details, supplier names, and shelf locations are excluded from public marketplace results.",
        ],
      },
      {
        title: "Security And Tenant Isolation",
        body: [
          "Protected API access uses JWT authentication and role-based authorization. Pharmacy manager operations are scoped by the pharmacy identity derived from the authenticated token rather than user-supplied tenant IDs.",
          "Passwords are hashed with bcrypt and are never returned through API responses.",
          "Tenant-scoped collections use pharmacy identifiers so one pharmacy cannot read or modify another pharmacy's operational data through authorized workflows.",
        ],
      },
      {
        title: "Retention And Auditability",
        body: [
          "Compliance-critical records use immutable audit logs and transaction ledgers where supported by the backend schema.",
          "Soft-delete patterns preserve historical context for users and medicine records where auditability is required.",
          "Operational logs may include timestamps, acting user, IP address, user agent, resource type, and before/after state snapshots for traceability.",
        ],
      },
      {
        title: "Contact",
        body: [
          "For privacy or support questions, contact Alyah Pharma Net at groomyas8@gmail.com or +251-92-877-5577.",
        ],
      },
    ],
  },
  terms: {
    title: "Terms of Service",
    eyebrow: "Platform use",
    description:
      "Professional use terms for pharmacy managers, administrators, public users, and API consumers using Alyah Pharma Net.",
    sections: [
      {
        title: "Accepted Use",
        body: [
          "Alyah Pharma Net is intended for pharmacy inventory operations, marketplace medicine discovery, order coordination, payment recording, reporting, and administrative tenant governance.",
          "Users must provide accurate account, contact, pharmacy, medicine, stock, and payment information when using the platform.",
        ],
      },
      {
        title: "Roles And Responsibilities",
        body: [
          "Pharmacy managers are responsible for maintaining accurate tenant-scoped medicine catalogs, batch details, stock levels, prices, contact details, and fulfillment updates.",
          "Administrators are responsible for tenant governance, billing review, role management, account lifecycle decisions, and platform oversight.",
          "Public users may search marketplace availability and use available ordering workflows only as implemented and enabled by the platform.",
        ],
      },
      {
        title: "Limitations",
        body: [
          "The platform supports operational logistics and discovery. It does not provide medical diagnosis, prescription validation, insurance adjudication, or clinical advice.",
          "Marketplace ordering and request tracking may be disabled or limited while workflows are being prepared, reviewed, or maintained.",
          "Regulatory responsibility for drug handling, dispensing, and local legal compliance remains with the licensed pharmacy or responsible organization.",
        ],
      },
      {
        title: "Security Requirements",
        body: [
          "Users must protect credentials, use authorized accounts only, and avoid attempting to access another tenant's data.",
          "The platform may record security and audit events to support accountability, troubleshooting, and compliance review.",
        ],
      },
      {
        title: "Support",
        body: [
          "Support requests can be sent through the contact form, by email at groomyas8@gmail.com, or by phone at +251-92-877-5577.",
        ],
      },
    ],
  },
  compliance: {
    title: "Auditing & Compliance",
    eyebrow: "Audit-ready controls",
    description:
      "A practical overview of the audit, integrity, tenant isolation, and traceability controls described in the project documentation.",
    sections: [
      {
        title: "Compliance Model",
        body: [
          "The project documentation describes a professional simulation of pharmaceutical data integrity controls inspired by ALCOA+ and FDA 21 CFR Part 11 principles.",
          "These controls are implemented as software safeguards for traceability and accountability; they do not replace pharmacy licensing duties or formal regulatory certification.",
        ],
      },
      {
        title: "Audit Logs",
        body: [
          "Critical data changes create audit entries with the acting user, timestamp, resource, action type, IP address, user agent, and before/after state where applicable.",
          "Audit log schemas are designed as append-only records. Update and delete operations are blocked at the schema level for audit-critical collections.",
        ],
      },
      {
        title: "Inventory Transaction Ledger",
        body: [
          "GRN and GIN stock movements create immutable inventory transaction records with stock-before, stock-after, quantity changed, transaction type, timestamp, and actor details.",
          "This ledger supports stock movement traceability across tenant-scoped pharmacy operations.",
        ],
      },
      {
        title: "Tenant Boundaries",
        body: [
          "Pharmacy manager access is scoped by the authenticated pharmacy identity. The backend derives tenant context from JWT claims and applies it to downstream queries.",
          "Public marketplace search returns an aggregated discovery view while excluding sensitive tenant operational data.",
        ],
      },
      {
        title: "Operational Readiness",
        body: [
          "The platform uses soft deletes, role-based authorization, server-generated timestamps, password hashing, and structured REST responses to support maintainable operations.",
          "Reports and admin views provide tenant-scoped and platform-level oversight where enabled by role and subscription permissions.",
        ],
      },
    ],
  },
};

export const LegalPage = ({ kind }: { kind: LegalPageKind }) => {
  const navigate = useNavigate();
  const content = legalContent[kind];

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "#F7FAF9" }}>
      <SEO title={content.title} noIndex={true} />
      <AppBar
        position="sticky"
        elevation={0}
        sx={{
          bgcolor: "rgba(247, 250, 249, 0.86)",
          backdropFilter: "blur(18px)",
          borderBottom: "1px solid rgba(23, 35, 31, 0.08)",
          color: "text.primary",
        }}
      >
        <Toolbar sx={{ px: { xs: 2, md: 4 }, minHeight: 72 }}>
          <Box sx={{ cursor: "pointer" }} onClick={() => navigate("/")}>
            <Logo />
          </Box>
          <Box sx={{ flexGrow: 1 }} />
          <Button onClick={() => navigate("/marketplace")} variant="outlined">
            Marketplace
          </Button>
        </Toolbar>
      </AppBar>

      <Box
        sx={{
          py: { xs: 7, md: 10 },
          borderBottom: "1px solid rgba(23, 35, 31, 0.08)",
          background:
            "linear-gradient(135deg, rgba(15, 139, 108, 0.07) 0%, rgba(221, 170, 74, 0.07) 100%)",
        }}
      >
        <Container maxWidth="md">
          <Chip
            label={content.eyebrow}
            sx={{
              mb: 2,
              bgcolor: "rgba(15, 139, 108, 0.1)",
              color: "#0F5E4D",
              fontWeight: 800,
            }}
          />
          <Typography
            variant="h2"
            sx={{
              color: "#0F5E4D",
              fontWeight: 850,
              fontSize: { xs: "2.2rem", md: "3.3rem" },
              lineHeight: 1.1,
            }}
          >
            {content.title}
          </Typography>
          <Typography
            variant="body1"
            color="text.secondary"
            sx={{ mt: 2, fontSize: { xs: "1rem", md: "1.08rem" }, lineHeight: 1.75 }}
          >
            {content.description}
          </Typography>
        </Container>
      </Box>

      <Container maxWidth="md" sx={{ py: { xs: 5, md: 7 } }}>
        <Stack spacing={4.5}>
          {content.sections.map((section) => (
            <Box key={section.title}>
              <Typography
                variant="h5"
                sx={{ color: "#17231F", fontWeight: 820, mb: 1.5 }}
              >
                {section.title}
              </Typography>
              <Divider sx={{ mb: 2, borderColor: "rgba(15, 139, 108, 0.18)" }} />
              <Stack spacing={1.5}>
                {section.body.map((paragraph) => (
                  <Typography
                    key={paragraph}
                    variant="body1"
                    color="text.secondary"
                    sx={{ lineHeight: 1.75 }}
                  >
                    {paragraph}
                  </Typography>
                ))}
              </Stack>
            </Box>
          ))}
        </Stack>
      </Container>

      <Footer />
    </Box>
  );
};

export default LegalPage;
