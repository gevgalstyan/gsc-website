import { redirect } from "next/navigation";
import { AdminDashboard } from "@/components/admin-dashboard";
import { createClient } from "@/lib/supabase/server";

export default async function AdminPage() {
  const supabase = await createClient();
  const { data: claims } = await supabase.auth.getClaims();
  const userId = claims?.claims?.sub;
  if (!userId) redirect("/?auth=login");
  const { data: role } = await supabase.from("user_roles").select("role").eq("user_id", userId).single();
  if (role?.role !== "admin") redirect("/account");

  const [directory, profiles, roles, meetups, bookings, attendance, loyalty, special, progress, favorites, audit] = await Promise.all([
    supabase.rpc("admin_member_directory"),
    supabase.from("profiles").select("id,display_name,avatar_path,avatar_url,telegram_username,created_at").order("created_at", { ascending: false }),
    supabase.from("user_roles").select("user_id,role,updated_at"),
    supabase.from("meetups").select("*").order("starts_at", { ascending: false }),
    supabase.from("meetup_bookings").select("id,meetup_id,user_id,status,booked_at").order("booked_at", { ascending: false }),
    supabase.from("attendance").select("id,meetup_id,user_id,status,is_paid,paid_amount_minor,paid_currency,recorded_at").order("recorded_at", { ascending: false }),
    supabase.from("loyalty_rewards").select("id,user_id,status,earned_at,reward_sequence"),
    supabase.from("special_rewards").select("id,user_id,name,reason,description,status,issued_at,expires_at").order("issued_at", { ascending: false }),
    supabase.from("question_progress").select("user_id,question_id"),
    supabase.from("question_favorites").select("user_id,question_id"),
    supabase.from("admin_audit_log").select("id,actor_user_id,action,target_table,target_id,details,created_at").order("created_at", { ascending: false }).limit(100),
  ]);

  const profileRows = profiles.data ?? [];
  const signedAvatars: Record<string, string> = {};
  await Promise.all(profileRows.filter((profile) => profile.avatar_path).map(async (profile) => {
    const { data } = await supabase.storage.from("profile-avatars").createSignedUrl(profile.avatar_path!, 1800);
    if (data?.signedUrl) signedAvatars[profile.id] = data.signedUrl;
  }));

  return <AdminDashboard initial={{
    currentUserId: userId,
    directory: directory.data ?? [], profiles: profileRows, roles: roles.data ?? [],
    meetups: meetups.data ?? [], bookings: bookings.data ?? [], attendance: attendance.data ?? [],
    loyalty: loyalty.data ?? [], special: special.data ?? [], progress: progress.data ?? [],
    favorites: favorites.data ?? [], audit: audit.data ?? [], signedAvatars,
  }} />;
}
