"use client";

/**
 * Main administrator workspace for meetups, members, attendance, rewards, questions, and content.
 * The UI sends normal Supabase mutations; RLS, triggers, and RPCs enforce authoritative rules.
 * Risk: HIGH. Keep form serialization aligned with database constraints and Moscow time helpers.
 */

import Image from "next/image";
import Link from "next/link";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Activity, Award, BookOpen, CalendarDays, Check, ChevronRight, ClipboardCheck, Copy, ImageIcon, LayoutDashboard, Pencil, Plus, Search, Settings, ShieldCheck, Sparkles, Star, TicketCheck, Trash2, Users } from "lucide-react";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { instantToMeetupWallTime, MEETUP_TIME_ZONE, meetupWallTimeToIso } from "@/lib/meetup-time";
import { NotificationBell } from "@/components/notification-bell";
import { ThemeToggle } from "@/components/theme-toggle";
import { ContentEditor, type ContentRevision, type EditableContent, type EditableFaq, type MediaAsset } from "@/components/content-editor";

type DirectoryRow = { user_id: string; email: string | null; email_verified: boolean; joined_at: string; last_sign_in_at: string | null };
type ProfileRow = { id: string; display_name: string | null; avatar_path: string | null; avatar_url: string | null; telegram_username: string | null; english_level: string | null; created_at: string };
type RoleRow = { user_id: string; role: string; updated_at: string };
type MeetupRow = { id: string; title: string; description: string; starts_at: string; ends_at: string; timezone: string; location_name: string; address: string | null; capacity: number; price_minor: number; currency: string; status: string; is_public: boolean; booking_opens_at: string | null; booking_closes_at: string | null; confirmed_booking_count: number; category?: string; image_url?: string | null };
type BookingRow = { id: string; meetup_id: string; user_id: string; status: string; booked_at: string; cancelled_at?: string | null };
type AttendanceRow = { id: string; meetup_id: string; user_id: string; booking_id: string | null; status: string; is_paid: boolean; payment_status: string; paid_amount_minor: number | null; paid_currency: string | null; recorded_at: string };
type RewardRow = { id: string; user_id: string; status: string; earned_at: string; reward_sequence: number };
type SpecialRow = { id: string; user_id: string; name: string; reason: string; description: string | null; status: string; issued_at: string; expires_at: string | null };
type QuestionRow = { user_id: string; question_id: string };
type AuditRow = { id: string; actor_user_id: string | null; action: string; target_table: string; target_id: string | null; created_at: string };
type ManagedQuestion = { id: string; prompt: string; translation: string | null; category: string; difficulty: string; is_published: boolean };
type NotificationRow = { id: string; title: string; body: string; read_at: string | null; created_at: string };
export type AdminData = { currentUserId: string; directory: DirectoryRow[]; profiles: ProfileRow[]; roles: RoleRow[]; meetups: MeetupRow[]; bookings: BookingRow[]; attendance: AttendanceRow[]; loyalty: RewardRow[]; special: SpecialRow[]; progress: QuestionRow[]; favorites: QuestionRow[]; audit: AuditRow[]; signedAvatars: Record<string, string>; managedQuestions: ManagedQuestion[]; content: EditableContent[]; notifications: NotificationRow[]; faq: EditableFaq[]; revisions: ContentRevision[]; media: MediaAsset[] };

// ======================================================
// ADMIN MEETUP MANAGEMENT — FORM SERIALIZATION
// ======================================================
const emptyMeetup = { id: "", title: "", description: "", starts_at: "", ends_at: "", timezone: MEETUP_TIME_ZONE, location_name: "", address: "", capacity: "12", price: "500", currency: "RUB", category: "Conversation", image_url: "", status: "draft", booking_opens_at: "", booking_closes_at: "" };

function meetupToForm(meetup: MeetupRow, duplicate = false) {
  return {
    id: duplicate ? "" : meetup.id,
    title: duplicate ? `${meetup.title} — copy` : meetup.title,
    description: meetup.description,
    starts_at: instantToMeetupWallTime(meetup.starts_at),
    ends_at: instantToMeetupWallTime(meetup.ends_at),
    timezone: MEETUP_TIME_ZONE,
    location_name: meetup.location_name,
    address: meetup.address ?? "",
    capacity: String(meetup.capacity),
    price: String(meetup.price_minor / 100),
    currency: meetup.currency,
    category: meetup.category ?? "Conversation",
    image_url: meetup.image_url ?? "",
    status: duplicate ? "draft" : meetup.status,
    booking_opens_at: duplicate || !meetup.booking_opens_at ? "" : instantToMeetupWallTime(meetup.booking_opens_at),
    booking_closes_at: duplicate || !meetup.booking_closes_at ? "" : instantToMeetupWallTime(meetup.booking_closes_at),
  };
}

