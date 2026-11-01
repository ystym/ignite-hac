import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { AppError, errorResponse } from "@/lib/errors";
import { getAIStatus } from "@/lib/env";
import { extractFromTypedText } from "@/lib/ai/extraction";
import { blocksToPlainText } from "@/lib/rag/chunk";
import { toDocumentSummary } from "@/lib/documents";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const inputSchema = z.object({
  title: z.string().trim().min(2).max(160),
  text: z.string().trim().min(40).max(200_000),
});

export async function POST(request: Request) {
  try {
    if (!getAIStatus().configured) {
      throw new AppError({
        message:
          "Pasting new material requires live AI so notes can be generated from it. Add GEMINI_API_KEY to .env, or explore the curated demo documents.",
        code: "DEMO_MODE",
        status: 412,
        retryable: false,
      });
    }

    const body = await request.json().catch(() => null);
    const parsed = inputSchema.safeParse(body);
    if (!parsed.success) {
      throw new AppError({
        message:
          "Add a title (2–160 characters) and at least 40 characters of study material.",
        code: "INVALID_TEXT_INPUT",
        status: 400,
        details: parsed.error.issues.slice(0, 6),
      });
    }

    const extraction = extractFromTypedText(parsed.data.title, parsed.data.text);
    const result = extraction.result;
    const document = await prisma.document.create({
      data: {
        title: result.title,
        fileName: `${parsed.data.title.replace(/[^\w-]+/g, "-").slice(0, 80)}.txt`,
        mimeType: "text/plain",
        fileSize: Buffer.byteLength(parsed.data.text, "utf8"),
        fileType: "text",
        source: "TEXT",
        status: "UPLOADED",
        processingStage: "queued",
        mode: "LIVE",
        extractedText: blocksToPlainText(result.blocks),
        blocksJson: JSON.stringify(result.blocks),
        warningsJson: JSON.stringify(result.warnings),
        overallConfidence: result.overallConfidence,
        pageCount: null,
        language: result.detectedLanguage,
        extractionMethod: extraction.method,
        extractionModel: null,
        indexStatus: "PENDING",
      },
    });

    return NextResponse.json({ document: toDocumentSummary(document) }, { status: 201 });
  } catch (error) {
    return errorResponse(error);
  }
}
