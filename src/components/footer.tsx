"use client";

import Image from "next/image";
import Link from "next/link";
import { Instagram, Send } from "lucide-react";
import { useEffect, useState } from "react";
import { socialLinks } from "@/lib/site-data";

export function Footer() {
  const [socialsInteracted, setSocialsInteracted] = useState(false);
  const [settings, setSettings] = useState<Record<string, string>>({});

  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/public-content", { signal: controller.signal, cache: "force-cache" })
      .then((response) => response.ok ? response.json() : Promise.reject(new Error("Settings unavailable")))
      .then((payload: { content?: Record<string, string> }) => setSettings(payload.content ?? {}))
      .catch(() => undefined);
    return () => controller.abort();
  }, []);

  const logo = settings["settings.logo"]?.startsWith("/") || settings["settings.logo"]?.startsWith("https://vmvsxxtaqtvaotrooafq.supabase.co/storage/v1/object/public/site-media/") ? settings["settings.logo"] : "/gsc-logo.jpg";

  return (
    <footer className="footer">
      <div className="footer-top">
        <div className="footer-brand">
          <Image src={logo} alt="Galstyan’s Speaking Club logo" width={60} height={60} />
          <div><strong>{settings["settings.club_name"] || "Galstyan’s Speaking Club"}</strong><span>English ON.</span></div>
        </div>
        <p>Speak English. Meet people.<br />Have fun.</p>
      </div>
      <div className="footer-bottom">
          <span>© {new Date().getFullYear()} Galstyan&apos;s Speaking Club</span>
        <nav className="legal-links" aria-label="Footer navigation"><Link href="/about">About</Link><Link href="/meetups">Meetups</Link><Link href="/questions">Questions</Link><Link href="/how-it-works">How it works</Link><Link href="/community">Community</Link><Link href="/membership">Membership</Link><Link href="/faq">FAQ</Link><Link href="/contact">Contact</Link><Link href="/privacy">Privacy</Link><Link href="/terms">Terms</Link><Link href="/cookies">Cookies</Link></nav>
        <div className={`social-links${socialsInteracted ? " interacted" : ""}`} aria-label="Social media">
          {socialLinks.map((social) => <a className={`social-${social.label.toLowerCase()}`} key={social.label} href={settings[`settings.${social.label.toLowerCase()}_url`] || social.href} target="_blank" rel="noreferrer" aria-label={`Follow GSC on ${social.label}`} onPointerDown={() => setSocialsInteracted(true)} onFocus={() => setSocialsInteracted(true)}>{social.label === "Telegram" ? <Send aria-hidden="true" /> : social.label === "Instagram" ? <Instagram aria-hidden="true" /> : <span aria-hidden="true">{social.label === "Threads" ? "@" : "VK"}</span>}</a>)}
        </div>
      </div>
    </footer>
  );
}
