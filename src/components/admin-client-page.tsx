"use client";
/* eslint-disable react-hooks/set-state-in-effect */

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AdminDashboard, type AdminData } from "@/components/admin-dashboard";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

/** Browser-only admin entry. RLS/RPC policies, not this gate, authorize data. */
export function AdminClientPage() {
  const router = useRouter(); const [revision, setRevision] = useState(0); const [data, setData] = useState<AdminData | null>(null); const [notice, setNotice] = useState("Checking member access…");
  useEffect(() => { let active = true; setData(null); setNotice("Checking member access…"); const client = getSupabaseBrowserClient(); if (!client) { setNotice("Member access is not configured."); return; } void (async () => {
    try {
    const { data: userData, error: userError } = await client.auth.getUser(); const user = userData.user;
    if (userError) { if (active) setNotice("Your session could not be checked. Log in again or retry."); return; }
    if (!user?.email_confirmed_at) { router.replace("/?auth=login"); return; }
    const { data: role, error: roleError } = await client.from("user_roles").select("role").eq("user_id", user.id).maybeSingle();
    if (roleError) { if (active) setNotice("Your administrator role could not be checked. Retry or contact the club."); return; }
    if (role?.role !== "admin") { router.replace("/account"); return; }
    const results = await Promise.all([
      client.rpc("admin_member_directory"), client.from("profiles").select("id,display_name,avatar_path,avatar_url,telegram_username,english_level,created_at,first_name,surname,age,nationality,gender"), client.from("user_roles").select("user_id,role,updated_at"), client.from("meetups").select("*").order("starts_at", { ascending: false }), client.from("meetup_bookings").select("id,meetup_id,user_id,status,booked_at,cancelled_at"), client.from("attendance").select("id,meetup_id,user_id,booking_id,status,is_paid,payment_status,paid_amount_minor,paid_currency,recorded_at"), client.from("loyalty_rewards").select("id,user_id,status,earned_at,reward_sequence"), client.from("special_rewards").select("id,user_id,name,reason,description,status,issued_at,expires_at"), client.from("question_progress").select("user_id,question_id"), client.from("question_favorites").select("user_id,question_id").eq("is_favorite", true), client.from("admin_audit_log").select("id,actor_user_id,action,target_table,target_id,created_at").limit(100), client.from("managed_questions").select("id,prompt,translation,category,difficulty,is_published"), client.from("site_content").select("key,value,page_slug,section_slug,label,content_type,draft_value,published_value,sort_order,is_enabled,published_is_enabled,updated_at,published_at").order("sort_order"), client.from("notifications").select("id,kind,title,body,meetup_id,booking_id,target_url,read_at,created_at").eq("user_id", user.id).limit(20), client.from("site_faq_items").select("id,draft_question,draft_answer,published_question,published_answer,sort_order,draft_sort_order,published_sort_order,is_enabled,published_is_enabled,updated_at").order("draft_sort_order"), client.from("site_content_revisions").select("id,page_slug,action,changed_by,created_at").limit(100), client.from("media_assets").select("id,storage_path,public_url,alt_text,mime_type,size_bytes,created_at"),
    ]);
    if (!active) return;
    const sections = ["member directory", "profiles", "roles", "meetups", "bookings", "attendance", "loyalty", "special rewards", "question progress", "favorites", "audit history", "question library", "content", "notifications", "FAQ", "content revisions", "media"];
    const unavailable = results.flatMap((result, index) => result.error ? [sections[index]] : []);
    if (unavailable.length) { setNotice(`Unable to load: ${unavailable.join(", ")}. Check database migrations and administrator permissions, then retry. No records were changed.`); return; }
    setData({ currentUserId: user.id, directory: results[0].data ?? [], profiles: results[1].data ?? [], roles: results[2].data ?? [], meetups: results[3].data ?? [], bookings: results[4].data ?? [], attendance: results[5].data ?? [], loyalty: results[6].data ?? [], special: results[7].data ?? [], progress: results[8].data ?? [], favorites: results[9].data ?? [], audit: results[10].data ?? [], managedQuestions: results[11].data ?? [], content: results[12].data ?? [], notifications: results[13].data ?? [], faq: results[14].data ?? [], revisions: results[15].data ?? [], media: results[16].data ?? [], signedAvatars: {} });
    } catch { if (active) setNotice("The administrator service could not be reached. Check your connection and retry."); }
  })(); return () => { active = false; }; }, [router, revision]);
  return data ? <AdminDashboard key={revision} initial={data} onRefresh={() => setRevision((value) => value + 1)} /> : <main className="dashboard-shell"><p className="form-status" role="status">{notice}</p><button type="button" onClick={() => setRevision((value) => value + 1)}>Retry loading dashboard</button></main>;
}
