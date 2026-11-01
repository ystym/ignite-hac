import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { getAIStatus } from "@/lib/env";
import { parseNotes, toChatMessageView, toDocumentDetail } from "@/lib/documents";
import { DocumentWorkspace } from "@/components/document/document-workspace";
import type {
  DocumentWorkspaceData,
  QuizSummaryView,
} from "@/components/document/types";

export const dynamic = "force-dynamic";

export default async function DocumentPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const ai = getAIStatus();

  const document = await prisma.document.findUnique({
    where: { id },
    include: {
      notes: true,
      quizzes: {
        orderBy: { createdAt: "desc" },
        include: {
          attempts: {
            orderBy: { completedAt: "desc" },
            take: 1,
            select: { score: true, total: true, completedAt: true },
          },
        },
      },
      messages: {
        orderBy: { createdAt: "asc" },
        take: 60,
      },
    },
  });

  if (!document) notFound();

  const parsedNote = document.notes ? parseNotes(document.notes.contentJson) : null;
  const note =
    document.notes && parsedNote
      ? {
          id: document.notes.id,
          title: document.notes.title,
          language: document.notes.language,
          mode: document.notes.mode,
          model: document.notes.model,
          updatedAt: document.notes.updatedAt.toISOString(),
          content: parsedNote,
        }
      : null;

  const quizzes: QuizSummaryView[] = document.quizzes.map((quiz) => ({
    id: quiz.id,
    title: quiz.title,
    difficulty: quiz.difficulty,
    questionCount: quiz.questionCount,
    mode: quiz.mode,
    createdAt: quiz.createdAt.toISOString(),
    latestAttempt: quiz.attempts[0]
      ? {
          score: quiz.attempts[0].score,
          total: quiz.attempts[0].total,
          completedAt: quiz.attempts[0].completedAt.toISOString(),
        }
      : null,
  }));

  const data: DocumentWorkspaceData = {
    document: toDocumentDetail(document),
    note,
    quizzes,
    messages: document.messages.map(toChatMessageView),
  };

  return <DocumentWorkspace data={data} aiConfigured={ai.configured} />;
}
