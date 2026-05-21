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
  description = "Pharma-Net is Alyah's premium B2B platform connecting pharmacies and medicine suppliers.",
  keywords = ["pharmaceuticals", "pharmacy b2b", "wholesale medicine", "pharma net", "alyah pharma"],
  ogType = "website",
  ogImage = "/alyah-logo-light.svg",
  canonicalUrl,
  noIndex = false,
  structuredData,
}) => {
  const siteTitle = `${title} | Alyah Pharma Net`;
  const formattedKeywords = Array.isArray(keywords) ? keywords.join(", ") : keywords;

  // Resolve canonical URL safely on the client side
  const currentUrl =
    canonicalUrl ||
    (typeof window !== "undefined"
      ? `${window.location.origin}${window.location.pathname}`
      : "");

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
