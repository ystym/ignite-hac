import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { errorResponse } from "@/lib/errors";
import { ensureDemoWorkspace } from "@/lib/demo/seed";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 120;

export async function POST() {
  try {
    const result = await ensureDemoWorkspace(prisma);
    return NextResponse.json({
      ok: true,
      documentIds: result.documentIds,
      planId: result.planId,
      reliabilityRunId: result.reliabilityRunId,
      message: "Curated demo workspace loaded. All demo content is labelled DEMO in the UI.",
    });
  } catch (error) {
    return errorResponse(error);
  }
}
