"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowDown, ArrowRight, BadgeCheck, CalendarDays, Check, Clock3, Coffee, MapPin, MessageCircle, Star, Ticket, Users } from "lucide-react";
import { useEffect, useState } from "react";
import type { AuthChangeEvent, Session } from "@supabase/supabase-js";
import { AuthDialog } from "@/components/auth-dialog";
import { FaqSection } from "@/components/faq-section";
import { Footer } from "@/components/footer";
import { Header } from "@/components/header";
import { QuestionDeck } from "@/components/question-deck";
import type { PublishedMeetup } from "@/lib/public-content";
import type { MeetupBookingState } from "@/components/meetup-booking-button";
import { socialLinks } from "@/lib/site-data";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

function meetupDate(meetup: PublishedMeetup) {
  const date = new Date(meetup.starts_at);
  return {
    day: new Intl.DateTimeFormat("en-GB", { day: "2-digit", month: "short", timeZone: meetup.timezone }).format(date),
    time: new Intl.DateTimeFormat("en-GB", { hour: "numeric", minute: "2-digit", timeZone: meetup.timezone }).format(date),
  };
}

function meetupPrice(meetup: PublishedMeetup) {
  return new Intl.NumberFormat("ru-RU", { style: "currency", currency: meetup.currency, maximumFractionDigits: 0 }).format(meetup.price_minor / 100);
}

function bookingState(meetup: PublishedMeetup): { state: MeetupBookingState; label: string } {
  const now = Date.now();
  if (meetup.member_booking_status === "confirmed") return { state: "open", label: "Booked ✓" };
  if (meetup.confirmed_booking_count >= meetup.capacity) return { state: "full", label: "Fully booked" };
  if (meetup.booking_closes_at && now >= new Date(meetup.booking_closes_at).getTime()) return { state: "closed", label: "Booking closed" };
  if (meetup.booking_opens_at && now < new Date(meetup.booking_opens_at).getTime()) return { state: "not_open", label: "Booking opens soon" };
  return { state: "open", label: "Booking open" };
}

