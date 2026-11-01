import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { AppError, errorResponse } from "@/lib/errors";
import { getAIStatus } from "@/lib/env";
import { askInputSchema } from "@/lib/schemas";
import {
  buildExtractiveAnswer,
  generateLiveAnswer,
  hasUsableIndex,
  retrieveChunks,
} from "@/lib/ai/answer";
import { embedQuery } from "@/lib/ai/embeddings";
import { localEmbedding } from "@/lib/rag/local-embedding";
import { toChatMessageView } from "@/lib/documents";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 120;

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await context.params;
    const document = await prisma.document.findUnique({ where: { id }, select: { id: true } });
    if (!document) {
      throw new AppError({
        message: "That document no longer exists.",
        code: "DOCUMENT_NOT_FOUND",
        status: 404,
      });
    }
    const messages = await prisma.chatMessage.findMany({
      where: { documentId: id },
      orderBy: { createdAt: "asc" },
      take: 60,
    });
    return NextResponse.json({ messages: messages.map(toChatMessageView) });
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
    await prisma.chatMessage.deleteMany({ where: { documentId: id } });
    return NextResponse.json({ ok: true });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await context.params;
    const parsed = askInputSchema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) {
      throw new AppError({
        message: "Ask a question between 2 and 1,000 characters.",
        code: "INVALID_QUESTION",
        status: 400,
      });
    }
    const question = parsed.data.question.trim();

    const document = await prisma.document.findUnique({
      where: { id },
      include: { chunks: { orderBy: { chunkIndex: "asc" } } },
    });
    if (!document) {
      throw new AppError({
        message: "That document no longer exists.",
        code: "DOCUMENT_NOT_FOUND",
        status: 404,
      });
    }
    if (document.status !== "READY") {
      throw new AppError({
        message: "This document is still being processed. Ask again when it is ready.",
        code: "DOCUMENT_NOT_READY",
        status: 409,
      });
    }
    if (document.indexStatus !== "READY" && !hasUsableIndex(document.chunks)) {
      throw new AppError({
        message:
          "The search index is not ready. Rebuild the index from the document workspace, then ask again.",
        code: "INDEX_NOT_READY",
        status: 409,
        retryable: true,
      });
    }
    if (document.chunks.length === 0) {
      throw new AppError({
        message: "There are no indexed passages to search. Rebuild the index first.",
        code: "INDEX_NOT_READY",
        status: 409,
        retryable: true,
      });
    }

    const demoIndex = document.mode === "DEMO";
    if (!demoIndex && !getAIStatus().configured) {
      throw new AppError({
        message:
          "Answering questions about this live document needs a Gemini API key for embeddings and grounded generation.",
        code: "AI_NOT_CONFIGURED",
        status: 412,
        retryable: false,
      });
    }

    const chunks = document.chunks.map((chunk) => ({
      id: chunk.id,
      content: chunk.content,
      page: chunk.page,
      startSeconds: chunk.startSeconds,
      endSeconds: chunk.endSeconds,
      confidence: chunk.confidence,
      sourceLabel: chunk.sourceLabel,
      embeddingJson: chunk.embeddingJson,
    }));
    if (!hasUsableIndex(chunks)) {
      throw new AppError({
        message:
          "This document's chunks have no stored vectors. Rebuild the search index, then ask again.",
        code: "INDEX_NOT_READY",
        status: 409,
        retryable: true,
      });
    }

    await prisma.chatMessage.create({
      data: {
        documentId: id,
        role: "user",
        content: question,
        mode: demoIndex ? "DEMO" : "LIVE",
      },
    });

    const queryVector = demoIndex ? localEmbedding(question) : await embedQuery(question);
    const retrieved = retrieveChunks(chunks, queryVector, 6);

    let outcome: Awaited<ReturnType<typeof generateLiveAnswer>>;
    if (demoIndex) {
      outcome = buildExtractiveAnswer({ question, chunks: retrieved, threshold: 0.11 });
    } else {
      if (!retrieved[0] || retrieved[0].relevance < 0.2) {
        outcome = {
          answer: {
            answer:
              "I couldn't find this in the uploaded material. No retrieved passage was similar enough to answer safely. Try using a term that appears in the document.",
            grounded: false,
            confidence: retrieved[0]?.relevance ?? 0,
            citedChunkIds: [],
            missingInformation: "The semantic search did not return a relevant enough passage.",
          },
          sources: [],
          noAnswer: true,
        };
      } else {
        outcome = await generateLiveAnswer({ question, chunks: retrieved });
      }
    }

    const assistant = await prisma.chatMessage.create({
      data: {
        documentId: id,
        role: "assistant",
        content: outcome.answer.answer,
        sourcesJson: JSON.stringify(outcome.sources),
        confidence: outcome.answer.confidence,
        mode: demoIndex ? "DEMO" : "LIVE",
      },
    });

    return NextResponse.json({
      message: toChatMessageView(assistant),
      noAnswer: outcome.noAnswer,
      mode: demoIndex ? "DEMO" : "LIVE",
      retrieval: {
        considered: chunks.length,
        returned: retrieved.length,
        topRelevance: retrieved[0]?.relevance ?? 0,
      },
    });
  } catch (error) {
    return errorResponse(error);
  }
}
