import { NextResponse } from "next/server";
import path from "node:path";
import { readFile } from "node:fs/promises";
import { prisma } from "@/lib/db";
import { AppError, errorResponse } from "@/lib/errors";
import { getAIStatus } from "@/lib/env";
import { getConfiguredModel } from "@/lib/ai/gemini";
import { runReliabilityExtraction } from "@/lib/ai/extraction";
import { safeJson } from "@/lib/documents";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 120;

const FIXTURE = "ambiguous-handwriting.png";
const FIXTURE_LABEL =
  "A deliberately smudged handwritten calculus question. The exponent is not recoverable from the image.";

export async function GET() {
  try {
    const runs = await prisma.reliabilityRun.findMany({
      orderBy: { createdAt: "desc" },
      take: 12,
    });
    return NextResponse.json({
      fixture: { key: "ambiguous", file: `/samples/${FIXTURE}`, description: FIXTURE_LABEL },
      runs: runs.map((run) => ({
        id: run.id,
        mode: run.mode,
        model: run.model,
        humanCorrection: run.humanCorrection,
        createdAt: run.createdAt.toISOString(),
        result: safeJson<unknown>(run.resultJson, null),
      })),
    });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function POST() {
  try {
    if (!getAIStatus().configured) {
      throw new AppError({
        message:
          "The live reliability test needs a Gemini API key. The curated report is available below and is explicitly labelled as authored, not a model run.",
        code: "AI_NOT_CONFIGURED",
        status: 412,
        retryable: false,
      });
    }

    const buffer = await readFile(path.join(process.cwd(), "public", "samples", FIXTURE));
    const result = await runReliabilityExtraction(buffer, FIXTURE);
    const run = await prisma.reliabilityRun.create({
      data: {
        imageKey: "ambiguous",
        mode: "LIVE",
        model: getConfiguredModel(),
        resultJson: JSON.stringify(result),
      },
    });

    return NextResponse.json(
      {
        run: {
          id: run.id,
          mode: run.mode,
          model: run.model,
          humanCorrection: run.humanCorrection,
          createdAt: run.createdAt.toISOString(),
          result,
        },
        fixture: { key: "ambiguous", file: `/samples/${FIXTURE}`, description: FIXTURE_LABEL },
      },
      { status: 201 },
    );
  } catch (error) {
    return errorResponse(error);
  }
}
