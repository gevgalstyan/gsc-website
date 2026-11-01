import { LocalizedText } from "@/components/localized-text";
import Link from "next/link";
import { FaqList } from "@/components/faq-list";
import { featuredFaqItems } from "@/lib/faq-data";

export function FaqSection({ compact = false }: { compact?: boolean }) {
  return (
    <section className={`section faq-section${compact ? " faq-section-compact" : ""}`} id={compact ? undefined : "faq"}>
      <div className="section-heading">
        <div>
          <span className="eyebrow"><LocalizedText en="Useful answers" ru="Полезные ответы" /></span>
          <h2><LocalizedText en="Questions people ask first." ru="Частые вопросы." /></h2>
        </div>
        <p><LocalizedText en="Clear answers about English practice, meetups and the GSC community." ru="Понятные ответы об английской практике, встречах и сообществе GSC." /><br /><Link className="text-link" href="/faq"><LocalizedText en="Read the full FAQ →" ru="Открыть весь FAQ →" /></Link></p>
      </div>
      <FaqList items={featuredFaqItems} />
    </section>
  );
}
