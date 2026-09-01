/** Browser-safe canonical published-meetup query. */

import type { SupabaseClient } from "@supabase/supabase-js";
import type { PublishedMeetup } from "@/lib/public-content";

export const publishedMeetupColumns = "id,title,description,starts_at,ends_at,timezone,location_name,address,capacity,price_minor,currency,status,booking_opens_at,booking_closes_at,confirmed_booking_count,category,image_url";

export function isUpcomingMeetup(meetup: Pick<PublishedMeetup, "status" | "starts_at">, now = Date.now()) {
  return meetup.status === "published" && new Date(meetup.starts_at).getTime() > now;
}

export async function fetchUpcomingPublishedMeetups(client: SupabaseClient, userId?: string | null): Promise<PublishedMeetup[]> {
  const meetups = client
    .from("meetups")
    .select(publishedMeetupColumns)
    .eq("status", "published")
    .gt("starts_at", new Date().toISOString())
    .order("starts_at", { ascending: true });
  const bookings = userId
    ? client.from("meetup_bookings").select("meetup_id,status").eq("user_id", userId).eq("status", "confirmed")
    : Promise.resolve({ data: [], error: null });
  const [meetupResult, bookingResult] = await Promise.all([meetups, bookings]);
  if (meetupResult.error) throw meetupResult.error;
  if (bookingResult.error) throw bookingResult.error;
  const booked = new Set((bookingResult.data ?? []).map((row: { meetup_id: string }) => row.meetup_id));
  return (meetupResult.data ?? [])
    .filter((row) => isUpcomingMeetup(row as PublishedMeetup))
    .map((row) => ({ ...row, member_booking_status: booked.has(row.id) ? "confirmed" : null }) as PublishedMeetup);
}
