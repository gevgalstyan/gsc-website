"use client";

import { Moon, Sun } from "lucide-react";
import { useSyncExternalStore } from "react";

type Theme = "light" | "dark";

function currentTheme(): Theme {
  return document.documentElement.dataset.theme === "dark" ? "dark" : "light";
}

export function ThemeToggle({ compact = false }: { compact?: boolean }) {
  const theme = useSyncExternalStore(
    (onStoreChange) => {
      window.addEventListener("gsc-theme-change", onStoreChange);
      return () => window.removeEventListener("gsc-theme-change", onStoreChange);
    },
    currentTheme,
    () => "light",
  );

  function toggleTheme() {
    const next = currentTheme() === "dark" ? "light" : "dark";
    document.documentElement.dataset.theme = next;
    document.documentElement.style.colorScheme = next;
    localStorage.setItem("gsc-theme", next);
    window.dispatchEvent(new Event("gsc-theme-change"));
  }

  const isDark = theme === "dark";
  return <button className={`theme-toggle${compact ? " theme-toggle-compact" : ""}`} type="button" onClick={toggleTheme} aria-label={`Switch to ${isDark ? "light" : "dark"} mode`} title={`Switch to ${isDark ? "light" : "dark"} mode`}>
    {isDark ? <Sun aria-hidden="true" /> : <Moon aria-hidden="true" />}
    {!compact && <span>{isDark ? "Light" : "Dark"}</span>}
  </button>;
}
