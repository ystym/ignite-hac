"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  BookOpenCheck,
  Check,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock3,
  FileText,
  Flag,
  ListChecks,
  Loader2,
  Quote,
  RotateCcw,
  Sparkles,
  Trophy,
  X,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";
import { cn, percent } from "@/lib/utils";
import { apiFetch, errorMessage } from "@/lib/client/api";
import { difficultyLabel } from "@/lib/client/labels";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Callout } from "@/components/ui/callout";
import { Progress } from "@/components/ui/feedback";
import { ModeBadge } from "@/components/mode-badges";
import { FileTypeIcon } from "@/components/file-type-icon";
import { TimeAgo } from "@/components/time-ago";

type TakeQuestion = {
  id: string;
  question: string;
  options: string[];
  difficulty: string;
  concept: string;
};

type QuizMeta = {
  id: string;
  title: string;
  difficulty: string;
  questionCount: number;
  mode: string;
  model: string | null;
  createdAt: string;
};

type DocumentMeta = {
  id: string;
  title: string;
  fileType: string;
  mode: string;
  status: string;
  overallConfidence: number | null;
};

type AttemptSummary = {
  id: string;
  score: number;
  total: number;
  completedAt: string;
};

type ResultQuestion = {
  id: string;
  question: string;
  options: string[];
  selectedIndex: number;
  correctIndex: number;
  correct: boolean;
  explanation: string;
  difficulty: string;
  concept: string;
  sourceExcerpt: string;
};

type SubmitResponse = {
  attemptId: string;
  score: number;
  total: number;
  percentage: number;
  results: ResultQuestion[];
  completedAt: string;
};

