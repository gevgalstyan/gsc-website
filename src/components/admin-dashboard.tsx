"use client";

import Image from "next/image";
import Link from "next/link";
import { FormEvent, useMemo, useState } from "react";
import { Activity, Award, CalendarDays, Check, ChevronRight, ClipboardCheck, LayoutDashboard, Pencil, Plus, Search, ShieldCheck, Sparkles, Star, TicketCheck, Users } from "lucide-react";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

type DirectoryRow = { user_id: string; email: string | null; email_verified: boolean; joined_at: string; last_sign_in_at: string | null };
type ProfileRow = { id: string; display_name: string | null; avatar_path: string | null; avatar_url: string | null; telegram_username: string | null; created_at: string };
type RoleRow = { user_id: string; role: string; updated_at: string };
type MeetupRow = { id: string; title: string; description: string; starts_at: string; ends_at: string; timezone: string; location_name: string; address: string | null; capacity: number; price_minor: number; currency: string; status: string; is_public: boolean; booking_opens_at: string | null; booking_closes_at: string | null; confirmed_booking_count: number };
type BookingRow = { id: string; meetup_id: string; user_id: string; status: string; booked_at: string };
type AttendanceRow = { id: string; meetup_id: string; user_id: string; status: string; is_paid: boolean; paid_amount_minor: number | null; paid_currency: string | null; recorded_at: string };
type RewardRow = { id: string; user_id: string; status: string; earned_at: string; reward_sequence: number };
type SpecialRow = { id: string; user_id: string; name: string; reason: string; description: string | null; status: string; issued_at: string; expires_at: string | null };
type QuestionRow = { user_id: string; question_id: string };
type AuditRow = { id: string; actor_user_id: string | null; action: string; target_table: string; target_id: string | null; created_at: string };
type AdminData = { currentUserId: string; directory: DirectoryRow[]; profiles: ProfileRow[]; roles: RoleRow[]; meetups: MeetupRow[]; bookings: BookingRow[]; attendance: AttendanceRow[]; loyalty: RewardRow[]; special: SpecialRow[]; progress: QuestionRow[]; favorites: QuestionRow[]; audit: AuditRow[]; signedAvatars: Record<string, string> };

const emptyMeetup = { id: "", title: "", description: "", starts_at: "", ends_at: "", timezone: "Europe/Moscow", location_name: "", address: "", capacity: "12", price: "500", currency: "RUB", status: "draft", booking_opens_at: "", booking_closes_at: "" };

