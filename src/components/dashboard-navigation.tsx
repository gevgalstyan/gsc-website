"use client";
import { ThemeToggle } from "@/components/theme-toggle";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Menu, X } from "lucide-react";
import { useDashboardLanguage } from "@/hooks/use-dashboard-language";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
export function DashboardNavigation({ admin = false }: { admin?: boolean }) {
  const { language, setLanguage } = useDashboardLanguage();
  const ru = language === "ru";
  const [open,setOpen] = useState(false); const [busy,setBusy] = useState(false); const [error,setError] = useState("");
  useEffect(()=>{ const close=(event:KeyboardEvent)=>{if(event.key==="Escape") setOpen(false);};window.addEventListener("keydown",close);return()=>window.removeEventListener("keydown",close);},[]);
  async function signOut() {
    if (busy) return; setBusy(true);setError("");
    try { const client=getSupabaseBrowserClient(); if(!client) throw new Error(); const result=await client.auth.signOut();if(result.error)throw result.error;window.location.replace("/"); }
    catch {setError(ru?"Не удалось выйти. Попробуй ещё раз.":"We couldn’t log you out. Please retry.");setBusy(false);}
  }
  return <header className="dashboard-navigation" lang={language}>
    <div className="dashboard-navigation-inner"><Link className="dashboard-navigation-brand" href="/" aria-label="Galstyan’s Speaking Club homepage"><Image src="/gsc-logo.jpg" alt="" width={42} height={42}/><span>Galstyan’s<small>Speaking Club</small></span></Link>
    <ThemeToggle compact />
    <label className="dashboard-language"><span className="sr-only">Dashboard language</span><select aria-label="Dashboard language" value={language} onChange={event=>setLanguage(event.target.value==="ru"?"ru":"en")}><option value="en">English</option><option value="ru">Русский</option></select></label>
    <button className="dashboard-menu-toggle" type="button" aria-expanded={open} aria-controls="dashboard-links" aria-label={open?"Close navigation":"Open navigation"} onClick={()=>setOpen(!open)}>{open?<X aria-hidden="true"/>:<Menu aria-hidden="true"/>}</button>
    <nav id="dashboard-links" className={open?"dashboard-links open":"dashboard-links"} aria-label="Member website navigation">
      <Link href="/" onClick={()=>setOpen(false)}>{ru?"Главная":"Home"}</Link><Link href="/meetups/" onClick={()=>setOpen(false)}>{ru?"Встречи клуба":"Speaking Club Meetups"}</Link><Link href="/questions/" onClick={()=>setOpen(false)}>{ru?"Вопросы на английском":"English Questions"}</Link><Link href="/account/" onClick={()=>setOpen(false)}>{ru?"Мой аккаунт":"My Account"}</Link>{admin&&<Link href="/admin/">Admin</Link>}
      <button type="button" onClick={()=>void signOut()} disabled={busy}>{busy?(ru?"Выход…":"Logging out…"):(ru?"Выйти":"Log out")}</button>
    </nav></div>{error&&<p role="status" className="dashboard-navigation-error">{error}</p>}
  </header>;
}
