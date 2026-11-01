import { prisma } from "@/lib/db";
import { getAIStatus } from "@/lib/env";
import { safeJson } from "@/lib/documents";
import { reliabilityDemo } from "@/lib/demo/data";
import { reliabilityRunResultSchema } from "@/lib/schemas";
import { ReliabilityLab, type StoredRun } from "@/components/reliability/reliability-lab";

export const dynamic = "force-dynamic";

export const metadata = { title: "Where it breaks" };

export default async function ReliabilityPage() {
  const ai = getAIStatus();
  const runs = await prisma.reliabilityRun.findMany({
    orderBy: { createdAt: "desc" },
    take: 12,
  });

  const storedRuns: StoredRun[] = [];
  for (const run of runs) {
    const raw = safeJson<unknown>(run.resultJson, null);
    const parsed = reliabilityRunResultSchema.safeParse(raw);
    if (!parsed.success) continue;
    storedRuns.push({
      id: run.id,
      mode: run.mode,
      model: run.model,
      humanCorrection: run.humanCorrection,
      createdAt: run.createdAt.toISOString(),
      result: parsed.data,
    });
  }

  return (
    <ReliabilityLab
      curated={reliabilityDemo}
      storedRuns={storedRuns}
      aiConfigured={ai.configured}
      configuredModel={ai.model}
      reason={ai.reason}
    />
  );
}
