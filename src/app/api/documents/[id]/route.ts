import { NextResponse } from "next/server";
import path from "node:path";
import { unlink } from "node:fs/promises";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { AppError, errorResponse } from "@/lib/errors";
import {
  parseBlocks,
  parseWarnings,
  toDocumentDetail,
  toDocumentSummary,
} from "@/lib/documents";
import { blocksToPlainText } from "@/lib/rag/chunk";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await context.params;
    const document = await prisma.document.findUnique({
      where: { id },
      include: {
        notes: { select: { id: true } },
        quizzes: {
          select: { id: true, title: true, difficulty: true, questionCount: true, mode: true },
          orderBy: { createdAt: "desc" },
        },
      },
    });
    if (!document) {
      throw new AppError({
        message: "That document no longer exists.",
        code: "DOCUMENT_NOT_FOUND",
        status: 404,
      });
    }
    return NextResponse.json({
      document: toDocumentDetail(document),
      quizzes: document.quizzes,
    });
  } catch (error) {
    return errorResponse(error);
  }
}

const correctionSchema = z.object({
  blockId: z.string().min(1).max(100),
  text: z.string().trim().min(1).max(20_000),
});

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await context.params;
    const parsed = correctionSchema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) {
      throw new AppError({
        message: "Provide the block ID and the corrected text.",
        code: "INVALID_CORRECTION",
        status: 400,
      });
    }

    const document = await prisma.document.findUnique({
      where: { id },
      include: { notes: { select: { id: true } } },
    });
    if (!document) {
      throw new AppError({
        message: "That document no longer exists.",
        code: "DOCUMENT_NOT_FOUND",
        status: 404,
      });
    }

    const blocks = parseBlocks(document.blocksJson);
    const targetIndex = blocks.findIndex((block) => block.id === parsed.data.blockId);
    if (targetIndex < 0) {
      throw new AppError({
        message: "That extracted block no longer exists. Refresh the document and try again.",
        code: "BLOCK_NOT_FOUND",
        status: 404,
      });
    }

    const original = blocks[targetIndex];
    const previousNote = original.note?.trim();
    const corrected = {
      ...original,
      text: parsed.data.text,
      type: original.type === "unreadable" ? ("paragraph" as const) : original.type,
      confidence: 1,
      uncertain: false,
      note: `Manually corrected by the student on ${new Date().toISOString().slice(0, 10)}. ${
        previousNote ? `Original extraction note: ${previousNote}` : "This text is not model output."
      }`.slice(0, 500),
    };
    blocks[targetIndex] = corrected;

    const warnings = parseWarnings(document.warningsJson);
    warnings.push({
      message:
        "A student manually corrected an extracted block. The extraction-time warnings are preserved below as an audit trail; AI notes and retrieval may be stale until regenerated/reindexed.",
      severity: "info",
      location: original.page ? `Page ${original.page}` : "Document",
    });

    const updated = await prisma.document.update({
      where: { id },
      data: {
        blocksJson: JSON.stringify(blocks),
        extractedText: blocksToPlainText(blocks),
        warningsJson: JSON.stringify(warnings.slice(-40)),
        indexStatus: "STALE",
      },
      include: { notes: { select: { id: true } } },
    });

    return NextResponse.json({ document: toDocumentDetail(updated) });
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
    const document = await prisma.document.findUnique({ where: { id } });
    if (!document) {
      throw new AppError({
        message: "That document no longer exists.",
        code: "DOCUMENT_NOT_FOUND",
        status: 404,
      });
    }

    if (document.storagePath) {
      const absolute = path.resolve(process.cwd(), document.storagePath);
      const uploadRoot = path.resolve(process.cwd(), "data", "uploads") + path.sep;
      if (absolute.startsWith(uploadRoot)) {
        await unlink(absolute).catch(() => {});
      }
    }

    await prisma.document.delete({ where: { id } });
    return NextResponse.json({ ok: true, deleted: toDocumentSummary(document) });
  } catch (error) {
    return errorResponse(error);
  }
}
