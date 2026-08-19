import Link from "next/link";
import { ArrowRight, Clock3, MapPin, MessageCircle, Send } from "lucide-react";
import { PublicPageShell } from "@/components/public-page-shell";
import { socialLinks } from "@/lib/site-data";
import { editablePageMetadata, getPublicContent } from "@/lib/site-content";

export const revalidate = 60;

export const generateMetadata = () => editablePageMetadata("contact", "Join an English Speaking Club in Sergiyev Posad", "Contact Galstyan’s Speaking Club about English conversation practice, upcoming meetups, and joining the local community in Sergiyev Posad.", "/contact");

export default async function ContactPage() {
  const content = await getPublicContent();
  return (
    <PublicPageShell
      eyebrow="Contact"
      title={content["contact.hero.title"] || "Have a question? Say hello."}
      intro={content["contact.intro"] || "Ask about English practice, the next meetup, or how to join Galstyan’s Speaking Club in Sergiev Posad."}
      breadcrumbLabel="Contact"
      breadcrumbPath="/contact"
    >
      <section className="section public-section contact-page-grid">
        <div className="public-contact-copy"><span className="eyebrow">The quickest reply</span><h2>Talk to the club on <em>Telegram.</em></h2><p>The GSC Telegram community is where meetup dates and venue announcements are shared. It is also the best place to ask a question before joining.</p><a className="button button-primary" href={content["settings.telegram_url"] || content["contact.telegram_url"] || "https://t.me/GalstyansSpeakingClub"} target="_blank" rel="noreferrer">Open Telegram <Send /></a></div>
        <div className="public-contact-details">
          <div><MapPin /><span><strong>Based in</strong>Sergiev Posad, Moscow Region</span></div>
          <div><Clock3 /><span><strong>What to ask about</strong>Meetup dates, English levels, and conversation practice</span></div>
          <div><ArrowRight /><span><strong>Ready to join?</strong><Link href="/?auth=register">Create a member profile</Link></span></div>
          <div className="contact-social-list"><MessageCircle /><span><strong>Other channels</strong><span>{socialLinks.slice(1).map((social) => <a key={social.label} href={content[`settings.${social.label.toLowerCase()}_url`] || social.href} target="_blank" rel="noreferrer">{social.label}</a>)}</span></span></div>
          {content["settings.contact_email"] && <div><MessageCircle /><span><strong>Email</strong><a href={`mailto:${content["settings.contact_email"]}`}>{content["settings.contact_email"]}</a></span></div>}
        </div>
      </section>
      <section className="section public-section public-note-panel"><span className="eyebrow">A clear local answer</span><h2>{content["contact.local_heading"] || "Looking for an English club in Sergiyev Posad?"}</h2><p>Galstyan’s Speaking Club is a local conversation community for people who want to practice English through real communication and meetups.</p></section>
    </PublicPageShell>
  );
}
