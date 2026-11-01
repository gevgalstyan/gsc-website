"use client";
import { useSyncExternalStore } from "react";
// Shared by translated help, policies and dashboard surfaces.
export type DashboardLanguage = "en" | "ru";
const key = "gsc-language";
let memoryLanguage: DashboardLanguage = "en";
function read(): DashboardLanguage { try { return localStorage.getItem(key) === "ru" ? "ru" : "en"; } catch { return memoryLanguage; } }
function subscribe(change: () => void) {
  window.addEventListener("gsc-language-change", change); window.addEventListener("storage", change);
  return () => { window.removeEventListener("gsc-language-change", change); window.removeEventListener("storage", change); };
}
export function useDashboardLanguage() {
  const language = useSyncExternalStore(subscribe, read, () => "en" as const);
  function setLanguage(value: DashboardLanguage) { memoryLanguage = value; try { localStorage.setItem(key,value); } catch { /* storage may be disabled */ } window.dispatchEvent(new Event("gsc-language-change")); }
  return { language, setLanguage };
}
