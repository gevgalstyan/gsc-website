"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowDown, ArrowRight, BadgeCheck, CalendarDays, Check, Clock3, Coffee, MapPin, MessageCircle, Star, Ticket, Users } from "lucide-react";
import { useState } from "react";
import { AuthDialog } from "@/components/auth-dialog";
import { Footer } from "@/components/footer";
import { Header } from "@/components/header";
import { QuestionDeck } from "@/components/question-deck";
import { meetups, socialLinks } from "@/lib/site-data";

export function HomePage() {
  const [authOpen, setAuthOpen] = useState(false);

  return (
    <>
      <Header onAuth={() => setAuthOpen(true)} />
      <main>
        <section id="home" className="hero section">
          <div className="hero-copy">
            <span className="eyebrow"><i /> Sergiev Posad · English speaking community</span>
            <h1>English<br /><em>ON.</em></h1>
            <p className="hero-lead">No Russian. Just conversations.<br />Just people.</p>
            <div className="hero-buttons">
              <Link className="button button-primary" href="#meetups">Find your meetup <ArrowRight /></Link>
              <Link className="button button-quiet" href="#questions">Try a question <ArrowDown /></Link>
            </div>
            <div className="hero-proof">
              <div className="avatar-stack"><span>G</span><span>S</span><span>C</span><span>+</span></div>
              <p><b>A growing local community</b><span>Come as you are. Leave more confident.</span></p>
            </div>
          </div>
          <div className="hero-visual">
            <div className="hero-glow" />
            <div className="orbit orbit-one" /><div className="orbit orbit-two" />
            <Image src="/gsc-logo.jpg" alt="Galstyan's Speaking Club — English ON" width={1254} height={1254} priority sizes="(max-width: 800px) 82vw, 46vw" />
            <div className="floating-card card-location"><MapPin /><span><small>We meet in</small>Sergiev Posad</span></div>
            <div className="floating-card card-price"><Ticket /><span><small>Per meetup</small>500 ₽</span></div>
          </div>
          <div className="scroll-cue"><span>Scroll to explore</span><ArrowDown /></div>
        </section>

        <section className="manifesto">
          <div><span className="eyebrow">This isn&apos;t a lesson</span><h2>Your English already knows<br />more than you <em>let it say.</em></h2></div>
          <div><p>GSC is a space to stop overthinking and start speaking. No textbooks, no tests, no pressure to be perfect.</p><p>Just interesting people, smart questions, and a reason to finally use your English.</p><Link href="#community">Meet the community <ArrowRight /></Link></div>
        </section>

        <QuestionDeck />

        <section id="meetups" className="section meetups-section">
          <div className="section-heading">
            <div><span className="eyebrow">Come say hello</span><h2>Upcoming<br /><em>meetups.</em></h2></div>
            <p>The first meetup will be announced once we have enough members to create a great experience.</p>
          </div>
          <div className="meetup-grid">
            {meetups.map((meetup, index) => (
              <article className={`meetup-card ${meetup.featured ? "featured" : ""}`} key={meetup.title}>
                <div className="meetup-date"><b>{meetup.day}</b><span>{meetup.date}</span></div>
                <span className="status"><i />{meetup.status}</span>
                <div className="meetup-icon">{index === 0 ? <MessageCircle /> : index === 1 ? <Coffee /> : <Star />}</div>
                <h3>{meetup.title}</h3><p>{meetup.description}</p>
                <ul><li><MapPin />{meetup.location}</li><li><Users />{meetup.capacity}</li><li><Ticket />{meetup.price}</li></ul>
                <button className="button button-card" onClick={() => setAuthOpen(true)}>{meetup.featured ? "Join the interest list" : "Get notified"}<ArrowRight /></button>
              </article>
            ))}
          </div>
          <p className="meetup-note"><CalendarDays /> Want to know first? Join Telegram for date and venue announcements.</p>
        </section>

        <section id="community" className="section community-section">
          <div className="community-panel">
            <div className="community-copy"><span className="eyebrow">The GSC way</span><h2>Progress over<br /><em>perfection.</em></h2><p>From the first minute to the last, we speak English only. You&apos;ll discover that fluency grows when the fear of mistakes disappears.</p><a className="button button-light" href={socialLinks[0].href} target="_blank" rel="noreferrer">Join our Telegram <ArrowRight /></a></div>
            <div className="principles">
              <div><span>01</span><Check /><h3>English only</h3><p>The simplest rule—and the one that changes everything.</p></div>
              <div><span>02</span><Check /><h3>Real connection</h3><p>Interesting people and conversations worth remembering.</p></div>
              <div><span>03</span><Check /><h3>No judgment</h3><p>Your accent and mistakes are welcome here.</p></div>
            </div>
          </div>
        </section>

        <section id="loyalty" className="section loyalty-section">
          <div className="loyalty-card">
            <div className="loyalty-copy"><span className="eyebrow">Keep showing up</span><h2>Your 7th<br />meetup is <em>free.</em></h2><p>Every conversation counts. Members will track attendance, collect badges, and unlock a free meetup after six visits.</p><button className="button button-primary" onClick={() => setAuthOpen(true)}>Create your profile <ArrowRight /></button></div>
            <div className="stamp-card"><div className="stamp-head"><div><BadgeCheck /><span><b>GSC Member</b><small>Loyalty card</small></span></div><strong>English ON.</strong></div><div className="stamps">{[1,2,3,4,5,6].map((n) => <span key={n}>{n}</span>)}<span className="reward"><Star />FREE</span></div><div className="stamp-foot"><span>6 visits</span><i /><span>1 free meetup</span></div></div>
          </div>
        </section>

        <section id="how-it-works" className="section how-section">
          <div className="section-heading"><div><span className="eyebrow">Simple by design</span><h2>How it<br /><em>works.</em></h2></div><p>Your next good conversation is only three steps away.</p></div>
          <div className="steps">
            <article><span>01</span><div><Users /></div><h3>Join the community</h3><p>Create a member profile or join our Telegram channel for announcements.</p></article>
            <article><span>02</span><div><CalendarDays /></div><h3>Book your place</h3><p>Choose a meetup that suits you. Groups stay intentionally small.</p></article>
            <article><span>03</span><div><MessageCircle /></div><h3>Turn English on</h3><p>Arrive, meet your table, draw a card, and start speaking.</p></article>
          </div>
        </section>

        <section id="contact" className="section contact-section">
          <div className="contact-copy"><span className="eyebrow">Let&apos;s talk</span><h2>Have a question?<br /><em>Say hello.</em></h2><p>Ask about upcoming dates, English levels, private groups, or anything else. The quickest response is on Telegram.</p><div><MapPin /><span><small>Based in</small>Sergiev Posad, Russia</span></div><div><Clock3 /><span><small>Typical response</small>Within one day</span></div></div>
          <form className="contact-form" onSubmit={(e) => { e.preventDefault(); alert("Demo mode: your message was not sent. Please use Telegram for now."); }}>
            <div><label>Your name<input name="name" placeholder="How should we call you?" required /></label><label>Email<input name="email" type="email" placeholder="you@example.com" required /></label></div>
            <label>What would you like to know?<textarea name="message" rows={5} placeholder="Tell us a little more..." required /></label>
            <button className="button button-primary" type="submit">Send demo message <ArrowRight /></button><small>Demo form—use Telegram for live enquiries.</small>
          </form>
        </section>
      </main>
      <Footer />
      <AuthDialog open={authOpen} onClose={() => setAuthOpen(false)} />
    </>
  );
}
