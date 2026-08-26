"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { ChevronDown } from "lucide-react";
import { NotificationBell } from "@/components/notification-bell";
import type { ViewerNotification } from "@/lib/viewer";

const sections = [
  { href: "#overview", label: "Overview" },
  { href: "#rewards", label: "Rewards" },
  { href: "#bookings", label: "Bookings" },
  { href: "#attendance", label: "Attendance" },
  { href: "#settings", label: "Profile" },
];

export function MemberDashboardHeader({
  name,
  avatarUrl,
  isAdmin,
  notifications,
}: {
  name: string;
  avatarUrl: string | null;
  isAdmin: boolean;
  notifications: ViewerNotification[];
}) {
  const [active, setActive] = useState("#overview");
  const itemRefs = useRef<Record<string, HTMLAnchorElement | null>>({});
  const initial = name.trim().charAt(0).toUpperCase() || "G";

  useEffect(() => {
    function updateFromHash() {
      const hash = sections.some((section) => section.href === window.location.hash) ? window.location.hash : "#overview";
      setActive(hash);
      window.requestAnimationFrame(() => itemRefs.current[hash]?.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" }));
    }
    updateFromHash();
    window.addEventListener("hashchange", updateFromHash);
    return () => window.removeEventListener("hashchange", updateFromHash);
  }, []);

  return <>
    <header className="dashboard-topbar">
      <Link className="dashboard-brand" href="/">GSC <span>Member space</span></Link>
      <nav className="dashboard-public-nav" aria-label="Club navigation">
        <Link href="/questions">Questions</Link>
        <Link href="/meetups">Meetups</Link>
        <Link href="/community">Community</Link>
      </nav>
      <div className="dashboard-user-controls">
        <NotificationBell initialNotifications={notifications} />
        {isAdmin && <Link className="dashboard-admin-link" href="/admin">Admin</Link>}
        <details className="dashboard-account-menu">
          <summary aria-label="Open account menu">{avatarUrl ? <Image src={avatarUrl} alt="" width={34} height={34} unoptimized /> : <span>{initial}</span>}<b>Account</b><ChevronDown /></summary>
          <div>
            <strong>{name}</strong>
            <Link href="/account" aria-current="page">My account</Link>
            <Link href="#settings">Profile</Link>
            <Link href="#bookings">Meetups &amp; bookings</Link>
            {isAdmin && <Link href="/admin">Admin dashboard</Link>}
            <form action="/auth/signout" method="post"><button type="submit">Log out</button></form>
          </div>
        </details>
      </div>
    </header>
    <nav className="dashboard-section-nav" aria-label="Account sections">
      <div>{sections.map((section) => <Link
        ref={(node) => { itemRefs.current[section.href] = node; }}
        className={active === section.href ? "active" : undefined}
        aria-current={active === section.href ? "location" : undefined}
        href={section.href}
        key={section.href}
        onClick={() => setActive(section.href)}
      >{section.label}</Link>)}</div>
    </nav>
  </>;
}
