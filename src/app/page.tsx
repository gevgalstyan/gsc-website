import { HomePage } from "@/components/home-page";
import { StructuredData } from "@/components/structured-data";
import { faqItems } from "@/lib/faq-data";
import { organizationSchema, websiteSchema } from "@/lib/seo";
import { editablePageMetadata, getPublicContent, getPublishedFaqItems } from "@/lib/site-content";

export const revalidate = 60;

export const generateMetadata = () => editablePageMetadata("home", "English Speaking Club in Sergiev Posad", "Join Galstyan’s Speaking Club for friendly English conversation practice, real meetups, and a welcoming local community in Sergiev Posad.", "/");

export default async function Page() {
  const [content, editableFaq] = await Promise.all([getPublicContent(), getPublishedFaqItems()]);
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
      <HomePage content={content} deferPublicData />
      <StructuredData data={organizationSchema} />
      <StructuredData data={websiteSchema} />
      <StructuredData data={faqSchema} />
    </>
  );
}
