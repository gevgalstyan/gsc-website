"use client";
import { useId, useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import styles from "./email-auth.module.css";
export function AuthPasswordInput({ name, label, error, autoComplete = "new-password" }: { name: string; label: string; error?: string; autoComplete?: string }) {
  const [visible, setVisible] = useState(false);
  const id = useId();
  return <div className={styles.field}><label htmlFor={id}>{label}</label><div className={styles.password}><input id={id} name={name} type={visible ? "text" : "password"} autoComplete={autoComplete} required minLength={8} aria-invalid={Boolean(error)} aria-describedby={error ? `${id}-error` : undefined} /><button type="button" onClick={() => setVisible(!visible)} aria-label={`${visible ? "Hide" : "Show"} ${label.toLowerCase()}`} aria-pressed={visible}>{visible ? <EyeOff size={18} /> : <Eye size={18} />}</button></div>{error && <small id={`${id}-error`} className={styles.error}>{error}</small>}</div>;
}
