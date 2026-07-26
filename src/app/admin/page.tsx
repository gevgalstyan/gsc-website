import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function AdminPage() {
  const supabase = await createClient();
  const { data: claims } = await supabase.auth.getClaims();
  const userId = claims?.claims?.sub;
  if (!userId) redirect("/?auth=login");
  const { data } = await supabase.from("user_roles").select("role").eq("user_id", userId).single();
  if (data?.role !== "admin") redirect("/account");
  return <main className="auth-page"><section className="account-card"><span className="eyebrow">Administrator</span><h1>Admin dashboard coming next</h1><p className="muted">Your administrator role was verified from the protected user_roles table.</p><Link className="button button-primary" href="/account">Back to account</Link></section></main>;
}
