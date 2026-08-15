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
};

export async function getPublishedMeetups(): Promise<PublishedMeetup[]> {
  const supabase = await createClient();
  if (!supabase) return [];

  try {
    const { data, error } = await supabase
      .from("meetups")
      .select("id,title,description,starts_at,ends_at,timezone,location_name,address,capacity,price_minor,currency,status,booking_opens_at,booking_closes_at,confirmed_booking_count,category,image_url")
      .eq("status", "published")
      .eq("is_public", true)
      .gte("starts_at", new Date().toISOString())
      .order("starts_at", { ascending: true });

    if (error || !data) return [];
    return data as PublishedMeetup[];
  } catch {
    return [];
  }
}
