import { HomePage } from "@/components/home-page";
import { StructuredData } from "@/components/structured-data";
import { faqItems } from "@/lib/faq-data";
import { organizationSchema, websiteSchema } from "@/lib/seo";

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
  return (
    <>
      <HomePage initialAuthOpen={typeof params.auth === "string"} deferPublicData />
      <StructuredData data={organizationSchema} />
      <StructuredData data={websiteSchema} />
      <StructuredData data={faqSchema} />
    </>
  );
}
