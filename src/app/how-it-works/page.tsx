import Link from "next/link";
import { ArrowRight, Award, CalendarDays, Check, MessageCircle, Users } from "lucide-react";
import { FaqSection } from "@/components/faq-section";
import { PublicPageShell } from "@/components/public-page-shell";
import { editablePageMetadata, getPublicContent } from "@/lib/site-content";
import { MemberJourneyStep } from "@/components/auth-aware-content";

export const revalidate = 60;

export const generateMetadata = () => editablePageMetadata("how-it-works", "How the English Speaking Club Works", "See how Galstyan’s Speaking Club combines English conversation practice, meetups, questions, and a local community in Sergiev Posad.", "/how-it-works");

export default async function HowItWorksPage() {
  const content = await getPublicContent();
  return (
    <PublicPageShell
      eyebrow="How it works"
      title={content["how-it-works.hero.title"] || "A simple way to practice spoken English"}
      intro={content["how-it-works.intro"] || "Join the community, choose a published meetup, and turn English on at the table."}
      breadcrumbLabel="How it works"
      breadcrumbPath="/how-it-works"
    >
      <section className="section public-section public-steps">
        <div className="public-step"><span>01</span><div><Users /><h2>Discover GSC</h2><p>Read about the club, browse the question library, and follow Telegram for real meetup announcements.</p></div></div>
        <div className="public-step"><span>02</span><div><Users /><MemberJourneyStep /></div></div>
        <div className="public-step"><span>03</span><div><CalendarDays /><h2>Choose a published meetup</h2><p>Check the real date, time, venue, capacity, price, and booking state. Only published events are available for online booking.</p></div></div>
        <div className="public-step"><span>04</span><div><MessageCircle /><h2>Book and attend</h2><p>Follow the published event’s booking instructions, then arrive ready for an English-first conversation.</p></div></div>
        <div className="public-step"><span>05</span><div><Check /><h2>Check in</h2><p>The organizer records attendance so your member history reflects the meetings you joined.</p></div></div>
        <div className="public-step"><span>06</span><div><Award /><h2>Build progress</h2><p>Keep exploring questions and collect six paid qualifying attended visits to earn a free-meetup reward.</p></div></div>
      </section>

      <section className="section public-section question-library-panel">
        <div><span className="eyebrow">Practice between meetups</span><h2>Keep the conversation going with <em>2,000 questions.</em></h2><p>The GSC question library covers 20 categories and beginner, intermediate, and advanced levels. Draw a card, explore a topic, save favorites, and build confidence before the next meetup.</p><Link className="button button-primary" href="/#questions">Try the question library <ArrowRight /></Link></div>
        <div className="question-library-stats"><strong>20</strong><span>categories</span><strong>3</strong><span>levels</span><strong>2,000</strong><span>conversation prompts</span></div>
      </section>

      <FaqSection compact />
    </PublicPageShell>
  );
}
