import { PublicPageShell } from "@/components/public-page-shell";
import { StructuredData } from "@/components/structured-data";
import { FaqPageContent } from "@/components/faq-page-content";
import { LocalizedText } from "@/components/localized-text";
import { faqItems } from "@/lib/faq-data";
import { editablePageMetadata } from "@/lib/site-content";
export const generateMetadata = () => editablePageMetadata("faq", "FAQ", "Answers about English levels, meetups, booking, accounts, loyalty, privacy and website features at Galstyan’s Speaking Club.", "/faq");
export default function FaqPage() {
  const faqSchema = { "@context": "https://schema.org", "@type": "FAQPage", mainEntity: faqItems.map(item => ({ "@type": "Question", name: item.question, acceptedAnswer: { "@type": "Answer", text: item.answer } })) };
  return <><PublicPageShell eyebrow="FAQ" title={<LocalizedText en="Good questions deserve clear answers" ru="Хорошие вопросы заслуживают понятных ответов" />} intro={<LocalizedText en="A practical guide to the club, your account and the website." ru="Практическая справка о клубе, личном кабинете и сайте." />} breadcrumbLabel="FAQ" breadcrumbPath="/faq"><FaqPageContent /></PublicPageShell><StructuredData data={faqSchema} /></>;
}
