import type { Metadata, Viewport } from "next";
import { Manrope, Playfair_Display } from "next/font/google";
import "./globals.css";

const manrope = Manrope({ subsets: ["latin", "cyrillic"], variable: "--font-sans", display: "swap" });
const playfair = Playfair_Display({ subsets: ["latin", "cyrillic"], variable: "--font-display", style: ["normal", "italic"], display: "swap" });

export const metadata: Metadata = {
  metadataBase: new URL("https://galstyansspeakingclub.ru"),
  title: {
    default: "Galstyan’s Speaking Club | English Speaking Club in Sergiev Posad",
    template: "%s | Galstyan’s Speaking Club",
  },
  description:
    "Practice English, meet new people and build confidence through friendly speaking meetups in Sergiev Posad.",
  alternates: {
    canonical: "https://galstyansspeakingclub.ru",
  },
  openGraph: {
    title: "Galstyan’s Speaking Club | English Speaking Club in Sergiev Posad",
    description:
      "Practice English, meet new people and build confidence through friendly speaking meetups in Sergiev Posad.",
    url: "https://galstyansspeakingclub.ru",
    siteName: "Galstyan’s Speaking Club",
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
    title: "Galstyan’s Speaking Club | English Speaking Club in Sergiev Posad",
    description:
      "Practice English, meet new people and build confidence through friendly speaking meetups in Sergiev Posad.",
    images: [
      {
        url: "https://galstyansspeakingclub.ru/social-preview.jpg",
        alt: "Galstyan’s Speaking Club — English speaking meetups in Sergiev Posad",
      },
    ],
  },
};

export const viewport: Viewport = { themeColor: "#07101c", width: "device-width", initialScale: 1 };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en" className={`${manrope.variable} ${playfair.variable}`} data-scroll-behavior="smooth"><body>{children}</body></html>;
}
