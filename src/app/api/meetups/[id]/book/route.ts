/**
 * Authenticated booking API for creating and cancelling meetup reservations.
 * Database triggers and RLS remain authoritative for windows, capacity, and ownership.
 */

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// ======================================================
// API ROUTES — MEETUP BOOKING
// ======================================================
export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  if (!supabase) return NextResponse.json({ error: "Member access is not configured." }, { status: 503 });

  const { data: claims } = await supabase.auth.getClaims();
  const userId = claims?.claims?.sub;
  if (!userId) return NextResponse.json({ error: "Please log in before booking a meetup." }, { status: 401 });

  const { data, error } = await supabase
    .from("meetup_bookings")
    .insert({ meetup_id: id })
    .select("id,meetup_id,status,booked_at")
    .single();

  if (error) {
    const message = error.message.toLowerCase();
    const status = message.includes("capacity") || message.includes("already") || error.code === "23505" ? 409 : 400;
    const friendly = message.includes("not open")
      ? "This meetup is not open for booking."
      : message.includes("not opened")
        ? "Booking has not opened yet."
        : message.includes("closed")
          ? "Booking for this meetup is closed."
          : status === 409
            ? "This meetup is full or you already have a booking."
            : "This meetup could not be booked.";
    return NextResponse.json({ error: friendly }, { status });
  }
  return NextResponse.json({ booking: data }, { status: 201 });
}

// ======================================================
// API ROUTES — BOOKING CANCELLATION
// ======================================================
export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  if (!supabase) return NextResponse.json({ error: "Member access is not configured." }, { status: 503 });

  const { data: claims } = await supabase.auth.getClaims();
  const userId = claims?.claims?.sub;
  if (!userId) return NextResponse.json({ error: "Please log in before changing a booking." }, { status: 401 });

  const { data, error } = await supabase
    .from("meetup_bookings")
    .update({ status: "cancelled" })
    .eq("meetup_id", id)
    .eq("user_id", userId)
    .eq("status", "confirmed")
    .select("id,meetup_id,status,cancelled_at")
    .single();

  if (error || !data) return NextResponse.json({ error: "That booking could not be cancelled." }, { status: 400 });
  return NextResponse.json({ booking: data });
}
