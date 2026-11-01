import { NextResponse } from "next/server";
import { format } from "date-fns";
import { prisma } from "@/lib/db";
import { AppError, errorResponse } from "@/lib/errors";
import { parsePlanDays, parseStringArray } from "@/lib/documents";
import { generatePlan } from "@/lib/ai/plan";
import { planInputSchema, type PlanInput } from "@/lib/schemas";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 240;

export async function POST(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await context.params;
    const plan = await prisma.studyPlan.findUnique({ where: { id } });
    if (!plan) {
      throw new AppError({
        message: "That study plan no longer exists.",
        code: "PLAN_NOT_FOUND",
        status: 404,
      });
    }

    const days = parsePlanDays(plan.daysJson);
    const completedTaskIds = new Set(parseStringArray(plan.completedTaskIdsJson));
    const completedTopics = new Set(parseStringArray(plan.completedTopicsJson));

    for (const day of days) {
      for (const task of day.tasks) {
        if (completedTaskIds.has(task.id) && task.type === "study") {
          completedTopics.add(task.topic);
        }
      }
    }

    const inputCandidate = {
      title: plan.title,
      subject: plan.subject,
      examDate: format(plan.examDate, "yyyy-MM-dd"),
      dailyMinutes: plan.dailyMinutes,
      language: plan.language === "hinglish" ? "hinglish" : "simple_en",
      syllabus: plan.syllabus,
      completedTopics: [...completedTopics],
    } satisfies PlanInput;
    const parsed = planInputSchema.safeParse(inputCandidate);
    if (!parsed.success) {
      throw new AppError({
        message:
          "This plan's exam date has passed or its stored data is incomplete. Create a fresh plan instead.",
        code: "PLAN_NOT_REGENERABLE",
        status: 409,
        details: parsed.error.issues.slice(0, 6),
      });
    }

    const generated = await generatePlan(parsed.data);
    const updated = await prisma.studyPlan.update({
      where: { id },
      data: {
        examDate: new Date(`${parsed.data.examDate}T12:00:00`),
        topicsJson: JSON.stringify(generated.plan.topics),
        daysJson: JSON.stringify(generated.plan.days),
        completedTopicsJson: JSON.stringify([...completedTopics]),
        completedTaskIdsJson: "[]",
        summary: generated.plan.summary,
        mode: generated.mode,
        model: generated.model,
      },
    });

    return NextResponse.json({
      ok: true,
      plan: generated.plan,
      mode: generated.mode,
      model: generated.model,
      note: generated.note,
      updatedAt: updated.updatedAt.toISOString(),
    });
  } catch (error) {
    return errorResponse(error);
  }
}
