/** Maps structured, database-authored notification metadata to safe static routes. */

export type NotificationTarget = {
  kind: string;
  meetup_id: string | null;
  booking_id: string | null;
  target_url: string | null;
};

export function notificationTarget(notification: NotificationTarget) {
  if (notification.target_url?.startsWith("/") && !notification.target_url.startsWith("//")) {
    const target = new URL(notification.target_url, "https://galstyansspeakingclub.ru");
    if (["/meetups/", "/account/", "/admin/"].includes(target.pathname)) return `${target.pathname}${target.search}`;
  }
  if (notification.meetup_id) return `/meetups/?id=${encodeURIComponent(notification.meetup_id)}`;
  if (notification.kind === "booking_confirmed" || notification.kind === "booking_cancelled") return "/account/#bookings";
  if (notification.kind === "new_member") return "/admin/?section=members";
  return null;
}
