import Link from "next/link";
import { format } from "date-fns";
import {
  ArrowRight,
  ArrowUpRight,
  BookOpenCheck,
  CalendarCheck2,
  CalendarDays,
  CheckCircle2,
  Circle,
  Clock3,
  FileText,
  Flame,
  Gauge,
  Layers3,
  ListChecks,
  NotebookPen,
  Plus,
  ShieldCheck,
  Sparkles,
  Target,
  UploadCloud,
} from "lucide-react";
import { prisma } from "@/lib/db";
import { getAIStatus } from "@/lib/env";
import { formatDuration, percent } from "@/lib/utils";
import { parsePlanDays, parseStringArray } from "@/lib/documents";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/feedback";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { FileTypeIcon } from "@/components/file-type-icon";
import { TimeAgo } from "@/components/time-ago";
import { ConfidenceBadge, ConfidenceBar, ModeBadge } from "@/components/mode-badges";
import { DemoLaunchButton } from "@/components/demo-launch-button";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const ai = getAIStatus();

  const [documents, demoDocuments, noteCount, attemptAggregate, recentDocuments, recentAttempts, latestPlan] =
    await Promise.all([
      prisma.document.count(),
      prisma.document.count({ where: { mode: "DEMO" } }),
      prisma.note.count(),
      prisma.quizAttempt.aggregate({ _count: { id: true }, _sum: { score: true, total: true } }),
      prisma.document.findMany({
        orderBy: { createdAt: "desc" },
        take: 4,
        include: {
          notes: { select: { id: true } },
          quizzes: { select: { id: true }, orderBy: { createdAt: "desc" }, take: 1 },
        },
      }),
      prisma.quizAttempt.findMany({
        orderBy: { completedAt: "desc" },
        take: 4,
        include: {
          quiz: { select: { id: true, title: true, documentId: true } },
        },
      }),
      prisma.studyPlan.findFirst({ orderBy: { updatedAt: "desc" } }),
    ]);

  const attempts = attemptAggregate._count.id;
  const scoreSum = attemptAggregate._sum.score ?? 0;
  const answeredTotal = attemptAggregate._sum.total ?? 0;
  const averageScore = answeredTotal > 0 ? scoreSum / answeredTotal : null;

  const planDays = latestPlan ? parsePlanDays(latestPlan.daysJson) : [];
  const completedTaskIds = new Set(
    latestPlan ? parseStringArray(latestPlan.completedTaskIdsJson) : [],
  );
  const allTasks = planDays.flatMap((day) => day.tasks);
  const completedTasks = allTasks.filter((task) => completedTaskIds.has(task.id)).length;
  const planProgress = allTasks.length > 0 ? (completedTasks / allTasks.length) * 100 : 0;

  const todayKey = format(new Date(), "yyyy-MM-dd");
  const focusDay =
    planDays.find((day) => day.date === todayKey) ??
    planDays.find((day) => day.date > todayKey) ??
    planDays[planDays.length - 1] ??
    null;
  const focusRemaining = focusDay?.tasks.filter((task) => !completedTaskIds.has(task.id)) ?? [];
  const focusMinutes = focusRemaining.reduce((sum, task) => sum + task.durationMinutes, 0);
  const completedFocus = focusDay?.tasks.filter((task) => completedTaskIds.has(task.id)).length ?? 0;

  const isEmpty = documents === 0;

  return (
    <div>
      <PageHeader
        eyebrow="Workspace overview"
        title="Welcome back. Let's make the next study hour count."
        description={
          ai.mode === "demo"
            ? "You are exploring a curated demo workspace. Every seeded output is labelled. Live analysis unlocks when a Gemini key is configured."
            : "Your live multimodal workspace, grounded in the material you uploaded."
        }
        actions={
          <>
            <Button asChild variant="outline">
              <Link href="/planner">
                <CalendarDays className="h-4 w-4" /> Plan the week
              </Link>
            </Button>
            <Button asChild variant="violet">
              <Link href="/upload">
                <UploadCloud className="h-4 w-4" /> Upload material
              </Link>
            </Button>
          </>
        }
      />

      {isEmpty ? (
        <div className="space-y-5">
          <EmptyState
            icon={Sparkles}
            title="Your workspace is ready for its first input"
            description={
              ai.mode === "demo"
                ? "Load the curated demo workspace to explore real extracted content, quizzes, a study plan and a citation-backed assistant — all clearly labelled as sample output."
                : "Upload a handwritten page, a PDF, a lecture recording or paste typed notes. The real extraction pipeline will show every stage."
            }
            action={
              ai.mode === "demo" ? (
                <DemoLaunchButton label="Load the curated demo" />
              ) : (
                <Button asChild variant="violet">
                  <Link href="/upload">Upload your first file</Link>
                </Button>
              )
            }
          />
          <div className="grid gap-4 sm:grid-cols-3">
            {[
              { title: "Understand the input", body: "Vision OCR, PDF text extraction or audio transcription — no invented words.", icon: FileText },
              { title: "Inspect the output", body: "Per-block confidence, warnings, original preview and manual correction.", icon: ShieldCheck },
              { title: "Study with sources", body: "Structured notes, grounded quizzes, cited answers and a realistic plan.", icon: BookOpenCheck },
            ].map((item) => (
              <Card key={item.title} className="p-5">
                <item.icon className="h-5 w-5 text-violet-600" />
                <h3 className="mt-4 text-sm font-bold text-ink-900">{item.title}</h3>
                <p className="mt-1.5 text-[12.5px] leading-6 text-ink-500">{item.body}</p>
              </Card>
            ))}
          </div>
        </div>
      ) : (
        <>
          <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4" aria-label="Workspace statistics">
            <Card className="relative overflow-hidden p-5">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-[0.13em] text-ink-400">
                    Study documents
                  </p>
                  <p className="mt-3 font-display text-4xl font-extrabold tracking-[-0.05em] text-ink-950">
                    {documents}
                  </p>
                </div>
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-50 text-violet-600">
                  <Layers3 className="h-5 w-5" />
                </span>
              </div>
              <p className="mt-3 text-[11.5px] text-ink-400">
                {demoDocuments > 0 ? `${documents - demoDocuments} live · ${demoDocuments} curated demo` : "All live material"}
              </p>
            </Card>

            <Card className="relative overflow-hidden p-5">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-[0.13em] text-ink-400">
                    Notes generated
                  </p>
                  <p className="mt-3 font-display text-4xl font-extrabold tracking-[-0.05em] text-ink-950">
                    {noteCount}
                  </p>
                </div>
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
                  <NotebookPen className="h-5 w-5" />
                </span>
              </div>
              <p className="mt-3 text-[11.5px] text-ink-400">
                Structured, source-grounded study notes
              </p>
            </Card>

            <Card className="relative overflow-hidden p-5">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-[0.13em] text-ink-400">
                    Quizzes completed
                  </p>
                  <p className="mt-3 font-display text-4xl font-extrabold tracking-[-0.05em] text-ink-950">
                    {attempts}
                  </p>
                </div>
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                  <ListChecks className="h-5 w-5" />
                </span>
              </div>
              <p className="mt-3 text-[11.5px] text-ink-400">
                {averageScore == null
                  ? "No attempts yet — pick a quiz"
                  : `${percent(averageScore)} average across ${answeredTotal} answers`}
              </p>
            </Card>

            <Card className="relative overflow-hidden p-5">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-[0.13em] text-ink-400">
                    Plan progress
                  </p>
                  <p className="mt-3 font-display text-4xl font-extrabold tracking-[-0.05em] text-ink-950">
                    {allTasks.length > 0 ? percent(planProgress / 100) : "—"}
                  </p>
                </div>
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-50 text-sky-600">
                  <Target className="h-5 w-5" />
                </span>
              </div>
              <div className="mt-3.5">
                <Progress value={planProgress} className="h-1.5" />
                <p className="mt-2 text-[11.5px] text-ink-400">
                  {allTasks.length > 0 ? `${completedTasks} of ${allTasks.length} tasks complete` : "No study plan yet"}
                </p>
              </div>
            </Card>
          </section>

          <div className="mt-6 grid gap-6 xl:grid-cols-[1.55fr_1fr]">
            <div className="space-y-6">
              <section>
                <div className="mb-3.5 flex items-end justify-between">
                  <div>
                    <h2 className="font-display text-lg font-bold text-ink-900">Recent material</h2>
                    <p className="mt-0.5 text-[12px] text-ink-400">
                      Extraction, notes and indexes for your latest uploads.
                    </p>
                  </div>
                  <Link
                    href="/library"
                    className="inline-flex items-center gap-1 text-[12px] font-bold text-violet-700 hover:text-violet-900"
                  >
                    View library <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </div>

                <div className="space-y-3">
                  {recentDocuments.map((doc) => {
                    const statusPill =
                      doc.status === "READY"
                        ? { label: "Ready", variant: "green" as const }
                        : doc.status === "FAILED"
                          ? { label: "Failed", variant: "rose" as const }
                          : { label: "Processing", variant: "amber" as const };
                    return (
                      <Link
                        key={doc.id}
                        href={`/documents/${doc.id}`}
                        className="group block rounded-2xl border border-slate-200/80 bg-white p-4 shadow-card transition hover:border-violet-200 hover:shadow-lift sm:p-5"
                      >
                        <div className="flex items-start gap-3.5">
                          <FileTypeIcon type={doc.fileType} className="h-11 w-11" />
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <h3 className="truncate text-[14px] font-bold text-ink-900 group-hover:text-violet-800">
                                {doc.title}
                              </h3>
                              <Badge variant={statusPill.variant}>{statusPill.label}</Badge>
                              {doc.mode === "DEMO" && <ModeBadge mode="DEMO" />}
                            </div>
                            <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-ink-400">
                              <span>{doc.fileName}</span>
                              <span>·</span>
                              <TimeAgo value={doc.updatedAt} />
                              <span>·</span>
                              <span>{doc.notes ? "Notes ready" : "No notes yet"}</span>
                              <span>·</span>
                              <span>{doc.quizzes.length} quiz{doc.quizzes.length === 1 ? "" : "zes"}</span>
                            </div>
                            <div className="mt-2.5 flex flex-wrap items-center gap-2">
                              <ConfidenceBadge score={doc.overallConfidence} />
                              <Badge variant={doc.indexStatus === "READY" ? "violet" : "amber"}>
                                {doc.indexStatus === "READY" ? "Search index ready" : `Index ${doc.indexStatus.toLowerCase()}`}
                              </Badge>
                            </div>
                          </div>
                          <ArrowUpRight className="mt-1 h-4 w-4 shrink-0 text-ink-300 transition group-hover:text-violet-600" />
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </section>

              <section className="rounded-2xl border border-slate-200/80 bg-white shadow-card">
                <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
                  <div>
                    <h2 className="font-display text-[16px] font-bold text-ink-900">Recent quiz attempts</h2>
                    <p className="mt-0.5 text-[11.5px] text-ink-400">Scores are calculated on the server and persisted.</p>
                  </div>
                  <Button asChild variant="ghost" size="sm">
                    <Link href="/quiz">All quizzes <ArrowRight className="h-3.5 w-3.5" /></Link>
                  </Button>
                </div>
                {recentAttempts.length === 0 ? (
                  <div className="px-5 py-8 text-center">
                    <Gauge className="mx-auto h-5 w-5 text-ink-300" />
                    <p className="mt-2 text-[12.5px] text-ink-400">
                      No quiz attempts yet. Each document has a grounded practice quiz.
                    </p>
                  </div>
                ) : (
                  <div className="divide-y divide-slate-100">
                    {recentAttempts.map((attempt) => {
                      const ratio = attempt.total > 0 ? attempt.score / attempt.total : 0;
                      return (
                        <div key={attempt.id} className="flex items-center gap-4 px-5 py-3.5">
                          <span
                            className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[11px] font-extrabold ${
                              ratio >= 0.75
                                ? "bg-emerald-50 text-emerald-700"
                                : ratio >= 0.5
                                  ? "bg-amber-50 text-amber-700"
                                  : "bg-rose-50 text-rose-700"
                            }`}
                          >
                            {percent(ratio)}
                          </span>
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-[12.5px] font-semibold text-ink-800">{attempt.quiz.title}</p>
                            <p className="mt-0.5 text-[11px] text-ink-400">
                              {attempt.score}/{attempt.total} correct · <TimeAgo value={attempt.completedAt} />
                            </p>
                          </div>
                          <Button asChild variant="ghost" size="sm">
                            <Link href={`/quiz/${attempt.quiz.id}`}>Retake</Link>
                          </Button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </section>
            </div>

            <aside className="space-y-5">
              <Card className="overflow-hidden">
                <div className="bg-ink-950 p-5 text-white">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-violet-300">Focus today</p>
                      <h2 className="mt-2 font-display text-[18px] font-bold leading-tight">
                        {focusDay ? focusDay.focus : "Build a study plan"}
                      </h2>
                    </div>
                    <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/10">
                      <Flame className="h-4 w-4 text-amber-300" />
                    </span>
                  </div>
                  {focusDay ? (
                    <p className="mt-2 text-[11.5px] text-white/50">
                      {focusDay.tasks.length - completedFocus} remaining · {formatDuration(focusMinutes)} planned
                    </p>
                  ) : (
                    <p className="mt-2 text-[11.5px] text-white/50">Turn your syllabus into daily tasks.</p>
                  )}
                </div>
                <div className="p-4">
                  {focusDay ? (
                    <div className="space-y-2.5">
                      {focusDay.tasks.slice(0, 4).map((task) => {
                        const done = completedTaskIds.has(task.id);
                        return (
                          <div key={task.id} className="flex items-start gap-2.5">
                            {done ? (
                              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
                            ) : (
                              <Circle className="mt-0.5 h-4 w-4 shrink-0 text-ink-300" />
                            )}
                            <div className="min-w-0">
                              <p className={`text-[12px] font-medium leading-5 ${done ? "text-ink-300 line-through" : "text-ink-700"}`}>
                                {task.title}
                              </p>
                              <p className="text-[10px] uppercase tracking-wide text-ink-300">
                                {task.type} · {task.durationMinutes} min
                              </p>
                            </div>
                          </div>
                        );
                      })}
                      <Button asChild variant="secondary" size="sm" className="mt-1 w-full">
                        <Link href={`/planner?plan=${latestPlan?.id ?? ""}`}>
                          Open today&apos;s plan <ArrowRight className="h-3.5 w-3.5" />
                        </Link>
                      </Button>
                    </div>
                  ) : (
                    <Button asChild variant="violet" size="sm" className="w-full">
                      <Link href="/planner">
                        <Plus className="h-3.5 w-3.5" /> Create a study plan
                      </Link>
                    </Button>
                  )}
                </div>
              </Card>

              <Card className="p-5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="h-4 w-4 text-violet-600" />
                    <h2 className="text-[13px] font-bold text-ink-900">Transparency snapshot</h2>
                  </div>
                  <Badge variant={ai.mode === "live" ? "green" : "amber"}>
                    {ai.mode === "live" ? "Live" : "Demo"}
                  </Badge>
                </div>
                <div className="mt-4 space-y-4">
                  {recentDocuments.slice(0, 2).map((doc) => (
                    <div key={doc.id}>
                      <p className="mb-2 truncate text-[11.5px] font-semibold text-ink-700">{doc.title}</p>
                      <ConfidenceBar score={doc.overallConfidence} />
                    </div>
                  ))}
                  {recentDocuments.length === 0 && (
                    <p className="text-[12px] text-ink-400">No confidence data yet.</p>
                  )}
                </div>
                <div className="mt-4 rounded-xl border border-slate-100 bg-slate-50/70 p-3">
                  <p className="text-[10.5px] leading-5 text-ink-400">
                    Confidence is the model&apos;s self-assessment, not a calibrated probability. Warnings stay visible after correction.
                  </p>
                </div>
                <Link
                  href="/reliability"
                  className="mt-3 inline-flex items-center gap-1 text-[11.5px] font-bold text-violet-700 hover:text-violet-900"
                >
                  See where it breaks <ArrowUpRight className="h-3 w-3" />
                </Link>
              </Card>

              <Card className="p-5">
                <div className="flex items-center gap-2">
                  <CalendarCheck2 className="h-4 w-4 text-emerald-600" />
                  <h2 className="text-[13px] font-bold text-ink-900">Quick actions</h2>
                </div>
                <div className="mt-4 grid gap-2">
                  <Link href="/upload" className="flex items-center gap-2.5 rounded-xl border border-slate-100 px-3 py-2.5 text-[12px] font-semibold text-ink-600 transition hover:border-violet-200 hover:bg-violet-50/50 hover:text-violet-800">
                    <UploadCloud className="h-4 w-4 text-violet-500" /> Upload new material
                  </Link>
                  <Link href="/planner" className="flex items-center gap-2.5 rounded-xl border border-slate-100 px-3 py-2.5 text-[12px] font-semibold text-ink-600 transition hover:border-violet-200 hover:bg-violet-50/50 hover:text-violet-800">
                    <CalendarDays className="h-4 w-4 text-sky-500" /> Adjust study plan
                  </Link>
                  <Link href="/quiz" className="flex items-center gap-2.5 rounded-xl border border-slate-100 px-3 py-2.5 text-[12px] font-semibold text-ink-600 transition hover:border-violet-200 hover:bg-violet-50/50 hover:text-violet-800">
                    <ListChecks className="h-4 w-4 text-emerald-500" /> Take a practice quiz
                  </Link>
                </div>
              </Card>
            </aside>
          </div>
        </>
      )}
    </div>
  );
}
