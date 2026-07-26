import { HomePage } from "@/components/home-page";

export default async function Page({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const params = await searchParams;
  return <HomePage initialAuthOpen={typeof params.auth === "string"} />;
}