export function AdminDashboard({ initial }: { initial: AdminData }) {
  const [tab, setTab] = useState("overview");
  const [search, setSearch] = useState("");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);
  const [meetups, setMeetups] = useState(initial.meetups);
  const [attendance, setAttendance] = useState(initial.attendance);
  const [special, setSpecial] = useState(initial.special);
  const [roles, setRoles] = useState(initial.roles);
  const [meetupForm, setMeetupForm] = useState(emptyMeetup);
  const [now] = useState(() => Date.now());

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

  function message(text: string) { setNotice(text); window.setTimeout(() => setNotice(""), 4000); }

  async function saveMeetup(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true);
    const client = getSupabaseBrowserClient();
    const payload = {
      title: meetupForm.title.trim(), description: meetupForm.description.trim(), starts_at: new Date(meetupForm.starts_at).toISOString(), ends_at: new Date(meetupForm.ends_at).toISOString(), timezone: meetupForm.timezone.trim(), location_name: meetupForm.location_name.trim(), address: meetupForm.address.trim() || null, capacity: Number(meetupForm.capacity), price_minor: Math.round(Number(meetupForm.price) * 100), currency: meetupForm.currency.toUpperCase(), status: meetupForm.status, is_public: meetupForm.status !== "draft", booking_opens_at: meetupForm.booking_opens_at ? new Date(meetupForm.booking_opens_at).toISOString() : null, booking_closes_at: meetupForm.booking_closes_at ? new Date(meetupForm.booking_closes_at).toISOString() : null,
    };
    const query = meetupForm.id ? client?.from("meetups").update(payload).eq("id", meetupForm.id).select().single() : client?.from("meetups").insert(payload).select().single();
    const result = await query;
    setBusy(false);
    if (!result || result.error) return message("The meetup could not be saved. Check the dates and fields.");
    setMeetups((rows) => meetupForm.id ? rows.map((row) => row.id === result.data.id ? result.data : row) : [result.data, ...rows]);
    setMeetupForm(emptyMeetup); message("Meetup saved.");
  }

  async function setMeetupStatus(id: string, status: string) {
    setBusy(true); const client = getSupabaseBrowserClient();
    const { data, error } = await client!.from("meetups").update({ status, is_public: status !== "draft" }).eq("id", id).select().single();
    setBusy(false); if (error) return message("Meetup status could not be changed.");
    setMeetups((rows) => rows.map((row) => row.id === id ? data : row)); message(`Meetup marked ${status}.`);
  }

  async function recordAttendance(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); const data = new FormData(event.currentTarget); const client = getSupabaseBrowserClient();
    const paid = data.get("is_paid") === "on";
    const payload = { meetup_id: String(data.get("meetup_id")), user_id: String(data.get("user_id")), status: String(data.get("status")), is_paid: paid, paid_amount_minor: paid ? Math.round(Number(data.get("amount") || 0) * 100) : null, paid_currency: paid ? String(data.get("currency") || "RUB").toUpperCase() : null };
    const { data: row, error } = await client!.from("attendance").upsert(payload, { onConflict: "meetup_id,user_id" }).select().single();
    setBusy(false); if (error) return message("Attendance could not be recorded.");
    setAttendance((rows) => [row, ...rows.filter((item) => item.id !== row.id)]); message("Attendance and payment record saved.");
  }

  async function bulkCheckIn(meetupId: string) {
    const booked = initial.bookings.filter((row) => row.meetup_id === meetupId && row.status === "confirmed");
    if (!booked.length || !window.confirm(`Mark ${booked.length} confirmed members as attended? Payment remains unrecorded.`)) return;
    setBusy(true); const client = getSupabaseBrowserClient();
    const { data, error } = await client!.from("attendance").upsert(booked.map((row) => ({ meetup_id: meetupId, user_id: row.user_id, booking_id: row.id, status: "attended", is_paid: false })), { onConflict: "meetup_id,user_id" }).select();
    setBusy(false); if (error) return message("Bulk check-in could not be completed.");
    setAttendance((rows) => [...(data ?? []), ...rows.filter((row) => !data?.some((item) => item.id === row.id))]); message("Bulk check-in completed.");
  }

  async function issueSpecial(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); const data = new FormData(event.currentTarget); const client = getSupabaseBrowserClient();
    const payload = { user_id: String(data.get("user_id")), name: String(data.get("name")).trim(), reason: String(data.get("reason")).trim(), description: String(data.get("description")).trim() || null, status: "available", expires_at: data.get("expires_at") ? new Date(String(data.get("expires_at"))).toISOString() : null };
    const { data: row, error } = await client!.from("special_rewards").insert(payload).select().single();
    setBusy(false); if (error) return message("Special reward could not be issued.");
    setSpecial((rows) => [row, ...rows]); event.currentTarget.reset(); message("Special reward issued.");
  }

  async function changeRole(userId: string, role: string) {
    if (!window.confirm(`Change this member’s role to ${role}?`)) return;
    setBusy(true); const client = getSupabaseBrowserClient();
    const { data, error } = await client!.from("user_roles").update({ role }).eq("user_id", userId).select().single();
    setBusy(false); if (error) return message(error.message.includes("final administrator") ? "The final administrator cannot be removed." : "Role could not be changed.");
    setRoles((rows) => rows.map((row) => row.user_id === userId ? data : row)); message("Member role updated.");
  }

  return <main className="admin-shell">
    <aside className="admin-sidebar"><Link className="admin-logo" href="/">GSC <small>Administration</small></Link><nav aria-label="Admin sections">{[["overview",LayoutDashboard,"Overview"],["members",Users,"Members"],["meetups",CalendarDays,"Meetups"],["attendance",ClipboardCheck,"Attendance"],["rewards",Award,"Rewards"],["audit",Activity,"Audit history"]].map(([id,Icon,label]) => <button key={id as string} className={tab === id ? "active" : ""} onClick={() => setTab(id as string)}><Icon size={18} />{label as string}</button>)}</nav><Link className="admin-member-link" href="/account">Member dashboard <ChevronRight /></Link></aside>
    <section className="admin-main"><header className="admin-header"><div><p className="dashboard-kicker">Protected workspace</p><h1>{tab === "overview" ? "Club overview" : tab.charAt(0).toUpperCase() + tab.slice(1)}</h1></div><span><ShieldCheck />Admin verified</span></header>{notice && <div className="admin-notice" role="status">{notice}</div>}

      {tab === "overview" && <><div className="admin-stat-grid"><article><Users /><strong>{members.length}</strong><span>Total members</span></article><article><CalendarDays /><strong>{upcoming.length}</strong><span>Upcoming meetups</span></article><article><TicketCheck /><strong>{initial.bookings.filter((row) => row.status === "confirmed").length}</strong><span>Current bookings</span></article><article><ClipboardCheck /><strong>{attendance.filter((row) => new Date(row.recorded_at).getMonth() === new Date().getMonth()).length}</strong><span>Attendance this month</span></article><article><Star /><strong>{attendance.filter((row) => row.status === "attended" && row.is_paid).length}</strong><span>Paid visits</span></article><article><Award /><strong>{closeToReward}</strong><span>Close to reward</span></article><article><Sparkles /><strong>{initial.loyalty.filter((row) => row.status === "available").length + special.filter((row) => row.status === "available").length}</strong><span>Unredeemed rewards</span></article><article><Activity /><strong>{initial.progress.length}</strong><span>Questions explored</span></article></div><section className="admin-panel"><div className="admin-panel-heading"><div><p className="dashboard-kicker">Live picture</p><h2>Recent members</h2></div><button onClick={() => setTab("members")}>View all</button></div><MemberCards members={members.slice(0, 5)} avatars={initial.signedAvatars} onRole={changeRole} busy={busy} /></section></>}

      {tab === "members" && <section className="admin-panel"><div className="admin-panel-heading"><div><p className="dashboard-kicker">Member management</p><h2>{filteredMembers.length} members</h2></div><label className="admin-search"><Search /><span className="sr-only">Search members</span><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Name, email or Telegram" /></label></div><MemberCards members={filteredMembers} avatars={initial.signedAvatars} onRole={changeRole} busy={busy} /></section>}

      {tab === "meetups" && <div className="admin-two-column"><section className="admin-panel"><div className="admin-panel-heading"><div><p className="dashboard-kicker">Schedule</p><h2>Manage meetups</h2></div></div><div className="admin-meetup-list">{meetups.map((meetup) => <article key={meetup.id}><div><span className={`admin-status ${meetup.status}`}>{meetup.status}</span><h3>{meetup.title}</h3><p>{new Date(meetup.starts_at).toLocaleString()} · {meetup.location_name}</p><small>{meetup.confirmed_booking_count}/{meetup.capacity} confirmed</small></div><div><button aria-label={`Edit ${meetup.title}`} onClick={() => setMeetupForm({ id: meetup.id, title: meetup.title, description: meetup.description, starts_at: meetup.starts_at.slice(0,16), ends_at: meetup.ends_at.slice(0,16), timezone: meetup.timezone, location_name: meetup.location_name, address: meetup.address ?? "", capacity: String(meetup.capacity), price: String(meetup.price_minor / 100), currency: meetup.currency, status: meetup.status, booking_opens_at: meetup.booking_opens_at?.slice(0,16) ?? "", booking_closes_at: meetup.booking_closes_at?.slice(0,16) ?? "" })}><Pencil /></button>{meetup.status === "draft" && <button onClick={() => setMeetupStatus(meetup.id,"published")}>Publish</button>}{meetup.status === "published" && <><button onClick={() => setMeetupStatus(meetup.id,"completed")}>Complete</button><button onClick={() => setMeetupStatus(meetup.id,"cancelled")}>Cancel</button></>}</div></article>)}</div></section><MeetupForm value={meetupForm} setValue={setMeetupForm} onSubmit={saveMeetup} busy={busy} /></div>}

      {tab === "attendance" && <div className="admin-two-column"><section className="admin-panel"><div className="admin-panel-heading"><div><p className="dashboard-kicker">Manual records</p><h2>Check in a member</h2></div></div><form className="admin-form" onSubmit={recordAttendance}><label>Meetup<select name="meetup_id" required>{meetups.map((row) => <option key={row.id} value={row.id}>{row.title}</option>)}</select></label><label>Member<select name="user_id" required>{members.map((row) => <option key={row.user_id} value={row.user_id}>{row.profile?.display_name || row.email}</option>)}</select></label><label>Attendance<select name="status"><option value="attended">Attended</option><option value="no_show">Absent / no-show</option><option value="excused">Excused</option></select></label><label className="admin-checkbox"><input type="checkbox" name="is_paid" />Paid qualifying visit</label><div className="admin-form-row"><label>Amount<input name="amount" type="number" min="0" step="0.01" defaultValue="500" /></label><label>Currency<input name="currency" defaultValue="RUB" pattern="[A-Z]{3}" /></label></div><button className="button button-primary" disabled={busy}>Save record</button></form></section><section className="admin-panel"><div className="admin-panel-heading"><div><p className="dashboard-kicker">Safe bulk action</p><h2>Booked members</h2></div></div>{meetups.map((meetup) => { const count = initial.bookings.filter((row) => row.meetup_id === meetup.id && row.status === "confirmed").length; return count ? <div className="bulk-row" key={meetup.id}><span><strong>{meetup.title}</strong><small>{count} confirmed</small></span><button onClick={() => bulkCheckIn(meetup.id)} disabled={busy}><Check />Check in all</button></div> : null; })}</section></div>}

      {tab === "rewards" && <div className="admin-two-column"><section className="admin-panel"><div className="admin-panel-heading"><div><p className="dashboard-kicker">Surprise and delight</p><h2>Issue special reward</h2></div></div><form className="admin-form" onSubmit={issueSpecial}><label>Member<select name="user_id" required>{members.map((row) => <option key={row.user_id} value={row.user_id}>{row.profile?.display_name || row.email}</option>)}</select></label><label>Reward name<input name="name" maxLength={120} required /></label><label>Reason<textarea name="reason" maxLength={500} required /></label><label>Description<textarea name="description" maxLength={2000} /></label><label>Optional expiry<input name="expires_at" type="datetime-local" /></label><button className="button button-primary" disabled={busy}><Plus />Issue reward</button></form></section><section className="admin-panel"><div className="admin-panel-heading"><div><p className="dashboard-kicker">Reward ledger</p><h2>Available rewards</h2></div></div><div className="reward-admin-list">{special.length ? special.map((reward) => <article key={reward.id}><Sparkles /><div><strong>{reward.name}</strong><p>{members.find((member) => member.user_id === reward.user_id)?.profile?.display_name ?? "Member"} · {reward.reason}</p></div><span>{reward.status}</span></article>) : <p className="admin-empty">No special rewards issued yet.</p>}</div></section></div>}

      {tab === "audit" && <section className="admin-panel"><div className="admin-panel-heading"><div><p className="dashboard-kicker">Append-only history</p><h2>Recent admin actions</h2></div></div><div className="audit-list">{initial.audit.map((row) => <div key={row.id}><span>{row.action}</span><strong>{row.target_table.replaceAll("_", " ")}</strong><p>{new Date(row.created_at).toLocaleString()} · {row.actor_user_id ? members.find((member) => member.user_id === row.actor_user_id)?.email ?? "Administrator" : "System operation"}</p></div>)}</div></section>}
    </section>
  </main>;
}

