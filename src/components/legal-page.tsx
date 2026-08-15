import Link from "next/link";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { Footer } from "@/components/footer";
import { Header } from "@/components/header";

export function LegalPage({ title, path, updated, children }: { title: string; path: string; updated: string; children: React.ReactNode }) {
  return <><Header /><main className="legal-main"><Breadcrumbs label={title} path={path} /><span className="eyebrow">Legal</span><h1>{title}</h1><p className="legal-updated">Last updated: {updated}</p><article>{children}</article><Link className="button button-outline-dark legal-back-link" href="/">Back to GSC</Link></main><Footer /></>;
}
