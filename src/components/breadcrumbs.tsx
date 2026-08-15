import Link from "next/link";
import { StructuredData } from "@/components/structured-data";
import { absoluteUrl } from "@/lib/seo";

export function Breadcrumbs({ label, path }: { label: string; path: string }) {
  const data = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: absoluteUrl("/") },
      { "@type": "ListItem", position: 2, name: label, item: absoluteUrl(path) },
    ],
  };

  return (
    <>
      <nav className="breadcrumbs" aria-label="Breadcrumb">
        <Link href="/">Home</Link><span aria-hidden="true">/</span><span aria-current="page">{label}</span>
      </nav>
      <StructuredData data={data} />
    </>
  );
}
