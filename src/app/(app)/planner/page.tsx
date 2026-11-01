import { prisma } from "@/lib/db";
import { getAIStatus } from "@/lib/env";
import { parsePlanDays, parseStringArray } from "@/lib/documents";
import { PlannerWorkspace, type PlanRecord } from "@/components/planner/planner-workspace";

export const dynamic = "force-dynamic";

export const metadata = { title: "Study planner" };

export default async function PlannerPage({
  searchParams,
}: {
  searchParams: Promise<{ plan?: string }>;
}) {
  const { plan: requestedPlanId } = await searchParams;
  const ai = getAIStatus();
  const plans = await prisma.studyPlan.findMany({ orderBy: { updatedAt: "desc" } });

  const data: PlanRecord[] = plans.map((plan) => ({
    id: plan.id,
    title: plan.title,
    subject: plan.subject,
    examDate: plan.examDate.toISOString(),
    dailyMinutes: plan.dailyMinutes,
    language: plan.language,
    syllabus: plan.syllabus,
    topics: parseStringArray(plan.topicsJson),
    days: parsePlanDays(plan.daysJson),
    completedTopics: parseStringArray(plan.completedTopicsJson),
    completedTaskIds: parseStringArray(plan.completedTaskIdsJson),
    summary: plan.summary,
    mode: plan.mode,
    model: plan.model,
    createdAt: plan.createdAt.toISOString(),
    updatedAt: plan.updatedAt.toISOString(),
  }));

  return <PlannerWorkspace plans={data} initialPlanId={requestedPlanId ?? null} aiConfigured={ai.configured} />;
}
