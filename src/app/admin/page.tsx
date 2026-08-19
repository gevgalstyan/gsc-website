import { redirect } from "next/navigation";
import { AdminDashboard } from "@/components/admin-dashboard";
import { isAllowlistedAdminEmail } from "@/lib/admin";
import { createClient } from "@/lib/supabase/server";

export const metadata = { robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const supabase = await createClient();
  if (!supabase) redirect("/?auth=login");
  const { data: claims } = await supabase.auth.getClaims();
  const userId = claims?.claims?.sub;
  if (!userId) redirect("/?auth=login");
  const email = typeof claims?.claims?.email === "string" ? claims.claims.email : null;
  if (!isAllowlistedAdminEmail(email)) redirect("/account");
  const { data: role } = await supabase.from("user_roles").select("role").eq("user_id", userId).single();
  if (role?.role !== "admin") redirect("/account");

  const [directory, profiles, roles, meetups, bookings, attendance, loyalty, special, progress, favorites, audit, managedQuestions, content, notifications, faq, revisions, media] = await Promise.all([
    supabase.rpc("admin_member_directory"),
    supabase.from("profiles").select("id,display_name,avatar_path,avatar_url,telegram_username,english_level,created_at").order("created_at", { ascending: false }),
    supabase.from("user_roles").select("user_id,role,updated_at"),
    supabase.from("meetups").select("*").order("starts_at", { ascending: false }),
    supabase.from("meetup_bookings").select("id,meetup_id,user_id,status,booked_at").order("booked_at", { ascending: false }),
    supabase.from("attendance").select("id,meetup_id,user_id,booking_id,status,is_paid,payment_status,paid_amount_minor,paid_currency,recorded_at").order("recorded_at", { ascending: false }),
    supabase.from("loyalty_rewards").select("id,user_id,status,earned_at,reward_sequence"),
    supabase.from("special_rewards").select("id,user_id,name,reason,description,status,issued_at,expires_at").order("issued_at", { ascending: false }),
    supabase.from("question_progress").select("user_id,question_id"),
    supabase.from("question_favorites").select("user_id,question_id"),
    supabase.from("admin_audit_log").select("id,actor_user_id,action,target_table,target_id,details,created_at").order("created_at", { ascending: false }).limit(100),
    supabase.from("managed_questions").select("id,prompt,translation,category,difficulty,is_published").order("created_at", { ascending: false }),
    supabase.from("site_content").select("key,value,page_slug,section_slug,label,content_type,draft_value,published_value,sort_order,is_enabled,published_is_enabled,updated_at,published_at").order("sort_order"),
    supabase.from("notifications").select("id,title,body,read_at,created_at").eq("user_id", userId).order("created_at", { ascending: false }).limit(20),
    supabase.from("site_faq_items").select("id,draft_question,draft_answer,published_question,published_answer,sort_order,draft_sort_order,published_sort_order,is_enabled,published_is_enabled,updated_at").order("draft_sort_order"),
    supabase.from("site_content_revisions").select("id,page_slug,action,changed_by,created_at").order("created_at", { ascending: false }).limit(100),
    supabase.from("media_assets").select("id,storage_path,public_url,alt_text,mime_type,size_bytes,created_at").order("created_at", { ascending: false }),
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
    favorites: favorites.data ?? [], audit: audit.data ?? [], signedAvatars, managedQuestions: managedQuestions.data ?? [], content: content.data ?? [], notifications: notifications.data ?? [], faq: faq.data ?? [], revisions: revisions.data ?? [], media: media.data ?? [],
  }} />;
}