function formatAdminMeetupTime(value: string) {
  return new Intl.DateTimeFormat("en-GB", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: MEETUP_TIME_ZONE,
  }).format(new Date(value));
}

// ======================================================
// ADMIN DASHBOARD
// ======================================================
export function AdminDashboard({ initial }: { initial: AdminData }) {
  const router = useRouter();
  const [tab, setTab] = useState("overview");
  const [search, setSearch] = useState("");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);
  const [meetups, setMeetups] = useState(initial.meetups);
  const [bookings, setBookings] = useState(initial.bookings);
  const [attendance, setAttendance] = useState(initial.attendance);
  const [notifications, setNotifications] = useState(initial.notifications);
  const [special, setSpecial] = useState(initial.special);
  const [roles, setRoles] = useState(initial.roles);
  const [managedQuestions, setManagedQuestions] = useState(initial.managedQuestions);
  const [editingQuestion, setEditingQuestion] = useState<ManagedQuestion | null>(null);
  const [questionSearch, setQuestionSearch] = useState("");
  const [questionCategory, setQuestionCategory] = useState("all");
  const [questionLevel, setQuestionLevel] = useState("all");
  const [meetupForm, setMeetupForm] = useState(emptyMeetup);
  const [now] = useState(() => Date.now());

  useEffect(() => {
    const refreshLiveData = async () => {
      const client = getSupabaseBrowserClient();
      if (!client) return;
      const [meetupResult, bookingResult, attendanceResult, notificationResult] = await Promise.all([
        client.from("meetups").select("*").order("starts_at", { ascending: false }),
        client.from("meetup_bookings").select("id,meetup_id,user_id,status,booked_at,cancelled_at").order("booked_at", { ascending: false }),
        client.from("attendance").select("id,meetup_id,user_id,booking_id,status,is_paid,payment_status,paid_amount_minor,paid_currency,recorded_at").order("recorded_at", { ascending: false }),
        client.from("notifications").select("id,title,body,read_at,created_at").eq("user_id", initial.currentUserId).order("created_at", { ascending: false }).limit(20),
      ]);
      if (meetupResult.data) setMeetups(meetupResult.data);
      if (bookingResult.data) setBookings(bookingResult.data);
      if (attendanceResult.data) setAttendance(attendanceResult.data);
      if (notificationResult.data) setNotifications(notificationResult.data);
    };
    const interval = window.setInterval(() => void refreshLiveData(), 15000);
    return () => window.clearInterval(interval);
  }, [initial.currentUserId]);

  const members = useMemo(() => initial.directory.map((auth) => ({
    ...auth,
    profile: initial.profiles.find((row) => row.id === auth.user_id),
    role: roles.find((row) => row.user_id === auth.user_id)?.role ?? "member",
    visits: attendance.filter((row) => row.user_id === auth.user_id && row.status === "attended").length,
    paid: attendance.filter((row) => row.user_id === auth.user_id && row.status === "attended" && row.is_paid).length,
    questions: initial.progress.filter((row) => row.user_id === auth.user_id).length,
    favorites: initial.favorites.filter((row) => row.user_id === auth.user_id).length,
  })), [attendance, initial.directory, initial.favorites, initial.profiles, initial.progress, roles]);
  const filteredMembers = members.filter((member) => `${member.profile?.display_name ?? ""} ${member.email ?? ""} ${member.profile?.telegram_username ?? ""}`.toLowerCase().includes(search.toLowerCase()));
  const upcoming = meetups.filter((meetup) => new Date(meetup.starts_at).getTime() > now && meetup.status === "published");
  const closeToReward = members.filter((member) => member.paid % 6 >= 4).length;
  const currentProfile = initial.profiles.find((profile) => profile.id === initial.currentUserId);
  const currentAvatar = initial.signedAvatars[initial.currentUserId] || currentProfile?.avatar_url || null;
  const currentName = currentProfile?.display_name || "GSC admin";

  function message(text: string) { setNotice(text); window.setTimeout(() => setNotice(""), 4000); }

  // Converts every datetime-local field from Moscow wall time before persistence.
  async function saveMeetup(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true);
    const client = getSupabaseBrowserClient();
    let payload;
    try {
      payload = {
        title: meetupForm.title.trim(), description: meetupForm.description.trim(), starts_at: meetupWallTimeToIso(meetupForm.starts_at), ends_at: meetupWallTimeToIso(meetupForm.ends_at), timezone: MEETUP_TIME_ZONE, location_name: meetupForm.location_name.trim(), address: meetupForm.address.trim() || null, capacity: Number(meetupForm.capacity), price_minor: Math.round(Number(meetupForm.price) * 100), currency: meetupForm.currency.toUpperCase(), category: meetupForm.category.trim() || "Conversation", image_url: meetupForm.image_url.trim() || null, status: meetupForm.status, is_public: meetupForm.status !== "draft", booking_opens_at: meetupForm.booking_opens_at ? meetupWallTimeToIso(meetupForm.booking_opens_at) : null, booking_closes_at: meetupForm.booking_closes_at ? meetupWallTimeToIso(meetupForm.booking_closes_at) : null,
      };
    } catch {
      setBusy(false);
      return message("The meetup dates must be valid Europe/Moscow times.");
    }
    const query = meetupForm.id ? client?.from("meetups").update(payload).eq("id", meetupForm.id).select().single() : client?.from("meetups").insert(payload).select().single();
    const result = await query;
    setBusy(false);
    if (!result || result.error) return message("The meetup could not be saved. Check the dates and fields.");
    setMeetups((rows) => meetupForm.id ? rows.map((row) => row.id === result.data.id ? result.data : row) : [result.data, ...rows]);
    router.refresh();
    setMeetupForm(emptyMeetup); message("Meetup saved.");
  }

  async function setMeetupStatus(id: string, status: string) {
    setBusy(true); const client = getSupabaseBrowserClient();
    const { data, error } = await client!.from("meetups").update({ status, is_public: status !== "draft" }).eq("id", id).select().single();
    setBusy(false); if (error) return message("Meetup status could not be changed.");
    setMeetups((rows) => rows.map((row) => row.id === id ? data : row)); router.refresh(); message(`Meetup marked ${status}.`);
  }

  async function deleteMeetup(id: string) {
    const meetup = meetups.find((row) => row.id === id);
    if (!meetup || !window.confirm(`Delete “${meetup.title}”? Events with bookings must be cancelled instead.`)) return;
    setBusy(true);
    const { error } = await getSupabaseBrowserClient()!.from("meetups").delete().eq("id", id);
    setBusy(false);
    if (error) return message("This meetup could not be deleted. Cancel it if it has booking history.");
    setMeetups((rows) => rows.filter((row) => row.id !== id));
    router.refresh();
    message("Meetup deleted.");
  }

  function duplicateMeetup(meetup: MeetupRow) {
    setMeetupForm(meetupToForm(meetup, true));
    message("A draft copy is ready to review.");
  }

  // ======================================================
  // ATTENDANCE / PAYMENT STATUS
  // ======================================================
  async function recordAttendance(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); const data = new FormData(event.currentTarget); const client = getSupabaseBrowserClient();
    const paid = data.get("is_paid") === "on";
    const paymentStatus = String(data.get("payment_status") || "unpaid");
    const payload = { meetup_id: String(data.get("meetup_id")), user_id: String(data.get("user_id")), booking_id: String(data.get("booking_id") || "") || null, status: String(data.get("status")), payment_status: paymentStatus, is_paid: paid, paid_amount_minor: paymentStatus === "paid" ? Math.round(Number(data.get("amount") || 0) * 100) : null, paid_currency: paymentStatus === "paid" ? String(data.get("currency") || "RUB").toUpperCase() : null };
    const { data: row, error } = await client!.from("attendance").upsert(payload, { onConflict: "meetup_id,user_id" }).select().single();
    setBusy(false); if (error) return message("Attendance could not be recorded.");
    setAttendance((rows) => [row, ...rows.filter((item) => item.id !== row.id)]); router.refresh(); message("Attendance and payment record saved.");
  }

  async function bulkCheckIn(meetupId: string) {
    const booked = bookings.filter((row) => row.meetup_id === meetupId && row.status === "confirmed");
    if (!booked.length || !window.confirm(`Mark ${booked.length} confirmed members as attended? Payment remains unrecorded.`)) return;
    setBusy(true); const client = getSupabaseBrowserClient();
    const { data, error } = await client!.from("attendance").upsert(booked.map((row) => ({ meetup_id: meetupId, user_id: row.user_id, booking_id: row.id, status: "attended", payment_status: "unpaid", is_paid: false })), { onConflict: "meetup_id,user_id" }).select();
    setBusy(false); if (error) return message("Bulk check-in could not be completed.");
    setAttendance((rows) => [...(data ?? []), ...rows.filter((row) => !data?.some((item: { id: string }) => item.id === row.id))]); router.refresh(); message("Bulk check-in completed.");
  }

  // ======================================================
  // LOYALTY / SPECIAL REWARDS
  // ======================================================
  async function issueSpecial(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); const data = new FormData(event.currentTarget); const client = getSupabaseBrowserClient();
    const payload = { user_id: String(data.get("user_id")), name: String(data.get("name")).trim(), reason: String(data.get("reason")).trim(), description: String(data.get("description")).trim() || null, status: "available", expires_at: data.get("expires_at") ? new Date(String(data.get("expires_at"))).toISOString() : null };
    const { data: row, error } = await client!.from("special_rewards").insert(payload).select().single();
    setBusy(false); if (error) return message("Special reward could not be issued.");
    setSpecial((rows) => [row, ...rows]); event.currentTarget.reset(); message("Special reward issued.");
  }

  // ======================================================
  // ADMIN MEMBER MANAGEMENT
  // ======================================================
  async function changeRole(userId: string, role: string) {
    if (!window.confirm(`Change this member’s role to ${role}?`)) return;
    setBusy(true); const client = getSupabaseBrowserClient();
    const { data, error } = await client!.from("user_roles").update({ role }).eq("user_id", userId).select().single();
    setBusy(false); if (error) return message(error.message.includes("final administrator") ? "The final administrator cannot be removed." : "Role could not be changed.");
    setRoles((rows) => rows.map((row) => row.user_id === userId ? data : row)); message("Member role updated.");
  }

  // ======================================================
  // QUESTIONS — ADMIN LIBRARY
  // ======================================================
  async function saveManagedQuestion(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true);
    const data = new FormData(event.currentTarget);
    const payload = { prompt: String(data.get("prompt") ?? "").trim(), translation: String(data.get("translation") ?? "").trim() || null, category: String(data.get("category") ?? "Conversation").trim(), difficulty: String(data.get("difficulty") ?? "Intermediate"), is_published: true };
    const query = editingQuestion
      ? getSupabaseBrowserClient()!.from("managed_questions").update(payload).eq("id", editingQuestion.id).select("id,prompt,translation,category,difficulty,is_published").single()
      : getSupabaseBrowserClient()!.from("managed_questions").insert(payload).select("id,prompt,translation,category,difficulty,is_published").single();
    const { data: row, error } = await query;
    setBusy(false);
    if (error || !row) return message("Question could not be saved. Please check the fields and try again.");
    setManagedQuestions((rows) => editingQuestion ? rows.map((item) => item.id === row.id ? row : item) : [row, ...rows]);
    setEditingQuestion(null); event.currentTarget.reset(); message(editingQuestion ? "Question saved successfully." : "Question added to the managed library.");
  }

  async function deleteManagedQuestion(id: string) {
    const question = managedQuestions.find((row) => row.id === id);
    if (!question || !window.confirm("Delete this question? It will be removed from the managed question library. Member exploration history is kept.")) return;
    setBusy(true); const { error } = await getSupabaseBrowserClient()!.from("managed_questions").delete().eq("id", id); setBusy(false);
    if (error) return message("Question could not be deleted.");
    setManagedQuestions((rows) => rows.filter((row) => row.id !== id));
    if (editingQuestion?.id === id) setEditingQuestion(null);
    message("Question deleted.");
  }

  const managedQuestionCategories = useMemo(() => [...new Set(managedQuestions.map((row) => row.category))].sort(), [managedQuestions]);
  const filteredManagedQuestions = useMemo(() => managedQuestions.filter((row) => {
    const searchable = `${row.prompt} ${row.translation ?? ""} ${row.category} ${row.difficulty}`.toLowerCase();
    return searchable.includes(questionSearch.trim().toLowerCase())
      && (questionCategory === "all" || row.category === questionCategory)
      && (questionLevel === "all" || row.difficulty === questionLevel);
  }), [managedQuestions, questionCategory, questionLevel, questionSearch]);

  const navGroups = [["Dashboard", [["overview",LayoutDashboard,"Overview"]]], ["Members", [["members",Users,"Members"],["attendance",ClipboardCheck,"Attendance"],["rewards",Award,"Rewards"]]], ["Events", [["meetups",CalendarDays,"Meetups"]]], ["Content", [["questions",BookOpen,"Questions"],["content",Pencil,"Content Editor"],["media",ImageIcon,"Media"]]], ["System", [["settings",Settings,"Site Settings"],["audit",Activity,"Audit History"]]]] as const;
  return <main className="admin-shell">
    <aside className="admin-sidebar"><Link className="admin-logo" href="/">GSC <small>Control center</small></Link><nav aria-label="Admin sections">{navGroups.map(([group, items]) => <div className="admin-nav-group" key={group}><p>{group}</p>{items.map(([id,Icon,label]) => <button key={id} className={tab === id ? "active" : ""} aria-current={tab === id ? "page" : undefined} onClick={() => setTab(id)}><Icon size={18} />{label}</button>)}</div>)}</nav><Link className="admin-member-link" href="/account">Member dashboard <ChevronRight /></Link></aside>
    <section className="admin-main"><header className="admin-header"><div><p className="dashboard-kicker">Protected workspace</p><h1>{tab === "overview" ? "Club overview" : tab.charAt(0).toUpperCase() + tab.slice(1)}</h1></div><div className="admin-header-actions"><ThemeToggle compact /><NotificationBell key={notifications.map((item) => `${item.id}:${item.read_at ?? ""}`).join("|")} initialNotifications={notifications} /><button type="button" onClick={() => router.refresh()} disabled={busy}>Refresh data</button><span><ShieldCheck />Admin verified</span><details className="dashboard-account-menu admin-account-menu"><summary aria-label="Open account menu">{currentAvatar ? <Image src={currentAvatar} alt="" width={34} height={34} unoptimized /> : <i>{currentName.charAt(0).toUpperCase()}</i>}</summary><div><strong>{currentName}</strong><Link href="/account">My account</Link><Link href="/account#settings">Profile</Link><Link href="/meetups">Meetups</Link><form action="/auth/signout" method="post"><button type="submit">Log out</button></form></div></details></div></header>{notice && <div className="admin-notice" role="status">{notice}</div>}

      {tab === "overview" && <><div className="admin-stat-grid"><article><Users /><strong>{members.length}</strong><span>Total members</span></article><article><CalendarDays /><strong>{upcoming.length}</strong><span>Upcoming meetups</span></article><article><TicketCheck /><strong>{bookings.filter((row) => row.status === "confirmed").length}</strong><span>Current bookings</span></article><article><ClipboardCheck /><strong>{attendance.filter((row) => new Date(row.recorded_at).getMonth() === new Date().getMonth()).length}</strong><span>Attendance this month</span></article><article><Star /><strong>{attendance.filter((row) => row.status === "attended" && row.is_paid).length}</strong><span>Paid visits</span></article><article><Award /><strong>{closeToReward}</strong><span>Close to reward</span></article><article><Sparkles /><strong>{initial.loyalty.filter((row) => row.status === "available").length + special.filter((row) => row.status === "available").length}</strong><span>Unredeemed rewards</span></article><article><Activity /><strong>{initial.progress.length}</strong><span>Questions explored</span></article></div><section className="admin-overview-actions"><div><p className="dashboard-kicker">Quick actions</p><button onClick={() => { setMeetupForm(emptyMeetup); setTab("meetups"); }}><Plus />Create meetup</button><button onClick={() => setTab("attendance")}><ClipboardCheck />Mark attendance</button><button onClick={() => setTab("questions")}><BookOpen />Add question</button></div><div><p className="dashboard-kicker">Needs attention</p><strong>{attendance.filter((row) => row.status === "attended" && !row.is_paid).length} unpaid attended visit{attendance.filter((row) => row.status === "attended" && !row.is_paid).length === 1 ? "" : "s"}</strong><span>{upcoming.length ? `${upcoming.length} published meetup${upcoming.length === 1 ? "" : "s"} coming up` : "No upcoming published meetups"}</span></div></section><section className="admin-panel"><div className="admin-panel-heading"><div><p className="dashboard-kicker">Live picture</p><h2>Recent members</h2></div><button onClick={() => setTab("members")}>View all</button></div><MemberCards members={members.slice(0, 5)} avatars={initial.signedAvatars} onRole={changeRole} busy={busy} /></section></>}

      {tab === "members" && <section className="admin-panel"><div className="admin-panel-heading"><div><p className="dashboard-kicker">Member management</p><h2>{filteredMembers.length} members</h2></div><label className="admin-search"><Search /><span className="sr-only">Search members</span><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Name, email or Telegram" /></label></div><MemberCards members={filteredMembers} avatars={initial.signedAvatars} onRole={changeRole} busy={busy} /></section>}

      {tab === "meetups" && <div className="admin-two-column"><section className="admin-panel"><div className="admin-panel-heading"><div><p className="dashboard-kicker">Schedule</p><h2>Manage meetups</h2></div></div><div className="admin-meetup-list">{meetups.map((meetup) => <article key={meetup.id}><div><span className={`admin-status ${meetup.status}`}>{meetup.status}</span><h3>{meetup.title}</h3><p>{formatAdminMeetupTime(meetup.starts_at)} · {meetup.location_name}</p><small>{meetup.confirmed_booking_count}/{meetup.capacity} confirmed · {meetup.category ?? "Conversation"} · {meetup.price_minor / 100} {meetup.currency}</small><details><summary>Participants ({bookings.filter((booking) => booking.meetup_id === meetup.id && booking.status === "confirmed").length})</summary><ParticipantList meetup={meetup} bookings={bookings} attendance={attendance} members={members} avatars={initial.signedAvatars} onSubmit={recordAttendance} busy={busy} /></details></div><div><button aria-label={`Edit ${meetup.title}`} onClick={() => setMeetupForm(meetupToForm(meetup))}><Pencil /></button><button aria-label={`Duplicate ${meetup.title}`} onClick={() => duplicateMeetup(meetup)}><Copy /></button><button aria-label={`Delete ${meetup.title}`} onClick={() => deleteMeetup(meetup.id)} disabled={busy}><Trash2 /></button>{meetup.status === "draft" && <button onClick={() => setMeetupStatus(meetup.id,"published")}>Publish</button>}{meetup.status === "published" && <><button onClick={() => setMeetupStatus(meetup.id,"completed")}>Complete</button><button onClick={() => setMeetupStatus(meetup.id,"cancelled")}>Cancel</button></>}</div></article>)}</div></section><MeetupForm value={meetupForm} setValue={setMeetupForm} onSubmit={saveMeetup} busy={busy} /></div>}

      {tab === "attendance" && <div className="admin-two-column"><section className="admin-panel"><div className="admin-panel-heading"><div><p className="dashboard-kicker">Manual records</p><h2>Check in a member</h2></div></div><form className="admin-form" onSubmit={recordAttendance}><label>Meetup<select name="meetup_id" required>{meetups.map((row) => <option key={row.id} value={row.id}>{row.title}</option>)}</select></label><label>Member<select name="user_id" required>{members.map((row) => <option key={row.user_id} value={row.user_id}>{row.profile?.display_name || row.email}</option>)}</select></label><label>Booking (optional)<select name="booking_id"><option value="">Walk-in / no booking</option>{bookings.filter((row) => row.status === "confirmed").map((row) => <option key={row.id} value={row.id}>{members.find((member) => member.user_id === row.user_id)?.profile?.display_name || row.user_id.slice(0, 8)}</option>)}</select></label><label>Attendance<select name="status"><option value="attended">Attended</option><option value="no_show">Absent / no-show</option><option value="excused">Excused</option></select></label><label>Payment<select name="payment_status"><option value="unpaid">Unpaid</option><option value="paid">Paid</option><option value="free_reward">Free loyalty reward</option></select></label><div className="admin-form-row"><label>Amount<input name="amount" type="number" min="0" step="0.01" defaultValue="500" /></label><label>Currency<input name="currency" defaultValue="RUB" pattern="[A-Z]{3}" /></label></div><button className="button button-primary" disabled={busy}>Save attendance</button></form></section><section className="admin-panel"><div className="admin-panel-heading"><div><p className="dashboard-kicker">Safe bulk action</p><h2>Booked members</h2></div></div>{meetups.map((meetup) => { const count = bookings.filter((row) => row.meetup_id === meetup.id && row.status === "confirmed").length; return count ? <div className="bulk-row" key={meetup.id}><span><strong>{meetup.title}</strong><small>{count} confirmed</small></span><button onClick={() => bulkCheckIn(meetup.id)} disabled={busy}><Check />Check in all</button></div> : null; })}</section></div>}
      {tab === "questions" && <div className="admin-two-column"><section className="admin-panel"><div className="admin-panel-heading"><div><p className="dashboard-kicker">Question CMS</p><h2>{editingQuestion ? "Edit speaking prompt" : "Add a speaking prompt"}</h2></div></div><form className="admin-form" key={editingQuestion?.id ?? "new-question"} onSubmit={saveManagedQuestion}><label>Question<textarea name="prompt" required maxLength={1000} defaultValue={editingQuestion?.prompt ?? ""} /></label><label>Translation<textarea name="translation" maxLength={1000} defaultValue={editingQuestion?.translation ?? ""} /></label><div className="admin-form-row"><label>Category<input name="category" defaultValue={editingQuestion?.category ?? "Conversation"} required /></label><label>Difficulty<select name="difficulty" defaultValue={editingQuestion?.difficulty ?? "Intermediate"}><option>Beginner</option><option>Intermediate</option><option>Advanced</option></select></label></div><div className="admin-form-actions"><button className="button button-primary" disabled={busy}><Plus />{editingQuestion ? "Save question" : "Add question"}</button>{editingQuestion && <button className="button button-outline" type="button" onClick={() => setEditingQuestion(null)} disabled={busy}>Discard</button>}</div></form></section><section className="admin-panel"><div className="admin-panel-heading"><div><p className="dashboard-kicker">Managed additions</p><h2>{filteredManagedQuestions.length} of {managedQuestions.length} questions</h2></div></div><div className="admin-question-tools"><label className="admin-search"><Search /><span className="sr-only">Search questions</span><input value={questionSearch} onChange={(event) => setQuestionSearch(event.target.value)} placeholder="Search questions…" /></label><div className="admin-filter-row"><label>Category<select value={questionCategory} onChange={(event) => setQuestionCategory(event.target.value)}><option value="all">All categories</option>{managedQuestionCategories.map((category) => <option key={category}>{category}</option>)}</select></label><label>Level<select value={questionLevel} onChange={(event) => setQuestionLevel(event.target.value)}><option value="all">All levels</option><option>Beginner</option><option>Intermediate</option><option>Advanced</option></select></label></div></div><div className="audit-list managed-question-list">{filteredManagedQuestions.length ? filteredManagedQuestions.map((row) => <div key={row.id}><span>{row.difficulty}</span><strong>{row.prompt}</strong><p>{row.category} · Ref {row.id.slice(0, 8)}</p><div className="managed-question-actions"><button onClick={() => setEditingQuestion(row)} disabled={busy}><Pencil />Edit</button><button className="danger" onClick={() => void deleteManagedQuestion(row.id)} disabled={busy}><Trash2 />Delete</button></div></div>) : <p className="admin-empty">No managed questions match these filters. The authored library remains available to members.</p>}</div></section></div>}

      {tab === "content" && <ContentEditor initialContent={initial.content} initialFaq={initial.faq} initialRevisions={initial.revisions} initialMedia={initial.media} currentUserId={initial.currentUserId} />}

      {tab === "media" && <ContentEditor initialContent={initial.content} initialFaq={initial.faq} initialRevisions={initial.revisions} initialMedia={initial.media} currentUserId={initial.currentUserId} mode="media" />}

      {tab === "settings" && <ContentEditor initialContent={initial.content} initialFaq={initial.faq} initialRevisions={initial.revisions} initialMedia={initial.media} currentUserId={initial.currentUserId} mode="settings" />}

      {tab === "rewards" && <div className="admin-two-column"><section className="admin-panel"><div className="admin-panel-heading"><div><p className="dashboard-kicker">Surprise and delight</p><h2>Issue special reward</h2></div></div><form className="admin-form" onSubmit={issueSpecial}><label>Member<select name="user_id" required>{members.map((row) => <option key={row.user_id} value={row.user_id}>{row.profile?.display_name || row.email}</option>)}</select></label><label>Reward name<input name="name" maxLength={120} required /></label><label>Reason<textarea name="reason" maxLength={500} required /></label><label>Description<textarea name="description" maxLength={2000} /></label><label>Optional expiry<input name="expires_at" type="datetime-local" /></label><button className="button button-primary" disabled={busy}><Plus />Issue reward</button></form></section><section className="admin-panel"><div className="admin-panel-heading"><div><p className="dashboard-kicker">Reward ledger</p><h2>Available rewards</h2></div></div><div className="reward-admin-list">{special.length ? special.map((reward) => <article key={reward.id}><Sparkles /><div><strong>{reward.name}</strong><p>{members.find((member) => member.user_id === reward.user_id)?.profile?.display_name ?? "Member"} · {reward.reason}</p></div><span>{reward.status}</span></article>) : <p className="admin-empty">No special rewards issued yet.</p>}</div></section></div>}

      {tab === "audit" && <section className="admin-panel"><div className="admin-panel-heading"><div><p className="dashboard-kicker">Append-only history</p><h2>Recent admin actions</h2></div></div><div className="audit-list">{initial.audit.map((row) => <div key={row.id}><span>{row.action}</span><strong>{row.target_table.replaceAll("_", " ")}</strong><p>{new Date(row.created_at).toLocaleString()} · {row.actor_user_id ? members.find((member) => member.user_id === row.actor_user_id)?.email ?? "Administrator" : "System operation"}</p></div>)}</div></section>}
    </section>
  </main>;
}

