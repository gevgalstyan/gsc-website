"use client";

/** Displays member notifications and persists read state through Supabase. */

import { useEffect, useRef, useState } from "react";
import { Bell, Check, CheckCheck } from "lucide-react";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

type Notification = { id: string; title: string; body: string; read_at: string | null; created_at: string };

// ======================================================
// NOTIFICATIONS
// ======================================================
export function NotificationBell({ initialNotifications }: { initialNotifications: Notification[] }) {
  const [items, setItems] = useState(initialNotifications);
  const [open, setOpen] = useState(false);
  const [notice, setNotice] = useState("");
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

  return <div className="notification-wrap" ref={wrapRef}><button className="notification-trigger" type="button" aria-expanded={open} aria-haspopup="dialog" aria-label={unread ? `${unread} unread notifications` : "Notifications"} onClick={() => setOpen(!open)}><Bell size={18} />{unread > 0 && <span>{unread}</span>}</button>{open && <div className="notification-popover" role="dialog" aria-label="Notifications"><div className="notification-popover-heading"><strong>Club updates</strong>{unread > 0 && <button type="button" onClick={markAllRead}><CheckCheck size={15} />Mark all read</button>}</div>{notice && <p className="notification-error" role="status">{notice}</p>}{items.length ? items.slice(0, 6).map((item) => <button className={`notification-item ${item.read_at ? "read" : ""}`} key={item.id} type="button" onClick={() => markRead(item.id)}><span><b>{item.title}</b><small>{item.body}</small></span>{!item.read_at && <Check size={15} />}</button>) : <p className="notification-empty">No new club updates. We’ll keep this space useful, not noisy.</p>}</div>}</div>;
}
