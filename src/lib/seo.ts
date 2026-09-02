/**
 * Shared SEO and structured-data defaults for public pages.
 * Page files use these helpers to keep metadata and canonical URLs consistent.
 */

// ======================================================
// SEO / METADATA
// ======================================================
export const SITE_URL = "https://galstyansspeakingclub.ru";
export const SITE_NAME = "Galstyan’s Speaking Club";
export const SITE_DESCRIPTION =
  "Galstyan’s Speaking Club is an English conversation club in Sergiev Posad, hosted by Gevorg Galstyan, for friendly spoken-English practice, real meetups, and a welcoming local community.";

export function pageMetadata(title: string, description: string, path: string) {
  const canonicalPath = canonicalPathname(path);
  const url = absoluteUrl(canonicalPath);
  const socialTitle = title.includes(SITE_NAME) ? title : `${title} | ${SITE_NAME}`;
  return {
    title,
    description,
    alternates: { canonical: canonicalPath },
    openGraph: {
      title: socialTitle,
      description,
      url,
      siteName: SITE_NAME,
      type: "website" as const,
      locale: "en_US",
      images: [{ url: absoluteUrl("/social-preview.jpg"), width: 1200, height: 630, alt: `${SITE_NAME} — English conversation in Sergiev Posad` }],
    },
    twitter: {
      card: "summary_large_image" as const,
      title: socialTitle,
      description,
      images: [absoluteUrl("/social-preview.jpg")],
    },
  };
}

export function absoluteUrl(path = "/") {
  if (/^https:\/\//.test(path)) return path;
  return new URL(canonicalPathname(path), SITE_URL).toString();
}

function canonicalPathname(path: string) {
  if (path === "/" || /\/[^/]+\.[^/]+$/.test(path)) return path;
  return path.endsWith("/") ? path : `${path}/`;
}

// ======================================================
// STRUCTURED DATA
// ======================================================
export const organizationSchema = {
  "@context": "https://schema.org",
  "@type": "Organization",
  "@id": `${SITE_URL}/#organization`,
  name: SITE_NAME,
  alternateName: "GSC",
  url: SITE_URL,
  logo: absoluteUrl("/gsc-logo.jpg"),
  description: SITE_DESCRIPTION,
  founder: {
    "@type": "Person",
    "@id": `${SITE_URL}/about/#gevorg-galstyan`,
    name: "Gevorg Galstyan",
    url: absoluteUrl("/about/"),
  },
  areaServed: [
    {
      "@type": "City",
      name: "Sergiev Posad",
      containedInPlace: {
        "@type": "AdministrativeArea",
        name: "Moscow Region",
      },
    },
  ],
  sameAs: [
    "https://t.me/GalstyansSpeakingClub",
    "https://instagram.com/galstyansspeakingclub",
    "https://threads.net/@galstyansspeakingclub",
    "https://vk.ru/galstyansspeakingclub",
  ],
};

export const websiteSchema = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  "@id": `${SITE_URL}/#website`,
  name: SITE_NAME,
  alternateName: "GSC",
  url: SITE_URL,
  description: SITE_DESCRIPTION,
  publisher: { "@id": `${SITE_URL}/#organization` },
  inLanguage: "en",
};
