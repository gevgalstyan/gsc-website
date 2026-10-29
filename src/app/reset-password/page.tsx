import Image from "next/image";
import { PasswordResetForm } from "@/components/password-reset-form";
import styles from "@/components/email-auth.module.css";
export const metadata = { robots: { index: false, follow: false } };
export default function ResetPasswordPage() {
  return <main className={styles.page}><section className={styles.panel}><Image className={styles.logo} src="/gsc-logo.jpg" alt="Galstyan’s Speaking Club" width={62} height={62} /><span className={styles.eyebrow}>GSC member space</span><h1>Choose a new password</h1><p className={styles.intro}>A fresh start for your member account.</p><PasswordResetForm /></section></main>;
}
