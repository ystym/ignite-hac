import type { DocumentDetail } from "@/lib/documents";
import type { ChatMessageView, NotesContent } from "@/lib/schemas";

export type NoteRecord = {
  id: string;
  title: string;
  language: string;
  mode: string;
  model: string | null;
  updatedAt: string;
  content: NotesContent;
};

export type QuizAttemptSummary = {
  score: number;
  total: number;
  completedAt: string;
};

export type QuizSummaryView = {
  id: string;
  title: string;
  difficulty: string;
  questionCount: number;
  mode: string;
  createdAt: string;
  latestAttempt: QuizAttemptSummary | null;
};

export type DocumentWorkspaceData = {
  document: DocumentDetail;
  note: NoteRecord | null;
  quizzes: QuizSummaryView[];
  messages: ChatMessageView[];
};

export function noteFromRecord(record: {
  id: string;
  title: string;
  language: string;
  mode: string;
  model: string | null;
  updatedAt: Date;
  contentJson: string;
} | null, parse: (value: unknown) => NotesContent | null): NoteRecord | null {
  if (!record) return null;
  const content = parse(record.contentJson);
  if (!content) return null;
  return {
    id: record.id,
    title: record.title,
    language: record.language,
    mode: record.mode,
    model: record.model,
    updatedAt: record.updatedAt.toISOString(),
    content,
  };
}
