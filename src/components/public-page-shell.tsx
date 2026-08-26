/** Shared server-rendered shell for public pages with viewer-aware navigation. */

import { Footer } from "@/components/footer";
import { Header } from "@/components/header";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { getViewer } from "@/lib/viewer";

// ======================================================
// PUBLIC PAGES — SHARED AUTH-AWARE SHELL
// ======================================================
export async function PublicPageShell({
  eyebrow,
  title,
  intro,
  breadcrumbLabel,
  breadcrumbPath,
  children,
}: {
  eyebrow: string;
  title: string;
  intro: string;
  breadcrumbLabel: string;
  breadcrumbPath: string;
  children: React.ReactNode;
}) {
  const viewer = await getViewer();
  return (
    <>
      <Header viewer={viewer} />
      <main className="public-page">
        <section className="public-hero section">
          <Breadcrumbs label={breadcrumbLabel} path={breadcrumbPath} />
          <span className="eyebrow"><i />{eyebrow}</span>
          <h1>{title}</h1>
          <p>{intro}</p>
        </section>
        {children}
      </main>
      <Footer />
    </>
  );
}
