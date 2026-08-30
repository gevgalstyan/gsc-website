"use client";

/**
 * Member meetup booking and cancellation control.
 * Calls the booking API and displays safe loading, blocked, and error states.
 */

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { ArrowRight, LoaderCircle, TicketCheck } from "lucide-react";

export type MeetupBookingState = "open" | "full" | "not_open" | "closed";

// ======================================================
// MEETUP BOOKING / BOOKING CANCELLATION
// ======================================================
export function MeetupBookingButton({
  meetupId,
  initialBooked = false,
  bookingState = "open",
  authenticated = true,
}: {
  meetupId: string;
  initialBooked?: boolean;
  bookingState?: MeetupBookingState;
  authenticated?: boolean;
}) {
  const [booked, setBooked] = useState(initialBooked);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");
  const router = useRouter();

  async function toggleBooking() {
    if (!authenticated) {
      router.push("/?auth=login");
      return;
    }
    setBusy(true);
    setNotice("");
    try {
      const client = getSupabaseBrowserClient();
      if (!client) throw new Error("Member access is not configured.");
      const { data: sessionData } = await client.auth.getSession();
      if (!sessionData.session) {
        setNotice("Please log in to book a place.");
      } else {
        const result = booked
          ? await client.from("meetup_bookings").update({ status: "cancelled" }).eq("meetup_id", meetupId).eq("user_id", sessionData.session.user.id).eq("status", "confirmed").select("id").single()
          : await client.from("meetup_bookings").insert({ meetup_id: meetupId }).select("id").single();
        if (result.error) {
          const message = result.error.message.toLowerCase();
          setNotice(message.includes("capacity") || result.error.code === "23505" ? "This meetup is full or you already have a booking." : "The booking could not be updated.");
          return;
        }
        setBooked(!booked);
        setNotice(booked ? "Booking cancelled." : "Your place is booked.");
      }
    } catch {
      setNotice("The booking service is temporarily unavailable.");
    } finally {
      setBusy(false);
    }
  }

  const stateLabel = bookingState === "full"
    ? "Meetup full"
    : bookingState === "not_open"
      ? "Booking opens soon"
      : bookingState === "closed"
        ? "Booking closed"
        : authenticated ? "Book my place" : "Sign in to book";
  const blocked = !booked && bookingState !== "open";

  return <div className="booking-action"><button className="button button-primary" type="button" onClick={toggleBooking} disabled={busy || blocked}>{busy ? <LoaderCircle className="spin" /> : booked ? <TicketCheck /> : <ArrowRight />}{busy ? "Updating…" : booked ? "Booked ✓ · Cancel" : stateLabel}</button>{notice && <p className="form-status" role="status" aria-live="polite">{notice}{notice.startsWith("Please log in") && <> <Link href="/?auth=login">Log in</Link></>}</p>}</div>;
}
