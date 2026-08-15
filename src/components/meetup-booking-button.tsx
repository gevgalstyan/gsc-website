"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowRight, LoaderCircle, TicketCheck } from "lucide-react";

export function MeetupBookingButton({ meetupId, initialBooked = false }: { meetupId: string; initialBooked?: boolean }) {
  const [booked, setBooked] = useState(initialBooked);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");

  async function toggleBooking() {
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
      }
    } catch {
      setNotice("The booking service is temporarily unavailable.");
    } finally {
      setBusy(false);
    }
  }

  return <div className="booking-action"><button className="button button-primary" type="button" onClick={toggleBooking} disabled={busy}>{busy ? <LoaderCircle className="spin" /> : booked ? <TicketCheck /> : <ArrowRight />}{busy ? "Updating…" : booked ? "Cancel booking" : "Book your place"}</button>{notice && <p className="form-status" role="status" aria-live="polite">{notice}{notice.startsWith("Please log in") && <> <Link href="/?auth=login">Log in</Link></>}</p>}</div>;
}
