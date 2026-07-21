import type { MetadataRoute } from "next";
export default function sitemap(): MetadataRoute.Sitemap { return ["", "/privacy", "/terms", "/cookies"].map((path) => ({ url: `https://www.galstyansspeakingclub.ru${path}`, lastModified: new Date("2026-07-21"), changeFrequency: path ? "yearly" : "weekly", priority: path ? 0.4 : 1 })); }
