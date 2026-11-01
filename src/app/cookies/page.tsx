import { LegalPage } from "@/components/legal-page";
import { pageMetadata } from "@/lib/seo";
export const metadata = pageMetadata("Cookies and Browser Storage", "How sessions, preferences, question progress and security use browser storage at GSC.", "/cookies");
export default function Page() { return <LegalPage kind="cookies" />; }
