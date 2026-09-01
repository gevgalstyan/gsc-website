"use client";
/* eslint-disable react-hooks/set-state-in-effect */

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ArrowRight, CalendarDays, Clock3, MapPin, Ticket, Users } from "lucide-react";
import { MeetupBookingButton, type MeetupBookingState } from "@/components/meetup-booking-button";
import { useBrowserViewer } from "@/hooks/use-browser-viewer";
import { fetchUpcomingPublishedMeetups } from "@/lib/meetup-data";
import { getMeetupBookingState, MEETUP_TIME_ZONE } from "@/lib/meetup-time";
import type { PublishedMeetup } from "@/lib/public-content";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

function formatDate(meetup: PublishedMeetup) {
  const start = new Date(meetup.starts_at);
  return {
    date: new Intl.DateTimeFormat("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric", timeZone: MEETUP_TIME_ZONE }).format(start),
    time: `${new Intl.DateTimeFormat("en-GB", { hour: "numeric", minute: "2-digit", timeZone: MEETUP_TIME_ZONE }).format(start)}–${new Intl.DateTimeFormat("en-GB", { hour: "numeric", minute: "2-digit", timeZone: MEETUP_TIME_ZONE }).format(new Date(meetup.ends_at))}`,
  };
}
function price(meetup: PublishedMeetup) { return new Intl.NumberFormat("ru-RU", { style: "currency", currency: meetup.currency, maximumFractionDigits: 0 }).format(meetup.price_minor / 100); }
function bookingState(meetup: PublishedMeetup): { state: MeetupBookingState; label: string } {
  if (meetup.member_booking_status === "confirmed") return { state: "open", label: "Booked ✓" };
  const state = getMeetupBookingState(meetup);
  return { state, label: state === "closed" ? "Booking closed" : state === "not_open" ? "Booking opens soon" : state === "full" ? "Meetup full" : "Booking open" };
}

export function MeetupsListing() {
  const viewer = useBrowserViewer();
  const [meetups, setMeetups] = useState<PublishedMeetup[]>([]);
  const [state, setState] = useState<"loading" | "ready" | "error">("loading");
  const [selectedId, setSelectedId] = useState<string | null>(() => typeof window === "undefined" ? null : new URLSearchParams(window.location.search).get("id") ?? new URLSearchParams(window.location.search).get("meetup"));

  const refresh = useCallback(async () => {
    const client = getSupabaseBrowserClient();
    if (!client) { setState("error"); return; }
    setState("loading");
    try { setMeetups(await fetchUpcomingPublishedMeetups(client, viewer.userId)); setState("ready"); }
    catch { setState("error"); }
  }, [viewer.userId]);
  useEffect(() => { setSelectedId(new URLSearchParams(window.location.search).get("id") ?? new URLSearchParams(window.location.search).get("meetup")); }, []);
  useEffect(() => { void refresh(); }, [refresh]);
  useEffect(() => {
    const refreshWhenVisible = () => { if (document.visibilityState === "visible") void refresh(); };
    window.addEventListener("focus", refreshWhenVisible); window.addEventListener("online", refreshWhenVisible); document.addEventListener("visibilitychange", refreshWhenVisible);
    return () => { window.removeEventListener("focus", refreshWhenVisible); window.removeEventListener("online", refreshWhenVisible); document.removeEventListener("visibilitychange", refreshWhenVisible); };
  }, [refresh]);
  const selected = useMemo(() => selectedId ? meetups.find((meetup) => meetup.id === selectedId) ?? null : null, [meetups, selectedId]);
  const displayed = selected ? [selected] : meetups;
  if (state === "loading" && !meetups.length) return <p className="form-status" role="status">Loading published meetups…</p>;
  if (state === "error") return <div className="public-empty-state"><CalendarDays /><h2>Meetups are taking a moment.</h2><p>We couldn’t load the current schedule. Please try again.</p><button className="button button-primary" type="button" onClick={() => void refresh()}>Try again</button></div>;
  if (selectedId && !selected) return <div className="public-empty-state"><CalendarDays /><h2>This meetup is no longer available.</h2><p>It may have been cancelled, completed, or removed from the current schedule.</p><Link className="button button-primary" href="/meetups/">View current meetups</Link></div>;
  if (!displayed.length) return <div className="public-empty-state"><CalendarDays /><span className="eyebrow">No published events yet</span><h2>No upcoming meetup yet.</h2><p>We’ll let you know when the next one is published.</p></div>;
  return <div className="published-meetup-list">{displayed.map((meetup) => {
    const details = formatDate(meetup); const booking = bookingState(meetup);
    return <article className="published-meetup-card" key={meetup.id}><div className="published-meetup-heading"><span className="eyebrow"><i /> Published meetup</span><strong>{booking.label}</strong></div><h2>{meetup.title}</h2><p>{meetup.description || "An English conversation meetup from Galstyan’s Speaking Club."}</p><dl className="published-meetup-details"><div><CalendarDays /><dt>Date</dt><dd>{details.date}</dd></div><div><Clock3 /><dt>Time</dt><dd>{details.time} · {MEETUP_TIME_ZONE}</dd></div><div><MapPin /><dt>Location</dt><dd>{meetup.location_name}{meetup.address ? ` · ${meetup.address}` : ""}</dd></div><div><Users /><dt>Capacity</dt><dd>{Math.max(0, meetup.capacity - meetup.confirmed_booking_count)} of {meetup.capacity} places remaining</dd></div><div><Ticket /><dt>Price</dt><dd>{price(meetup)}</dd></div></dl><div className="public-actions">{viewer.role === "admin" ? <Link className="button button-primary" href={`/admin/?section=meetups&meetup=${meetup.id}`}>Manage meetup <ArrowRight /></Link> : <MeetupBookingButton meetupId={meetup.id} initialBooked={meetup.member_booking_status === "confirmed"} bookingState={booking.state} authenticated={viewer.role === "member"} />}</div></article>;
  })}</div>;
}
