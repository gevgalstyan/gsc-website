import Link from "next/link";
import { ArrowRight, CalendarDays, Check, Clock3, MapPin, MessageCircle, Ticket, Users } from "lucide-react";
import { PublicPageShell } from "@/components/public-page-shell";
import { MeetupBookingButton } from "@/components/meetup-booking-button";
import type { MeetupBookingState } from "@/components/meetup-booking-button";
import { getPublishedMeetups, type PublishedMeetup } from "@/lib/public-content";
import { getMeetupBookingState, MEETUP_TIME_ZONE } from "@/lib/meetup-time";
import { editablePageMetadata, getPublicContent } from "@/lib/site-content";
import { getViewer, type ViewerRole } from "@/lib/viewer";

export const generateMetadata = () => editablePageMetadata("meetups", "English Speaking Meetups in Sergiev Posad", "Find published English conversation meetups from Galstyan’s Speaking Club in Sergiev Posad, with real times, places, capacity, price, and booking status.", "/meetups");
export const dynamic = "force-dynamic";

function formatDate(meetup: PublishedMeetup) {
  const date = new Date(meetup.starts_at);
  return {
    date: new Intl.DateTimeFormat("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric", timeZone: MEETUP_TIME_ZONE }).format(date),
    time: `${new Intl.DateTimeFormat("en-GB", { hour: "numeric", minute: "2-digit", timeZone: MEETUP_TIME_ZONE }).format(date)}–${new Intl.DateTimeFormat("en-GB", { hour: "numeric", minute: "2-digit", timeZone: MEETUP_TIME_ZONE }).format(new Date(meetup.ends_at))}`,
  };
}

function price(meetup: PublishedMeetup) {
  return new Intl.NumberFormat("ru-RU", { style: "currency", currency: meetup.currency, maximumFractionDigits: 0 }).format(meetup.price_minor / 100);
}

function bookingState(meetup: PublishedMeetup): { state: MeetupBookingState; label: string } {
  if (meetup.member_booking_status === "confirmed") return { state: "open", label: "Booked ✓" };
  const state = getMeetupBookingState(meetup);
  return { state, label: state === "closed" ? "Booking closed" : state === "not_open" ? "Booking opens soon" : state === "full" ? "Meetup full" : "Booking open" };
}

function MeetupCard({ meetup, viewerRole }: { meetup: PublishedMeetup; viewerRole: ViewerRole }) {
  const details = formatDate(meetup);
  const booking = bookingState(meetup);
  return (
    <article className="published-meetup-card">
      <div className="published-meetup-heading">
        <span className="eyebrow"><i /> Published meetup</span>
        <strong>{booking.label}</strong>
      </div>
      <h2>{meetup.title}</h2>
      <p>{meetup.description || "An English conversation meetup from Galstyan’s Speaking Club."}</p>
      <dl className="published-meetup-details">
        <div><CalendarDays /><dt>Date</dt><dd>{details.date}</dd></div>
        <div><Clock3 /><dt>Time</dt><dd>{details.time} · {MEETUP_TIME_ZONE}</dd></div>
        <div><MapPin /><dt>Location</dt><dd>{meetup.location_name}{meetup.address ? ` · ${meetup.address}` : ""}</dd></div>
        <div><Users /><dt>Capacity</dt><dd>{Math.max(0, meetup.capacity - meetup.confirmed_booking_count)} of {meetup.capacity} places remaining</dd></div>
        <div><Ticket /><dt>Price</dt><dd>{price(meetup)}</dd></div>
      </dl>
      <p className="published-meetup-note">{viewerRole === "loggedOut" ? "Sign in to reserve a place. You can also ask the club a question on Telegram." : viewerRole === "admin" ? "Review this event in the admin workspace, or ask the club a question on Telegram." : "Reserve your place here, or ask the club a question on Telegram."}</p>
      <div className="public-actions">{viewerRole === "admin" ? <Link className="button button-primary" href="/admin">Manage meetup <ArrowRight /></Link> : <MeetupBookingButton meetupId={meetup.id} initialBooked={meetup.member_booking_status === "confirmed"} bookingState={booking.state} authenticated={viewerRole === "member"} />}<a className="button button-outline-dark" href="https://t.me/GalstyansSpeakingClub" target="_blank" rel="noreferrer">Ask on Telegram <ArrowRight /></a></div>
    </article>
  );
}

export default async function MeetupsPage() {
  const [meetups, content, viewer] = await Promise.all([getPublishedMeetups(), getPublicContent(), getViewer()]);
  return (
    <PublicPageShell
      eyebrow="Meetups"
      title="English conversation meetups in Sergiev Posad"
      intro={content["meetups.intro"] || "GSC meetups are built for people who want to practice spoken English in a relaxed, social setting. Published events below use the club’s real event records."}
      breadcrumbLabel="Meetups"
      breadcrumbPath="/meetups"
    >
      <section className="section public-section published-meetups-section">
        {meetups.length ? <div className="published-meetup-list">{meetups.map((meetup) => <MeetupCard key={meetup.id} meetup={meetup} viewerRole={viewer.role} />)}</div> : <div className="public-empty-state"><CalendarDays /><span className="eyebrow">No published events yet</span><h2>No upcoming meetup yet.</h2><p>We’ll let you know when the next one is published. Join Telegram for the next real date, venue, and booking details.</p><div className="public-actions"><a className="button button-primary" href="https://t.me/GalstyansSpeakingClub" target="_blank" rel="noreferrer">Join Telegram <ArrowRight /></a><Link className="button button-outline-dark" href="/contact">Contact the club <ArrowRight /></Link></div></div>}
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