type MemberSummary = DirectoryRow & { profile?: ProfileRow; role: string; visits: number; paid: number; questions: number; favorites: number };
function MemberCards({ members, avatars, onRole, busy }: { members: MemberSummary[]; avatars: Record<string,string>; onRole: (id:string,role:string)=>void; busy:boolean }) {
  return <div className="admin-member-list">{members.map((member) => { const avatar = avatars[member.user_id] ?? member.profile?.avatar_url; return <article key={member.user_id}>{avatar ? <Image src={avatar} alt="" width={52} height={52} unoptimized /> : <span className="member-mini-avatar">{member.profile?.display_name?.[0]?.toUpperCase() ?? "G"}</span>}<div className="member-primary"><strong>{member.profile?.display_name || "Unnamed member"}</strong><p>{member.email}{member.email_verified && <ShieldCheck />}</p><small>{member.profile?.telegram_username ? `@${member.profile.telegram_username}` : "No Telegram username"}</small></div><div className="member-metrics"><span><b>{member.visits}</b> visits</span><span><b>{member.paid}</b> paid</span><span><b>{member.questions}</b> questions</span><span><b>{member.favorites}</b> favorites</span></div><div className="member-role"><span className={`admin-status ${member.role}`}>{member.role}</span><button onClick={() => onRole(member.user_id, member.role === "admin" ? "member" : "admin")} disabled={busy}>{member.role === "admin" ? "Make member" : "Make admin"}</button><Link href={`/admin/members/${member.user_id}`}>Details <ChevronRight /></Link></div></article>; })}</div>;
}

