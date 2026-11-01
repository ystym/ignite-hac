import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { errorResponse } from "@/lib/errors";
import { getAIStatus } from "@/lib/env";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const status = getAIStatus();
    const [documents, demoDocuments, notes, quizAttempts, liveRuns] = await Promise.all([
      prisma.document.count(),
      prisma.document.count({ where: { mode: "DEMO" } }),
      prisma.note.count(),
      prisma.quizAttempt.count(),
      prisma.document.count({ where: { mode: "LIVE" } }),
    ]);
    return NextResponse.json({
      ai: status,
      workspace: { documents, demoDocuments, liveDocuments: liveRuns, notes, quizAttempts },
      time: new Date().toISOString(),
    });
  } catch (error) {
    return errorResponse(error);
  }
}
