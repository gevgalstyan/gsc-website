import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Check, MapPin, MessageCircle, Users } from "lucide-react";
import { PublicPageShell } from "@/components/public-page-shell";
import { pageMetadata } from "@/lib/seo";
import { getPublicContent } from "@/lib/site-content";

export const metadata: Metadata = pageMetadata("About Galstyan’s Speaking Club", "Learn about Galstyan’s Speaking Club, an English-speaking community for real conversation practice in Sergiev Posad, Moscow Region.", "/about");

export default async function AboutPage() {
  const content = await getPublicContent();
  return (
    <PublicPageShell
      eyebrow="About the club"
      title="A local English-speaking community in Sergiev Posad"
      intro={content["about.intro"] || "Galstyan’s Speaking Club is a welcoming place to practice spoken English, meet people, and build confidence through real conversation."}
      breadcrumbLabel="About"
      breadcrumbPath="/about"
    >
      <section className="section public-section public-story">
        <div>
          <span className="eyebrow">Why GSC exists</span>
          <h2>English gets easier when you <em>use it.</em></h2>
        </div>
        <div className="public-copy">
          <p>GSC is for people in Sergiev Posad who want more than a textbook exercise. The club creates a reason to speak: interesting questions, a small group, and a friendly atmosphere where mistakes are part of learning.</p>
          <p>The club is English-first and community-minded. You can come to practice, meet new people, or simply give your English a place in everyday life.</p>
          <Link className="text-link public-inline-link" href="/meetups">See how meetups work <ArrowRight /></Link>
        </div>
      </section>

      <section className="section public-section public-card-section">
        <div className="section-heading"><div><span className="eyebrow">The GSC way</span><h2>What you can expect.</h2></div><p>Simple principles keep the conversation open, useful, and human.</p></div>
        <div className="public-card-grid">
          <article><Users /><h3>Small-group connection</h3><p>The public meetup concept is intentionally small so there is room for everyone to speak and listen.</p></article>
          <article><MessageCircle /><h3>Real spoken English</h3><p>Conversation prompts help people move from overthinking to participating in a natural English conversation.</p></article>
          <article><Check /><h3>No judgment</h3><p>Accents, pauses, and mistakes are welcome. Progress matters more than sounding perfect.</p></article>
        </div>
      </section>

      <section className="section public-section location-panel">
        <div><MapPin /><div><span className="eyebrow">Local by design</span><h2>Based in <em>Sergiev Posad.</em></h2><p>Galstyan’s Speaking Club is based in Sergiev Posad, Moscow Region. The exact meetup venue is shared when a session is published.</p></div></div>
        <aside className="language-note" lang="ru"><strong>Коротко по-русски:</strong> Galstyan’s Speaking Club — разговорный клуб английского языка в Сергиевом Посаде для живой практики и общения.</aside>
      </section>
    </PublicPageShell>
  );
}
