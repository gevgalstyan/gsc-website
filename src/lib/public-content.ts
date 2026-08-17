import { createClient } from "@/lib/supabase/server";

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

export async function getPublishedMeetups(): Promise<PublishedMeetup[]> {
  const supabase = await createClient();
  if (!supabase) return [];

  try {
    const [{ data, error }, { data: claims }] = await Promise.all([
      supabase
      .from("meetups")
      .select("id,title,description,starts_at,ends_at,timezone,location_name,address,capacity,price_minor,currency,status,booking_opens_at,booking_closes_at,confirmed_booking_count,category,image_url")
      .eq("status", "published")
      .gte("starts_at", new Date().toISOString())
      .order("starts_at", { ascending: true }),
      supabase.auth.getClaims(),
    ]);

    if (error || !data) return [];
    const userId = typeof claims?.claims?.sub === "string" ? claims.claims.sub : null;
    const bookingStatuses = new Map<string, "confirmed" | "cancelled">();
    if (userId) {
      const { data: bookings } = await supabase
        .from("meetup_bookings")
        .select("meetup_id,status")
        .eq("user_id", userId);
      for (const booking of bookings ?? []) {
        bookingStatuses.set(booking.meetup_id, booking.status as "confirmed" | "cancelled");
      }
    }

    return (data as Omit<PublishedMeetup, "member_booking_status">[]).map((meetup) => ({
      ...meetup,
      member_booking_status: bookingStatuses.get(meetup.id) ?? null,
    }));
  } catch {
    return [];
  }
}