function ParticipantList({ meetup, bookings, attendance, members, avatars, onSubmit, busy }: { meetup: MeetupRow; bookings: BookingRow[]; attendance: AttendanceRow[]; members: MemberSummary[]; avatars: Record<string, string>; onSubmit: (event: FormEvent<HTMLFormElement>) => void; busy: boolean }) {
  const rows = bookings.filter((booking) => booking.meetup_id === meetup.id);
  if (!rows.length) return <p className="admin-empty">No bookings yet. New bookings will appear here automatically.</p>;

  return <div className="admin-participant-list">{rows.map((booking) => {
    const member = members.find((item) => item.user_id === booking.user_id);
    const record = attendance.find((item) => item.meetup_id === meetup.id && item.user_id === booking.user_id);
    const avatar = avatars[booking.user_id] ?? member?.profile?.avatar_url;
    const paymentStatus = record?.payment_status ?? (record?.is_paid ? "paid" : "unpaid");
    return <article className="admin-participant" key={booking.id}>
      {avatar ? <Image src={avatar} alt="" width={42} height={42} unoptimized /> : <span className="member-mini-avatar">{member?.profile?.display_name?.[0]?.toUpperCase() ?? "G"}</span>}
      <div className="participant-identity"><strong>{member?.profile?.display_name || "Unnamed member"}</strong><small>{member?.email ?? "Email unavailable"}</small><span>Booking: {booking.status} · Attendance: {record?.status ?? "not recorded"} · Payment: {paymentStatus}</span></div>
      <form className="participant-controls" onSubmit={onSubmit}>
        <input type="hidden" name="meetup_id" value={meetup.id} />
        <input type="hidden" name="user_id" value={booking.user_id} />
        <input type="hidden" name="booking_id" value={booking.id} />
        <select name="status" defaultValue={record?.status ?? "attended"} aria-label={`Attendance status for ${member?.profile?.display_name ?? "member"}`}><option value="attended">Attended</option><option value="no_show">No-show</option><option value="excused">Excused</option></select>
        <select name="payment_status" defaultValue={paymentStatus} aria-label={`Payment status for ${member?.profile?.display_name ?? "member"}`}><option value="paid">Paid</option><option value="unpaid">Unpaid</option><option value="free_reward">Free reward</option></select>
        <input name="amount" type="number" min="0" step="0.01" defaultValue={record?.paid_amount_minor ? record.paid_amount_minor / 100 : meetup.price_minor / 100} aria-label="Paid amount" />
        <input name="currency" defaultValue={record?.paid_currency ?? meetup.currency} maxLength={3} aria-label="Paid currency" />
        <button type="submit" disabled={busy}><Check size={14} />Save</button>
      </form>
    </article>;
  })}</div>;
}

