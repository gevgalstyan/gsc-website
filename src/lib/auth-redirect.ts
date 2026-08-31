/** Builds allowlisted same-site destinations for Supabase authentication callbacks. */

import { SITE_URL } from "@/lib/seo";

const productionHosts = new Set(["galstyansspeakingclub.ru", "www.galstyansspeakingclub.ru"]);

// ======================================================
// GOOGLE / EMAIL AUTH — SAFE CALLBACK URLS
// ======================================================
export function authCallbackUrl(next?: string) {
  const origin = typeof window !== "undefined" && productionHosts.has(window.location.hostname)
    ? SITE_URL
    : typeof window !== "undefined"
      ? window.location.origin
      : SITE_URL;
  // Static export emits /auth/callback/index.html. Keep the externally visible
  // callback canonical so OAuth does not rely on host redirect behavior.
  const callback = new URL("/auth/callback/", origin);
  if (next?.startsWith("/") && !next.startsWith("//")) callback.searchParams.set("next", next);
  return callback.toString();
}
