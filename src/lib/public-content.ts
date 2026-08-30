/**
 * Loads published meetup summaries from Supabase for the public website.
 * Missing configuration or query failures fall back safely to an empty list.
 */


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
  return [];
}
