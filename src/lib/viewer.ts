/**
 * Resolves the current public-site viewer from the verified Supabase session.
 * This is the reusable server-side source for logged-out, member, and admin UI.
 */

import { cache } from "react";
import { createClient } from "@/lib/supabase/server";

export type ViewerRole = "loggedOut" | "member" | "admin";

export type ViewerNotification = {
  id: string;
  title: string;
  body: string;
  read_at: string | null;
  created_at: string;
};

export type Viewer = {
  role: ViewerRole;
  userId: string | null;
  name: string;
  avatarUrl: string | null;
  notifications: ViewerNotification[];
};

const loggedOutViewer: Viewer = {
  role: "loggedOut",
  userId: null,
  name: "GSC member",
  avatarUrl: null,
  notifications: [],
};

// ======================================================
// SESSION MANAGEMENT — AUTH-AWARE VIEWER
// ======================================================
export const getViewer = cache(async (): Promise<Viewer> => {
  const supabase = await createClient();
  if (!supabase) return loggedOutViewer;

  try {
    const { data: claimsResult } = await supabase.auth.getClaims();
    const claims = claimsResult?.claims;
    const userId = typeof claims?.sub === "string" ? claims.sub : null;
    if (!userId) return loggedOutViewer;

    const [profileResult, roleResult, notificationsResult] = await Promise.all([
      supabase.from("profiles").select("display_name,avatar_path,avatar_url").eq("id", userId).maybeSingle(),
      supabase.from("user_roles").select("role").eq("user_id", userId).maybeSingle(),
      supabase.from("notifications").select("id,title,body,read_at,created_at").eq("user_id", userId).order("created_at", { ascending: false }).limit(12),
    ]);

    const metadata = claims?.user_metadata && typeof claims.user_metadata === "object"
      ? claims.user_metadata as Record<string, unknown>
      : {};
    const profile = profileResult.data;
    const metadataName = typeof metadata.full_name === "string" ? metadata.full_name : typeof metadata.name === "string" ? metadata.name : "";
    const name = profile?.display_name?.trim() || metadataName.trim() || "GSC member";
    let avatarUrl = profile?.avatar_url || (typeof metadata.avatar_url === "string" ? metadata.avatar_url : null);

    if (profile?.avatar_path) {
      const { data } = await supabase.storage.from("profile-avatars").createSignedUrl(profile.avatar_path, 3600);
      avatarUrl = data?.signedUrl ?? avatarUrl;
    }

    // Authorization comes from user_roles; metadata is only a cosmetic fallback.
    return {
      role: roleResult.data?.role === "admin" ? "admin" : "member",
      userId,
      name,
      avatarUrl,
      notifications: notificationsResult.data ?? [],
    };
  } catch {
    return loggedOutViewer;
  }
});
