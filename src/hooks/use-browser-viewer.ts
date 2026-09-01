"use client";

import { useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import type { Viewer, ViewerRole } from "@/lib/viewer";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

const debugAuth = process.env.NODE_ENV === "development";
const loggedOutViewer: Viewer = { role: "loggedOut", userId: null, name: "GSC member", avatarUrl: null, notifications: [] };
function log(event: string, details: Record<string, unknown>) { if (debugAuth) console.debug("[gsc:browser-auth]", event, details); }

export function useBrowserViewer(fallback: Viewer = loggedOutViewer, enabled = true) {
  const [viewer, setViewer] = useState<Viewer>(fallback);
  useEffect(() => {
    if (!enabled) return;
    const client = getSupabaseBrowserClient();
    if (!client) return;
    const supabase = client;
    let active = true;
    let revision = 0;
    async function resolve(session: Session | null, source: string) {
      const current = ++revision;
      log(source, { origin: window.location.origin, sessionPresent: Boolean(session), userIdPresent: Boolean(session?.user.id) });
      if (!session) { if (active) setViewer(loggedOutViewer); return; }
      const [profile, role, notifications] = await Promise.all([
        supabase.from("profiles").select("display_name,avatar_path,avatar_url").eq("id", session.user.id).maybeSingle(),
        supabase.from("user_roles").select("role").eq("user_id", session.user.id).maybeSingle(),
        supabase.from("notifications").select("id,kind,title,body,meetup_id,booking_id,target_url,read_at,created_at").eq("user_id", session.user.id).order("created_at", { ascending: false }).limit(20),
      ]);
      let avatarUrl = profile.data?.avatar_url ?? null;
      if (profile.data?.avatar_path) {
        const signed = await supabase.storage.from("profile-avatars").createSignedUrl(profile.data.avatar_path, 3600);
        avatarUrl = signed.data?.signedUrl ?? avatarUrl;
      }
      if (!active || current !== revision) return;
      const metadataName = session.user.user_metadata?.full_name ?? session.user.user_metadata?.name;
      const resolvedRole: ViewerRole = role.data?.role === "admin" ? "admin" : "member";
      setViewer({ role: resolvedRole, userId: session.user.id, name: profile.data?.display_name || (typeof metadataName === "string" ? metadataName : null) || "GSC member", avatarUrl, notifications: notifications.data ?? [] });
      log("profile-resolved", { profileLookupSuccess: !profile.error, roleLookupSuccess: !role.error });
    }
    const { data: subscription } = supabase.auth.onAuthStateChange((event, session) => { void resolve(session, `event:${event}`); });
    void supabase.auth.getSession().then(({ data }) => resolve(data.session, "getSession"));
    return () => { active = false; subscription.subscription.unsubscribe(); };
  }, [enabled]);
  return viewer;
}
