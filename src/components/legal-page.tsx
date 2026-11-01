import { Footer } from "@/components/footer";
import { Header } from "@/components/header";
import { LegalDocument } from "@/components/legal-document";
import { getViewer } from "@/lib/viewer";
import type { LegalKind } from "@/lib/legal-data";
export async function LegalPage({ kind }: { kind: LegalKind }) {
  const viewer = await getViewer();
  return <><Header viewer={viewer} /><LegalDocument kind={kind} /><Footer /></>;
}
