import type { Metadata } from "next";
import { FaqList } from "@/components/faq-list";
import { PublicPageShell } from "@/components/public-page-shell";
import { StructuredData } from "@/components/structured-data";
import { faqItems } from "@/lib/faq-data";
import { pageMetadata } from "@/lib/seo";
import { getPublicContent } from "@/lib/site-content";

export const metadata: Metadata = pageMetadata(
  "FAQ About the English Speaking Club",
  "Answers about Galstyan’s Speaking Club, English conversation practice, meetups, attendance, loyalty, and joining the Sergiev Posad community.",
  "/faq",
);

const faqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: faqItems.map((item) => ({ "@type": "Question", name: item.question, acceptedAnswer: { "@type": "Answer", text: item.answer } })),
};

export default async function FaqPage() {
  const content = await getPublicContent();
  return <>
    <PublicPageShell eyebrow="FAQ" title="Good questions deserve clear answers" intro={content["faq.intro"] || "Everything we can say accurately today about English practice, published meetups, member access, and the GSC community."} breadcrumbLabel="FAQ" breadcrumbPath="/faq">
      <section className="section public-section faq-page-section"><div className="section-heading"><div><span className="eyebrow">Search the answers</span><h2>Before you <em>ask.</em></h2></div><p>Search by topic, then open an answer. If a detail is event-specific, the published meetup record is the source of truth.</p></div><FaqList items={faqItems} /></section>
    </PublicPageShell>
    <StructuredData data={faqSchema} />
  </>;
}
