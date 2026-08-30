/**
 * Server-side access to editable public content stored in Supabase.
 * Published values are used only when enabled; authored page fallbacks remain available.
 */

import { absoluteUrl, pageMetadata } from "@/lib/seo";

// ======================================================
// CONTENT EDITOR — PUBLISHED SITE CONTENT
// ======================================================
export async function getPublicContent(): Promise<Record<string, string>> {
  // Static pages render their authored copy immediately. Interactive clients
  // refresh editable records after hydration where that content is displayed.
  return {};
}

// ======================================================
// FAQ CONTENT
// ======================================================
export async function getPublishedFaqItems() {
  return [] as { question: string; answer: string }[];
}

// ======================================================
// SEO / EDITABLE METADATA
// ======================================================
export async function editablePageMetadata(page: string, fallbackTitle: string, fallbackDescription: string, path: string) {
  const content = await getPublicContent();
  const title = content[`${page}.seo.title`] || fallbackTitle;
  const description = content[`${page}.seo.description`] || fallbackDescription;
  const metadata = pageMetadata(title, description, path);
  const openGraphTitle = content[`${page}.seo.og_title`];
  const openGraphDescription = content[`${page}.seo.og_description`];
  const openGraphImage = content[`${page}.seo.og_image`];
  if (openGraphTitle) metadata.openGraph.title = openGraphTitle;
  if (openGraphDescription) metadata.openGraph.description = openGraphDescription;
  if (openGraphImage && validPublicAsset(openGraphImage)) {
    const imageUrl = openGraphImage.startsWith("/") ? absoluteUrl(openGraphImage) : openGraphImage;
    metadata.openGraph.images = [{ url: imageUrl, width: 1200, height: 630, alt: openGraphTitle || title }];
    metadata.twitter.images = [imageUrl];
  }
  return metadata;
}

function validPublicAsset(value: string) {
  if (value.startsWith("/") && !value.startsWith("//")) return true;
  try {
    return new URL(value).protocol === "https:";
  } catch {
    return false;
  }
}