export function HomePage({ initialAuthOpen = false, authenticated = false, meetups = [], content = {}, deferPublicData = false }: { initialAuthOpen?: boolean; authenticated?: boolean; meetups?: PublishedMeetup[]; content?: Record<string, string>; deferPublicData?: boolean }) {
  const [authOpen, setAuthOpen] = useState(initialAuthOpen);
  const [isAuthenticated, setIsAuthenticated] = useState(authenticated);
  const [publicMeetups, setPublicMeetups] = useState(meetups);
  const [publicContent, setPublicContent] = useState(content);
  const [publicDataState, setPublicDataState] = useState<"loading" | "ready" | "error">(deferPublicData ? "loading" : "ready");
  const [publicDataAttempt, setPublicDataAttempt] = useState(0);

  useEffect(() => {
    const authParam = new URLSearchParams(window.location.search).get("auth");
    if (!authParam) return;
    const openTimer = window.setTimeout(() => setAuthOpen(true), 0);
    return () => window.clearTimeout(openTimer);
  }, []);

  useEffect(() => {
    const client = getSupabaseBrowserClient();
    if (!client) return;
    let active = true;

    client.auth.getSession().then(({ data }: { data: { session: Session | null } }) => {
      if (active) setIsAuthenticated(Boolean(data.session?.user));
    }).catch(() => undefined);
    const { data: authState } = client.auth.onAuthStateChange((_event: AuthChangeEvent, session: Session | null) => {
      if (active) setIsAuthenticated(Boolean(session?.user));
    });
    return () => { active = false; authState.subscription.unsubscribe(); };
  }, []);

  useEffect(() => {
    if (!deferPublicData) return;
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 2800);
    fetch("/api/public-content", { signal: controller.signal, cache: "force-cache" })
      .then((response) => response.ok ? response.json() : Promise.reject(new Error("Public content request failed")))
      .then((data: { meetups?: PublishedMeetup[]; content?: Record<string, string> }) => {
        setPublicMeetups(data.meetups ?? []);
        setPublicContent(data.content ?? {});
        setPublicDataState("ready");
      })
      .catch(() => setPublicDataState("error"))
      .finally(() => window.clearTimeout(timeout));

    return () => { controller.abort(); window.clearTimeout(timeout); };
  }, [deferPublicData, publicDataAttempt]);

  function retryPublicData() {
    setPublicDataState("loading");
    setPublicDataAttempt((attempt) => attempt + 1);
  }

  return (
    <>
      <Header onAuth={() => setAuthOpen(true)} authenticated={authenticated} />
      <main>
        <section id="home" className="hero section">
          <div className="hero-copy">
            <span className="eyebrow"><i /> Sergiev Posad · English speaking community</span>
            <h1>English<br /><em>Speaking Club</em><small> in Sergiev Posad</small></h1>
            <p className="hero-lead">{publicContent["homepage.hero.lead"] || "A friendly English conversation club in Sergiev Posad. Practice spoken English with real people."}</p>
            <div className="hero-buttons">
              <Link className="button button-primary" href={isAuthenticated ? "/account" : "/contact"}>{isAuthenticated ? "Open your dashboard" : "Join the club"} <ArrowRight /></Link>
              <Link className="button button-quiet" href="/meetups">Explore meetups <ArrowDown /></Link>
            </div>
            <div className="hero-proof">
              <div className="avatar-stack"><span>G</span><span>S</span><span>C</span><span>+</span></div>
              <p><b>Local English practice</b><span>Come as you are. Leave more confident.</span></p>
            </div>
          </div>
          <div className="hero-visual">
            <div className="hero-glow" />
            <div className="orbit orbit-one" /><div className="orbit orbit-two" />
            <Image src="/gsc-logo.jpg" alt="Galstyan’s Speaking Club logo" width={1254} height={1254} priority sizes="(max-width: 800px) 82vw, 46vw" />
            <div className="floating-card card-location"><MapPin /><span><small>We meet in</small>Sergiev Posad</span></div>
            <div className="floating-card card-price"><MessageCircle /><span><small>At the table</small>English first</span></div>
          </div>
          <div className="scroll-cue"><span>Scroll to explore</span><ArrowDown /></div>
        </section>

        <section className="manifesto">
          <div><span className="eyebrow">This isn&apos;t a lesson</span><h2>A local English speaking club in <em>Sergiev Posad.</em></h2></div>
          <div><p>GSC is a space to stop overthinking and start speaking. No textbooks, no tests, no pressure to be perfect.</p><p>Meet people from Sergiev Posad, practice spoken English, and find a reason to use your English in real conversation.</p><Link href="#community">Meet the community <ArrowRight /></Link></div>
        </section>

        <section className="section local-intro" aria-labelledby="local-intro-title">
          <div className="section-heading"><div><span className="eyebrow">Real conversation, close to home</span><h2 id="local-intro-title">Practice spoken English with a <em>local community.</em></h2></div><p>Galstyan’s Speaking Club brings English conversation practice and social connection together in Sergiev Posad, Moscow Region.</p></div>
          <div className="local-intro-grid">
            <article><span>01</span><h3>Who can join?</h3><p>People who want to speak more English, meet others, and grow their confidence in a friendly group. The question library supports beginner through advanced practice.</p></article>
            <article><span>02</span><h3>What happens at a meetup?</h3><p>Small groups use interesting prompts to start conversations. The public format is relaxed, social, and English-only from the first minute to the last.</p></article>
            <article><span>03</span><h3>Where do we meet?</h3><p>The club is based in Sergiev Posad. Dates and the exact venue are shared when a meetup is published, with announcements in Telegram.</p></article>
          </div>
        </section>

        <QuestionDeck />

        <section id="meetups" className="section meetups-section">
          <div className="section-heading">
            <div><span className="eyebrow">Come say hello</span><h2>English conversation<br /><em>meetups.</em></h2></div>
            <p>Meetups are designed for spoken-English practice in Sergiev Posad. Only published events appear here, with the details supplied by the club.</p>
          </div>
          {publicMeetups.length ? <div className="meetup-grid">
            {publicMeetups.slice(0, 3).map((meetup, index) => {
              const date = meetupDate(meetup);
              const booking = bookingState(meetup);
              return <article className={`meetup-card ${index === 0 ? "featured" : ""}`} key={meetup.id}>
                <div className="meetup-date"><b>{date.day}</b><span>{date.time}</span></div>
                <span className="status"><i />{booking.label}</span>
                <div className="meetup-icon">{index === 0 ? <MessageCircle /> : index === 1 ? <Coffee /> : <Star />}</div>
                <h3>{meetup.title}</h3><p>{meetup.description || "An English conversation meetup from Galstyan’s Speaking Club."}</p>
                <ul><li><MapPin />{meetup.location_name}</li><li><Users />{Math.max(0, meetup.capacity - meetup.confirmed_booking_count)} places left</li><li><Ticket />{meetupPrice(meetup)}</li></ul>
                <Link className="button button-card" href="/meetups">See meetup details <ArrowRight /></Link>
              </article>;
            })}
          </div> : <div className="meetup-empty"><CalendarDays /><div><h3>{publicDataState === "loading" ? "Loading upcoming meetups…" : publicDataState === "error" ? "Meetups are taking a moment." : "Next meetup coming soon."}</h3><p>{publicDataState === "error" ? "Couldn’t load this section. Try again, or join Telegram for announcements." : "No published meetup is available yet. Join Telegram for the first real date, venue, and booking details."}</p>{publicDataState === "error" ? <button className="text-link" type="button" onClick={retryPublicData}>Try again <ArrowRight /></button> : <a className="text-link" href={socialLinks[0].href} target="_blank" rel="noreferrer">Join the announcement channel <ArrowRight /></a>}</div></div>}
          <p className="meetup-note"><CalendarDays /> Want to see every published event? <Link href="/meetups">Open the meetups page.</Link></p>
        </section>

        <section id="community" className="section community-section">
          <div className="community-panel">
            <div className="community-copy"><span className="eyebrow">The GSC way</span><h2>An English-speaking community in <em>Sergiev Posad.</em></h2><p>From the first minute to the last, we speak English only. You&apos;ll discover that fluency grows when the fear of mistakes disappears.</p><a className="button button-light" href={socialLinks[0].href} target="_blank" rel="noreferrer">Join our Telegram <ArrowRight /></a></div>
            <div className="principles">
              <div><span>01</span><Check /><h3>English only</h3><p>The simplest rule—and the one that changes everything.</p></div>
              <div><span>02</span><Check /><h3>Real connection</h3><p>Interesting people and conversations worth remembering.</p></div>
              <div><span>03</span><Check /><h3>No judgment</h3><p>Your accent and mistakes are welcome here.</p></div>
            </div>
          </div>
        </section>

        <section id="loyalty" className="section loyalty-section">
          <div className="loyalty-card">
            <div className="loyalty-copy"><span className="eyebrow">Keep showing up</span><h2>Six visits.<br />One free <em>meetup.</em></h2><p>Every conversation counts. Members can track qualifying attendance and unlock a free meetup after six paid visits.</p><div className="loyalty-actions">{isAuthenticated ? <Link className="button button-primary" href="/account#rewards">View your progress <ArrowRight /></Link> : <button className="button button-primary" onClick={() => setAuthOpen(true)}>Create your profile <ArrowRight /></button>}<Link className="button button-outline-dark" href="/membership">How membership works <ArrowRight /></Link></div></div>
            <div className="stamp-card"><div className="stamp-head"><div><BadgeCheck /><span><b>GSC Member</b><small>Loyalty card</small></span></div><strong>English ON.</strong></div><div className="stamps">{[1,2,3,4,5,6].map((n) => <span key={n}>{n}</span>)}<span className="reward"><Star />FREE</span></div><div className="stamp-foot"><span>6 visits</span><i /><span>1 free meetup</span></div></div>
          </div>
        </section>

        <section id="how-it-works" className="section how-section">
          <div className="section-heading"><div><span className="eyebrow">Simple by design</span><h2>How an English speaking meetup <em>works.</em></h2></div><p>Your next good conversation starts with the community, a published meetup, and a table ready for English.</p></div>
          <div className="steps">
            <article><span>01</span><div><Users /></div><h3>Join the community</h3><p>Create a member profile or join our Telegram channel for announcements.</p></article>
            <article><span>02</span><div><CalendarDays /></div><h3>Choose a published meetup</h3><p>When a date and venue are announced, check the details and reserve your place if booking is open.</p></article>
            <article><span>03</span><div><MessageCircle /></div><h3>Turn English on</h3><p>Arrive, meet your table, draw a card, and start speaking.</p></article>
          </div>
        </section>

        <FaqSection />

        <section id="contact" className="section contact-section">
          <div className="contact-copy"><span className="eyebrow">Let&apos;s talk</span><h2>Join an English speaking club in <em>Sergiev Posad.</em></h2><p>Ask about upcoming dates, English levels, or the next conversation meetup. The quickest response is on Telegram.</p><div><MapPin /><span><small>Based in</small>Sergiev Posad, Moscow Region</span></div><div><Clock3 /><span><small>Announcements</small>Join the GSC Telegram community</span></div></div>
          <div className="contact-form contact-cta-card"><span className="eyebrow">Want to join the next meetup?</span><h3>Start with a real conversation.</h3><p>Use Telegram for live questions and meetup announcements. When a public event is published, its date and booking details will appear on the meetups page.</p><div className="public-actions"><a className="button button-primary" href={socialLinks[0].href} target="_blank" rel="noreferrer">Open Telegram <ArrowRight /></a><Link className="button button-outline-dark" href="/contact">All contact channels <ArrowRight /></Link></div></div>
        </section>
      </main>
      <Footer />
      <AuthDialog open={authOpen} onClose={() => setAuthOpen(false)} />
    </>
  );
}
