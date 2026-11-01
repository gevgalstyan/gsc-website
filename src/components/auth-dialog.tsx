"use client";
/** Static-safe email access modal. Provider configuration remains in Supabase. */
import { X } from "lucide-react";
import { useEffect, useRef } from "react";
import { EmailAuthForm, type AuthMode } from "./email-auth-form";
export function AuthDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const dialogRef = useRef<HTMLElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (!open) return;
    const previous = document.activeElement as HTMLElement | null;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden"; closeRef.current?.focus();
    function keyDown(event: KeyboardEvent) {
      if (event.key === "Escape") { onClose(); return; }
      if (event.key !== "Tab" || !dialogRef.current) return;
      const items = Array.from(dialogRef.current.querySelectorAll<HTMLElement>('a[href],button:not(:disabled),input:not(:disabled),select:not(:disabled),iframe,[tabindex]:not([tabindex="-1"])')).filter((el) => el.getClientRects().length);
      if (!items.length) return;
      if (event.shiftKey && document.activeElement === items[0]) { event.preventDefault(); items[items.length - 1].focus(); }
      else if (!event.shiftKey && document.activeElement === items[items.length - 1]) { event.preventDefault(); items[0].focus(); }
    }
    window.addEventListener("keydown", keyDown);
    return () => { document.body.style.overflow = overflow; window.removeEventListener("keydown", keyDown); previous?.focus(); };
  }, [open, onClose]);
  if (!open) return null;
  const requested = new URLSearchParams(window.location.search).get("auth");
  const initialMode: AuthMode = requested === "register" ? "register" : requested === "forgot" ? "forgot" : "login";
  return <div className="modal-backdrop" onMouseDown={(e) => e.target === e.currentTarget && onClose()}><section ref={dialogRef} style={{ position: "relative", width: "min(560px, 100%)", maxHeight: "92svh", overflowY: "auto", borderRadius: 24 }} role="dialog" aria-modal="true" aria-labelledby="auth-title" aria-describedby="auth-description"><button ref={closeRef} type="button" className="dialog-close" style={{ zIndex: 1 }} onClick={onClose} aria-label="Close"><X /></button><EmailAuthForm initialMode={initialMode} headingLevel={2} /></section></div>;
}
