import React from "react";
import { Helmet } from "react-helmet-async";

export interface SEOProps {
  /** The page title (e.g. "Inventory" or "Marketplace") */
  title: string;
  /** Page description for search engine snippet and social previews */
  description?: string;
  /** Keywords array or comma-separated string */
  keywords?: string | string[];
  /** Open Graph type (defaults to 'website') */
  ogType?: "website" | "article" | "profile";
  /** URL to preview image for social sharing */
  ogImage?: string;
  /** Canonical URL. If not provided, computed from window location */
  canonicalUrl?: string;
  /** Whether to tell search engines not to index/follow links on this page (e.g. private dashboard views) */
  noIndex?: boolean;
  /** Optional custom structured data object for schema.org search engine rich results */
  structuredData?: Record<string, any>;
}

export const SEO: React.FC<SEOProps> = ({
  title,
  description = "Alyah Pharma-Net is a B2B2C Multi-Tenant SaaS platform designed to modernize the pharmaceutical supply chain by connecting local Pharmacies directly with Public Users (Patients). In the current landscape, manual communication and lack of visibility mean patients struggle to find out which local pharmacies have their required medications in stock.",
  keywords = ["pharmaceuticals", "pharmacy b2b2c", "wholesale medicine", "pharma net", "alyah pharma", "pharma net africa", "pharma net ethiopia", "alyah pharma africa", "alyah pharma ethiopia"],
  ogType = "website",
  ogImage = "/alyah-logo-light.svg",
  canonicalUrl,
  noIndex = false,
  structuredData,
}) => {
  const siteTitle = `${title} | Alyah Pharma Net`;
  const formattedKeywords = Array.isArray(keywords) ? keywords.join(", ") : keywords;
  const configuredSiteUrl = import.meta.env.VITE_SITE_URL?.replace(/\/+$/, "");

  const currentPath =
    typeof window !== "undefined" ? window.location.pathname : "";
  const currentOrigin =
    configuredSiteUrl ||
    (typeof window !== "undefined" ? window.location.origin : "");
  const resolvedCanonicalPath = canonicalUrl
    ? canonicalUrl
    : currentPath
      ? `${currentOrigin}${currentPath}`
      : currentOrigin;
  const currentUrl = resolvedCanonicalPath.replace(/\/+$/, "") || resolvedCanonicalPath;

  const robotsContent = noIndex ? "noindex, nofollow" : "index, follow";

  return (
    <Helmet>
      {/* HTML Language tag can also be set or supplemented if needed */}

      {/* Primary Meta Tags */}
      <title>{siteTitle}</title>
      <meta name="title" content={siteTitle} />
      <meta name="description" content={description} />
      {formattedKeywords && <meta name="keywords" content={formattedKeywords} />}
      <meta name="robots" content={robotsContent} />

      {/* Canonical Link */}
      {currentUrl && <link rel="canonical" href={currentUrl} />}

      {/* Open Graph / Facebook */}
      <meta property="og:type" content={ogType} />
      <meta property="og:title" content={siteTitle} />
      <meta property="og:description" content={description} />
      {currentUrl && <meta property="og:url" content={currentUrl} />}
      {ogImage && <meta property="og:image" content={ogImage} />}
      <meta property="og:site_name" content="Alyah Pharma Net" />

      {/* Twitter Cards */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={siteTitle} />
      <meta name="twitter:description" content={description} />
      {ogImage && <meta name="twitter:image" content={ogImage} />}

      {/* Structured Schema Data (JSON-LD) */}
      {structuredData && (
        <script type="application/ld+json">
          {JSON.stringify(structuredData)}
        </script>
      )}
    </Helmet>
  );
};

export default SEO;
