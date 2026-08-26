/** Public homepage server entry: loads published content, viewer state, and search schemas. */

import { HomePage } from "@/components/home-page";
import { StructuredData } from "@/components/structured-data";
import { faqItems } from "@/lib/faq-data";
import { organizationSchema, websiteSchema } from "@/lib/seo";
import { editablePageMetadata, getPublicContent, getPublishedFaqItems } from "@/lib/site-content";
import { getViewer } from "@/lib/viewer";

export const revalidate = 60;
export const dynamic = "force-dynamic";

export const generateMetadata = () => editablePageMetadata("home", "English Speaking Club in Sergiev Posad", "Join Galstyan’s Speaking Club for friendly English conversation practice, real meetups, and a welcoming local community in Sergiev Posad.", "/");

export default async function Page() {
  // Public content and the verified viewer load together so auth-aware UI is correct on first paint.
  const [content, editableFaq, viewer] = await Promise.all([getPublicContent(), getPublishedFaqItems(), getViewer()]);
  const items = editableFaq.length ? editableFaq : [...faqItems];
  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: { "@type": "Answer", text: item.answer },
    })),
  };
  return (
    <>
      <HomePage content={content} deferPublicData viewer={viewer} />
      <StructuredData data={organizationSchema} />
      <StructuredData data={websiteSchema} />
      <StructuredData data={faqSchema} />
    </>
  );
}
