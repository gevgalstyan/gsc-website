/**
 * Public meetup listing and auth-aware booking entry point.
 * Stored instants are displayed in Europe/Moscow and availability comes from shared helpers.
 */

import { Check, MapPin, MessageCircle, Users } from "lucide-react";
import { PublicPageShell } from "@/components/public-page-shell";
import { MeetupsListing } from "@/components/meetups-listing";
import { editablePageMetadata } from "@/lib/site-content";

export const generateMetadata = () => editablePageMetadata("meetups", "English Speaking Meetups in Sergiev Posad", "Find published English conversation meetups from Galstyan’s Speaking Club in Sergiev Posad, with real times, places, capacity, price, and booking status.", "/meetups");

export default async function MeetupsPage() {
  return (
    <PublicPageShell
      eyebrow="Meetups"
      title="English conversation meetups in Sergiev Posad"
      intro="GSC meetups are built for people who want to practice spoken English in a relaxed, social setting. Published events below use the club’s real event records."
      breadcrumbLabel="Meetups"
      breadcrumbPath="/meetups"
    >
      <section className="section public-section published-meetups-section">
        <MeetupsListing />
      </section>

      <section className="section public-section public-card-section">
        <div className="section-heading"><div><span className="eyebrow">What to expect</span><h2>Come ready to <em>speak.</em></h2></div><p>Every published meetup carries its own final details. These are the principles behind the format.</p></div>
        <div className="public-card-grid public-detail-grid">
          <article><Users /><h3>Small-group conversation</h3><p>Meetups are designed so that everyone has room to speak, listen, and meet someone new. The exact capacity comes from the published event.</p></article>
          <article><MessageCircle /><h3>English-first table</h3><p>The club’s stated language rule is English only: use prompts, ask follow-up questions, and keep the conversation moving.</p></article>
          <article><Check /><h3>Simple booking flow</h3><p>Check the published date, time, place, capacity, price, and booking state. If a booking action is not available, Telegram is the current contact channel.</p></article>
          <article><MapPin /><h3>Local Sergiev Posad club</h3><p>The club is based in Sergiev Posad. The exact venue is only shown when it is part of a real published meetup record.</p></article>
        </div>
      </section>
    </PublicPageShell>
  );
}
