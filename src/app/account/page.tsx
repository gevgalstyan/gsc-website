import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Award, BookOpen, CalendarDays, CheckCircle2, Heart, History, Settings, Sparkles, Star, TicketCheck, Trophy } from "lucide-react";
import { ProfileForm } from "@/components/profile-form";
import { MeetupBookingButton } from "@/components/meetup-booking-button";
import { NotificationBell } from "@/components/notification-bell";
import { categories, difficulties, questions } from "@/lib/questions";
import { createClient } from "@/lib/supabase/server";

export const metadata = { robots: { index: false, follow: false } };

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric" }).format(new Date(value));
}

export default async function AccountPage() {
  const supabase = await createClient();
  if (!supabase) redirect("/?auth=login");
  const { data: claims } = await supabase.auth.getClaims();
  const userId = claims?.claims?.sub;
  if (!userId) redirect("/?auth=login");

  const [profileResult, roleResult, attendanceResult, bookingsResult, rewardsResult, specialResult, progressResult, favoritesResult, notificationsResult] = await Promise.all([
    supabase.from("profiles").select("display_name,avatar_path,avatar_url,telegram_username,english_level,created_at").eq("id", userId).single(),
    supabase.from("user_roles").select("role").eq("user_id", userId).single(),
    supabase.from("attendance").select("id,meetup_id,status,is_paid,paid_amount_minor,paid_currency,recorded_at,meetups(title,starts_at,location_name)").eq("user_id", userId).order("recorded_at", { ascending: false }),
    supabase.from("meetup_bookings").select("id,status,booked_at,meetups(id,title,starts_at,location_name,status)").eq("user_id", userId).order("booked_at", { ascending: false }),
    supabase.from("loyalty_rewards").select("id,status,earned_at,redeemed_at,reward_sequence").eq("user_id", userId).order("earned_at", { ascending: false }),
    supabase.from("special_rewards").select("id,name,reason,description,status,issued_at,expires_at").eq("user_id", userId).order("issued_at", { ascending: false }),
    supabase.from("question_progress").select("question_id,explored_at").eq("user_id", userId),
    supabase.from("question_favorites").select("question_id,created_at").eq("user_id", userId),
    supabase.from("notifications").select("id,title,body,read_at,created_at").eq("user_id", userId).order("created_at", { ascending: false }).limit(12),
  ]);

  const profile = profileResult.data ?? { display_name: null, avatar_path: null, avatar_url: null, telegram_username: null, english_level: null, created_at: new Date().toISOString() };
  let avatarUrl = profile.avatar_url;
  if (profile.avatar_path) {
    const { data } = await supabase.storage.from("profile-avatars").createSignedUrl(profile.avatar_path, 3600);
    avatarUrl = data?.signedUrl ?? avatarUrl;
  }
  const attendance = (attendanceResult.data ?? []).map((row) => ({ ...row, meetup: Array.isArray(row.meetups) ? row.meetups[0] : row.meetups }));
  const bookings = (bookingsResult.data ?? []).map((row) => ({ ...row, meetup: Array.isArray(row.meetups) ? row.meetups[0] : row.meetups }));
  const rewards = rewardsResult.data ?? [];
  const specialRewards = specialResult.data ?? [];
  const exploredIds = new Set((progressResult.data ?? []).map((row) => row.question_id));
  const favoriteCount = favoritesResult.data?.length ?? 0;
  const attended = attendance.filter((row) => row.status === "attended");
  const paidVisits = attended.filter((row) => row.is_paid).length;
  const loyaltyRemainder = paidVisits % 6;
  const visitsUntilReward = loyaltyRemainder === 0 && paidVisits > 0 ? 0 : 6 - loyaltyRemainder;
  const availableRewards = rewards.filter((row) => row.status === "available");
  const availableSpecial = specialRewards.filter((row) => row.status === "available");
  const upcomingBooking = bookings.find((row) => row.status === "confirmed" && row.meetup);
  const completeFields = [profile.display_name, profile.avatar_path || profile.avatar_url, profile.telegram_username].filter(Boolean).length;
  const completion = Math.round(completeFields / 3 * 100);
  const exploredQuestions = questions.filter((question) => exploredIds.has(question.id));
  const achievements = [
    completion === 100 && ["Profile completed", "Your member profile is ready."],
    attended.length >= 1 && ["First meetup", "You joined your first GSC conversation."],
    attended.length >= 3 && ["Three meetups", "Consistency looks good on you."],
    paidVisits >= 6 && ["Six qualifying visits", "You earned your first free meetup."],
    exploredIds.size >= 100 && ["First 100 questions", "One hundred conversations started."],
    exploredIds.size >= 500 && ["500 questions", "A serious conversation explorer."],
    exploredIds.size >= 1000 && ["1,000 questions", "Half the full collection explored."],
    difficulties.every((level) => exploredQuestions.some((question) => question.difficulty === level)) && ["All levels explored", "Beginner through advanced unlocked."],
  ].filter(Boolean) as string[][];

  return <main className="dashboard-shell">
    <header className="dashboard-topbar">
      <Link className="dashboard-brand" href="/">GSC <span>Member space</span></Link>
      <nav aria-label="Member navigation"><Link href="/#questions">Questions</Link><Link href="/meetups">Meetups</Link><Link href="/#community">Community</Link><NotificationBell initialNotifications={notificationsResult.data ?? []} />{roleResult.data?.role === "admin" && <Link href="/admin">Admin</Link>}</nav>
      <form action="/auth/signout" method="post"><button className="dashboard-logout">Logout</button></form>
    </header>

    <div className="dashboard-content">
      <section className="member-welcome">
        <div className="member-identity">{avatarUrl ? <Image src={avatarUrl} alt="Your profile photo" width={88} height={88} unoptimized /> : <span>{profile.display_name?.[0]?.toUpperCase() ?? "G"}</span>}<div><p className="dashboard-kicker">Welcome back</p><h1>{profile.display_name || "GSC member"}</h1><p>English on. Progress in motion.</p></div></div>
        <div className="profile-completion"><span>{completion}%</span><div><strong>Profile completion</strong><div className="mini-progress"><i style={{ width: `${completion}%` }} /></div></div></div>
      </section>

      {(availableRewards.length > 0 || availableSpecial.length > 0) && <section className="reward-banner"><Sparkles /><div><strong>{availableSpecial.length ? "A special reward is waiting for you." : "Your free meetup is ready."}</strong><p>{availableSpecial[0]?.name ?? "You’ve completed six qualifying visits."}</p></div></section>}

      <section className="dashboard-stat-grid" aria-label="Member statistics">
        <article><TicketCheck /><span>{attended.length}</span><p>Meetups attended</p></article>
        <article><Star /><span>{paidVisits}</span><p>Qualifying visits</p></article>
        <article><BookOpen /><span>{exploredIds.size}</span><p>Questions explored</p></article>
        <article><Heart /><span>{favoriteCount}</span><p>Favorites</p></article>
      </section>

      <div className="dashboard-grid">
        <section className="dashboard-card loyalty-dashboard-card"><div className="card-heading"><div><p className="dashboard-kicker">Loyalty journey</p><h2>Your next free meetup</h2></div><Award /></div><div className="loyalty-number"><strong>{loyaltyRemainder || (paidVisits ? 6 : 0)}</strong><span>/ 6</span></div><div className="loyalty-dots">{[1,2,3,4,5,6].map((step) => <i className={step <= loyaltyRemainder || (loyaltyRemainder === 0 && paidVisits > 0) ? "done" : ""} key={step}>{step}</i>)}</div><p>{visitsUntilReward === 0 ? "Free meetup earned — your reward is ready." : `${loyaltyRemainder} of 6 qualifying visits — ${visitsUntilReward} ${visitsUntilReward === 1 ? "visit" : "visits"} until your free meetup.`}</p></section>

        <section className="dashboard-card"><div className="card-heading"><div><p className="dashboard-kicker">Next up</p><h2>Upcoming meetup</h2></div><CalendarDays /></div>{upcomingBooking?.meetup ? <div className="upcoming-meetup"><strong>{upcomingBooking.meetup.title}</strong><p>{formatDate(upcomingBooking.meetup.starts_at)} · {upcomingBooking.meetup.location_name}</p><span>Booking confirmed</span><MeetupBookingButton meetupId={upcomingBooking.meetup.id} initialBooked /></div> : <div className="dashboard-empty"><CalendarDays /><p>No upcoming booking yet.</p><Link href="/meetups">Explore meetups</Link></div>}</section>

        <section className="dashboard-card question-stats-card"><div className="card-heading"><div><p className="dashboard-kicker">Question library</p><h2>{exploredIds.size} explored · {questions.length - exploredIds.size} remaining</h2></div><BookOpen /></div><div className="question-breakdown"><div><strong>By level</strong>{difficulties.map((level) => { const total = questions.filter((q) => q.difficulty === level).length; const count = exploredQuestions.filter((q) => q.difficulty === level).length; return <p key={level}><span>{level}</span><b>{count}/{total}</b></p>; })}</div><div><strong>Top categories</strong>{categories.slice(0, 5).map((category) => <p key={category}><span>{category}</span><b>{exploredQuestions.filter((q) => q.category === category).length}</b></p>)}</div></div><Link className="card-link" href="/#questions">Continue exploring</Link></section>

        <section className="dashboard-card"><div className="card-heading"><div><p className="dashboard-kicker">Milestones</p><h2>Achievements</h2></div><Trophy /></div>{achievements.length ? <div className="achievement-list">{achievements.map(([title, copy]) => <div key={title}><CheckCircle2 /><span><strong>{title}</strong><small>{copy}</small></span></div>)}</div> : <div className="dashboard-empty"><Trophy /><p>Your first achievement is just ahead.</p></div>}</section>

        <section className="dashboard-card dashboard-card-wide"><div className="card-heading"><div><p className="dashboard-kicker">Your history</p><h2>Attendance & bookings</h2></div><History /></div>{attendance.length || bookings.length ? <div className="history-list">{attendance.slice(0, 6).map((row) => <div key={row.id}><span className={`history-mark ${row.status}`} /><div><strong>{row.meetup?.title ?? "Speaking club meetup"}</strong><p>{formatDate(row.recorded_at)} · {row.status.replace("_", " ")}</p></div><b>{row.is_paid ? `${((row.paid_amount_minor ?? 0) / 100).toLocaleString()} ${row.paid_currency ?? "RUB"}` : "Not qualifying"}</b></div>)}</div> : <div className="dashboard-empty"><History /><p>Your attendance and booking history will appear here.</p></div>}</section>

        <section className="dashboard-card dashboard-card-wide"><div className="card-heading"><div><p className="dashboard-kicker">Your bookings</p><h2>Upcoming and past reservations</h2></div><TicketCheck /></div>{bookings.length ? <div className="history-list">{bookings.slice(0, 8).map((row) => <div key={row.id}><span className={`history-mark ${row.status}`} /><div><strong>{row.meetup?.title ?? "Speaking club meetup"}</strong><p>{row.meetup?.starts_at ? formatDate(row.meetup.starts_at) : "Meetup details unavailable"} · {row.status}</p></div>{row.status === "confirmed" && row.meetup?.id && <MeetupBookingButton meetupId={row.meetup.id} initialBooked />}</div>)}</div> : <div className="dashboard-empty"><TicketCheck /><p>You have no bookings yet.</p><Link href="/meetups">Find a meetup</Link></div>}</section>

        <section className="dashboard-card dashboard-card-wide"><details className="settings-panel"><summary><span><Settings />Account settings</span><small>Photo, display name and Telegram</small></summary><ProfileForm userId={userId} initialProfile={profile} initialAvatarUrl={avatarUrl} /></details></section>
      </div>
    </div>
  </main>;
}
