"use client";

/**
 * Auth-aware public header for desktop and mobile navigation.
 * It owns drawer focus/scroll behavior and the compact signed-in profile menu.
 */

import Image from "next/image";
import Link from "next/link";
import { ChevronDown, Menu, UserCircle, X } from "lucide-react";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { NotificationBell } from "@/components/notification-bell";
import { ThemeToggle } from "@/components/theme-toggle";
import { navigation } from "@/lib/site-data";
import type { Viewer } from "@/lib/viewer";

// ======================================================
// DESKTOP / MOBILE NAVIGATION
// ======================================================
export function Header({ onAuth, viewer }: { onAuth?: () => void; viewer: Viewer }) {
  const [open, setOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [activeSection, setActiveSection] = useState("home");
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const drawerRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);
  const activeSectionRef = useRef("home");
  const pathname = usePathname();
  const isAuthenticated = viewer.role !== "loggedOut";

  // Homepage items are real in-page destinations. A narrow observer band below the
  // sticky header selects the section occupying the reader's primary viewport area.
  useEffect(() => {
    if (pathname !== "/") return;
    let observer: IntersectionObserver | undefined;
    let animationFrame = 0;
    const onScroll = () => {
      if (animationFrame) return;
      animationFrame = window.requestAnimationFrame(syncActiveSection);
    };
    const syncActiveSection = () => {
      animationFrame = 0;
      const sections = navigation.flatMap((item) => {
        const element = item.sectionId ? document.getElementById(item.sectionId) : null;
        return element ? [element] : [];
      });
      const activationLine = 116;
      const next = sections.find((element) => {
        const rect = element.getBoundingClientRect();
        return rect.top <= activationLine && rect.bottom > activationLine;
      })?.id ?? sections.find((element) => element.getBoundingClientRect().top > activationLine)?.id ?? "home";
      if (activeSectionRef.current === next) return;
      activeSectionRef.current = next;
      window.history.replaceState(null, "", next === "home" ? "/" : `/#${next}`);
      setActiveSection(next);
    };
    let setupRetry = 0;
    const setup = () => {
      const sections = navigation.flatMap((item) => {
        const element = item.sectionId ? document.getElementById(item.sectionId) : null;
        return element ? [element] : [];
      });
      if (!sections.length) { setupRetry = window.setTimeout(setup, 100); return; }
      observer = new IntersectionObserver(syncActiveSection, { rootMargin: "-96px 0px -86% 0px", threshold: 0 });
      sections.forEach((section) => observer?.observe(section));
      window.addEventListener("scroll", onScroll, { passive: true });
      syncActiveSection();
    };
    const setupFrame = window.requestAnimationFrame(setup);
    return () => { observer?.disconnect(); window.removeEventListener("scroll", onScroll); window.cancelAnimationFrame(animationFrame); window.cancelAnimationFrame(setupFrame); window.clearTimeout(setupRetry); };
  }, [pathname]);

  // Locks background scrolling and traps keyboard focus while the mobile drawer is open.
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

  // Closes the desktop profile menu after an outside click or Escape key.
  useEffect(() => {
    if (!profileOpen) return;
    function closeProfile(event: MouseEvent) {
      if (!profileRef.current?.contains(event.target as Node)) setProfileOpen(false);
    }
    function closeProfileOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") setProfileOpen(false);
    }
    document.addEventListener("mousedown", closeProfile);
    window.addEventListener("keydown", closeProfileOnEscape);
    return () => {
      document.removeEventListener("mousedown", closeProfile);
      window.removeEventListener("keydown", closeProfileOnEscape);
    };
  }, [profileOpen]);

  function closeMenu() {
    setOpen(false);
  }

  function openAuth() {
    if (onAuth) onAuth();
  }

  function isActive(item: (typeof navigation)[number]) {
    return pathname === "/" ? item.sectionId === activeSection : item.href === "/" ? pathname === "/" : pathname === item.href || pathname.startsWith(`${item.href}/`);
  }

  function itemHref(item: (typeof navigation)[number]) {
    if (!item.sectionId) return item.href;
    return pathname === "/" ? `#${item.sectionId}` : `/#${item.sectionId}`;
  }

  const profileInitial = viewer.name.trim().charAt(0).toUpperCase() || "G";
  const profileControl = <div className="profile-control" ref={profileRef}>
    <button className="profile-trigger" type="button" aria-expanded={profileOpen} aria-haspopup="menu" onClick={() => setProfileOpen((value) => !value)}>
      {viewer.avatarUrl ? <Image src={viewer.avatarUrl} alt="" width={34} height={34} unoptimized /> : <span>{profileInitial}</span>}
      <b>{viewer.name}</b><ChevronDown size={15} />
    </button>
    {profileOpen && <div className="profile-menu" role="menu">
      <Link href="/account" role="menuitem" onClick={() => setProfileOpen(false)}>My account</Link>
      <Link href="/account#settings" role="menuitem" onClick={() => setProfileOpen(false)}>Profile</Link>
      <Link href="/account#bookings" role="menuitem" onClick={() => setProfileOpen(false)}>Meetups &amp; bookings</Link>
      {viewer.role === "admin" && <Link href="/admin" role="menuitem" onClick={() => setProfileOpen(false)}>Admin dashboard</Link>}
      <form action="/auth/signout" method="post"><button type="submit" role="menuitem">Log out</button></form>
    </div>}
  </div>;

  return (
    <header className="site-header">
      <div className="header-inner">
        <Link className="wordmark" href="/#home" aria-label="GSC home">
          <Image src="/gsc-logo.jpg" alt="Galstyan's Speaking Club logo" width={48} height={48} loading="eager" />
          <span><b>Galstyan&apos;s</b><small>Speaking Club</small></span>
        </Link>
        <nav className="desktop-nav" aria-label="Main navigation">
          {navigation.map((item) => <Link className={isActive(item) ? "active" : undefined} aria-current={isActive(item) ? pathname === "/" ? "location" : "page" : undefined} key={item.href} href={itemHref(item)} onClick={() => { if (item.sectionId && pathname === "/") { activeSectionRef.current = item.sectionId; setActiveSection(item.sectionId); } }}>{item.label}</Link>)}
        </nav>
        <div className="header-actions">
          <ThemeToggle compact />
          {isAuthenticated && <NotificationBell initialNotifications={viewer.notifications} />}
          {isAuthenticated ? profileControl : onAuth ? <button className="button button-small button-outline desktop-auth" onClick={openAuth}>Join / Login</button> : <Link className="button button-small button-outline desktop-auth" href="/?auth=login">Join / Login</Link>}
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
              <Link className={isActive(item) ? "active" : undefined} aria-current={isActive(item) ? pathname === "/" ? "location" : "page" : undefined} key={item.href} href={itemHref(item)} onClick={() => { if (item.sectionId && pathname === "/") { activeSectionRef.current = item.sectionId; setActiveSection(item.sectionId); } closeMenu(); }}>
                <span>0{index + 1}</span>{item.label}
              </Link>
            ))}
          </nav>
          {isAuthenticated ? <div className="mobile-account-panel">
            <div className="mobile-account-heading">{viewer.avatarUrl ? <Image src={viewer.avatarUrl} alt="" width={38} height={38} unoptimized /> : <span>{profileInitial}</span>}<div><small>Signed in as</small><strong>{viewer.name}</strong></div></div>
            <Link className="mobile-profile-link" href="/account" onClick={closeMenu}><UserCircle size={18} />My account</Link>
            <Link className="mobile-profile-link" href="/account#settings" onClick={closeMenu}>Profile</Link>
            <Link className="mobile-profile-link" href="/account#bookings" onClick={closeMenu}>Meetups &amp; bookings</Link>
            {viewer.role === "admin" && <Link className="mobile-profile-link" href="/admin" onClick={closeMenu}>Admin dashboard</Link>}
            <form action="/auth/signout" method="post"><button className="mobile-logout" type="submit">Log out</button></form>
          </div> : onAuth ? <button className="button button-primary mobile-auth-action" onClick={() => { closeMenu(); openAuth(); }}>Join / Login</button> : <Link className="button button-primary mobile-auth-action" href="/?auth=login" onClick={closeMenu}>Join / Login</Link>}
          <p>English ON. <span>•</span> Sergiev Posad</p>
        </div>
      )}
    </header>
  );
}
