/** Root document shell, global fonts, viewport settings, and default site metadata. */

import type { Metadata, Viewport } from "next";
import { Manrope, Playfair_Display } from "next/font/google";
import { SITE_DESCRIPTION, SITE_NAME, SITE_URL } from "@/lib/seo";
import "./globals.css";
import "./business-flow.css";
import "./design-system.css";

const themeScript = `(()=>{try{const saved=localStorage.getItem('gsc-theme');const theme=saved==='dark'||saved==='light'?saved:(matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light');document.documentElement.dataset.theme=theme;document.documentElement.style.colorScheme=theme}catch(e){}})()`;

const manrope = Manrope({ subsets: ["latin", "cyrillic"], variable: "--font-sans", display: "swap", preload: false });
const playfair = Playfair_Display({ subsets: ["latin", "cyrillic"], variable: "--font-display", style: ["normal", "italic"], display: "swap", preload: false });

// ======================================================
// SEO / METADATA — SITE DEFAULTS
// ======================================================
export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "English Speaking Club in Sergiev Posad | Galstyan’s Speaking Club",
    template: `%s | ${SITE_NAME}`,
  },
  applicationName: SITE_NAME,
  description: SITE_DESCRIPTION,
  alternates: {
    canonical: "/",
  },
  icons: { icon: "/gsc-logo.jpg", apple: "/gsc-logo.jpg" },
  openGraph: {
    title: "English Speaking Club in Sergiev Posad | Galstyan’s Speaking Club",
    description: SITE_DESCRIPTION,
    url: SITE_URL,
    siteName: SITE_NAME,
    type: "website",
    locale: "en_US",
    images: [
      {
        url: "https://galstyansspeakingclub.ru/social-preview.jpg",
        width: 1200,
        height: 630,
        alt: "Galstyan’s Speaking Club — English speaking meetups in Sergiev Posad",
        type: "image/jpeg",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "English Speaking Club in Sergiev Posad | Galstyan’s Speaking Club",
    description: SITE_DESCRIPTION,
    images: [
      {
        url: "https://galstyansspeakingclub.ru/social-preview.jpg",
        alt: "Galstyan’s Speaking Club — English speaking meetups in Sergiev Posad",
      },
    ],
  },
};

export const viewport: Viewport = { themeColor: "#07101c", width: "device-width", initialScale: 1, viewportFit: "cover" };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en" suppressHydrationWarning className={`${manrope.variable} ${playfair.variable}`} data-scroll-behavior="smooth"><head><script dangerouslySetInnerHTML={{ __html: themeScript }} /></head><body>{children}</body></html>;
}
