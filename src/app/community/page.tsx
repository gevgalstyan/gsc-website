import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, HeartHandshake, MessageCircle, Users, Waves } from "lucide-react";
import { PublicPageShell } from "@/components/public-page-shell";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata(
  "The GSC English Speaking Community",
  "Meet people, practice conversational English, and build speaking confidence with a friendly local English community in Sergiev Posad.",
  "/community",
);

export default function CommunityPage() {
  return <PublicPageShell eyebrow="Community" title="A reason to keep English in your life" intro="Galstyan’s Speaking Club is a local Sergiev Posad community for conversation, confidence, and the people you meet along the way." breadcrumbLabel="Community" breadcrumbPath="/community">
    <section className="section public-section community-intro-section"><div><span className="eyebrow">The social side of GSC</span><h2>Practice becomes easier when it is <em>shared.</em></h2></div><div className="public-copy"><p>GSC brings people together around real English conversation. You do not need to arrive with a group or have a perfect speaking voice; the point is to take part, listen well, and make the next sentence.</p><p>Between published meetups, the question library gives the community a simple way to keep exploring topics and building confidence.</p><Link className="text-link" href="/questions">Try the question library <ArrowRight /></Link></div></section>
    <section className="section public-section public-card-section"><div className="section-heading"><div><span className="eyebrow">What community can mean</span><h2>Room for <em>connection.</em></h2></div><p>A friendly offline environment and a local reason to practise regularly.</p></div><div className="public-card-grid"><article><MessageCircle /><h3>Conversational practice</h3><p>Use English in a real exchange, with prompts that help a table move beyond small talk.</p></article><article><Users /><h3>Meet new people</h3><p>Come for the practice and leave knowing someone from the Sergiev Posad community.</p></article><article><Waves /><h3>Confidence over perfection</h3><p>Regular speaking makes pauses, mistakes, and new conversations feel more manageable.</p></article><article><HeartHandshake /><h3>Friendly by design</h3><p>The club’s principles are English-first, respectful, social, and welcoming to different levels.</p></article></div></section>
    <section className="section public-section public-cta-panel"><Users /><div><span className="eyebrow">Join the local community</span><h2>Your next good conversation can start <em>here.</em></h2><p>Follow meetup announcements on Telegram, or use Member access when you are ready to create an account. Regular attendance can also build qualifying progress in the member space.</p><div className="public-actions"><a className="button button-primary" href="https://t.me/GalstyansSpeakingClub" target="_blank" rel="noreferrer">Join Telegram <ArrowRight /></a><Link className="button button-outline-dark" href="/membership">See membership <ArrowRight /></Link></div></div></section>
  </PublicPageShell>;
}
