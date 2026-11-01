"use client";
import { FormEvent, useEffect, useRef, useState } from "react";
import { missingProfileColumns, dataLoadExplanation } from "@/lib/profile-schema";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { validateDetails, type RegistrationDetails } from "@/lib/registration";
import { AuthProfileFields } from "./auth-profile-fields";
import styles from "./email-auth.module.css";
export function MemberPersonalDetails({ userId }: { userId: string }) {
  const [revision,setRevision] = useState(0);
  const [legacy,setLegacy] = useState(false);
  const [details, setDetails] = useState<RegistrationDetails | null>(null);
  const [email, setEmail] = useState(""); const [notice, setNotice] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({}); const [busy, setBusy] = useState(false); const lock = useRef(false);
  useEffect(() => {
    let active = true;
    void (async () => {
      try {
        const client = getSupabaseBrowserClient(); if (!client) return;
        const { data, error } = await client.from("profiles").select("first_name,surname,age,nationality,gender,email").eq("id", userId).maybeSingle();
        if (!active) return;
        if (error) { setLegacy(missingProfileColumns(error)); setNotice(missingProfileColumns(error) ? "Additional personal fields are not enabled yet. Your main profile settings are available below; no profile information has been removed." : dataLoadExplanation(error)); return; }
        if (!data) { setNotice("Your profile record could not be found. Contact the club so it can be checked without replacing your account."); return; }
        setLegacy(false); setNotice("");
        setEmail(data.email ?? ""); setDetails({ first_name: data.first_name ?? "", surname: data.surname ?? "", age: data.age == null ? "" : String(data.age), nationality: data.nationality ?? "", gender: data.gender ?? "" });
      } catch { if (active) setNotice("We couldn’t load your personal details. Please try again later."); }
    })(); return () => { active = false; };
  }, [userId,revision]);
  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); if (lock.current) return;
    const form = new FormData(event.currentTarget);
    const values = Object.fromEntries(["first_name", "surname", "age", "nationality", "gender"].map((key) => [key, String(form.get(key) ?? "").trim()])) as RegistrationDetails;
    const validation = validateDetails(values); setErrors(validation); if (Object.keys(validation).length) return;
    lock.current = true; setBusy(true); setNotice("");
    try {
      const result = await getSupabaseBrowserClient()?.from("profiles").update({ ...values, age: Number(values.age) }).eq("id", userId).select("id").single();
      setNotice(result && !result.error ? "Personal details saved." : "We couldn’t save your details. Please try again.");
    } catch { setNotice("We couldn’t reach the profile service. Please try again."); }
    finally { lock.current = false; setBusy(false); }
  }
  if (legacy) return null; // Optional fields are unavailable; the main profile editor remains usable.
  return <section className={styles.panel} style={{ maxWidth: "none", marginBottom: 24 }} aria-label="Personal details"><h2>Personal details</h2>{details && <form className={styles.form} noValidate onSubmit={save} aria-busy={busy}><p className={styles.intro}>Email: {email || "Available in your Auth account"}. Contact the club if you need help changing it.</p><fieldset disabled={busy}><AuthProfileFields errors={errors} initial={details} /></fieldset><button className={styles.primary} disabled={busy}>{busy ? "Saving…" : "Save personal details"}</button></form>}{notice && <p className={styles.notice} role="status">{notice}</p>}{!details && !legacy && <button className={styles.textButton} type="button" onClick={()=>setRevision(value=>value+1)}>Retry personal details</button>}</section>;
}
