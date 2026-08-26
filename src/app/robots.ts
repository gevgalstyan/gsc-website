/** Allows public pages while excluding account, admin, auth, and API routes from indexing. */

import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/seo";

// ======================================================
// ROBOTS — SEARCH CRAWLER POLICY
// ======================================================
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      { userAgent: "*", allow: "/", disallow: ["/account", "/admin", "/reset-password", "/auth/", "/api/"] },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
