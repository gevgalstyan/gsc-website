import Image from "next/image";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Footer } from "@/components/footer";

export function LegalPage({ title, updated, children }: { title: string; updated: string; children: React.ReactNode }) {
  return <><header className="legal-header"><Link className="wordmark" href="/"><Image src="/gsc-logo.jpg" alt="GSC logo" width={44} height={44} /><span><b>Galstyan&apos;s</b><small>Speaking Club</small></span></Link><Link href="/"><ArrowLeft /> Back home</Link></header><main className="legal-main"><span className="eyebrow">Legal</span><h1>{title}</h1><p className="legal-updated">Last updated: {updated}</p><article>{children}</article></main><Footer /></>;
}
