"use client";

import { useState } from "react";
import Link from "next/link";
import {
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  ListChecks,
  RotateCcw,
  Sparkles,
  Trophy,
} from "lucide-react";
import { toast } from "sonner";
import type { DocumentDetail } from "@/lib/documents";
import { percent } from "@/lib/utils";
import { apiFetch, errorMessage } from "@/lib/client/api";
import { difficultyLabel } from "@/lib/client/labels";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Callout } from "@/components/ui/callout";
import { EmptyState } from "@/components/ui/empty-state";
import { Select } from "@/components/ui/input";
import { ModeBadge } from "@/components/mode-badges";
import { TimeAgo } from "@/components/time-ago";
import type { QuizSummaryView } from "@/components/document/types";

type QuizResponse = {
  quiz: {
    id: string;
    title: string;
    difficulty: string;
    questionCount: number;
    mode: string;
    rejectedQuestions: number;
  };
};

export function PracticePanel({
  document,
  quizzes,
  aiConfigured,
  onQuizzesChange,
}: {
  document: DocumentDetail;
  quizzes: QuizSummaryView[];
  aiConfigured: boolean;
  onQuizzesChange: (quizzes: QuizSummaryView[]) => void;
}) {
  const [difficulty, setDifficulty] = useState("mixed");
  const [count, setCount] = useState("5");
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canGenerate =
    aiConfigured && document.mode === "LIVE" && document.status === "READY";
  const isDemo = document.mode === "DEMO";

  async function generate() {
    if (generating) return;
    setGenerating(true);
    setError(null);
    try {
      const response = await apiFetch<QuizResponse>(`/api/documents/${document.id}/quiz`, {
        method: "POST",
        body: { difficulty, count: Number(count) },
      });
      const created: QuizSummaryView = {
        id: response.quiz.id,
        title: response.quiz.title,
        difficulty: response.quiz.difficulty,
        questionCount: response.quiz.questionCount,
        mode: response.quiz.mode,
        createdAt: new Date().toISOString(),
        latestAttempt: null,
      };
      onQuizzesChange([created, ...quizzes]);
      toast.success("Grounded quiz created", {
        description:
          response.quiz.rejectedQuestions > 0
            ? `${response.quiz.questionCount} questions passed the source-excerpt check; ${response.quiz.rejectedQuestions} were rejected as ungrounded.`
            : `${response.quiz.questionCount} questions passed the source-excerpt check.`,
      });
    } catch (caught) {
      const message = errorMessage(caught);
      setError(message);
      toast.error("Could not generate a quiz", { description: message });
    } finally {
      setGenerating(false);
    }
  }

  return (
    <div className="space-y-5">
      {error && (
        <div className="flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-rose-600" />
          <p className="text-[12px] leading-5 text-rose-800">{error}</p>
        </div>
      )}

      {isDemo && (
        <Callout variant="warning" title="Curated practice quiz">
          This quiz and its explanations are authored demo content, not a live Gemini generation.
          You can take it and score it normally — attempts and scores are real and persisted locally.
          Upload your own material with a Gemini key to generate live, excerpt-grounded quizzes.
        </Callout>
      )}

      {!isDemo && !aiConfigured && (
        <Callout variant="warning" title="Quiz generation needs a Gemini key">
          Existing quizzes for this document remain available. Add a key and restart to generate new
          ones from the current extracted source.
        </Callout>
      )}

      <div className="rounded-2xl border border-hairline bg-white p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
              <ListChecks className="h-5 w-5" />
            </span>
            <div>
              <h2 className="font-display text-[16px] font-semibold text-ink-900">Grounded practice</h2>
              <p className="mt-0.5 text-[11.5px] leading-5 text-ink-400">
                Every generated question must quote an extracted passage. Scoring happens on the server.
              </p>
            </div>
          </div>
          {canGenerate && (
            <div className="flex flex-wrap items-end gap-2">
              <div>
                <label htmlFor="quiz-difficulty" className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-ink-400">
                  Difficulty
                </label>
                <Select
                  id="quiz-difficulty"
                  value={difficulty}
                  onChange={(event) => setDifficulty(event.target.value)}
                  className="h-9 w-[120px] text-[12px]"
                  disabled={generating}
                >
                  <option value="mixed">Mixed</option>
                  <option value="easy">Easy</option>
                  <option value="medium">Medium</option>
                  <option value="hard">Hard</option>
                </Select>
              </div>
              <div>
                <label htmlFor="quiz-count" className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-ink-400">
                  Questions
                </label>
                <Select
                  id="quiz-count"
                  value={count}
                  onChange={(event) => setCount(event.target.value)}
                  className="h-9 w-[92px] text-[12px]"
                  disabled={generating}
                >
                  {[3, 4, 5, 6, 8, 10].map((value) => (
                    <option key={value} value={value}>
                      {value}
                    </option>
                  ))}
                </Select>
              </div>
              <Button
                type="button"
                size="sm"
                variant="violet"
                onClick={generate}
                loading={generating}
                className="h-9"
              >
                {!generating && <Sparkles className="h-3.5 w-3.5" />} Generate quiz
              </Button>
            </div>
          )}
        </div>
      </div>

      {quizzes.length === 0 ? (
        <EmptyState
          icon={ListChecks}
          title="No quiz for this material yet"
          description={
            canGenerate
              ? "Generate a grounded quiz above. Question count and difficulty are your choice; the source excerpt is verified server-side."
              : isDemo
                ? "Curated demo documents ship with a quiz; this one does not. Upload your own material to generate live practice."
                : "Add a Gemini key to generate a grounded quiz from the extracted source. Nothing is invented in the meantime."
          }
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {quizzes.map((quiz) => {
            const attempt = quiz.latestAttempt;
            const ratio = attempt && attempt.total > 0 ? attempt.score / attempt.total : null;
            return (
              <article
                key={quiz.id}
                className="flex flex-col rounded-2xl border border-hairline bg-white p-5"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <Badge
                    variant={
                      quiz.difficulty === "easy"
                        ? "green"
                        : quiz.difficulty === "hard"
                          ? "rose"
                          : quiz.difficulty === "medium"
                            ? "amber"
                            : "violet"
                    }
                  >
                    {difficultyLabel(quiz.difficulty)}
                  </Badge>
                  <ModeBadge mode={quiz.mode} />
                  <span className="text-[10px] text-ink-400">
                    {quiz.questionCount} question{quiz.questionCount === 1 ? "" : "s"}
                  </span>
                </div>
                <h3 className="mt-2.5 font-display text-[16px] font-semibold leading-snug text-ink-900">
                  {quiz.title}
                </h3>
                <p className="mt-1 text-[10.5px] text-ink-400">Created <TimeAgo value={quiz.createdAt} /></p>

                <div className="mt-4 flex items-center gap-2 rounded-xl bg-parchment px-3 py-2.5">
                  {attempt ? (
                    <>
                      <Trophy className="h-4 w-4 shrink-0 text-amber-500" />
                      <div className="min-w-0 flex-1">
                        <p className="text-[11.5px] font-semibold text-ink-800">
                          Best recent attempt: {attempt.score}/{attempt.total} · {percent(ratio)}
                        </p>
                        <p className="text-[9.5px] text-ink-400">
                          Completed <TimeAgo value={attempt.completedAt} />
                        </p>
                      </div>
                      <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4 shrink-0 text-violet-500" />
                      <p className="text-[11px] text-ink-500">Not attempted yet. Explanations unlock after scoring.</p>
                    </>
                  )}
                </div>

                <div className="mt-4 flex items-center gap-2">
                  <Button asChild size="sm" variant="violet" className="flex-1">
                    <Link href={`/quiz/${quiz.id}`}>
                      {attempt ? (
                        <>
                          <RotateCcw className="h-3.5 w-3.5" /> Retake quiz
                        </>
                      ) : (
                        <>
                          Start quiz <ArrowRight className="h-3.5 w-3.5" />
                        </>
                      )}
                    </Link>
                  </Button>
                  <Button asChild size="sm" variant="outline">
                    <Link href={`/quiz/${quiz.id}`}>Details</Link>
                  </Button>
                </div>
              </article>
            );
          })}
        </div>
      )}

      <p className="rounded-xl border border-[#f0f0f0] bg-parchment px-3.5 py-2.5 text-[10px] leading-4 text-ink-400">
        Quiz attempts are scored server-side from the stored correct answers. The quiz page sends only
        question IDs and selected options; correct answers and explanations arrive after submission.
      </p>
    </div>
  );
}
