import { useEffect } from "react";

interface SEOProps {
  title?: string;
  description?: string;
  keywords?: string;
  canonicalUrl?: string;
  ogImage?: string;
  ogType?: "website" | "article" | "profile";
  noIndex?: boolean;
}

const DEFAULT_TITLE = "Spaark - Find Your Perfect Match | Modern Dating Platform";
const DEFAULT_DESCRIPTION = "Discover meaningful connections on Spaark. Swipe, match, and chat with compatible singles in your area. Join now to find your perfect match with verified profiles and smart matching!";
const DEFAULT_KEYWORDS = "dating app, online dating, find love, singles, match, relationships, dating platform, Spaark, swipe, chat, meet singles";
const SITE_URL = "https://spaarkdating.com";

export const SEO = ({
  title,
  description = DEFAULT_DESCRIPTION,
  keywords = DEFAULT_KEYWORDS,
  canonicalUrl,
  ogImage = "/logo.png",
  ogType = "website",
  noIndex = false,
}: SEOProps) => {
  const fullTitle = title ? `${title} | Spaark Dating` : DEFAULT_TITLE;
  const fullCanonicalUrl = canonicalUrl ? `${SITE_URL}${canonicalUrl}` : SITE_URL;

  useEffect(() => {
    // Update document title
    document.title = fullTitle;

    // Update or create meta tags
    const updateMeta = (name: string, content: string, isProperty = false) => {
      const attr = isProperty ? "property" : "name";
      let meta = document.querySelector(`meta[${attr}="${name}"]`) as HTMLMetaElement;
      if (!meta) {
        meta = document.createElement("meta");
        meta.setAttribute(attr, name);
        document.head.appendChild(meta);
      }
      meta.content = content;
    };

    // Standard meta tags
    updateMeta("description", description);
    updateMeta("keywords", keywords);
    updateMeta("author", "Spaark Dating");
    
    // Robots
    updateMeta("robots", noIndex ? "noindex, nofollow" : "index, follow");

    // Open Graph tags
    updateMeta("og:title", fullTitle, true);
    updateMeta("og:description", description, true);
    updateMeta("og:type", ogType, true);
    updateMeta("og:url", fullCanonicalUrl, true);
    updateMeta("og:image", ogImage.startsWith("http") ? ogImage : `${SITE_URL}${ogImage}`, true);
    updateMeta("og:site_name", "Spaark Dating", true);
    updateMeta("og:locale", "en_US", true);

    // Twitter Card tags
    updateMeta("twitter:card", "summary_large_image");
    updateMeta("twitter:title", fullTitle);
    updateMeta("twitter:description", description);
    updateMeta("twitter:image", ogImage.startsWith("http") ? ogImage : `${SITE_URL}${ogImage}`);
    updateMeta("twitter:site", "@SpaarkDating");

    // Update canonical link
    let canonical = document.querySelector('link[rel="canonical"]') as HTMLLinkElement;
    if (!canonical) {
      canonical = document.createElement("link");
      canonical.rel = "canonical";
      document.head.appendChild(canonical);
    }
    canonical.href = fullCanonicalUrl;

    return () => {
      // Reset to defaults when component unmounts
      document.title = DEFAULT_TITLE;
    };
  }, [fullTitle, description, keywords, fullCanonicalUrl, ogImage, ogType, noIndex]);

  return null;
};

// Structured data generator for organization
export const getOrganizationSchema = () => ({
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "Spaark",
  url: "https://spaarkdating.com",
  logo: "https://spaarkdating.com/logo.png",
  description: "Spaark is a modern dating platform helping singles find meaningful connections through smart matching and verified profiles.",
  foundingDate: "2025",
  founders: [
    { "@type": "Person", name: "Sourabh Sharma" },
    { "@type": "Person", name: "Aakanksha Singh" }
  ],
  sameAs: [],
  contactPoint: {
    "@type": "ContactPoint",
    contactType: "customer support",
    url: "https://spaarkdating.com/support"
  }
});

// Structured data for dating service
export const getDatingServiceSchema = () => ({
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: "Spaark Dating",
  url: "https://spaarkdating.com",
  applicationCategory: "DatingApplication",
  operatingSystem: "Web",
  description: "Find your perfect match on Spaark. A modern dating platform with smart matching, verified profiles, and secure messaging.",
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "USD",
    description: "Free to join and use"
  },
  aggregateRating: {
    "@type": "AggregateRating",
    ratingValue: "4.8",
    ratingCount: "1000",
    bestRating: "5",
    worstRating: "1"
  },
  featureList: [
    "Smart Matching Algorithm",
    "Verified Profiles",
    "Instant Messaging",
    "Location-Based Matching",
    "Photo Verification"
  ]
});

// FAQ Schema generator
export const getFAQSchema = (faqs: Array<{ question: string; answer: string }>) => ({
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: faqs.map((faq) => ({
    "@type": "Question",
    name: faq.question,
    acceptedAnswer: {
      "@type": "Answer",
      text: faq.answer
    }
  }))
});

// Breadcrumb Schema generator
export const getBreadcrumbSchema = (items: Array<{ name: string; url: string }>) => ({
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: items.map((item, index) => ({
    "@type": "ListItem",
    position: index + 1,
    name: item.name,
    item: `https://spaarkdating.com${item.url}`
  }))
});

// JSON-LD Script component
export const JsonLd = ({ data }: { data: object }) => (
  <script
    type="application/ld+json"
    dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
  />
);

export default SEO;
