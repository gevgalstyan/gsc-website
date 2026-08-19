import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { isAllowlistedAdminEmail } from "@/lib/admin";
import { createClient } from "@/lib/supabase/server";

const paths: Record<string, string> = {
  home: "/",
  about: "/about",
  meetups: "/meetups",
  questions: "/questions",
  "how-it-works": "/how-it-works",
  community: "/community",
  faq: "/faq",
  contact: "/contact",
  membership: "/membership",
  settings: "/",
};

export async function POST(request: Request) {
  const supabase = await createClient();
  if (!supabase) return NextResponse.json({ error: "Unavailable" }, { status: 503 });
  const { data: claims } = await supabase.auth.getClaims();
  const userId = claims?.claims?.sub;
  const email = typeof claims?.claims?.email === "string" ? claims.claims.email : null;
  if (!userId || !isAllowlistedAdminEmail(email)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { data: role } = await supabase.from("user_roles").select("role").eq("user_id", userId).single();
  if (role?.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const payload = await request.json().catch(() => null) as { page?: string } | null;
  const page = payload?.page;
  if (!page || !paths[page]) return NextResponse.json({ error: "Unknown page" }, { status: 400 });
  revalidatePath(paths[page]);
  revalidatePath("/api/public-content");
  if (page === "settings") {
    Object.values(paths).forEach((path) => revalidatePath(path));
  }
  return NextResponse.json({ revalidated: true });
}
