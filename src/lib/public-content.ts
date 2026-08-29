/**
 * Loads published meetup summaries from Supabase for the public website.
 * Missing configuration or query failures fall back safely to an empty list.
 */

import { createClient } from "@/lib/supabase/server";
import { withPublicFallback } from "@/lib/public-resilience";

export type PublishedMeetup = {
  id: string;
  title: string;
  description: string;
  starts_at: string;
  ends_at: string;
  timezone: string;
  location_name: string;
  address: string | null;
  capacity: number;
  price_minor: number;
  currency: string;
  status: "published" | "cancelled" | "completed";
  booking_opens_at: string | null;
  booking_closes_at: string | null;
  confirmed_booking_count: number;
  category: string;
  image_url: string | null;
  member_booking_status: "confirmed" | "cancelled" | null;
};

// ======================================================
// MEETUP LISTING — PUBLIC READ MODEL
// ======================================================
export async function getPublishedMeetups(): Promise<PublishedMeetup[]> {
  return withPublicFallback(async () => {
    const supabase = await createClient();
    if (!supabase) return [];
    const { data, error } = await supabase
        .from("meetups")
        .select("id,title,description,starts_at,ends_at,timezone,location_name,address,capacity,price_minor,currency,status,booking_opens_at,booking_closes_at,confirmed_booking_count,category,image_url")
        .eq("status", "published")
        .gte("starts_at", new Date().toISOString())
        .order("starts_at", { ascending: true });

    if (error || !data) return [];

    return (data as Omit<PublishedMeetup, "member_booking_status">[]).map((meetup) => ({
      ...meetup,
      // Booking state is checked by the booking action. Public content should
      // never wait for a member session to render.
      member_booking_status: null,
    }));
  }, []);
}
