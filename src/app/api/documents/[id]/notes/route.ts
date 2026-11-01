import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { AppError, errorResponse } from "@/lib/errors";
import { getAIStatus } from "@/lib/env";
import { languageSchema } from "@/lib/schemas";
import { generateNotes } from "@/lib/ai/notes";
import { parseBlocks, parseWarnings } from "@/lib/documents";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 180;

const inputSchema = z.object({
  language: languageSchema.default("simple_en"),
});

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await context.params;
    const parsed = inputSchema.safeParse((await request.json().catch(() => ({}))) ?? {});
    if (!parsed.success) {
      throw new AppError({
        message: "Choose simple English or Hinglish.",
        code: "INVALID_LANGUAGE",
        status: 400,
      });
    }

    if (!getAIStatus().configured) {
      throw new AppError({
        message:
          "Generating new notes needs a Gemini API key. The existing curated note on a demo document is sample output, not a live run.",
        code: "AI_NOT_CONFIGURED",
        status: 412,
        retryable: false,
      });
    }

    const document = await prisma.document.findUnique({ where: { id } });
    if (!document) {
      throw new AppError({
        message: "That document no longer exists.",
        code: "DOCUMENT_NOT_FOUND",
        status: 404,
      });
    }
    if (document.mode === "DEMO") {
      throw new AppError({
        message:
          "This is a curated demo document. Upload your own material to generate live notes with your chosen language.",
        code: "DEMO_DOCUMENT_READ_ONLY",
        status: 409,
      });
    }
    if (document.status !== "READY") {
      throw new AppError({
        message:
          "This document is not ready yet. Wait for extraction to finish, then generate notes.",
        code: "DOCUMENT_NOT_READY",
        status: 409,
      });
    }

    const blocks = parseBlocks(document.blocksJson);
    if (blocks.length === 0) {
      throw new AppError({
        message: "There is no extracted content to turn into notes.",
        code: "NO_CONTENT",
        status: 422,
      });
    }

    const generated = await generateNotes({
      title: document.title,
      blocks,
      warnings: parseWarnings(document.warningsJson),
      language: parsed.data.language,
    });

    const note = await prisma.note.upsert({
      where: { documentId: id },
      create: {
        documentId: id,
        title: generated.notes.title,
        language: parsed.data.language,
        contentJson: JSON.stringify(generated.notes),
        model: generated.model,
        mode: "LIVE",
      },
      update: {
        title: generated.notes.title,
        language: parsed.data.language,
        contentJson: JSON.stringify(generated.notes),
        model: generated.model,
        mode: "LIVE",
      },
    });

    return NextResponse.json({
      note: {
        id: note.id,
        title: note.title,
        language: note.language,
        mode: note.mode,
        model: note.model,
        content: generated.notes,
      },
    });
  } catch (error) {
    return errorResponse(error);
  }
}
