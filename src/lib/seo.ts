export const SITE_URL = "https://galstyansspeakingclub.ru";
export const SITE_NAME = "Galstyan’s Speaking Club";
export const SITE_DESCRIPTION =
  "Galstyan’s Speaking Club is an English speaking and conversation club in Sergiev Posad for friendly practice, real meetups, and a welcoming local community.";

export function pageMetadata(title: string, description: string, path: string) {
  const url = absoluteUrl(path);
  return {
    title,
    description,
    alternates: { canonical: path },
    openGraph: {
      title: `${title} | ${SITE_NAME}`,
      description,
      url,
      siteName: SITE_NAME,
      type: "website" as const,
      locale: "en_US",
      images: [{ url: absoluteUrl("/social-preview.jpg"), width: 1200, height: 630, alt: `${SITE_NAME} — English conversation in Sergiev Posad` }],
    },
    twitter: {
      card: "summary_large_image" as const,
      title: `${title} | ${SITE_NAME}`,
      description,
      images: [absoluteUrl("/social-preview.jpg")],
    },
  };
}

export function absoluteUrl(path = "/") {
  return new URL(path, SITE_URL).toString();
}

export const organizationSchema = {
  "@context": "https://schema.org",
  "@type": "Organization",
  "@id": `${SITE_URL}/#organization`,
  name: SITE_NAME,
  alternateName: "GSC",
  url: SITE_URL,
  logo: absoluteUrl("/gsc-logo.jpg"),
  description: SITE_DESCRIPTION,
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
