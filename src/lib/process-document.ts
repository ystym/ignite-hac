import path from "node:path";
import { readFile } from "node:fs/promises";
import type { Document } from "@prisma/client";
import { prisma } from "@/lib/db";
import { AppError, toAppError } from "@/lib/errors";
import { getAIStatus } from "@/lib/env";
import { readStoredUpload } from "@/lib/files";
import { parsePdf } from "@/lib/pdf";
import { buildChunks } from "@/lib/rag/chunk";
import { localEmbedding } from "@/lib/rag/local-embedding";
import {
  extractFromAudio,
  extractFromImage,
  extractFromScannedPdf,
  extractFromPdfText,
  type ExtractionOutcome,
} from "@/lib/ai/extraction";
import { generateNotes } from "@/lib/ai/notes";
import { embedTexts } from "@/lib/ai/embeddings";
import { blocksToPlainText } from "@/lib/rag/chunk";
import { parseBlocks } from "@/lib/documents";

const SAMPLE_DIR = path.join(process.cwd(), "public", "samples");

async function readSampleBuffer(fileName: string): Promise<Buffer> {
  const safe = path.basename(fileName);
  if (safe !== fileName) {
    throw new AppError({
      message: "That sample file reference is invalid.",
      code: "INVALID_SAMPLE",
      status: 400,
    });
  }
  try {
    return await readFile(path.join(SAMPLE_DIR, safe));
  } catch {
    throw new AppError({
      message:
        "The bundled sample file is missing. Run `npm run setup` or restore public/samples from the repository.",
      code: "SAMPLE_MISSING",
      status: 410,
    });
  }
}

async function setStage(documentId: string, stage: string) {
  await prisma.document.update({
    where: { id: documentId },
    data: { processingStage: stage, status: "PROCESSING", processingError: null },
  });
}

async function extractForDocument(
  document: Document,
  buffer: Buffer,
): Promise<ExtractionOutcome> {
  switch (document.fileType) {
    case "image":
      return extractFromImage(buffer, document.mimeType, document.fileName);
    case "pdf": {
      const parsed = await parsePdf(buffer);
      if (parsed.hasReliableTextLayer) {
        return extractFromPdfText(parsed, document.fileName);
      }
      return extractFromScannedPdf(
        buffer,
        document.mimeType,
        document.fileName,
        parsed.totalPages,
      );
    }
    case "audio":
      return extractFromAudio(buffer, document.mimeType, document.fileName);
    case "text": {
      const blocks = parseBlocks(document.blocksJson);
      if (blocks.length === 0) {
        throw new AppError({
          message: "This typed document has no stored content.",
          code: "EMPTY_TYPED_DOCUMENT",
          status: 422,
        });
      }
      return {
        result: {
          title: document.title,
          detectedLanguage: document.language ?? "unknown",
          overallConfidence: document.overallConfidence ?? 1,
          blocks,
          warnings: [],
        },
        method: "typed",
        model: null,
        pageCount: null,
      };
    }
    default:
      throw new AppError({
        message: "This file type cannot be processed.",
        code: "UNSUPPORTED_FILE_TYPE",
        status: 415,
      });
  }
}

export type ProcessResult = {
  documentId: string;
  status: "READY" | "FAILED";
  indexStatus: string;
  chunkCount: number;
  notesGenerated: boolean;
  error?: string;
};

/**
 * The real document pipeline. Each stage is persisted so the browser can show
 * genuine progress by polling the document record. Partial failures are kept
 * honest: a document can have readable notes and a failed search index, and
 * the UI offers a targeted retry for each.
 */
