import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft, Award, BookOpen, CalendarCheck, Heart, ShieldCheck } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { isAllowlistedAdminEmail } from "@/lib/admin";

export const metadata = { robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default async function AdminMemberPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  if (!supabase) redirect("/?auth=login");
  const { data: claims } = await supabase.auth.getClaims();
  const currentUserId = claims?.claims?.sub;
  if (!currentUserId) redirect("/?auth=login");
  const email = typeof claims?.claims?.email === "string" ? claims.claims.email : null;
  if (!isAllowlistedAdminEmail(email)) redirect("/account");
  const { data: role } = await supabase.from("user_roles").select("role").eq("user_id", currentUserId).single();
  if (role?.role !== "admin") redirect("/account");

  const [directory, profile, memberRole, attendance, bookings, rewards, special, progress, favorites] = await Promise.all([
    supabase.rpc("admin_member_directory"),
    supabase.from("profiles").select("id,display_name,telegram_username,english_level,created_at").eq("id", id).single(),
    supabase.from("user_roles").select("role").eq("user_id", id).single(),
    supabase.from("attendance").select("id,status,is_paid,payment_status,paid_amount_minor,paid_currency,recorded_at,meetups(title,starts_at)").eq("user_id", id).order("recorded_at", { ascending: false }),
    supabase.from("meetup_bookings").select("id,status,booked_at,meetups(title,starts_at)").eq("user_id", id).order("booked_at", { ascending: false }),
    supabase.from("loyalty_rewards").select("id,status,earned_at,reward_sequence").eq("user_id", id).order("earned_at", { ascending: false }),
    supabase.from("special_rewards").select("id,name,reason,status,issued_at").eq("user_id", id).order("issued_at", { ascending: false }),
    supabase.from("question_progress").select("question_id").eq("user_id", id),
    supabase.from("question_favorites").select("question_id").eq("user_id", id),
  ]);
  if (!profile.data) notFound();
  const auth = directory.data?.find((row: { user_id: string }) => row.user_id === id);
  const attendanceRows = (attendance.data ?? []).map((row) => ({ ...row, meetup: Array.isArray(row.meetups) ? row.meetups[0] : row.meetups }));
  const visits = attendanceRows.filter((row) => row.status === "attended");
  const paid = visits.filter((row) => row.is_paid).length;

  return <main className="admin-detail-shell"><Link className="admin-back" href="/admin"><ArrowLeft />Back to dashboard</Link><header><div><p className="dashboard-kicker">Member record</p><h1>{profile.data.display_name || "Unnamed member"}</h1><p>{auth?.email}{auth?.email_verified && <ShieldCheck />}</p></div><span className={`admin-status ${memberRole.data?.role}`}>{memberRole.data?.role ?? "member"}</span></header><section className="admin-stat-grid"><article><CalendarCheck /><strong>{visits.length}</strong><span>Attended</span></article><article><Award /><strong>{paid}</strong><span>Paid visits</span></article><article><BookOpen /><strong>{progress.data?.length ?? 0}</strong><span>Questions</span></article><article><Heart /><strong>{favorites.data?.length ?? 0}</strong><span>Favorites</span></article></section><div className="admin-two-column"><section className="admin-panel"><div className="admin-panel-heading"><div><p className="dashboard-kicker">Timeline</p><h2>Attendance</h2></div></div><div className="audit-list">{attendanceRows.length ? attendanceRows.map((row) => <div key={row.id}><span>{row.status}</span><strong>{row.meetup?.title ?? "Meetup"}</strong><p>{new Date(row.recorded_at).toLocaleString()} · {row.payment_status === "free_reward" ? "FREE reward" : row.is_paid ? `${(row.paid_amount_minor ?? 0) / 100} ${row.paid_currency ?? "RUB"}` : "not paid"}</p></div>) : <p className="admin-empty">No attendance yet.</p>}</div></section><section className="admin-panel"><div className="admin-panel-heading"><div><p className="dashboard-kicker">Account</p><h2>Activity & rewards</h2></div></div><dl className="member-detail-list"><div><dt>Telegram</dt><dd>{profile.data.telegram_username ? `@${profile.data.telegram_username}` : "Not provided"}</dd></div><div><dt>Joined</dt><dd>{new Date(auth?.joined_at ?? profile.data.created_at).toLocaleDateString()}</dd></div><div><dt>Bookings</dt><dd>{bookings.data?.length ?? 0}</dd></div><div><dt>Free rewards</dt><dd>{rewards.data?.length ?? 0}</dd></div><div><dt>Special rewards</dt><dd>{special.data?.length ?? 0}</dd></div></dl></section></div></main>;
}
