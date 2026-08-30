"use client";
/* eslint-disable react-hooks/set-state-in-effect */

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ProfileForm } from "@/components/profile-form";
import { MeetupBookingButton } from "@/components/meetup-booking-button";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

type AccountData = { id: string; profile: { display_name: string | null; avatar_path: string | null; avatar_url: string | null; telegram_username: string | null; english_level: string | null; created_at: string }; attendance: { id: string; status: string; recorded_at: string }[]; bookings: { id: string; status: string; meetup: { id: string; title: string; starts_at: string; location_name: string } | null }[]; progress: { question_id: string }[]; favorites: { question_id: string }[]; rewards: { id: string; status: string }[] };

export default function AccountPage() {
  const router = useRouter(); const [data, setData] = useState<AccountData | null>(null); const [message, setMessage] = useState("Loading your member dashboard…");
  useEffect(() => { const client = getSupabaseBrowserClient(); if (!client) { setMessage("Member access is not configured."); return; } void (async () => {
    const { data: userData } = await client.auth.getUser(); const user = userData.user; if (!user) { router.replace("/?auth=login"); return; }
    const [profile, attendance, bookings, progress, favorites, rewards] = await Promise.all([
      client.from("profiles").select("display_name,avatar_path,avatar_url,telegram_username,english_level,created_at").eq("id", user.id).maybeSingle(), client.from("attendance").select("id,status,recorded_at").eq("user_id", user.id).order("recorded_at", { ascending: false }), client.from("meetup_bookings").select("id,status,meetups(id,title,starts_at,location_name)").eq("user_id", user.id).order("booked_at", { ascending: false }), client.from("question_progress").select("question_id").eq("user_id", user.id), client.from("question_favorites").select("question_id").eq("user_id", user.id).eq("is_favorite", true), client.from("loyalty_rewards").select("id,status").eq("user_id", user.id),
    ]);
    if ([profile, attendance, bookings, progress, favorites, rewards].some((result) => result.error)) { setMessage("Some member details could not be loaded. Please refresh."); return; }
    setData({ id: user.id, profile: profile.data ?? { display_name: null, avatar_path: null, avatar_url: null, telegram_username: null, english_level: null, created_at: new Date().toISOString() }, attendance: attendance.data ?? [], bookings: ((bookings.data ?? []) as { id: string; status: string; meetups: { id: string; title: string; starts_at: string; location_name: string } | { id: string; title: string; starts_at: string; location_name: string }[] | null }[]).map((row) => ({ ...row, meetup: Array.isArray(row.meetups) ? row.meetups[0] ?? null : row.meetups })), progress: progress.data ?? [], favorites: favorites.data ?? [], rewards: rewards.data ?? [] });
  })(); }, [router]);
  if (!data) return <main className="dashboard-shell"><p className="form-status" role="status">{message}</p></main>;
  const name = data.profile.display_name || "GSC member"; const booked = data.bookings.filter((row) => row.status === "confirmed");
  return <main className="dashboard-shell"><div className="dashboard-content"><section className="member-welcome"><div><p className="dashboard-kicker">Welcome back</p><h1>{name}</h1><p>English on. Progress in motion.</p></div></section><section className="dashboard-stat-grid"><article><span>{data.attendance.length}</span><p>Meetups attended</p></article><article><span>{data.progress.length}</span><p>Questions explored</p></article><article><span>{data.favorites.length}</span><p>Favorites</p></article><article><span>{data.rewards.filter((row) => row.status === "available").length}</span><p>Available rewards</p></article></section><section id="bookings" className="dashboard-card"><h2>Your bookings</h2>{booked.length ? booked.map((row) => <div className="history-list" key={row.id}><div><strong>{row.meetup?.title ?? "Speaking club meetup"}</strong><p>{row.meetup?.starts_at ? new Date(row.meetup.starts_at).toLocaleString() : "Meetup details unavailable"} · {row.meetup?.location_name ?? ""}</p></div>{row.meetup && <MeetupBookingButton meetupId={row.meetup.id} initialBooked />}</div>) : <p><Link href="/meetups">Explore published meetups</Link></p>}</section><section id="settings" className="dashboard-card"><h2>Account settings</h2><ProfileForm userId={data.id} initialProfile={data.profile} initialAvatarUrl={data.profile.avatar_url} /></section></div></main>;
}
