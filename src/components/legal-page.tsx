import Link from "next/link";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { Footer } from "@/components/footer";
import { Header } from "@/components/header";
import { getViewer } from "@/lib/viewer";

export async function LegalPage({ title, path, updated, children }: { title: string; path: string; updated: string; children: React.ReactNode }) {
  const viewer = await getViewer();
  return <><Header viewer={viewer} /><main className="legal-main"><Breadcrumbs label={title} path={path} /><span className="eyebrow">Legal</span><h1>{title}</h1><p className="legal-updated">Last updated: {updated}</p><article>{children}</article><Link className="button button-outline-dark legal-back-link" href="/">Back to GSC</Link></main><Footer /></>;
}
