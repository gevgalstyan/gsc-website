import { HomePage } from "@/components/home-page";
import { StructuredData } from "@/components/structured-data";
import { getPublishedMeetups } from "@/lib/public-content";
import { faqItems } from "@/lib/faq-data";
import { createClient } from "@/lib/supabase/server";
import { organizationSchema, websiteSchema } from "@/lib/seo";
import { getPublicContent } from "@/lib/site-content";

const faqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: faqItems.map((item) => ({
    "@type": "Question",
    name: item.question,
    acceptedAnswer: { "@type": "Answer", text: item.answer },
  })),
};

export default async function Page({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const params = await searchParams;
  const supabase = await createClient();
  const [{ data: claims }, meetups, content] = await Promise.all([
    supabase ? supabase.auth.getClaims() : Promise.resolve({ data: null }),
    getPublishedMeetups(),
    getPublicContent(),
  ]);
  return (
    <>
      <HomePage initialAuthOpen={typeof params.auth === "string" && !claims?.claims?.sub} authenticated={Boolean(claims?.claims?.sub)} meetups={meetups} content={content} />
      <StructuredData data={organizationSchema} />
      <StructuredData data={websiteSchema} />
      <StructuredData data={faqSchema} />
    </>
  );
}
