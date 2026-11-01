import Link from "next/link";
import { notFound } from "next/navigation";
import { AlertTriangle, ArrowLeft } from "lucide-react";
import { prisma } from "@/lib/db";
import { parseQuiz } from "@/lib/documents";
import { Button } from "@/components/ui/button";
import { Callout } from "@/components/ui/callout";
import { QuizRunner } from "@/components/quiz/quiz-runner";

export const dynamic = "force-dynamic";

export default async function QuizPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const quiz = await prisma.quiz.findUnique({
    where: { id },
    include: {
      document: {
        select: {
          id: true,
          title: true,
          fileType: true,
          mode: true,
          status: true,
          overallConfidence: true,
        },
      },
      attempts: {
        orderBy: { completedAt: "desc" },
        take: 10,
        select: { id: true, score: true, total: true, completedAt: true },
      },
    },
  });

  if (!quiz) notFound();

  const content = parseQuiz(quiz.questionsJson);
  if (!content) {
    return (
      <div>
        <Button asChild variant="ghost" size="sm" className="mb-4 -ml-2">
          <Link href="/quiz">
            <ArrowLeft className="h-3.5 w-3.5" /> All quizzes
          </Link>
        </Button>
        <Callout variant="danger" title="This quiz cannot be opened safely">
          The stored question data failed schema validation, so the app will not display or score it.
          Return to the quiz list and generate a fresh quiz from the source document. Nothing was
          guessed or repaired silently.
        </Callout>
      </div>
    );
  }

  const questions = content.questions.map((question) => ({
    id: question.id,
    question: question.question,
    options: question.options,
    difficulty: question.difficulty,
    concept: question.concept,
  }));

  return (
    <QuizRunner
      quiz={{
        id: quiz.id,
        title: quiz.title,
        difficulty: quiz.difficulty,
        questionCount: quiz.questionCount,
        mode: quiz.mode,
        model: quiz.model,
        createdAt: quiz.createdAt.toISOString(),
      }}
      document={{
        id: quiz.document.id,
        title: quiz.document.title,
        fileType: quiz.document.fileType,
        mode: quiz.document.mode,
        status: quiz.document.status,
        overallConfidence: quiz.document.overallConfidence,
      }}
      questions={questions}
      attempts={quiz.attempts.map((attempt) => ({
        id: attempt.id,
        score: attempt.score,
        total: attempt.total,
        completedAt: attempt.completedAt.toISOString(),
      }))}
    />
  );
}
