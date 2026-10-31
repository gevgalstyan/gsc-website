"use client";
import { useSyncExternalStore } from "react";
// No site-wide language preference existed. Shared across dashboard surfaces, not the loyalty card alone.
export type DashboardLanguage = "en" | "ru";
const key = "gsc-language";
function read(): DashboardLanguage { try { return localStorage.getItem(key) === "ru" ? "ru" : "en"; } catch { return "en"; } }
function subscribe(change: () => void) {
  window.addEventListener("gsc-language-change", change); window.addEventListener("storage", change);
  return () => { window.removeEventListener("gsc-language-change", change); window.removeEventListener("storage", change); };
}
export function useDashboardLanguage() {
  const language = useSyncExternalStore(subscribe, read, () => "en" as const);
  function setLanguage(value: DashboardLanguage) { try { localStorage.setItem(key,value); } catch { /* storage may be disabled */ } window.dispatchEvent(new Event("gsc-language-change")); }
  return { language, setLanguage };
}
