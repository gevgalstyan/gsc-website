"use client";
/* eslint-disable react-hooks/set-state-in-effect */

import { useEffect, useState } from "react";
import { ProfileForm } from "@/components/profile-form";
import { isProfileOnboardingComplete } from "@/lib/profile-onboarding";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

type Profile = { display_name: string | null; avatar_path: string | null; avatar_url: string | null; telegram_username: string | null; english_level: string | null; onboarding_completed: boolean | null };

export default function OnboardingPage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [message, setMessage] = useState("Preparing your welcome…");
  useEffect(() => { const client = getSupabaseBrowserClient(); if (!client) { setMessage("Member access is not configured."); return; } void (async () => {
    const { data: userData } = await client.auth.getUser(); const user = userData.user;
    if (!user) { window.location.replace("/?auth=login&next=/onboarding/"); return; }
    const { data, error } = await client.from("profiles").select("display_name,avatar_path,avatar_url,telegram_username,english_level,onboarding_completed").eq("id", user.id).maybeSingle();
    if (error) { setMessage("We couldn’t load your profile. Please refresh and try again."); return; }
    if (isProfileOnboardingComplete(data)) { window.location.replace("/"); return; }
    const current = data ?? { display_name: null, avatar_path: null, avatar_url: null, telegram_username: null, english_level: null, onboarding_completed: false };
    if (current.avatar_path) { const { data: signed } = await client.storage.from("profile-avatars").createSignedUrl(current.avatar_path, 3600); setAvatarUrl(signed?.signedUrl ?? current.avatar_url); } else setAvatarUrl(current.avatar_url);
    setUserId(user.id); setProfile(current);
  })(); }, []);
  if (!profile || !userId) return <main className="auth-page"><section className="account-card"><p role="status">{message}</p></section></main>;
  return <main className="onboarding-page"><section className="onboarding-card"><span className="eyebrow">GSC member space</span><h1>Welcome to Galstyan’s Speaking Club</h1><p>Set up your profile so the community knows who they’re speaking with.</p><ProfileForm userId={userId} initialProfile={profile} initialAvatarUrl={avatarUrl} onboarding /></section></main>;
}
