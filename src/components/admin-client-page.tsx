"use client";
/* eslint-disable react-hooks/set-state-in-effect */

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AdminDashboard, type AdminData } from "@/components/admin-dashboard";
import { useBrowserViewer } from "@/hooks/use-browser-viewer";
import Link from "next/link";
import { DashboardNavigation } from "@/components/dashboard-navigation";
import { BASE_PROFILE_COLUMNS, PERSONAL_PROFILE_COLUMNS, missingProfileColumns, dataLoadExplanation } from "@/lib/profile-schema";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

/** Browser-only admin entry. RLS/RPC policies, not this gate, authorize data. */
export function AdminClientPage() {
  const viewer = useBrowserViewer();
  const [compatibility, setCompatibility] = useState("");
  const router = useRouter(); const [revision, setRevision] = useState(0); const [data, setData] = useState<AdminData | null>(null); const [notice, setNotice] = useState("Checking member access…");
  useEffect(() => { if (viewer.authLoading) return; let active = true; setData(null); setNotice("Checking member access…"); setCompatibility(""); const client = getSupabaseBrowserClient(); if (!client) { setNotice("Member access is not configured."); return; } void (async () => {
    try {
    const { data: userData, error: userError } = await client.auth.getUser(); const user = userData.user;
    if (userError) { if (active) setNotice("Your session could not be checked. Log in again or retry."); return; }
    if (!user?.email_confirmed_at) { router.replace("/?auth=login"); return; }
    const { data: role, error: roleError } = await client.from("user_roles").select("role").eq("user_id", user.id).maybeSingle();
    if (roleError) { if (active) setNotice("Your administrator role could not be checked. Retry or contact the club."); return; }
    if (role?.role !== "admin") { router.replace("/account"); return; }
    // Read optional fields with a schema-only fallback; both queries use the same RLS.
    let profiles = await client.from("profiles").select(`${BASE_PROFILE_COLUMNS},${PERSONAL_PROFILE_COLUMNS}`);
    let legacyProfiles = false;
    if (profiles.error && missingProfileColumns(profiles.error)) {
      profiles = await client.from("profiles").select(BASE_PROFILE_COLUMNS);
      legacyProfiles = !profiles.error;
    }
    const results = await Promise.all([
      client.rpc("admin_member_directory"), Promise.resolve(profiles), client.from("user_roles").select("user_id,role,updated_at"), client.from("meetups").select("*").order("starts_at", { ascending: false }), client.from("meetup_bookings").select("id,meetup_id,user_id,status,booked_at,cancelled_at"), client.from("attendance").select("id,meetup_id,user_id,booking_id,status,is_paid,payment_status,paid_amount_minor,paid_currency,recorded_at"), client.from("loyalty_rewards").select("id,user_id,status,earned_at,expires_at,reward_sequence"), client.from("special_rewards").select("id,user_id,name,reason,description,status,issued_at,expires_at"), client.from("question_progress").select("user_id,question_id"), client.from("question_favorites").select("user_id,question_id").eq("is_favorite", true), client.from("admin_audit_log").select("id,actor_user_id,action,target_table,target_id,created_at").limit(100), client.from("managed_questions").select("id,prompt,translation,category,difficulty,is_published"), client.from("site_content").select("key,value,page_slug,section_slug,label,content_type,draft_value,published_value,sort_order,is_enabled,published_is_enabled,updated_at,published_at").order("sort_order"), client.from("notifications").select("id,kind,title,body,meetup_id,booking_id,target_url,read_at,created_at").eq("user_id", user.id).limit(20), client.from("site_faq_items").select("id,draft_question,draft_answer,published_question,published_answer,sort_order,draft_sort_order,published_sort_order,is_enabled,published_is_enabled,updated_at").order("draft_sort_order"), client.from("site_content_revisions").select("id,page_slug,action,changed_by,created_at").limit(100), client.from("media_assets").select("id,storage_path,public_url,alt_text,mime_type,size_bytes,created_at"),
    ]);
    if (!active) return;
    const sections = ["member directory", "profiles", "roles", "meetups", "bookings", "attendance", "loyalty", "special rewards", "question progress", "favorites", "audit history", "question library", "content", "notifications", "FAQ", "content revisions", "media"];
    const unavailable = results.flatMap((result, index) => result.error ? [sections[index]] : []);
    if (unavailable.length) { setNotice(`Unable to load: ${unavailable.join(", ")}. ${dataLoadExplanation(results.find((result) => result.error)?.error)} No records were changed.`); return; }
    setCompatibility(legacyProfiles ? "Existing member profiles are available. Additional registration fields need the reviewed profile migration; those fields are not shown or changed here." : "");
    setData({ currentUserId: user.id, directory: results[0].data ?? [], profiles: results[1].data ?? [], roles: results[2].data ?? [], meetups: results[3].data ?? [], bookings: results[4].data ?? [], attendance: results[5].data ?? [], loyalty: results[6].data ?? [], special: results[7].data ?? [], progress: results[8].data ?? [], favorites: results[9].data ?? [], audit: results[10].data ?? [], managedQuestions: results[11].data ?? [], content: results[12].data ?? [], notifications: results[13].data ?? [], faq: results[14].data ?? [], revisions: results[15].data ?? [], media: results[16].data ?? [], signedAvatars: {} });
    // Private image loading is optional and must not block member administration.
    void (async () => {
    const avatarResults = await Promise.all((profiles.data ?? []).filter(profile => profile.avatar_path).map(async profile => {
      const signed = await client.storage.from("profile-avatars").createSignedUrl(profile.avatar_path!, 3600);
      return [profile.id, signed.data?.signedUrl] as const;
    }));
    if (!active) return;
    const signedAvatars = Object.fromEntries(avatarResults.filter((entry): entry is readonly [string, string] => Boolean(entry[1])));
    setData(previous => previous?.currentUserId === user.id ? { ...previous, signedAvatars } : previous);
    })().catch(() => { /* Keep the loaded records and provider-avatar fallbacks. */ });
    } catch { if (active) setNotice("The administrator service could not be reached. Check your connection and retry."); }
  })(); return () => { active = false; }; }, [router, revision,viewer.authLoading,viewer.userId]);
  return data && !viewer.authLoading && data.currentUserId === viewer.userId ? <><DashboardNavigation admin />{compatibility && <div className="dashboard-compatibility"><details><summary>Profile field availability</summary><p>{compatibility}</p></details></div>}<AdminDashboard key={revision} initial={data} onRefresh={() => setRevision((value) => value + 1)} /></> : <><DashboardNavigation /><main className="dashboard-experience dashboard-state"><section className="dashboard-state-card" aria-label="Administrator access"><p className="dashboard-kicker">Administrator workspace</p><h1>Club administration</h1><p role="status">{notice}</p><div className="dashboard-state-actions"><button className="button button-primary" type="button" onClick={() => setRevision((value) => value + 1)}>Retry loading dashboard</button><Link href="/">Back to the website</Link>{!viewer.authLoading && viewer.role === "loggedOut" && <Link href="/login/?next=%2Fadmin%2F">Log in again</Link>}</div></section></main></>;
}