export function QuizRunner({
  quiz,
  document,
  questions,
  attempts: initialAttempts,
}: {
  quiz: QuizMeta;
  document: DocumentMeta;
  questions: TakeQuestion[];
  attempts: AttemptSummary[];
}) {
  const [stage, setStage] = useState<"intro" | "taking" | "results">("intro");
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [current, setCurrent] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<SubmitResponse | null>(null);
  const [attempts, setAttempts] = useState(initialAttempts);

  const answeredCount = Object.keys(answers).length;
  const question = questions[current];
  const isDemo = quiz.mode === "DEMO";

  function start() {
    setAnswers({});
    setCurrent(0);
    setError(null);
    setResult(null);
    setStage("taking");
  }

  function select(index: number) {
    setAnswers((currentAnswers) => ({ ...currentAnswers, [question.id]: index }));
  }

  async function submit() {
    if (submitting) return;
    if (answeredCount !== questions.length) {
      setError(`Answer every question before submitting. ${questions.length - answeredCount} still unanswered.`);
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const response = await apiFetch<SubmitResponse>(`/api/quizzes/${quiz.id}/attempts`, {
        method: "POST",
        body: { answers },
      });
      setResult(response);
      setAttempts((previous) => [
        {
          id: response.attemptId,
          score: response.score,
          total: response.total,
          completedAt: response.completedAt,
        },
        ...previous,
      ]);
      setStage("results");
      toast.success("Attempt scored on the server", {
        description: `${response.score} of ${response.total} correct. Review the explanations below.`,
      });
    } catch (caught) {
      const message = errorMessage(caught);
      setError(message);
      toast.error("Could not submit the attempt", { description: message });
    } finally {
      setSubmitting(false);
    }
  }

  if (stage === "intro") {
    return (
      <QuizIntro
        quiz={quiz}
        document={document}
        attempts={attempts}
        isDemo={isDemo}
        onStart={start}
      />
    );
  }

  if (stage === "taking" && question) {
    return (
      <div>
        <div className="mb-4 flex flex-wrap items-center gap-2 text-[11px] text-ink-400">
          <Link href="/quiz" className="inline-flex items-center gap-1 font-semibold text-ink-500 hover:text-violet-700">
            <ArrowLeft className="h-3.5 w-3.5" /> All quizzes
          </Link>
          <span className="text-ink-200">/</span>
          <span>{quiz.title}</span>
        </div>

        <div className="mb-5 flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="violet">{difficultyLabel(quiz.difficulty)}</Badge>
              <ModeBadge mode={quiz.mode} />
              <span className="text-[10px] text-ink-400">
                {questions.length} questions · {answeredCount} answered
              </span>
            </div>
            <h1 className="mt-2 font-display text-[clamp(1.35rem,2.2vw,1.85rem)] font-semibold tracking-[-0.03em] text-ink-950">
              {quiz.title}
            </h1>
          </div>
          <p className="text-[11px] text-ink-400">
            Source:{" "}
            <Link href={`/documents/${document.id}`} className="font-semibold text-violet-700 hover:underline">
              {document.title}
            </Link>
          </p>
        </div>

        <Progress
          value={(answeredCount / questions.length) * 100}
          className="mb-5 h-1.5"
          label="Questions answered"
        />

        {isDemo && (
          <Callout variant="warning" title="Curated demo quiz" className="mb-4">
            These questions are authored sample content, not a live Gemini generation. Your attempt is
            genuinely scored and saved.
          </Callout>
        )}

        {error && (
          <div className="mb-4 flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-rose-600" />
            <p className="text-[12px] leading-5 text-rose-800">{error}</p>
          </div>
        )}

        <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_230px]">
          <div className="rounded-2xl border border-hairline bg-white">
            <div className="flex flex-wrap items-center gap-2 border-b border-[#f0f0f0] px-5 py-3.5">
              <span className="rounded-lg bg-ink-900 px-2 py-1 font-mono text-[10px] font-semibold text-white">
                Q{current + 1} / {questions.length}
              </span>
              <Badge
                variant={
                  question.difficulty === "easy"
                    ? "green"
                    : question.difficulty === "hard"
                      ? "rose"
                      : "amber"
                }
                size="sm"
              >
                {difficultyLabel(question.difficulty)}
              </Badge>
              <Badge variant="default" size="sm">
                {question.concept}
              </Badge>
              <span className="ml-auto text-[9.5px] text-ink-300">
                Correct answers arrive after submission
              </span>
            </div>

            <div className="p-5 sm:p-6">
              <h2 className="font-display text-[18px] font-semibold leading-snug text-ink-950">
                {question.question}
              </h2>

              <div className="mt-5 space-y-2.5" role="radiogroup" aria-label={`Answers for question ${current + 1}`}>
                {question.options.map((option, index) => {
                  const selected = answers[question.id] === index;
                  const letter = String.fromCharCode(65 + index);
                  return (
                    <button
                      key={option}
                      type="button"
                      role="radio"
                      aria-checked={selected}
                      onClick={() => select(index)}
                      className={cn(
                        "flex w-full items-start gap-3 rounded-xl border p-3.5 text-left transition",
                        selected
                          ? "border-violet-400 bg-violet-50 ring-2 ring-violet-100"
                          : "border-hairline bg-white hover:border-violet-200 hover:bg-violet-50/40",
                      )}
                    >
                      <span
                        className={cn(
                          "mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-[10px] font-semibold",
                          selected
                            ? "border-violet-500 bg-violet-600 text-white"
                            : "border-slate-300 bg-white text-ink-400",
                        )}
                      >
                        {selected ? <Check className="h-3 w-3" /> : letter}
                      </span>
                      <span className="text-[12.5px] leading-6 text-ink-700">{option}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="flex items-center justify-between gap-3 border-t border-[#f0f0f0] px-5 py-4">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setCurrent((index) => Math.max(0, index - 1))}
                disabled={current === 0}
              >
                <ChevronLeft className="h-3.5 w-3.5" /> Previous
              </Button>

              {current < questions.length - 1 ? (
                <Button
                  type="button"
                  variant="violet"
                  size="sm"
                  onClick={() => setCurrent((index) => Math.min(questions.length - 1, index + 1))}
                >
                  Next <ChevronRight className="h-3.5 w-3.5" />
                </Button>
              ) : (
                <Button
                  type="button"
                  variant="violet"
                  size="sm"
                  onClick={submit}
                  loading={submitting}
                  disabled={answeredCount !== questions.length}
                  title={
                    answeredCount !== questions.length
                      ? "Answer all questions before submitting"
                      : "Submit for server-side scoring"
                  }
                >
                  {!submitting && <Flag className="h-3.5 w-3.5" />} Submit attempt
                </Button>
              )}
            </div>
          </div>

          <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start">
            <div className="rounded-2xl border border-hairline bg-white p-4">
              <div className="flex items-center gap-2">
                <ListChecks className="h-4 w-4 text-violet-600" />
                <h2 className="text-[12px] font-semibold text-ink-900">Question map</h2>
              </div>
              <div className="mt-3 grid grid-cols-5 gap-1.5">
                {questions.map((item, index) => {
                  const answered = answers[item.id] != null;
                  const active = index === current;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setCurrent(index)}
                      className={cn(
                        "flex h-8 items-center justify-center rounded-lg border text-[10px] font-semibold transition",
                        active
                          ? "border-ink-900 bg-ink-900 text-white"
                          : answered
                            ? "border-violet-200 bg-violet-50 text-violet-800"
                            : "border-hairline bg-white text-ink-400 hover:border-slate-300",
                      )}
                      aria-label={`Go to question ${index + 1}${answered ? ", answered" : ", unanswered"}`}
                      aria-current={active ? "step" : undefined}
                    >
                      {index + 1}
                    </button>
                  );
                })}
              </div>
              <div className="mt-3 flex items-center justify-between text-[10px] text-ink-400">
                <span>{answeredCount} answered</span>
                <span>{questions.length - answeredCount} left</span>
              </div>
              <div className="mt-3 border-t border-[#f0f0f0] pt-3">
                <Button
                  type="button"
                  size="sm"
                  variant="secondary"
                  className="w-full"
                  onClick={submit}
                  loading={submitting}
                  disabled={answeredCount !== questions.length}
                >
                  Submit attempt
                </Button>
                {answeredCount !== questions.length && (
                  <p className="mt-1.5 text-center text-[9.5px] leading-4 text-ink-300">
                    All questions must be answered.
                  </p>
                )}
              </div>
            </div>

            <div className="rounded-2xl border border-hairline bg-white p-4">
              <div className="flex items-center gap-2">
                <FileTypeIcon type={document.fileType} className="h-8 w-8 rounded-lg" iconClassName="h-3.5 w-3.5" />
                <div className="min-w-0">
                  <p className="truncate text-[11px] font-semibold text-ink-800">{document.title}</p>
                  <p className="text-[9.5px] text-ink-400">Grounded source document</p>
                </div>
              </div>
              <Button asChild variant="ghost" size="sm" className="mt-2 w-full justify-start px-2">
                <Link href={`/documents/${document.id}`}>
                  <BookOpenCheck className="h-3.5 w-3.5" /> Open source
                </Link>
              </Button>
            </div>
          </aside>
        </div>
      </div>
    );
  }

  if (stage === "results" && result) {
    return (
      <QuizResults
        quiz={quiz}
        document={document}
        result={result}
        attempts={attempts}
        onRetake={start}
      />
    );
  }

  return (
    <div className="flex min-h-[50vh] items-center justify-center">
      <Loader2 className="h-6 w-6 animate-spin text-violet-500" />
    </div>
  );
}