export async function processDocument(documentId: string): Promise<ProcessResult> {
  const document = await prisma.document.findUnique({ where: { id: documentId } });
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
        "Curated demo documents cannot be re-processed. Upload your own file with a Gemini key to run a live analysis.",
      code: "DEMO_DOCUMENT_READ_ONLY",
      status: 409,
    });
  }

  const status = getAIStatus();
  if (!status.configured) {
    throw new AppError({
      message:
        "Live analysis needs a Gemini API key. Add GEMINI_API_KEY to .env and restart the server.",
      code: "AI_NOT_CONFIGURED",
      status: 412,
      retryable: false,
    });
  }

  let chunkCount = 0;
  try {
    await setStage(documentId, "reading");
    let buffer: Buffer;
    if (document.source === "SAMPLE" || document.source === "DEMO") {
      buffer = await readSampleBuffer(document.fileName);
    } else if (document.storagePath) {
      buffer = await readStoredUpload(document.storagePath);
    } else if (document.fileType === "text") {
      buffer = Buffer.from(document.extractedText ?? "", "utf8");
    } else {
      throw new AppError({
        message:
          "The original file is missing. Upload it again to continue. Nothing was fabricated.",
        code: "FILE_MISSING",
        status: 410,
      });
    }

    await setStage(documentId, "extracting");
    const extraction = await extractForDocument(document, buffer);
    const result = extraction.result;

    await prisma.document.update({
      where: { id: documentId },
      data: {
        title: result.title,
        extractedText: blocksToPlainText(result.blocks),
        blocksJson: JSON.stringify(result.blocks),
        warningsJson: JSON.stringify(result.warnings),
        overallConfidence: result.overallConfidence,
        pageCount: extraction.pageCount,
        language: result.detectedLanguage,
        extractionMethod: extraction.method,
        extractionModel: extraction.model,
      },
    });

    await setStage(documentId, "chunking");
    const draft = buildChunks(result.blocks, result.title);
    if (draft.chunks.length === 0) {
      throw new AppError({
        message:
          "No usable text could be extracted, so there is nothing to index. Check the original and try again.",
        code: "NO_USABLE_CONTENT",
        status: 422,
      });
    }

    const chunkRows = draft.chunks.map((chunk) => ({
      id: crypto.randomUUID(),
      documentId,
      chunkIndex: chunk.chunkIndex,
      content: chunk.content,
      page: chunk.page,
      startSeconds: chunk.startSeconds,
      endSeconds: chunk.endSeconds,
      confidence: chunk.confidence,
      sourceLabel: chunk.sourceLabel,
      embeddingJson: "[]",
    }));

    await prisma.$transaction([
      prisma.chunk.deleteMany({ where: { documentId } }),
      prisma.chunk.createMany({ data: chunkRows }),
      prisma.document.update({
        where: { id: documentId },
        data: { indexStatus: "INDEXING", indexError: null },
      }),
    ]);
    chunkCount = chunkRows.length;

    await setStage(documentId, "embedding");
    try {
      const vectors = await embedTexts(
        chunkRows.map((row) => row.content),
        "RETRIEVAL_DOCUMENT",
      );
      await prisma.$transaction(
        chunkRows.map((row, index) =>
          prisma.chunk.update({
            where: { id: row.id },
            data: { embeddingJson: JSON.stringify(vectors[index]) },
          }),
        ),
      );
      await prisma.document.update({
        where: { id: documentId },
        data: { indexStatus: "READY", indexError: null },
      });
    } catch (error) {
      const appError = toAppError(error);
      await prisma.document.update({
        where: { id: documentId },
        data: {
          indexStatus: "FAILED",
          indexError: appError.message,
        },
      });
      // Notes do not depend on the embedding index, so continue. The workspace
      // shows a separate, honest "search index unavailable" state.
      console.error("[studymate] embedding stage failed", appError.code, error);
    }

    await setStage(documentId, "notes");
    let notesGenerated = false;
    try {
      const notes = await generateNotes({
        title: result.title,
        blocks: result.blocks,
        warnings: result.warnings,
        language: "simple_en",
      });
      await prisma.note.upsert({
        where: { documentId },
        create: {
          documentId,
          title: notes.notes.title,
          language: "simple_en",
          contentJson: JSON.stringify(notes.notes),
          model: notes.model,
          mode: "LIVE",
        },
        update: {
          title: notes.notes.title,
          language: "simple_en",
          contentJson: JSON.stringify(notes.notes),
          model: notes.model,
          mode: "LIVE",
        },
      });
      notesGenerated = true;
    } catch (error) {
      // A failed notes call must not throw away a successful extraction or
      // index. It is surfaced in the workspace with a retry button.
      console.error("[studymate] notes stage failed", error);
    }

    await prisma.document.update({
      where: { id: documentId },
      data: {
        status: "READY",
        processingStage: "done",
        processingError: null,
      },
    });

    return {
      documentId,
      status: "READY",
      indexStatus: (await prisma.document.findUnique({ where: { id: documentId } }))
        ?.indexStatus ?? "FAILED",
      chunkCount,
      notesGenerated,
    };
  } catch (error) {
    const appError = toAppError(error);
    await prisma.document.update({
      where: { id: documentId },
      data: {
        status: "FAILED",
        processingStage: "failed",
        processingError: appError.message,
      },
    });
    return {
      documentId,
      status: "FAILED",
      indexStatus: "FAILED",
      chunkCount,
      notesGenerated: false,
      error: appError.message,
    };
  }
}

