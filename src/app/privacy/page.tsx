import { LegalPage } from "@/components/legal-page";
import { pageMetadata } from "@/lib/seo";
export const metadata = pageMetadata("Privacy Policy", "Privacy information for accounts, meetups and practice records; proposed bilingual revision and published version.", "/privacy");
export default function Page() { return <LegalPage kind="privacy" />; }
