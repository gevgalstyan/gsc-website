"use client";
import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { EmailLinkConfirmation } from "@/components/email-link-confirmation";
function ConfirmEmail() {
  const params = useSearchParams();
  const [link] = useState(() => ({ tokenHash: params.get("token_hash") ?? "", type: params.get("type") ?? "", next: params.get("next") }));
  return <EmailLinkConfirmation {...link} />;
}
export default function Page() { return <Suspense fallback={<main>Loading secure verification…</main>}><ConfirmEmail /></Suspense>; }
