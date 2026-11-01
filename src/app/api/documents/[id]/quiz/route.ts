import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { AppError, errorResponse } from "@/lib/errors";
import { getAIStatus } from "@/lib/env";
import { generateQuiz } from "@/lib/ai/quiz";
import { parseBlocks } from "@/lib/documents";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 180;

const inputSchema = z.object({
  difficulty: z.enum(["easy", "medium", "hard", "mixed"]).default("mixed"),
  count: z.number().int().min(3).max(10).default(5),
});

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await context.params;
    const quizzes = await prisma.quiz.findMany({
      where: { documentId: id },
      select: {
        id: true,
        title: true,
        difficulty: true,
        questionCount: true,
        mode: true,
        createdAt: true,
        attempts: { select: { score: true, total: true }, orderBy: { completedAt: "desc" }, take: 1 },
      },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json({ quizzes });
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
    const parsed = inputSchema.safeParse((await request.json().catch(() => ({}))) ?? {});
    if (!parsed.success) {
      throw new AppError({
        message: "Choose a difficulty and between 3 and 10 questions.",
        code: "INVALID_QUIZ_REQUEST",
        status: 400,
      });
    }

    if (!getAIStatus().configured) {
      throw new AppError({
        message:
          "Generating a new quiz needs a Gemini API key. Demo documents include a curated quiz that you can take.",
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
          "This is a curated demo document and its quiz is sample output. Upload your own material to generate a live quiz.",
        code: "DEMO_DOCUMENT_READ_ONLY",
        status: 409,
      });
    }
    if (document.status !== "READY") {
      throw new AppError({
        message: "Wait for this document's extraction to finish before generating a quiz.",
        code: "DOCUMENT_NOT_READY",
        status: 409,
      });
    }

    const blocks = parseBlocks(document.blocksJson);
    if (blocks.length === 0) {
      throw new AppError({
        message: "There is no extracted content to quiz you on.",
        code: "NO_CONTENT",
        status: 422,
      });
    }

    const generated = await generateQuiz({
      title: document.title,
      blocks,
      difficulty: parsed.data.difficulty,
      count: parsed.data.count,
    });

    const quiz = await prisma.quiz.create({
      data: {
        documentId: id,
        title: generated.quiz.title,
        difficulty: generated.quiz.difficulty,
        questionCount: generated.quiz.questions.length,
        questionsJson: JSON.stringify(generated.quiz),
        model: generated.model,
        mode: "LIVE",
      },
    });

    return NextResponse.json(
      {
        quiz: {
          id: quiz.id,
          title: quiz.title,
          difficulty: quiz.difficulty,
          questionCount: quiz.questionCount,
          mode: quiz.mode,
          rejectedQuestions: generated.rejectedQuestions,
        },
      },
      { status: 201 },
    );
  } catch (error) {
    return errorResponse(error);
  }
}
