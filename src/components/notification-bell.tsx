"use client";

/** Displays member notifications and persists read state through Supabase. */

import { useEffect, useRef, useState } from "react";
import { Bell, Check } from "lucide-react";
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

  return <div className="notification-wrap" ref={wrapRef}><button className="notification-trigger" type="button" aria-expanded={open} aria-haspopup="dialog" aria-label={unread ? `${unread} unread notifications` : "Notifications"} onClick={() => setOpen(!open)}><Bell size={18} />{unread > 0 && <span>{unread}</span>}</button>{open && <div className="notification-popover" role="dialog" aria-label="Notifications"><strong>Club updates</strong>{notice && <p className="notification-error" role="status">{notice}</p>}{items.length ? items.slice(0, 6).map((item) => <button className={`notification-item ${item.read_at ? "read" : ""}`} key={item.id} type="button" onClick={() => markRead(item.id)}><span><b>{item.title}</b><small>{item.body}</small></span>{!item.read_at && <Check size={15} />}</button>) : <p>No new club updates.</p>}</div>}</div>;
}
