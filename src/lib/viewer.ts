/**
 * Resolves the current public-site viewer from the verified Supabase session.
 * This is the reusable server-side source for logged-out, member, and admin UI.
 */


export type ViewerRole = "loggedOut" | "member" | "admin";

export type ViewerNotification = {
  id: string;
  kind: string;
  title: string;
  body: string;
  meetup_id: string | null;
  booking_id: string | null;
  target_url: string | null;
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
// Static HTML always has a useful logged-out shell. Auth-aware UI resolves in
// browser-only dashboard/booking components, never from request cookies.
export async function getViewer(): Promise<Viewer> { return loggedOutViewer; }
