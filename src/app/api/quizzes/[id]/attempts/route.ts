import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { AppError, errorResponse } from "@/lib/errors";
import { parseQuiz } from "@/lib/documents";
import { quizSubmissionSchema } from "@/lib/schemas";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await context.params;
    const parsed = quizSubmissionSchema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) {
      throw new AppError({
        message: "Submit an answer (0–3) for every question in the quiz.",
        code: "INVALID_QUIZ_SUBMISSION",
        status: 400,
        details: parsed.error.issues.slice(0, 8),
      });
    }

    const quiz = await prisma.quiz.findUnique({ where: { id } });
    if (!quiz) {
      throw new AppError({
        message: "That quiz no longer exists.",
        code: "QUIZ_NOT_FOUND",
        status: 404,
      });
    }
    const content = parseQuiz(quiz.questionsJson);
    if (!content) {
      throw new AppError({
        message: "The stored quiz is damaged and cannot be scored safely.",
        code: "QUIZ_CORRUPT",
        status: 500,
      });
    }

    const answered = Object.keys(parsed.data.answers).length;
    if (answered !== content.questions.length) {
      throw new AppError({
        message: `Answer all ${content.questions.length} questions before submitting.`,
        code: "INCOMPLETE_QUIZ",
        status: 400,
      });
    }

    const results = content.questions.map((question) => {
      const selected = parsed.data.answers[question.id];
      if (selected == null) {
        throw new AppError({
          message: "One or more answers are missing. Reload the quiz and try again.",
          code: "MISSING_ANSWER",
          status: 400,
        });
      }
      return {
        id: question.id,
        question: question.question,
        options: question.options,
        selectedIndex: selected,
        correctIndex: question.correctIndex,
        correct: selected === question.correctIndex,
        explanation: question.explanation,
        difficulty: question.difficulty,
        concept: question.concept,
        sourceExcerpt: question.sourceExcerpt,
      };
    });

    const score = results.filter((result) => result.correct).length;
    const total = results.length;
    const attempt = await prisma.quizAttempt.create({
      data: {
        quizId: id,
        answersJson: JSON.stringify(parsed.data.answers),
        score,
        total,
        mode: quiz.mode,
      },
    });

    return NextResponse.json({
      attemptId: attempt.id,
      score,
      total,
      percentage: Math.round((score / total) * 100),
      results,
      completedAt: attempt.completedAt.toISOString(),
    });
  } catch (error) {
    return errorResponse(error);
  }
}
