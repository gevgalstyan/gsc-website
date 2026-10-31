"use client";
/* eslint-disable react-hooks/set-state-in-effect */

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { DashboardNavigation } from "@/components/dashboard-navigation";
import { MemberLoyaltyCard } from "@/components/member-loyalty-card";
import { useDashboardLanguage } from "@/hooks/use-dashboard-language";
import { ProfileForm } from "@/components/profile-form";
import { MeetupBookingButton } from "@/components/meetup-booking-button";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { isProfileOnboardingComplete } from "@/lib/profile-onboarding";

type AccountData = { id: string; profile: { display_name: string | null; avatar_path: string | null; avatar_url: string | null; telegram_username: string | null; english_level: string | null; onboarding_completed: boolean | null; created_at: string }; avatarUrl: string | null; attendance: { id: string; status: string; payment_status: string; recorded_at: string }[]; bookings: { id: string; status: string; meetup: { id: string; title: string; starts_at: string; location_name: string } | null }[]; progress: { question_id: string }[]; favorites: { question_id: string }[]; rewards: { id: string; status: string }[] };

export default function AccountPage() {
  const {language}=useDashboardLanguage(); const ru=language==="ru";
  const [revision,setRevision]=useState(0);
  const router = useRouter(); const [data, setData] = useState<AccountData | null>(null); const [message, setMessage] = useState("Loading your member dashboard…");
  useEffect(() => { let active=true; const client = getSupabaseBrowserClient(); if (!client) { setMessage("Member access is not configured."); return; } void (async () => {
    try {
    const { data: userData } = await client.auth.getUser(); const user = userData.user; if (!user?.email_confirmed_at) { router.replace("/?auth=login"); return; }
    const [profile, attendance, bookings, progress, favorites, rewards] = await Promise.all([
      client.from("profiles").select("display_name,avatar_path,avatar_url,telegram_username,english_level,onboarding_completed,created_at").eq("id", user.id).maybeSingle(), client.from("attendance").select("id,status,payment_status,recorded_at").eq("user_id", user.id).order("recorded_at", { ascending: false }), client.from("meetup_bookings").select("id,status,meetups(id,title,starts_at,location_name)").eq("user_id", user.id).order("booked_at", { ascending: false }), client.from("question_progress").select("question_id").eq("user_id", user.id), client.from("question_favorites").select("question_id").eq("user_id", user.id).eq("is_favorite", true), client.from("loyalty_rewards").select("id,status").eq("user_id", user.id),
    ]);
    if(!active)return;
    if ([profile, attendance, bookings, progress, favorites, rewards].some((result) => result.error)) { setMessage("Some member details could not be loaded. Please refresh."); return; }
    if (!profile.data) { setMessage("Your member profile was not found. Contact the club so it can be checked without replacing your account."); return; }
    const memberProfile = profile.data;
    if (!isProfileOnboardingComplete(memberProfile)) { window.location.replace("/onboarding/"); return; }
    const signedAvatar = memberProfile.avatar_path ? await client.storage.from("profile-avatars").createSignedUrl(memberProfile.avatar_path, 3600) : null;
    setData({ id: user.id, profile: memberProfile, avatarUrl: signedAvatar?.data?.signedUrl ?? memberProfile.avatar_url, attendance: attendance.data ?? [], bookings: ((bookings.data ?? []) as { id: string; status: string; meetups: { id: string; title: string; starts_at: string; location_name: string } | { id: string; title: string; starts_at: string; location_name: string }[] | null }[]).map((row) => ({ ...row, meetup: Array.isArray(row.meetups) ? row.meetups[0] ?? null : row.meetups })), progress: progress.data ?? [], favorites: favorites.data ?? [], rewards: rewards.data ?? [] });
    } catch {if(active)setMessage("We couldn’t reach your member dashboard. Please check your connection and retry.");}
  })(); return()=>{active=false;}; }, [router,revision]);
  if (!data) return <><DashboardNavigation/><main className="dashboard-experience dashboard-state"><section className="dashboard-state-card"><h1>{ru?"Личный кабинет":"Your member space"}</h1><p role="status">{message}</p><button className="button button-primary" type="button" onClick={()=>setRevision(value=>value+1)}>Retry member dashboard</button></section></main></>;
  const name = data.profile.display_name || "GSC member"; const booked = data.bookings.filter((row) => row.status === "confirmed");
  const attendedVisits=data.attendance.filter(row=>row.status==="attended").length;
  const availableRewards = data.rewards.filter((row) => row.status === "available");
  return <><DashboardNavigation/><main className="dashboard-shell dashboard-experience" lang={language}><div className="dashboard-content"><section id="overview" className="member-welcome"><div><p className="dashboard-kicker">{ru?"С возвращением":"Welcome back"}</p><h1>{name}</h1><p>English on. Progress in motion.</p></div></section><section className="dashboard-stat-grid"><article><span>{attendedVisits}</span><p>Meetups attended</p></article><article><span>{data.progress.length}</span><p>Questions explored</p></article><article><span>{data.favorites.length}</span><p>Favorites</p></article><article><span>{availableRewards.length}</span><p>Available rewards</p></article></section><section id="bookings" className="dashboard-card"><h2>{ru?"Твои бронирования":"Your bookings"}</h2>{booked.length ? booked.map((row) => <div className="history-list" key={row.id}><div><strong>{row.meetup?.title ?? "Speaking club meetup"}</strong><p>{row.meetup?.starts_at ? new Date(row.meetup.starts_at).toLocaleString() : "Meetup details unavailable"} · {row.meetup?.location_name ?? ""}</p></div>{row.meetup && <MeetupBookingButton meetupId={row.meetup.id} initialBooked />}</div>) : <p>You haven’t booked a meetup yet. <Link href="/meetups">Explore meetups</Link></p>}</section><section id="attendance" className="dashboard-card"><h2>{ru?"Посещения":"Attendance"}</h2>{data.attendance.length ? <p>You have attended {attendedVisits} meetup{attendedVisits === 1 ? "" : "s"}. Your meetup history is building here.</p> : <p>Your meetup history will appear here after your first session.</p>}</section><section id="questions" className="dashboard-card"><h2>{ru?"Практика вопросов":"Question progress"}</h2><p>{data.progress.length ? `You have explored ${data.progress.length} question${data.progress.length === 1 ? "" : "s"}.` : "Start exploring questions whenever you want to warm up your English."} {data.favorites.length ? ` ${data.favorites.length} saved for later.` : " Save questions you want to revisit."} <Link href="/questions">Open questions</Link></p></section><MemberLoyaltyCard attendance={data.attendance} rewards={data.rewards}/><section id="settings" className="dashboard-card"><h2>{ru?"Настройки аккаунта":"Account settings"}</h2><ProfileForm userId={data.id} initialProfile={data.profile} initialAvatarUrl={data.avatarUrl} /></section></div></main></>;
}
