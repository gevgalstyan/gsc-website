import { FaqList } from "@/components/faq-list";
import { PublicPageShell } from "@/components/public-page-shell";
import { StructuredData } from "@/components/structured-data";
import { faqItems } from "@/lib/faq-data";
import { editablePageMetadata, getPublicContent, getPublishedFaqItems } from "@/lib/site-content";

export const revalidate = 60;
export const dynamic = "force-dynamic";

export const generateMetadata = () => editablePageMetadata("faq", "FAQ About the English Speaking Club", "Answers about Galstyan’s Speaking Club, English conversation practice, meetups, attendance, loyalty, and joining the Sergiev Posad community.", "/faq");

export default async function FaqPage() {
  const [content, editableFaq] = await Promise.all([getPublicContent(), getPublishedFaqItems()]);
  const items = editableFaq.length ? editableFaq : [...faqItems];
  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((item) => ({ "@type": "Question", name: item.question, acceptedAnswer: { "@type": "Answer", text: item.answer } })),
  };
  return <>
    <PublicPageShell eyebrow="FAQ" title="Good questions deserve clear answers" intro={content["faq.intro"] || "Everything we can say accurately today about English practice, published meetups, member access, and the GSC community."} breadcrumbLabel="FAQ" breadcrumbPath="/faq">
      <section className="section public-section faq-page-section"><div className="section-heading"><div><span className="eyebrow">Search the answers</span><h2>Before you <em>ask.</em></h2></div><p>Search by topic, then open an answer. If a detail is event-specific, the published meetup record is the source of truth.</p></div><FaqList items={items} /></section>
    </PublicPageShell>
    <StructuredData data={faqSchema} />
  </>;
}
