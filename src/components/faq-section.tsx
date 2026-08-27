import Link from "next/link";
import { FaqList } from "@/components/faq-list";
import { featuredFaqItems } from "@/lib/faq-data";

export function FaqSection({ compact = false }: { compact?: boolean }) {
  return (
    <section className={`section faq-section${compact ? " faq-section-compact" : ""}`} id={compact ? undefined : "faq"}>
      <div className="section-heading">
        <div>
          <span className="eyebrow">Useful answers</span>
          <h2>Questions people<br /><em>ask first.</em></h2>
        </div>
        <p>Clear answers about English practice, meetup details, and joining the local GSC community.<br /><Link className="text-link" href="/faq">Read the full FAQ →</Link></p>
      </div>
      <FaqList items={featuredFaqItems} />
    </section>
  );
}
