"use client";

import Image from "next/image";
import Link from "next/link";
import { Instagram, Send } from "lucide-react";
import { useState } from "react";
import { socialLinks } from "@/lib/site-data";

export function Footer() {
  const [socialsInteracted, setSocialsInteracted] = useState(false);

  return (
    <footer className="footer">
      <div className="footer-top">
        <div className="footer-brand">
          <Image src="/gsc-logo.jpg" alt="GSC logo" width={60} height={60} />
          <div><strong>Galstyan&apos;s Speaking Club</strong><span>English ON.</span></div>
        </div>
        <p>Speak English. Meet people.<br />Have fun.</p>
      </div>
      <div className="footer-bottom">
        <span>© 2026 Galstyan&apos;s Speaking Club</span>
        <div className="legal-links"><Link href="/privacy">Privacy</Link><Link href="/terms">Terms</Link><Link href="/cookies">Cookies</Link></div>
        <div className={`social-links${socialsInteracted ? " interacted" : ""}`} aria-label="Social media">
          {socialLinks.map((social) => <a className={`social-${social.label.toLowerCase()}`} key={social.label} href={social.href} target="_blank" rel="noreferrer" aria-label={`Follow GSC on ${social.label}`} onPointerDown={() => setSocialsInteracted(true)} onFocus={() => setSocialsInteracted(true)}>{social.label === "Telegram" ? <Send aria-hidden="true" /> : social.label === "Instagram" ? <Instagram aria-hidden="true" /> : <span aria-hidden="true">{social.label === "Threads" ? "@" : "VK"}</span>}</a>)}
        </div>
      </div>
    </footer>
  );
}
