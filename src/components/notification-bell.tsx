"use client";

/** Displays member notifications and persists read state through Supabase. */

import { useEffect, useRef, useState } from "react";
import { Bell, Check, CheckCheck } from "lucide-react";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { notificationTarget } from "@/lib/notification-target";

type Notification = { id: string; kind: string; title: string; body: string; meetup_id: string | null; booking_id: string | null; target_url: string | null; read_at: string | null; created_at: string };

// ======================================================
// NOTIFICATIONS
// ======================================================
export function NotificationBell({ initialNotifications }: { initialNotifications: Notification[] }) {
  const [items, setItems] = useState(initialNotifications);
  const [open, setOpen] = useState(false);
  const [notice, setNotice] = useState("");
  const [now] = useState(() => Date.now());
  const wrapRef = useRef<HTMLDivElement>(null);
  const unread = items.filter((item) => !item.read_at).length;

  useEffect(() => {
    if (!open) return;
    function close(event: MouseEvent) {
      if (!wrapRef.current?.contains(event.target as Node)) setOpen(false);
    }
    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", close);
    window.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("mousedown", close);
      window.removeEventListener("keydown", closeOnEscape);
    };
  }, [open]);

  async function markRead(id: string) {
    const client = getSupabaseBrowserClient();
    if (!client) return;
    const { error } = await client.from("notifications").update({ read_at: new Date().toISOString() }).eq("id", id);
    if (error) {
      setNotice("Couldn’t update this notification. Try again.");
      return;
    }
    setNotice("");
    setItems((current) => current.map((item) => item.id === id ? { ...item, read_at: new Date().toISOString() } : item));
  }

  async function markAllRead() {
    const unreadIds = items.filter((item) => !item.read_at).map((item) => item.id);
    if (!unreadIds.length) return;
    const client = getSupabaseBrowserClient();
    if (!client) return;
    const readAt = new Date().toISOString();
    const { error } = await client.from("notifications").update({ read_at: readAt }).in("id", unreadIds);
    if (error) {
      setNotice("Couldn’t update your notifications. Try again.");
      return;
    }
    setNotice("");
    setItems((current) => current.map((item) => item.read_at ? item : { ...item, read_at: readAt }));
  }

  async function openNotification(item: Notification) {
    setOpen(false);
    await markRead(item.id);
    const target = notificationTarget(item);
    if (target) window.location.assign(target);
  }

  function timestamp(value: string) {
    const seconds = Math.max(0, Math.floor((now - new Date(value).getTime()) / 1000));
    if (seconds < 60) return "Just now";
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    return new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short" }).format(new Date(value));
  }

  return <div className="notification-wrap" ref={wrapRef}><button className="notification-trigger" type="button" aria-expanded={open} aria-haspopup="dialog" aria-controls="club-notifications" aria-label={unread ? `${unread} unread notifications` : "Notifications"} onClick={() => setOpen(!open)}><Bell size={18} />{unread > 0 && <span>{unread}</span>}</button>{open && <div className="notification-popover" id="club-notifications" role="dialog" aria-label="Notifications"><div className="notification-popover-heading"><strong>Club updates</strong>{unread > 0 && <button type="button" onClick={() => void markAllRead()}><CheckCheck size={15} />Mark all read</button>}</div>{notice && <p className="notification-error" role="status">{notice}</p>}{items.length ? items.slice(0, 8).map((item) => <button className={`notification-item ${item.read_at ? "read" : ""}`} key={item.id} type="button" onClick={() => void openNotification(item)} aria-label={`${item.title}. ${item.body}. ${timestamp(item.created_at)}`}><span><b>{item.title}</b><small>{item.body}</small><time dateTime={item.created_at}>{timestamp(item.created_at)}</time></span>{!item.read_at && <Check aria-label="Unread" size={15} />}</button>) : <p className="notification-empty">No new updates yet.</p>}</div>}</div>;
}
