import type { Metadata, Viewport } from "next";
import { Manrope, Playfair_Display } from "next/font/google";
import "./globals.css";

const manrope = Manrope({ subsets: ["latin", "cyrillic"], variable: "--font-sans", display: "swap" });
const playfair = Playfair_Display({ subsets: ["latin", "cyrillic"], variable: "--font-display", style: ["normal", "italic"], display: "swap" });

export const metadata: Metadata = {
  metadataBase: new URL("https://www.galstyansspeakingclub.ru"),
  title: { default: "Galstyan's Speaking Club | English ON.", template: "%s | GSC" },
  description: "English speaking club in Sergiev Posad. No Russian. Just conversations. Just people.",
  openGraph: { title: "Galstyan's Speaking Club", description: "Speak English. Meet people. Have fun.", type: "website", locale: "en_US", images: ["/gsc-logo.jpg"] },
};

export const viewport: Viewport = { themeColor: "#07101c", width: "device-width", initialScale: 1 };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en" className={`${manrope.variable} ${playfair.variable}`} data-scroll-behavior="smooth"><body>{children}</body></html>;
}
