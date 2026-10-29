import { EmailAuthForm } from "@/components/email-auth-form";
import styles from "@/components/email-auth.module.css";
export const metadata = { title: "Resend verification email", robots: { index: false, follow: false } };
export default function Page() { return <main className={styles.page}><EmailAuthForm initialMode="verify" /></main>; }
