import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { AppError, errorResponse } from "@/lib/errors";
import { planInputSchema } from "@/lib/schemas";
import { generatePlan } from "@/lib/ai/plan";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 240;

export async function GET() {
  try {
    const plans = await prisma.studyPlan.findMany({
      orderBy: { updatedAt: "desc" },
      take: 20,
      select: {
        id: true,
        title: true,
        subject: true,
        examDate: true,
        dailyMinutes: true,
        mode: true,
        model: true,
        updatedAt: true,
      },
    });
    return NextResponse.json({ plans });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function POST(request: Request) {
  try {
    const parsed = planInputSchema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) {
      throw new AppError({
        message:
          "Check the plan form: a title, subject, future exam date, daily minutes, and at least 10 characters of syllabus are required.",
        code: "INVALID_PLAN_INPUT",
        status: 400,
        details: parsed.error.issues.slice(0, 8),
      });
    }

    const generated = await generatePlan(parsed.data);
    const plan = await prisma.studyPlan.create({
      data: {
        title: generated.plan.title,
        subject: parsed.data.subject,
        examDate: new Date(`${parsed.data.examDate}T12:00:00`),
        dailyMinutes: parsed.data.dailyMinutes,
        language: parsed.data.language,
        syllabus: parsed.data.syllabus,
        topicsJson: JSON.stringify(generated.plan.topics),
        daysJson: JSON.stringify(generated.plan.days),
        completedTopicsJson: JSON.stringify(parsed.data.completedTopics),
        completedTaskIdsJson: "[]",
        summary: generated.plan.summary,
        mode: generated.mode,
        model: generated.model,
      },
    });

    return NextResponse.json(
      {
        id: plan.id,
        plan: generated.plan,
        mode: generated.mode,
        model: generated.model,
        note: generated.note,
        capped: generated.capped,
      },
      { status: 201 },
    );
  } catch (error) {
    return errorResponse(error);
  }
}
