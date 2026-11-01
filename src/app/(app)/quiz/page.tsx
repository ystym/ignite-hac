import Link from "next/link";
import {
  ArrowRight,
  BarChart3,
  BookOpenCheck,
  ListChecks,
  Sparkles,
  Target,
  Trophy,
} from "lucide-react";
import { prisma } from "@/lib/db";
import { getAIStatus } from "@/lib/env";
import { percent } from "@/lib/utils";
import { difficultyLabel } from "@/lib/client/labels";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Callout } from "@/components/ui/callout";
import { EmptyState } from "@/components/ui/empty-state";
import { TimeAgo } from "@/components/time-ago";
import { ConfidenceBadge, ModeBadge } from "@/components/mode-badges";
import { FileTypeIcon } from "@/components/file-type-icon";
import { DemoLaunchButton } from "@/components/demo-launch-button";

export const dynamic = "force-dynamic";

export const metadata = { title: "Practice quizzes" };

export default async function QuizIndexPage() {
  const ai = getAIStatus();
  const [quizzes, attempts, documents] = await Promise.all([
    prisma.quiz.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        document: {
          select: {
            id: true,
            title: true,
            fileType: true,
            mode: true,
            overallConfidence: true,
            indexStatus: true,
          },
        },
        attempts: { orderBy: { completedAt: "desc" }, take: 10 },
      },
    }),
    prisma.quizAttempt.findMany({ select: { score: true, total: true } }),
    prisma.document.count(),
  ]);

  const totalAttempts = attempts.length;
  const scoreSum = attempts.reduce((sum, attempt) => sum + attempt.score, 0);
  const answerSum = attempts.reduce((sum, attempt) => sum + attempt.total, 0);
  const average = answerSum > 0 ? scoreSum / answerSum : null;

  return (
    <div>
      <PageHeader
        eyebrow={`${quizzes.length} quiz${quizzes.length === 1 ? "" : "zes"} · ${totalAttempts} attempt${totalAttempts === 1 ? "" : "s"}`}
        title="Practice, with receipts."
        description="Every question is tied to a source excerpt, scored on the server, and explained after submission. Demo quizzes are curated sample content; live quizzes are generated from your own extracted material."
        actions={
          <Button asChild variant="violet">
            <Link href="/library">
              <BookOpenCheck className="h-4 w-4" /> Choose material
            </Link>
          </Button>
        }
      />

      {quizzes.length === 0 ? (
        <div className="space-y-5">
          <EmptyState
            icon={ListChecks}
            title="No practice quizzes yet"
            description={
              documents === 0
                ? ai.mode === "demo"
                  ? "Load the curated workspace to try three complete quizzes, or add a Gemini key and upload your own material."
                  : "Upload material and generate a grounded quiz from its extracted source. Every question will cite a passage."
                : "Open a ready document and generate a quiz from its Extracted source. Questions validate their source excerpt before they are saved."
            }
            action={
              documents === 0 && ai.mode === "demo" ? (
                <DemoLaunchButton label="Load curated quizzes" redirectTo="/quiz" />
              ) : (
                <Button asChild variant="violet">
                  <Link href="/library">Open the library</Link>
                </Button>
              )
            }
          />
          <Callout variant="info" title="What grounding means here">
            The generator must return a verbatim source excerpt for each question. The server checks
            that excerpt against the extracted text and rejects questions that cannot be tied back.
            It is a safeguard, not a guarantee that every question is pedagogically perfect.
          </Callout>
        </div>
      ) : (
        <>
          <section className="grid gap-4 sm:grid-cols-3" aria-label="Quiz statistics">
            <Card className="p-5">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-[0.13em] text-ink-400">Quizzes available</p>
                  <p className="mt-2.5 font-display text-3xl font-extrabold tracking-[-0.05em] text-ink-950">
                    {quizzes.length}
                  </p>
                </div>
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-50 text-violet-600">
                  <ListChecks className="h-[18px] w-[18px]" />
                </span>
              </div>
              <p className="mt-2 text-[11px] text-ink-400">
                {quizzes.filter((quiz) => quiz.mode === "DEMO").length} curated ·{" "}
                {quizzes.filter((quiz) => quiz.mode !== "DEMO").length} live
              </p>
            </Card>
            <Card className="p-5">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-[0.13em] text-ink-400">Attempts recorded</p>
                  <p className="mt-2.5 font-display text-3xl font-extrabold tracking-[-0.05em] text-ink-950">
                    {totalAttempts}
                  </p>
                </div>
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                  <Target className="h-[18px] w-[18px]" />
                </span>
              </div>
              <p className="mt-2 text-[11px] text-ink-400">
                {totalAttempts === 0 ? "No submissions yet" : `${answerSum} answers scored server-side`}
              </p>
            </Card>
            <Card className="p-5">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-[0.13em] text-ink-400">Average score</p>
                  <p className="mt-2.5 font-display text-3xl font-extrabold tracking-[-0.05em] text-ink-950">
                    {average == null ? "—" : percent(average)}
                  </p>
                </div>
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
                  <BarChart3 className="h-[18px] w-[18px]" />
                </span>
              </div>
              <p className="mt-2 text-[11px] text-ink-400">
                Across all recorded attempts, not an accuracy claim
              </p>
            </Card>
          </section>

          <div className="mt-6 space-y-4">
            {quizzes.map((quiz) => {
              const attemptsForQuiz = quiz.attempts;
              const best = attemptsForQuiz.reduce(
                (winner, attempt) =>
                  !winner || attempt.score / attempt.total > winner.score / winner.total ? attempt : winner,
                null as null | (typeof attemptsForQuiz)[number],
              );
              const last = attemptsForQuiz[0] ?? null;
              return (
                <article
                  key={quiz.id}
                  className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-card sm:p-6"
                >
                  <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
                    <div className="flex min-w-0 items-start gap-3.5">
                      <FileTypeIcon
                        type={quiz.document.fileType}
                        className="h-12 w-12 rounded-xl"
                      />
                      <div className="min-w-0">
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
                            {quiz.questionCount} questions
                          </span>
                          <ConfidenceBadge score={quiz.document.overallConfidence} className="text-[9px]" />
                        </div>
                        <h2 className="mt-2 font-display text-[17px] font-bold leading-snug text-ink-900">
                          {quiz.title}
                        </h2>
                        <p className="mt-1 truncate text-[11px] text-ink-400">
                          From{" "}
                          <Link
                            href={`/documents/${quiz.document.id}`}
                            className="font-medium text-ink-500 hover:text-violet-700"
                          >
                            {quiz.document.title}
                          </Link>{" "}
                          · created <TimeAgo value={quiz.createdAt} />
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-shrink-0 flex-col gap-2 sm:flex-row sm:items-center">
                      <div className="rounded-xl bg-slate-50 px-4 py-2.5 sm:min-w-[190px]">
                        {best ? (
                          <>
                            <p className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-amber-700">
                              <Trophy className="h-3 w-3" /> Best attempt
                            </p>
                            <p className="mt-0.5 text-[13px] font-extrabold text-ink-900">
                              {best.score}/{best.total} · {percent(best.score / best.total)}
                            </p>
                            <p className="text-[9.5px] text-ink-400">
                              {attemptsForQuiz.length} attempt{attemptsForQuiz.length === 1 ? "" : "s"} · last{" "}
                              {last ? <TimeAgo value={last.completedAt} /> : "—"}
                            </p>
                          </>
                        ) : (
                          <>
                            <p className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-violet-600">
                              <Sparkles className="h-3 w-3" /> Not attempted
                            </p>
                            <p className="mt-0.5 text-[12px] font-semibold text-ink-700">
                              Explanations unlock after scoring
                            </p>
                          </>
                        )}
                      </div>
                      <Button asChild variant="violet">
                        <Link href={`/quiz/${quiz.id}`}>
                          {best ? "Retake" : "Start quiz"} <ArrowRight className="h-4 w-4" />
                        </Link>
                      </Button>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>

          <Callout variant="info" title="How scoring works" className="mt-6">
            The browser sends only selected option indexes. The server checks them against the stored
            answer key and persists the attempt. The quiz page fetches explanations and source excerpts
            only after submission.
          </Callout>
        </>
      )}
    </div>
  );
}
