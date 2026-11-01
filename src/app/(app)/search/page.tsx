import { getAIStatus } from "@/lib/env";
import { KnowledgeSearch } from "@/components/search/knowledge-search";

export const dynamic = "force-dynamic";

export const metadata = { title: "Search" };

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string | string[] }>;
}) {
  const params = await searchParams;
  const initialQuery =
    typeof params.q === "string" ? params.q.slice(0, 180) : Array.isArray(params.q) ? (params.q[0] ?? "").slice(0, 180) : "";
  const ai = getAIStatus();

  return (
    <KnowledgeSearch aiConfigured={ai.configured} model={ai.model} initialQuery={initialQuery} />
  );
}
