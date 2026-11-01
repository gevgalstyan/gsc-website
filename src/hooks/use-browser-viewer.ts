"use client";

import { createContext, createElement, useContext, useEffect, useState, type ReactNode } from "react";
import type { Session } from "@supabase/supabase-js";
import type { Viewer } from "@/lib/viewer";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

const guest: Viewer = { role: "loggedOut", userId: null, name: "GSC member", avatarUrl: null, notifications: [], authLoading: false };
const ViewerContext = createContext<Viewer>({ ...guest, authLoading: true });

/** One subscription for every route and CTA. Session identity never waits on optional data. */
export function BrowserViewerProvider({ children }: { children: ReactNode }) {
  const [viewer, setViewer] = useState<Viewer>({ ...guest, authLoading: true });
  useEffect(() => {
    const client = getSupabaseBrowserClient();
    if (!client) { const timer = setTimeout(() => setViewer(guest), 0); return () => clearTimeout(timer); }
    let active = true;
    let revision = 0;
    const timers = new Set<ReturnType<typeof setTimeout>>();
    function resolve(session: Session | null) {
      const current = ++revision;
      if (!active) return;
      if (!session?.user.email_confirmed_at) { setViewer(guest); return; }
      const user = session.user;
      const name = user.user_metadata?.full_name ?? user.user_metadata?.name;
      setViewer(previous => ({ ...guest, ...(previous.userId === user.id ? previous : {}), role: previous.userId === user.id ? previous.role : "member", userId: user.id, name: previous.userId === user.id ? previous.name : typeof name === "string" ? name : "GSC member", authLoading: false }));
      // Auth callbacks must return before another SDK call acquires the session lock.
      const timer = setTimeout(() => {
        timers.delete(timer);
        void enrich(user.id, current);
      }, 0);
      timers.add(timer);
    }
    async function enrich(userId: string, current: number) {
      try {
        const [profile, role, notifications] = await Promise.all([
          client!.from("profiles").select("display_name,avatar_path,avatar_url").eq("id", userId).maybeSingle(),
          client!.from("user_roles").select("role").eq("user_id", userId).maybeSingle(),
          client!.from("notifications").select("id,kind,title,body,meetup_id,booking_id,target_url,read_at,created_at").eq("user_id", userId).order("created_at", { ascending: false }).limit(20),
        ]);
        if (!active || current !== revision) return;
        setViewer(previous => ({ ...previous, role: role.error ? previous.role : role.data?.role === "admin" ? "admin" : "member", name: profile.data?.display_name || previous.name, avatarUrl: profile.data?.avatar_url ?? previous.avatarUrl, notifications: notifications.data?.map(item => ({ ...item, read_at: item.read_at ?? previous.notifications.find(previousItem => previousItem.id === item.id)?.read_at ?? null })) ?? previous.notifications }));
        if (profile.data?.avatar_path) {
          const signed = await client!.storage.from("profile-avatars").createSignedUrl(profile.data.avatar_path, 3600);
          if (active && current === revision && signed.data) setViewer(previous => ({ ...previous, avatarUrl: signed.data.signedUrl }));
        }
      } catch { /* Optional display data cannot turn a member into a guest. RLS still authorizes every operation. */ }
    }
    function onNotificationsRead(event: Event) {
      const detail = (event as CustomEvent<{ ids?: unknown; readAt?: unknown }>).detail;
      if (!detail || !Array.isArray(detail.ids) || typeof detail.readAt !== "string") return;
      const ids = new Set(detail.ids.filter((id): id is string => typeof id === "string"));
      const readAt = detail.readAt;
      setViewer(previous => ({ ...previous, notifications: previous.notifications.map(item => ids.has(item.id) ? { ...item, read_at: readAt } : item) }));
    }
    window.addEventListener("gsc-notifications-read", onNotificationsRead);
    const { data } = client.auth.onAuthStateChange((_event, session) => resolve(session));
    const initialRevision = revision;
    void client.auth.getSession().then(({ data, error }) => {
      if (active && revision === initialRevision) resolve(error ? null : data.session);
    }).catch(() => { if (active && revision === initialRevision) setViewer(guest); });
    return () => { active = false; revision++; timers.forEach(clearTimeout); window.removeEventListener("gsc-notifications-read", onNotificationsRead); data.subscription.unsubscribe(); };
  }, []);
  return createElement(ViewerContext.Provider, { value: viewer }, children);
}

// Keep the existing call signature for components that also accept static fallback props.
export function useBrowserViewer(_fallback?: Viewer, _enabled = true) {
  void _fallback; void _enabled;
  return useContext(ViewerContext);
}

/** Share successful read updates across public headers without another database write. */
export function notifyViewerNotificationsRead(ids: string[], readAt: string) {
  window.dispatchEvent(new CustomEvent("gsc-notifications-read", { detail: { ids, readAt } }));
}