type MemberSummary = DirectoryRow & { profile?: ProfileRow; role: string; visits: number; paid: number; questions: number; favorites: number };
function MemberCards({ members, avatars, onRole, busy }: { members: MemberSummary[]; avatars: Record<string,string>; onRole: (id:string,role:string)=>void; busy:boolean }) {
  return <div className="admin-member-list">{members.map((member) => { const avatar = avatars[member.user_id] ?? member.profile?.avatar_url; return <article key={member.user_id}>{avatar ? <Image src={avatar} alt="" width={52} height={52} unoptimized /> : <span className="member-mini-avatar">{member.profile?.display_name?.[0]?.toUpperCase() ?? "G"}</span>}<div className="member-primary"><strong>{member.profile?.display_name || "Unnamed member"}</strong><p>{member.email}{member.email_verified && <ShieldCheck />}</p><small>{member.profile?.telegram_username ? `@${member.profile.telegram_username}` : "No Telegram username"}</small></div><div className="member-metrics"><span><b>{member.visits}</b> visits</span><span><b>{member.paid}</b> paid</span><span><b>{member.questions}</b> questions</span><span><b>{member.favorites}</b> favorites</span></div><div className="member-role"><span className={`admin-status ${member.role}`}>{member.role}</span><button onClick={() => onRole(member.user_id, member.role === "admin" ? "member" : "admin")} disabled={busy}>{member.role === "admin" ? "Make member" : "Make admin"}</button><Link href={`/admin/members/${member.user_id}`}>Details <ChevronRight /></Link></div></article>; })}</div>;
}

