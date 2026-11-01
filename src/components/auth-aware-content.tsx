"use client";
import Link from "next/link";
import { useBrowserViewer } from "@/hooks/use-browser-viewer";
import { useDashboardLanguage } from "@/hooks/use-dashboard-language";
/** Static HTML cannot resolve a localStorage session. These public blocks share the root viewer. */
export function ContactMemberAction() {
  const viewer = useBrowserViewer();
  const { language } = useDashboardLanguage(); const ru = language === "ru";
  if (viewer.authLoading) return <span aria-busy="true"><strong>{ru ? "Твой доступ" : "Your club access"}</strong><span role="status">{ru ? "Проверяем аккаунт…" : "Checking member access…"}</span></span>;
  const member = viewer.role !== "loggedOut";
  return <span lang={language}><strong>{member ? (ru ? "Твой личный кабинет" : "Your member space") : (ru ? "Хочешь присоединиться?" : "Ready to join?")}</strong><Link href={member ? "/account/" : "/signup/"}>{member ? (ru ? "Открыть профиль" : "Open your profile") : (ru ? "Создать аккаунт" : "Create your profile")}</Link>{member && <Link href="/meetups/">{ru ? "Посмотреть встречи" : "Explore upcoming meetups"}</Link>}{viewer.role === "admin" && <Link href="/admin/">{ru ? "Панель администратора" : "Admin dashboard"}</Link>}</span>;
}
export function MemberJourneyStep() {
  const viewer = useBrowserViewer();
  return <><h2>{viewer.authLoading ? "Your club space" : viewer.role === "loggedOut" ? "Register when ready" : "Use your dashboard"}</h2><p>{viewer.authLoading ? "Bookings, question progress, attendance, and rewards in one place." : viewer.role === "loggedOut" ? "Create an account when you want to book and save your progress. Public questions remain available without one." : "Your existing member space keeps bookings, question progress, attendance, and rewards together."}</p></>;
}
export function MemberAccountLink() {
  const viewer = useBrowserViewer(); const { language } = useDashboardLanguage();
  if (viewer.authLoading || viewer.role === "loggedOut") return null;
  return <Link className="button button-outline-dark" href="/account/">{language === "ru" ? "Мой аккаунт" : "My account"}</Link>;
}