function MeetupForm({ value, setValue, onSubmit, busy }: { value: typeof emptyMeetup; setValue: (value: typeof emptyMeetup)=>void; onSubmit:(event:FormEvent<HTMLFormElement>)=>void; busy:boolean }) {
  const field = (key: keyof typeof emptyMeetup) => ({ value: value[key], onChange: (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => setValue({ ...value, [key]: event.target.value }) });
  return <section className="admin-panel"><div className="admin-panel-heading"><div><p className="dashboard-kicker">{value.id ? "Edit event" : "New event"}</p><h2>{value.id ? "Update meetup" : "Create meetup"}</h2></div>{value.id && <button onClick={() => setValue(emptyMeetup)}>Cancel edit</button>}</div><form className="admin-form" onSubmit={onSubmit}><label>Title<input {...field("title")} required maxLength={160} /></label><label>Description<textarea {...field("description")} maxLength={5000} /></label><div className="admin-form-row"><label>Starts<input {...field("starts_at")} type="datetime-local" required /></label><label>Ends<input {...field("ends_at")} type="datetime-local" required /></label></div><label>Time zone<input {...field("timezone")} readOnly aria-readonly="true" required /></label><label>Venue<input {...field("location_name")} required /></label><label>Address<input {...field("address")} /></label><div className="admin-form-row"><label>Category<input {...field("category")} maxLength={80} /></label><label>Image URL<input {...field("image_url")} type="url" placeholder="https://…" /></label></div><div className="admin-form-row"><label>Capacity<input {...field("capacity")} type="number" min="1" max="100" required /></label><label>Price<input {...field("price")} type="number" min="0" step="0.01" /></label><label>Currency<input {...field("currency")} pattern="[A-Z]{3}" /></label></div><div className="admin-form-row"><label>Booking opens<input {...field("booking_opens_at")} type="datetime-local" /></label><label>Booking closes<input {...field("booking_closes_at")} type="datetime-local" /></label></div><label>Status<select {...field("status")}><option value="draft">Draft</option><option value="published">Published</option><option value="cancelled">Cancelled</option><option value="completed">Completed</option></select></label><button className="button button-primary" disabled={busy}>{value.id ? "Save changes" : "Create meetup"}</button></form></section>;
}
