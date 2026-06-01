// src/features/landing-page/pages/LandingPage.tsx
import { Box, CssBaseline } from "@mui/material";
import { useCallback } from "react";
import SEO from "../../../components/SEO";
import { PublicHeader } from "../components/PublicHeader";
import {
  ContactSection,
  FAQSection,
  FeaturesSection,
  Footer,
  HeroSection,
  PricingSection,
} from "../sections";

export const LandingPage = () => {
  const scrollToSection = useCallback((id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  }, []);

  const landingSchema = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "Alyah Pharma Net",
    url: import.meta.env.VITE_SITE_URL || "https://alyah-pharma-net.vercel.app",
    description:
      "Ethiopia's premier multi-tenant SaaS for pharmaceutical inventory, batch tracking, and compliance management. Real-time stock visibility and audit-ready tools.",
    potentialAction: {
      "@type": "SearchAction",
      target: `${import.meta.env.VITE_SITE_URL || "https://alyah-pharma-net.vercel.app"}/marketplace?name={search_term_string}`,
      "query-input": "required name=search_term_string",
    },
    publisher: {
      "@type": "Organization",
      name: "Alyah Pharma Net",
      logo: {
        "@type": "ImageObject",
        url: "https://alyah-pharma-net.vercel.app/alyah-logo-light.svg",
      },
    },
    offers: {
      "@type": "OfferCatalog",
      name: "Pharmacy Management Solutions",
      numberOfItems: 3,
    },
  };

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "#F7FAF9" }}>
      <CssBaseline />
      <SEO
        title="Alyah Pharma Net - B2B Multi-Tenant Pharmacy Inventory & Compliance SaaS"
        description="Manage pharmacy inventory, track FEFO batches, and maintain ALCOA+ compliance. Real-time stock visibility and audit-ready dashboards for modern pharmacies."
        keywords={[
          "medicine search Ethiopia",
          "pharmacy near me",
          "pharmaceutical marketplace",
          "multi-tenant pharmacy SaaS",
          "wholesale drugs",
          "medical supply B2B",
          "compliance audit logs",
          "pharmacy management system",
          "inventory tracking",
          "FEFO batch management",
          "FDA 21 CFR Part 11",
          "EFDA compliance",
        ]}
        structuredData={landingSchema}
      />

      {/* Sticky Public Header */}
      <PublicHeader onNavigateToSection={scrollToSection} />

      {/* Hero Zone with Live Search */}
      <HeroSection />

      {/* Features / About Grid */}
      <FeaturesSection />

      {/* Billing & Plans Section */}
      <PricingSection />

      {/* FAQ Section */}
      <FAQSection />

      {/* Contact Hub */}
      <ContactSection />

      {/* Footer */}
      <Footer />
    </Box>
  );
};

export default LandingPage;