function QuizIntro({
  quiz,
  document,
  attempts,
  isDemo,
  onStart,
}: {
  quiz: QuizMeta;
  document: DocumentMeta;
  attempts: AttemptSummary[];
  isDemo: boolean;
  onStart: () => void;
}) {
  const best = attempts.reduce(
    (winner, attempt) =>
      !winner || attempt.score / attempt.total > winner.score / winner.total ? attempt : winner,
    null as AttemptSummary | null,
  );

  return (
    <div>
      <Button asChild variant="ghost" size="sm" className="mb-4 -ml-2">
        <Link href="/quiz">
          <ArrowLeft className="h-3.5 w-3.5" /> All quizzes
        </Link>
      </Button>

      <div className="overflow-hidden rounded-2xl border border-hairline bg-white">
        <div className="relative overflow-hidden bg-ink-950 p-6 text-white sm:p-8">
          <div className="pointer-events-none absolute inset-0 dot-grid opacity-[0.08]" />
          <div className="relative">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="white">
                <Sparkles className="h-3 w-3" /> Grounded practice
              </Badge>
              <Badge variant="white">{difficultyLabel(quiz.difficulty)}</Badge>
              {isDemo ? (
                <Badge variant="amber">Curated demo</Badge>
              ) : (
                <Badge variant="green">Live · {quiz.model ?? "Gemini"}</Badge>
              )}
            </div>
            <h1 className="mt-4 max-w-3xl font-display text-[clamp(1.8rem,4vw,2.7rem)] font-semibold leading-[1.08] tracking-[-0.04em]">
              {quiz.title}
            </h1>
            <p className="mt-3 max-w-2xl text-[13px] leading-6 text-white/60">
              {quiz.questionCount} multiple-choice questions. Answer them all, submit once, and get
              server-scored results with an explanation and the exact source excerpt after scoring.
            </p>
          </div>
        </div>

        <div className="grid gap-4 p-5 sm:grid-cols-3 sm:p-6">
          <div className="rounded-xl border border-[#f0f0f0] bg-parchment p-4">
            <p className="text-[10px] font-semibold uppercase tracking-[0.13em] text-ink-400">Questions</p>
            <p className="mt-1.5 font-display text-2xl font-semibold text-ink-950">{quiz.questionCount}</p>
            <p className="text-[10px] text-ink-400">{difficultyLabel(quiz.difficulty)} difficulty</p>
          </div>
          <div className="rounded-xl border border-[#f0f0f0] bg-parchment p-4">
            <p className="text-[10px] font-semibold uppercase tracking-[0.13em] text-ink-400">Source material</p>
            <p className="mt-1.5 truncate text-[12.5px] font-semibold text-ink-900">{document.title}</p>
            <Link
              href={`/documents/${document.id}`}
              className="mt-0.5 inline-flex items-center gap-1 text-[10px] font-semibold text-violet-700 hover:underline"
            >
              <BookOpenCheck className="h-3 w-3" /> Inspect what was read
            </Link>
          </div>
          <div className="rounded-xl border border-[#f0f0f0] bg-parchment p-4">
            <p className="text-[10px] font-semibold uppercase tracking-[0.13em] text-ink-400">Your best</p>
            <p className="mt-1.5 font-display text-2xl font-semibold text-ink-950">
              {best ? percent(best.score / best.total) : "—"}
            </p>
            <p className="text-[10px] text-ink-400">
              {best ? `${best.score}/${best.total} · ${attempts.length} attempt${attempts.length === 1 ? "" : "s"}` : "No attempts yet"}
            </p>
          </div>
        </div>

        <div className="border-t border-[#f0f0f0] p-5 sm:p-6">
          {isDemo && (
            <Callout variant="warning" title="This quiz is curated sample content" className="mb-4">
              It was authored for the demo, not generated live by Gemini. Attempts are genuinely scored
              and persisted. The source excerpts are real excerpts from the curated extracted source.
            </Callout>
          )}

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="inline-flex items-center gap-1.5 text-[11px] text-ink-400">
              <Clock3 className="h-3.5 w-3.5" /> No timer. Submit when every question is answered.
            </p>
            <Button type="button" variant="violet" size="lg" onClick={onStart}>
              {attempts.length > 0 ? (
                <>
                  <RotateCcw className="h-4 w-4" /> Retake quiz
                </>
              ) : (
                <>
                  Start quiz <ArrowRight className="h-4 w-4" />
                </>
              )}
            </Button>
          </div>
        </div>
      </div>

      {attempts.length > 0 && (
        <div className="mt-5 rounded-2xl border border-hairline bg-white p-5 sm:p-6">
          <div className="flex items-center gap-2">
            <Trophy className="h-4 w-4 text-amber-500" />
            <h2 className="font-display text-[15px] font-semibold text-ink-900">Recent attempts</h2>
          </div>
          <div className="mt-3 divide-y divide-[#f0f0f0]">
            {attempts.slice(0, 10).map((attempt, index) => {
              const ratio = attempt.total > 0 ? attempt.score / attempt.total : 0;
              return (
                <div key={attempt.id} className="flex items-center gap-3 py-2.5">
                  <span
                    className={cn(
                      "flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[10px] font-semibold",
                      ratio >= 0.75
                        ? "bg-emerald-50 text-emerald-700"
                        : ratio >= 0.5
                          ? "bg-amber-50 text-amber-700"
                          : "bg-rose-50 text-rose-700",
                    )}
                  >
                    {percent(ratio)}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-[11.5px] font-semibold text-ink-700">
                      {attempt.score}/{attempt.total} correct
                    </p>
                    <p className="text-[9.5px] text-ink-400"><TimeAgo value={attempt.completedAt} /></p>
                  </div>
                  {index === 0 && <Badge variant="violet" size="sm">Latest</Badge>}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

function QuizResults({
  quiz,
  document,
  result,
  attempts,
  onRetake,
}: {
  quiz: QuizMeta;
  document: DocumentMeta;
  result: SubmitResponse;
  attempts: AttemptSummary[];
  onRetake: () => void;
}) {
  const [filter, setFilter] = useState<"all" | "incorrect">("all");
  const filtered = useMemo(
    () => (filter === "incorrect" ? result.results.filter((item) => !item.correct) : result.results),
    [filter, result.results],
  );
  const incorrect = result.total - result.score;
  const best = attempts.reduce(
    (winner, attempt) =>
      !winner || attempt.score / attempt.total > winner.score / winner.total ? attempt : winner,
    null as AttemptSummary | null,
  );

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center gap-2 text-[11px] text-ink-400">
        <Link href="/quiz" className="inline-flex items-center gap-1 font-semibold text-ink-500 hover:text-violet-700">
          <ArrowLeft className="h-3.5 w-3.5" /> All quizzes
        </Link>
        <span className="text-ink-200">/</span>
        <span>{quiz.title}</span>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_300px]">
        <div className="space-y-5">
          <div className="overflow-hidden rounded-2xl border border-hairline bg-white">
            <div className="bg-parchment p-5 sm:p-7">
              <div className="flex flex-col items-start gap-5 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="green">
                      <CheckCircle2 className="h-3 w-3" /> Scored on the server
                    </Badge>
                    <ModeBadge mode={quiz.mode} />
                  </div>
                  <h1 className="mt-3 font-display text-[clamp(1.6rem,3vw,2.25rem)] font-semibold tracking-[-0.035em] text-ink-950">
                    {result.percentage >= 80
                      ? "Strong result."
                      : result.percentage >= 50
                        ? "A solid foundation — review the gaps."
                        : "This topic needs another pass."}
                  </h1>
                  <p className="mt-2 max-w-xl text-[12.5px] leading-6 text-ink-500">
                    You answered {result.score} of {result.total} correctly. Every explanation below
                    points back to the extracted source, not to an answer key invented after the fact.
                  </p>
                  <p className="mt-2 text-[10px] text-ink-400">
                    Attempt {result.attemptId.slice(0, 8)} · <TimeAgo value={result.completedAt} />
                  </p>
                </div>

                <div
                  className="relative flex h-32 w-32 shrink-0 items-center justify-center rounded-full"
                  style={{
                    background: `conic-gradient(#0066cc ${result.percentage}%, #e8e8ed 0)`,
                  }}
                  aria-label={`Score: ${result.percentage} percent`}
                >
                  <div className="flex h-[104px] w-[104px] flex-col items-center justify-center rounded-full bg-white shadow-inner">
                    <span className="font-display text-3xl font-semibold tracking-[-0.05em] text-ink-950">
                      {result.percentage}%
                    </span>
                    <span className="text-[10px] font-semibold text-ink-400">
                      {result.score}/{result.total} correct
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-3 divide-x divide-[#f0f0f0] border-t border-[#f0f0f0]">
              <div className="p-4 text-center">
                <p className="font-display text-xl font-semibold text-emerald-700">{result.score}</p>
                <p className="text-[9.5px] uppercase tracking-wider text-ink-400">Correct</p>
              </div>
              <div className="p-4 text-center">
                <p className="font-display text-xl font-semibold text-rose-700">{incorrect}</p>
                <p className="text-[9.5px] uppercase tracking-wider text-ink-400">Incorrect</p>
              </div>
              <div className="p-4 text-center">
                <p className="font-display text-xl font-semibold text-ink-900">
                  {best ? percent(best.score / best.total) : "—"}
                </p>
                <p className="text-[9.5px] uppercase tracking-wider text-ink-400">Best recent</p>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex rounded-xl border border-hairline bg-white p-1">
              <button
                type="button"
                onClick={() => setFilter("all")}
                className={cn(
                  "rounded-lg px-3 py-1.5 text-[11.5px] font-semibold transition",
                  filter === "all" ? "bg-ink-900 text-white" : "text-ink-500 hover:text-ink-800",
                )}
              >
                All answers ({result.total})
              </button>
              <button
                type="button"
                onClick={() => setFilter("incorrect")}
                className={cn(
                  "rounded-lg px-3 py-1.5 text-[11.5px] font-semibold transition",
                  filter === "incorrect" ? "bg-ink-900 text-white" : "text-ink-500 hover:text-ink-800",
                )}
              >
                To review ({incorrect})
              </button>
            </div>
            <Button type="button" variant="violet" size="sm" onClick={onRetake}>
              <RotateCcw className="h-3.5 w-3.5" /> Retake quiz
            </Button>
          </div>

          {filtered.length === 0 ? (
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-8 text-center">
              <Trophy className="mx-auto h-7 w-7 text-emerald-600" />
              <p className="mt-2 font-display text-[16px] font-semibold text-emerald-900">
                No incorrect answers to review.
              </p>
              <p className="mt-1 text-[11.5px] text-emerald-800/70">
                This attempt scored {result.score}/{result.total}. The explanations are still available
                under “All answers”.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filtered.map((item) => {
                const index = result.results.findIndex((entry) => entry.id === item.id);
                return (
                  <article
                    key={item.id}
                    className={cn(
                      "rounded-2xl border bg-white p-5",
                      item.correct ? "border-emerald-200" : "border-rose-200",
                    )}
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={cn(
                          "flex h-7 w-7 items-center justify-center rounded-full text-[10px] font-semibold",
                          item.correct ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700",
                        )}
                      >
                        {index + 1}
                      </span>
                      <Badge variant={item.correct ? "green" : "rose"}>
                        {item.correct ? (
                          <>
                            <CheckCircle2 className="h-3 w-3" /> Correct
                          </>
                        ) : (
                          <>
                            <XCircle className="h-3 w-3" /> Incorrect
                          </>
                        )}
                      </Badge>
                      <Badge variant="default" size="sm">
                        {item.concept}
                      </Badge>
                      <Badge
                        variant={
                          item.difficulty === "easy"
                            ? "green"
                            : item.difficulty === "hard"
                              ? "rose"
                              : "amber"
                        }
                        size="sm"
                      >
                        {difficultyLabel(item.difficulty)}
                      </Badge>
                    </div>

                    <h3 className="mt-2.5 font-display text-[15px] font-semibold leading-snug text-ink-900">
                      {item.question}
                    </h3>

                    <div className="mt-3 space-y-1.5">
                      {item.options.map((option, optionIndex) => {
                        const selected = item.selectedIndex === optionIndex;
                        const correct = item.correctIndex === optionIndex;
                        return (
                          <div
                            key={option}
                            className={cn(
                              "flex items-start gap-2.5 rounded-lg border px-3 py-2 text-[11.5px] leading-5",
                              correct
                                ? "border-emerald-200 bg-emerald-50/70 text-emerald-900"
                                : selected
                                  ? "border-rose-200 bg-rose-50/70 text-rose-900"
                                  : "border-[#f0f0f0] bg-parchment/40 text-ink-500",
                            )}
                          >
                            <span
                              className={cn(
                                "mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full text-[8px] font-semibold",
                                correct
                                  ? "bg-emerald-600 text-white"
                                  : selected
                                    ? "bg-rose-500 text-white"
                                    : "bg-[#d2d2d7] text-ink-500",
                              )}
                            >
                              {correct ? <Check className="h-2.5 w-2.5" /> : selected ? <X className="h-2.5 w-2.5" /> : String.fromCharCode(65 + optionIndex)}
                            </span>
                            <span className="flex-1">{option}</span>
                            {selected && (
                              <span className="shrink-0 text-[8.5px] font-semibold uppercase tracking-wider opacity-70">
                                Your answer
                              </span>
                            )}
                            {correct && !selected && (
                              <span className="shrink-0 text-[8.5px] font-semibold uppercase tracking-wider text-emerald-700">
                                Correct
                              </span>
                            )}
                          </div>
                        );
                      })}
                    </div>

                    <div className="mt-3 rounded-xl border border-violet-100 bg-violet-50/50 p-3.5">
                      <p className="text-[9.5px] font-semibold uppercase tracking-[0.13em] text-violet-700">
                        Explanation
                      </p>
                      <p className="mt-1 text-[12px] leading-6 text-ink-600">{item.explanation}</p>
                    </div>

                    <div className="mt-2.5 rounded-xl border border-[#f0f0f0] bg-parchment/60 p-3.5">
                      <p className="inline-flex items-center gap-1.5 text-[9.5px] font-semibold uppercase tracking-[0.13em] text-ink-400">
                        <Quote className="h-3 w-3" /> Source excerpt
                      </p>
                      <p className="mt-1 border-l-2 border-slate-300 pl-2.5 text-[11px] leading-5 text-ink-500">
                        {item.sourceExcerpt}
                      </p>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </div>

        <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start">
          <div className="rounded-2xl border border-hairline bg-white p-5">
            <h2 className="font-display text-[14px] font-semibold text-ink-900">Next step</h2>
            <div className="mt-3 space-y-2">
              <Button asChild variant="violet" size="sm" className="w-full justify-start">
                <Link href={`/documents/${document.id}`}>
                  <BookOpenCheck className="h-3.5 w-3.5" /> Review the source notes
                </Link>
              </Button>
              <Button asChild variant="outline" size="sm" className="w-full justify-start">
                <Link href="/quiz">
                  <ListChecks className="h-3.5 w-3.5" /> All quizzes
                </Link>
              </Button>
              <Button asChild variant="ghost" size="sm" className="w-full justify-start">
                <Link href={`/documents/${document.id}`}>
                  <FileText className="h-3.5 w-3.5" /> Extracted text
                </Link>
              </Button>
            </div>
          </div>

          <div className="rounded-2xl border border-hairline bg-white p-5">
            <div className="flex items-center gap-2">
              <Clock3 className="h-4 w-4 text-violet-600" />
              <h2 className="text-[12px] font-semibold text-ink-900">Attempt history</h2>
            </div>
            <div className="mt-3 space-y-2.5">
              {attempts.slice(0, 8).map((attempt, index) => {
                const ratio = attempt.total > 0 ? attempt.score / attempt.total : 0;
                return (
                  <div key={attempt.id} className="flex items-center gap-2.5">
                    <span
                      className={cn(
                        "flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[9px] font-semibold",
                        ratio >= 0.75
                          ? "bg-emerald-50 text-emerald-700"
                          : ratio >= 0.5
                            ? "bg-amber-50 text-amber-700"
                            : "bg-rose-50 text-rose-700",
                      )}
                    >
                      {percent(ratio)}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-[10.5px] font-semibold text-ink-700">
                        {attempt.score}/{attempt.total} correct
                      </p>
                      <p className="text-[9px] text-ink-400"><TimeAgo value={attempt.completedAt} /></p>
                    </div>
                    {index === 0 && <Badge variant="violet" size="sm">This</Badge>}
                  </div>
                );
              })}
            </div>
            <p className="mt-3 border-t border-[#f0f0f0] pt-3 text-[9.5px] leading-4 text-ink-400">
              Scores are calculated from the stored key. There is no accuracy percentage claim about the
              AI itself.
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}
