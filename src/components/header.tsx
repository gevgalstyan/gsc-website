"use client";

import Image from "next/image";
import Link from "next/link";
import { ChevronDown, Menu, UserCircle, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { navigation } from "@/lib/site-data";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

export function Header({ onAuth, authenticated = false }: { onAuth?: () => void; authenticated?: boolean }) {
  const [open, setOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(authenticated);
  const [profile, setProfile] = useState<{ name: string; avatarUrl: string | null }>({ name: "GSC member", avatarUrl: null });
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const drawerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const configuredClient = getSupabaseBrowserClient();
    if (!configuredClient) return;
    const client = configuredClient;
    let mounted = true;

    async function loadProfile() {
      const { data } = await client.auth.getClaims();
      const claims = data?.claims as Record<string, unknown> | undefined;
      const userId = typeof claims?.sub === "string" ? claims.sub : null;
      if (!userId || !mounted) {
        if (mounted) setIsAuthenticated(false);
        return;
      }
      const metadata = claims?.user_metadata as Record<string, unknown> | undefined;
      const { data: profileRow } = await client.from("profiles").select("display_name,avatar_url").eq("id", userId).maybeSingle();
      if (!mounted) return;
      const name = typeof profileRow?.display_name === "string" && profileRow.display_name.trim()
        ? profileRow.display_name
        : typeof metadata?.full_name === "string" && metadata.full_name.trim()
          ? metadata.full_name
          : typeof metadata?.name === "string" && metadata.name.trim()
            ? metadata.name
            : "GSC member";
      const avatarUrl = typeof profileRow?.avatar_url === "string" ? profileRow.avatar_url : typeof metadata?.avatar_url === "string" ? metadata.avatar_url : null;
      setProfile({ name, avatarUrl });
      setIsAuthenticated(true);
    }

    void loadProfile();
    const { data: authState } = client.auth.onAuthStateChange(() => { void loadProfile(); });
    return () => { mounted = false; authState.subscription.unsubscribe(); };
  }, []);

  useEffect(() => {
    if (!open) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    drawerRef.current?.querySelector<HTMLElement>("button")?.focus();

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
        menuButtonRef.current?.focus();
        return;
      }

      if (event.key !== "Tab" || !drawerRef.current) return;
      const focusable = drawerRef.current.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])',
      );
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  function closeMenu() {
    setOpen(false);
  }

  function openAuth() {
    if (onAuth) onAuth();
  }

  const profileInitial = profile.name.trim().charAt(0).toUpperCase() || "G";
  const profileControl = <div className="profile-control">
    <button className="profile-trigger" type="button" aria-expanded={profileOpen} aria-haspopup="menu" onClick={() => setProfileOpen((value) => !value)}>
      {profile.avatarUrl ? <Image src={profile.avatarUrl} alt="" width={34} height={34} unoptimized /> : <span>{profileInitial}</span>}
      <b>{profile.name}</b><ChevronDown size={15} />
    </button>
    {profileOpen && <div className="profile-menu" role="menu">
      <Link href="/account" role="menuitem" onClick={() => setProfileOpen(false)}>My profile</Link>
      <Link href="/account#bookings" role="menuitem" onClick={() => setProfileOpen(false)}>My bookings</Link>
      <Link href="/account#attendance" role="menuitem" onClick={() => setProfileOpen(false)}>Attendance</Link>
      <Link href="/account#rewards" role="menuitem" onClick={() => setProfileOpen(false)}>Rewards</Link>
      <Link href="/account#settings" role="menuitem" onClick={() => setProfileOpen(false)}>Settings</Link>
      <form action="/auth/signout" method="post"><button type="submit" role="menuitem">Log out</button></form>
    </div>}
  </div>;

  return (
    <header className="site-header">
      <div className="header-inner">
        <Link className="wordmark" href="/#home" aria-label="GSC home">
          <Image src="/gsc-logo.jpg" alt="Galstyan's Speaking Club logo" width={48} height={48} priority />
          <span><b>Galstyan&apos;s</b><small>Speaking Club</small></span>
        </Link>
        <nav className="desktop-nav" aria-label="Main navigation">
          {navigation.map((item) => <Link key={item.href} href={item.href}>{item.label}</Link>)}
        </nav>
        <div className="header-actions">
          {isAuthenticated ? profileControl : onAuth ? <button className="button button-small button-outline desktop-auth" onClick={openAuth}>Member access</button> : <Link className="button button-small button-outline desktop-auth" href="/?auth=login">Member access</Link>}
          <button ref={menuButtonRef} className="menu-button" onClick={() => setOpen(true)} aria-label="Open menu" aria-expanded={open} aria-controls="mobile-navigation"><Menu /></button>
        </div>
      </div>
      {open && (
        <div ref={drawerRef} id="mobile-navigation" className="mobile-drawer" role="dialog" aria-modal="true" aria-label="Navigation menu">
          <div className="drawer-head">
            <span className="eyebrow">Navigate</span>
            <button className="menu-button" onClick={() => { closeMenu(); menuButtonRef.current?.focus(); }} aria-label="Close menu"><X /></button>
          </div>
          <nav aria-label="Mobile navigation">
            {navigation.map((item, index) => (
              <Link key={item.href} href={item.href} onClick={closeMenu}>
                <span>0{index + 1}</span>{item.label}
              </Link>
            ))}
          </nav>
          {isAuthenticated ? <><Link className="mobile-profile-link" href="/account" onClick={closeMenu}><UserCircle size={18} />{profile.name}&apos;s dashboard</Link><Link className="mobile-profile-link" href="/account#bookings" onClick={closeMenu}>My bookings</Link><Link className="mobile-profile-link" href="/account#attendance" onClick={closeMenu}>Attendance & rewards</Link><form action="/auth/signout" method="post"><button className="button button-primary" type="submit">Log out</button></form></> : onAuth ? <button className="button button-primary" onClick={() => { closeMenu(); openAuth(); }}>Member access</button> : <Link className="button button-primary" href="/?auth=login" onClick={closeMenu}>Member access</Link>}
          <p>English ON. <span>•</span> Sergiev Posad</p>
        </div>
      )}
    </header>
  );
}