/** Rebuilds embeddings for existing chunks; falls back to rechunking if needed. */
export async function reindexDocument(documentId: string): Promise<ProcessResult> {
  const document = await prisma.document.findUnique({
    where: { id: documentId },
    include: { chunks: { orderBy: { chunkIndex: "asc" } }, notes: true },
  });
  if (!document) {
    throw new AppError({
      message: "That document no longer exists.",
      code: "DOCUMENT_NOT_FOUND",
      status: 404,
    });
  }

  await prisma.document.update({
    where: { id: documentId },
    data: { indexStatus: "INDEXING", indexError: null },
  });

  try {
    let rows = document.chunks;
    if (rows.length === 0) {
      const blocks = parseBlocks(document.blocksJson);
      if (blocks.length === 0) {
        throw new AppError({
          message: "There is no extracted content to index. Re-run extraction first.",
          code: "NO_CONTENT_TO_INDEX",
          status: 422,
        });
      }
      const chunks = buildChunks(blocks, document.title).chunks;
      const ids = chunks.map(() => crypto.randomUUID());
      await prisma.chunk.createMany({
        data: chunks.map((chunk, index) => ({
          id: ids[index],
          documentId,
          chunkIndex: chunk.chunkIndex,
          content: chunk.content,
          page: chunk.page,
          startSeconds: chunk.startSeconds,
          endSeconds: chunk.endSeconds,
          confidence: chunk.confidence,
          sourceLabel: chunk.sourceLabel,
          embeddingJson: "[]",
        })),
      });
      rows = await prisma.chunk.findMany({
        where: { documentId },
        orderBy: { chunkIndex: "asc" },
      });
    }

    let vectors: number[][];
    if (document.mode === "DEMO") {
      vectors = rows.map((row) => localEmbedding(row.content));
    } else {
      if (!getAIStatus().configured) {
        throw new AppError({
          message:
            "Reindexing this live document needs a Gemini API key. Add GEMINI_API_KEY to .env and restart.",
          code: "AI_NOT_CONFIGURED",
          status: 412,
        });
      }
      vectors = await embedTexts(
        rows.map((row) => row.content),
        "RETRIEVAL_DOCUMENT",
      );
    }

    await prisma.$transaction(
      rows.map((row, index) =>
        prisma.chunk.update({
          where: { id: row.id },
          data: { embeddingJson: JSON.stringify(vectors[index]) },
        }),
      ),
    );

    await prisma.document.update({
      where: { id: documentId },
      data: { indexStatus: "READY", indexError: null },
    });

    return {
      documentId,
      status: "READY",
      indexStatus: "READY",
      chunkCount: rows.length,
      notesGenerated: Boolean(document.notes),
    };
  } catch (error) {
    const appError = toAppError(error);
    await prisma.document.update({
      where: { id: documentId },
      data: { indexStatus: "FAILED", indexError: appError.message },
    });
    throw appError;
  }
}
