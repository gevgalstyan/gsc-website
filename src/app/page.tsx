/** Public homepage server entry: loads published content, viewer state, and search schemas. */

import { HomePage } from "@/components/home-page";
import { StructuredData } from "@/components/structured-data";
import { featuredFaqItems } from "@/lib/faq-data";
import { organizationSchema, websiteSchema } from "@/lib/seo";
import { editablePageMetadata } from "@/lib/site-content";
import { getViewer } from "@/lib/viewer";

export const revalidate = 60;

export const generateMetadata = () => editablePageMetadata("home", "English Speaking Club in Sergiev Posad", "Join Galstyan’s Speaking Club for friendly English conversation practice, real meetups, and a welcoming local community in Sergiev Posad.", "/");

export default async function Page() {
  // The homepage has authored fallbacks and fetches optional editable data after
  // first paint, so a slow backend cannot delay its public shell.
  const viewer = await getViewer();
  const items = featuredFaqItems;
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
      <HomePage deferPublicData viewer={viewer} />
      <StructuredData data={organizationSchema} />
      <StructuredData data={websiteSchema} />
      <StructuredData data={faqSchema} />
    </>
  );
}
