/** Generates the public XML sitemap consumed by search engines. */

import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/seo";
export const dynamic = "force-static";

// ======================================================
// SITEMAP — INDEXABLE PUBLIC ROUTES
// ======================================================
const publicPages = [
  { path: "", priority: 1, changeFrequency: "weekly" as const },
  { path: "/about", priority: 0.8, changeFrequency: "monthly" as const },
  { path: "/meetups", priority: 0.9, changeFrequency: "weekly" as const },
  { path: "/how-it-works", priority: 0.7, changeFrequency: "monthly" as const },
  { path: "/contact", priority: 0.7, changeFrequency: "monthly" as const },
  { path: "/faq", priority: 0.6, changeFrequency: "monthly" as const },
  { path: "/questions", priority: 0.8, changeFrequency: "monthly" as const },
  { path: "/community", priority: 0.7, changeFrequency: "monthly" as const },
  { path: "/membership", priority: 0.6, changeFrequency: "monthly" as const },
  { path: "/privacy", priority: 0.2, changeFrequency: "yearly" as const },
  { path: "/terms", priority: 0.2, changeFrequency: "yearly" as const },
  { path: "/cookies", priority: 0.2, changeFrequency: "yearly" as const },
];

export default function sitemap(): MetadataRoute.Sitemap {
  return publicPages.map(({ path, priority, changeFrequency }) => ({
    url: `${SITE_URL}${path}`,
    lastModified: new Date("2026-08-14"),
    changeFrequency,
    priority,
  }));
}
