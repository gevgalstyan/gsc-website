"use client";

/**
 * Member meetup booking and cancellation control.
 * Calls the booking API and displays safe loading, blocked, and error states.
 */

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
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
      const response = await fetch(`/api/meetups/${meetupId}/book`, {
        method: booked ? "DELETE" : "POST",
        headers: booked ? undefined : { "Content-Type": "application/json" },
      });
      const payload = await response.json().catch(() => ({}));
      if (response.status === 401) {
        setNotice("Please log in to book a place.");
      } else if (!response.ok) {
        setNotice(payload.error ?? "The booking could not be updated.");
      } else {
        setBooked(!booked);
        setNotice(booked ? "Booking cancelled." : "Your place is booked.");
        router.refresh();
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
