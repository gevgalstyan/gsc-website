/** Builds allowlisted same-site destinations for Supabase authentication callbacks. */

import { SITE_URL } from "@/lib/seo";

const productionHosts = new Set(["galstyansspeakingclub.ru", "www.galstyansspeakingclub.ru"]);

/**
 * Returns a same-origin path only. Authentication redirects must never trust a
 * URL supplied in a query string, including browser-normalized backslashes.
 */
export function safeAuthDestination(value: string | null | undefined, fallback = "/") {
  if (!value?.startsWith("/")) return fallback;
  const origin = typeof window !== "undefined" ? window.location.origin : SITE_URL;
  try {
    const target = new URL(value, origin);
    return target.origin === origin ? `${target.pathname}${target.search}${target.hash}` : fallback;
  } catch {
    return fallback;
  }
}

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
  const destination = safeAuthDestination(next);
  if (destination !== "/") callback.searchParams.set("next", destination);
  return callback.toString();
}
