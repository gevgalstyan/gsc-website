"use client";

import { useState } from "react";
import { Bell, Check } from "lucide-react";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

type Notification = { id: string; title: string; body: string; read_at: string | null; created_at: string };

export function NotificationBell({ initialNotifications }: { initialNotifications: Notification[] }) {
  const [items, setItems] = useState(initialNotifications);
  const [open, setOpen] = useState(false);
  const unread = items.filter((item) => !item.read_at).length;

  async function markRead(id: string) {
    const client = getSupabaseBrowserClient();
    if (!client) return;
    await client.from("notifications").update({ read_at: new Date().toISOString() }).eq("id", id);
    setItems((current) => current.map((item) => item.id === id ? { ...item, read_at: new Date().toISOString() } : item));
  }

  return <div className="notification-wrap"><button className="notification-trigger" type="button" aria-expanded={open} aria-label={`${unread} unread notifications`} onClick={() => setOpen(!open)}><Bell size={18} />{unread > 0 && <span>{unread}</span>}</button>{open && <div className="notification-popover" role="dialog" aria-label="Notifications"><strong>Club updates</strong>{items.length ? items.slice(0, 6).map((item) => <button className={`notification-item ${item.read_at ? "read" : ""}`} key={item.id} type="button" onClick={() => markRead(item.id)}><span><b>{item.title}</b><small>{item.body}</small></span>{!item.read_at && <Check size={15} />}</button>) : <p>No new club updates.</p>}</div>}</div>;
}
