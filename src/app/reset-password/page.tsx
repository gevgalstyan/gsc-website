import Link from "next/link";
import { PasswordResetForm } from "@/components/password-reset-form";

export const metadata = { robots: { index: false, follow: false } };

export default function ResetPasswordPage() {
  return <main className="auth-page"><section className="account-card"><span className="eyebrow">GSC member space</span><h1>Choose a new password</h1><PasswordResetForm /><Link className="text-link" href="/">Back to the club</Link></section></main>;
}
