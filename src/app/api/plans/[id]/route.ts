import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { AppError, errorResponse } from "@/lib/errors";
import { parsePlanDays, parseStringArray } from "@/lib/documents";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const patchSchema = z
  .object({
    completedTaskIds: z.array(z.string().min(1).max(120)).max(500).optional(),
    completedTopics: z.array(z.string().min(1).max(180)).max(80).optional(),
  })
  .refine((value) => value.completedTaskIds !== undefined || value.completedTopics !== undefined, {
    message: "Nothing to update.",
  });

export async function GET(
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
    return NextResponse.json({
      plan: {
        ...plan,
        days: parsePlanDays(plan.daysJson),
        topics: parseStringArray(plan.topicsJson),
        completedTopics: parseStringArray(plan.completedTopicsJson),
        completedTaskIds: parseStringArray(plan.completedTaskIdsJson),
      },
    });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await context.params;
    const parsed = patchSchema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) {
      throw new AppError({
        message: "Send the completed task IDs or completed topics to update.",
        code: "INVALID_PLAN_UPDATE",
        status: 400,
      });
    }

    const plan = await prisma.studyPlan.findUnique({ where: { id } });
    if (!plan) {
      throw new AppError({
        message: "That study plan no longer exists.",
        code: "PLAN_NOT_FOUND",
        status: 404,
      });
    }

    const days = parsePlanDays(plan.daysJson);
    const validTaskIds = new Set(days.flatMap((day) => day.tasks.map((task) => task.id)));
    const completedTaskIds =
      parsed.data.completedTaskIds !== undefined
        ? [...new Set(parsed.data.completedTaskIds.filter((taskId) => validTaskIds.has(taskId)))]
        : parseStringArray(plan.completedTaskIdsJson);
    const completedTopics =
      parsed.data.completedTopics !== undefined
        ? [...new Set(parsed.data.completedTopics.map((topic) => topic.trim()).filter(Boolean))]
        : parseStringArray(plan.completedTopicsJson);

    const updated = await prisma.studyPlan.update({
      where: { id },
      data: {
        completedTaskIdsJson: JSON.stringify(completedTaskIds),
        completedTopicsJson: JSON.stringify(completedTopics),
      },
    });

    return NextResponse.json({
      ok: true,
      completedTaskIds,
      completedTopics,
      updatedAt: updated.updatedAt.toISOString(),
    });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await context.params;
    await prisma.studyPlan.delete({ where: { id } }).catch(() => {
      throw new AppError({
        message: "That study plan no longer exists.",
        code: "PLAN_NOT_FOUND",
        status: 404,
      });
    });
    return NextResponse.json({ ok: true });
  } catch (error) {
    return errorResponse(error);
  }
}
