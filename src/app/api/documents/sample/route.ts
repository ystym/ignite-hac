import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { AppError, errorResponse } from "@/lib/errors";
import { getAIStatus } from "@/lib/env";
import { SAMPLE_CATALOG } from "@/lib/file-config";
import { toDocumentSummary } from "@/lib/documents";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const inputSchema = z.object({
  sampleKey: z.enum(["handwritten", "syllabus", "audio"]),
});

export async function POST(request: Request) {
  try {
    if (!getAIStatus().configured) {
      throw new AppError({
        message:
          "Running the bundled samples through live AI needs a Gemini key. In Demo Mode, open the curated sample workspace instead.",
        code: "DEMO_MODE",
        status: 412,
        retryable: false,
      });
    }

    const parsed = inputSchema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) {
      throw new AppError({
        message: "Choose one of the bundled samples.",
        code: "INVALID_SAMPLE",
        status: 400,
      });
    }
    const sample = SAMPLE_CATALOG.find((item) => item.key === parsed.data.sampleKey);
    if (!sample) {
      throw new AppError({
        message: "That sample is not available.",
        code: "INVALID_SAMPLE",
        status: 404,
      });
    }

    const document = await prisma.document.create({
      data: {
        title: sample.title,
        fileName: sample.fileName,
        mimeType: sample.mimeType,
        fileSize: 0,
        fileType: sample.kind,
        source: "SAMPLE",
        sampleKey: sample.key,
        status: "UPLOADED",
        processingStage: "queued",
        mode: "LIVE",
        indexStatus: "PENDING",
      },
    });

    return NextResponse.json({ document: toDocumentSummary(document) }, { status: 201 });
  } catch (error) {
    return errorResponse(error);
  }
}
