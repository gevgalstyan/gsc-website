import { LegalPage } from "@/components/legal-page";
import { pageMetadata } from "@/lib/seo";
export const metadata = pageMetadata("Terms of Service", "Club participation, account and booking terms, with a proposed revision for owner review.", "/terms");
export default function Page() { return <LegalPage kind="terms" />; }