function MeetupForm({ value, setValue, onSubmit, busy }: { value: typeof emptyMeetup; setValue: (value: typeof emptyMeetup)=>void; onSubmit:(event:FormEvent<HTMLFormElement>)=>void; busy:boolean }) {
  const field = (key: keyof typeof emptyMeetup) => ({ value: value[key], onChange: (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => setValue({ ...value, [key]: event.target.value }) });
  return <section className="admin-panel"><div className="admin-panel-heading"><div><p className="dashboard-kicker">{value.id ? "Edit event" : "New event"}</p><h2>{value.id ? "Update meetup" : "Create meetup"}</h2></div>{value.id && <button onClick={() => setValue(emptyMeetup)}>Cancel edit</button>}</div><form className="admin-form" onSubmit={onSubmit}><label>Title<input {...field("title")} required maxLength={160} /></label><label>Description<textarea {...field("description")} maxLength={5000} /></label><div className="admin-form-row"><label>Starts<input {...field("starts_at")} type="datetime-local" required /></label><label>Ends<input {...field("ends_at")} type="datetime-local" required /></label></div><label>Time zone<input {...field("timezone")} required /></label><label>Venue<input {...field("location_name")} required /></label><label>Address<input {...field("address")} /></label><div className="admin-form-row"><label>Capacity<input {...field("capacity")} type="number" min="1" max="100" required /></label><label>Price<input {...field("price")} type="number" min="0" step="0.01" /></label><label>Currency<input {...field("currency")} pattern="[A-Z]{3}" /></label></div><div className="admin-form-row"><label>Booking opens<input {...field("booking_opens_at")} type="datetime-local" /></label><label>Booking closes<input {...field("booking_closes_at")} type="datetime-local" /></label></div><label>Status<select {...field("status")}><option value="draft">Draft</option><option value="published">Published</option><option value="cancelled">Cancelled</option><option value="completed">Completed</option></select></label><button className="button button-primary" disabled={busy}>{value.id ? "Save changes" : "Create meetup"}</button></form></section>;
}
