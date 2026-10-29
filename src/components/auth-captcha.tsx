"use client";
import Script from "next/script";
import { useEffect, useRef, useState } from "react";
import styles from "./email-auth.module.css";
type Turnstile = { render: (element: HTMLElement, options: Record<string, unknown>) => string; remove: (id: string) => void };
declare global { interface Window { turnstile?: Turnstile } }
export const CAPTCHA_SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY?.trim();
export const AUTH_UNAVAILABLE_MESSAGE = "Registration and sign-in are temporarily unavailable. No request or verification email has been sent. Please contact the club for help.";
export function AuthCaptcha({ onToken }: { onToken: (token: string) => void }) {
  const element = useRef<HTMLDivElement>(null);
  const [ready, setReady] = useState(false);
  const [compact, setCompact] = useState(() => typeof window !== "undefined" && window.matchMedia("(max-width: 380px)").matches);
  useEffect(() => {
    const query = window.matchMedia("(max-width: 380px)");
    const update = () => setCompact(query.matches);
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);
  const [error, setError] = useState("");
  useEffect(() => {
    if (!ready || !CAPTCHA_SITE_KEY || !element.current || !window.turnstile) return;
    let widget: string | undefined;
    let cancelled = false;
    void Promise.resolve().then(() => {
      if (cancelled || !element.current || !window.turnstile) return;
      onToken("");
      widget = window.turnstile.render(element.current, {
      sitekey: CAPTCHA_SITE_KEY, theme: "dark", size: compact ? "compact" : "flexible",
      callback: (token: string) => { setError(""); onToken(token); },
      "expired-callback": () => { onToken(""); setError("Verification expired. Please complete the security check again."); },
      "error-callback": () => { onToken(""); setError("The security check could not load. Check your connection or reload the page."); },
      });
    }).catch(() => {
      if (!cancelled) { onToken(""); setError("The security check could not start. Please reload and try again later."); }
    });
    return () => { cancelled = true; if (widget) window.turnstile?.remove(widget); };
  }, [ready, onToken, compact]);
  if (!CAPTCHA_SITE_KEY) return <p className={styles.notice} role="status">{AUTH_UNAVAILABLE_MESSAGE}</p>;
  return <div className={styles.captcha}><Script src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit" strategy="afterInteractive" onReady={() => setReady(true)} onError={() => { onToken(""); setError("The security check could not load. Please reload and try again."); }} /><div ref={element} />{error && <p className={styles.error} role="alert">{error}</p>}</div>;
}
