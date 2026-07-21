"use client";

import Image from "next/image";
import Link from "next/link";
import { Menu, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { navigation } from "@/lib/site-data";

export function Header({ onAuth }: { onAuth: () => void }) {
  const [open, setOpen] = useState(false);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const drawerRef = useRef<HTMLDivElement>(null);

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
          <button className="button button-small button-outline desktop-auth" onClick={onAuth}>Member access</button>
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
          <button className="button button-primary" onClick={() => { closeMenu(); onAuth(); }}>Login / Register</button>
          <p>English ON. <span>•</span> Sergiev Posad</p>
        </div>
      )}
    </header>
  );
}
