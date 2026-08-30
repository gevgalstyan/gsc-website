import Link from "next/link";
import { FaqList } from "@/components/faq-list";
import { PublicPageShell } from "@/components/public-page-shell";
import { StructuredData } from "@/components/structured-data";
import { faqItems, normalizeEditableFaqItems } from "@/lib/faq-data";
import { editablePageMetadata, getPublicContent, getPublishedFaqItems } from "@/lib/site-content";
import { getViewer } from "@/lib/viewer";

export const revalidate = 60;

export const generateMetadata = () => editablePageMetadata(
  "faq",
  "Frequently Asked Questions",
  "Answers about joining Galstyan’s Speaking Club, English levels, meetups, booking, pricing, loyalty, member accounts, and English conversation practice in Sergiyev Posad.",
  "/faq",
);

export default async function FaqPage() {
  const [content, editableFaq, viewer] = await Promise.all([getPublicContent(), getPublishedFaqItems(), getViewer()]);
  const items = editableFaq.length >= 20 ? normalizeEditableFaqItems(editableFaq) : faqItems;
  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((item) => ({ "@type": "Question", name: item.question, acceptedAnswer: { "@type": "Answer", text: item.answer } })),
  };
  return <>
    <PublicPageShell eyebrow="FAQ" title="Good questions deserve clear answers" intro={content["faq.intro"] || "Everything we can say accurately today about English practice, published meetups, member accounts, loyalty progress, and the GSC community in Sergiyev Posad."} breadcrumbLabel="FAQ" breadcrumbPath="/faq">
      <section className="section public-section faq-page-section">
        <div className="section-heading">
          <div>
            <span className="eyebrow">Search the answers</span>
            <h2>Before you <em>ask.</em></h2>
          </div>
          <p>Search by topic, filter by category, then open an answer. If a detail is event-specific, the published meetup record is the source of truth.</p>
        </div>
        <FaqList items={items} />
      </section>
      <section className="section public-cta-panel faq-final-cta">
        <div>
          <span className="eyebrow"><i />Still have a question?</span>
          <h2>Ask before your first meetup.</h2>
          <p>Contact the host if you are unsure about your level, booking, venue details, or what to expect. You can also check the next published meetup whenever you are ready to join.</p>
          <div className="public-actions">
            <Link className="button button-primary" href="/contact">Contact us</Link>
            <Link className="button button-outline-dark" href="/meetups">View upcoming meetups</Link>
            {viewer.role !== "loggedOut" ? <Link className="button button-outline-dark" href={viewer.role === "admin" ? "/admin" : "/account"}>{viewer.role === "admin" ? "Admin dashboard" : "My account"}</Link> : null}
          </div>
        </div>
      </section>
    </PublicPageShell>
    <StructuredData data={faqSchema} />
  </>;
}
