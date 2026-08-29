/**
 * Server-side access to editable public content stored in Supabase.
 * Published values are used only when enabled; authored page fallbacks remain available.
 */

import { createClient } from "@/lib/supabase/server";
import { absoluteUrl, pageMetadata } from "@/lib/seo";
import { withPublicFallback } from "@/lib/public-resilience";

// ======================================================
// CONTENT EDITOR — PUBLISHED SITE CONTENT
// ======================================================
export async function getPublicContent(): Promise<Record<string, string>> {
  return withPublicFallback(async () => {
    const supabase = await createClient();
    if (!supabase) return {} as Record<string, string>;
    const { data, error } = await supabase.from("site_content").select("key,value,published_value,published_is_enabled").eq("is_public", true).eq("published_is_enabled", true);
    if (error || !data) return {} as Record<string, string>;
    return Object.fromEntries(data.map((row) => [row.key, row.published_value ?? row.value]));
  }, {});
}

// ======================================================
// FAQ CONTENT
// ======================================================
export async function getPublishedFaqItems() {
  return withPublicFallback(async () => {
    const supabase = await createClient();
    if (!supabase) return [] as { question: string; answer: string }[];
    const { data, error } = await supabase
      .from("site_faq_items")
      .select("published_question,published_answer")
      .eq("published_is_enabled", true)
      .order("published_sort_order");
    if (error || !data) return [] as { question: string; answer: string }[];
    return data
      .filter((item) => item.published_question.trim() && item.published_answer.trim())
      .map((item) => ({ question: item.published_question, answer: item.published_answer }));
  }, [] as { question: string; answer: string }[]);
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
