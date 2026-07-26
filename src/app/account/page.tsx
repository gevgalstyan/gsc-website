import Link from "next/link";
import Image from "next/image";
import { redirect } from "next/navigation";
import { ProfileForm } from "@/components/profile-form";
import { createClient } from "@/lib/supabase/server";

export default async function AccountPage() {
  const supabase = await createClient();
  const { data: claims } = await supabase.auth.getClaims();
  const userId = claims?.claims?.sub;
  if (!userId) redirect("/?auth=login");
  const [{ data: profile }, { data: role }] = await Promise.all([
    supabase.from("profiles").select("display_name,avatar_url,telegram_username").eq("id", userId).single(),
    supabase.from("user_roles").select("role").eq("user_id", userId).single(),
  ]);
  return <main className="auth-page"><section className="account-card account-card-wide"><div className="account-heading"><div><span className="eyebrow">GSC member space</span><h1>Your account</h1></div>{profile?.avatar_url ? <Image className="profile-avatar" src={profile.avatar_url} alt="Member avatar" width={88} height={88} unoptimized /> : <div className="profile-avatar profile-placeholder" aria-label="No avatar">{profile?.display_name?.[0]?.toUpperCase() ?? "G"}</div>}</div><p className="role-badge">Role: {role?.role ?? "member"}</p><ProfileForm userId={userId} initialProfile={profile ?? { display_name: null, avatar_url: null, telegram_username: null }} /><div className="account-actions">{role?.role === "admin" && <Link className="button button-outline-dark" href="/admin">Admin dashboard</Link>}<form action="/auth/signout" method="post"><button className="button button-primary" type="submit">Logout</button></form></div><Link className="text-link" href="/">Back to the club</Link></section></main>;
}
