"use client";
import { FormEvent, useState } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

type Profile = { display_name: string | null; avatar_url: string | null; telegram_username: string | null };
export function ProfileForm({ userId, initialProfile }: { userId: string; initialProfile: Profile }) {
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setLoading(true); setStatus("");
    const data = new FormData(event.currentTarget);
    const clean = (key: string) => String(data.get(key) ?? "").trim() || null;
    const telegram = clean("telegram_username")?.replace(/^@/, "") ?? null;
    const { error } = await getSupabaseBrowserClient()!.from("profiles").update({ display_name: clean("display_name"), avatar_url: clean("avatar_url"), telegram_username: telegram }).eq("id", userId);
    setLoading(false); setStatus(error ? error.message : "Profile saved.");
  }
  return <form className="account-form" onSubmit={submit} aria-busy={loading}><label>Display name<input name="display_name" defaultValue={initialProfile.display_name ?? ""} maxLength={80} autoComplete="name" /></label><label>Avatar URL<input name="avatar_url" defaultValue={initialProfile.avatar_url ?? ""} type="url" maxLength={2048} placeholder="https://…" /></label><label>Telegram username<input name="telegram_username" defaultValue={initialProfile.telegram_username ?? ""} pattern="@?[A-Za-z0-9_]{5,32}" placeholder="@username" /></label><button className="button button-primary" disabled={loading}>{loading ? "Saving…" : "Save profile"}</button>{status && <p className="form-status" role="status">{status}</p>}</form>;
}
