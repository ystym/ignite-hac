import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { AppError, errorResponse } from "@/lib/errors";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const correctionSchema = z.object({
  correction: z.string().trim().min(10).max(3_000),
});

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await context.params;
    const parsed = correctionSchema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) {
      throw new AppError({
        message: "Write at least 10 characters explaining or recording the human correction.",
        code: "INVALID_CORRECTION",
        status: 400,
      });
    }

    const existing = await prisma.reliabilityRun.findUnique({ where: { id } });
    if (!existing) {
      throw new AppError({
        message: "That reliability run no longer exists.",
        code: "RUN_NOT_FOUND",
        status: 404,
      });
    }

    const updated = await prisma.reliabilityRun.update({
      where: { id },
      data: { humanCorrection: parsed.data.correction },
    });

    return NextResponse.json({
      ok: true,
      id: updated.id,
      humanCorrection: updated.humanCorrection,
    });
  } catch (error) {
    return errorResponse(error);
  }
}
