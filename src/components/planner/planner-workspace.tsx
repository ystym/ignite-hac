"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  ArrowRight,
  BookOpen,
  CalendarDays,
  CalendarPlus,
  Check,
  CheckCircle2,
  ChevronDown,
  Coffee,
  GraduationCap,
  Languages,
  Loader2,
  PencilRuler,
  Plus,
  RefreshCw,
  RotateCcw,
  Sparkles,
  Target,
  Timer,
  Trash2,
  TriangleAlert,
} from "lucide-react";
import { addDays, differenceInCalendarDays, format } from "date-fns";
import { toast } from "sonner";
import type { PlanDay, PlanTask } from "@/lib/schemas";
import {
  cn,
  formatDuration,
  parseDate,
  percent,
} from "@/lib/utils";
import { apiFetch, errorMessage } from "@/lib/client/api";
import { languageLabel, taskTypeLabel } from "@/lib/client/labels";
import { PageHeader } from "@/components/ui/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Callout } from "@/components/ui/callout";
import { EmptyState } from "@/components/ui/empty-state";
import { Progress } from "@/components/ui/feedback";
import { TimeAgo } from "@/components/time-ago";
import { Input, Label, Select, Textarea } from "@/components/ui/input";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ModeBadge } from "@/components/mode-badges";

export type PlanRecord = {
  id: string;
  title: string;
  subject: string;
  examDate: string;
  dailyMinutes: number;
  language: string;
  syllabus: string;
  topics: string[];
  days: PlanDay[];
  completedTopics: string[];
  completedTaskIds: string[];
  summary: string | null;
  mode: string;
  model: string | null;
  createdAt: string;
  updatedAt: string;
  notice?: string | null;
};

type CreateResponse = {
  id: string;
  plan: {
    title: string;
    summary: string;
    topics: string[];
    days: PlanDay[];
  };
  mode: string;
  model: string | null;
  note: string | null;
  capped: boolean;
};

type RegenerateResponse = {
  ok: boolean;
  plan: {
    title: string;
    summary: string;
    topics: string[];
    days: PlanDay[];
  };
  mode: string;
  model: string | null;
  note: string | null;
  updatedAt: string;
};

export function PlannerWorkspace({
  plans: initialPlans,
  initialPlanId,
  aiConfigured,
}: {
  plans: PlanRecord[];
  initialPlanId: string | null;
  aiConfigured: boolean;
}) {
  const router = useRouter();
  const [plans, setPlans] = useState(initialPlans);
  const [selectedId, setSelectedId] = useState(
    initialPlanId && initialPlans.some((plan) => plan.id === initialPlanId)
      ? initialPlanId
      : (initialPlans[0]?.id ?? null),
  );
  const [creating, setCreating] = useState(initialPlans.length === 0);
  const [regenerateOpen, setRegenerateOpen] = useState(false);
  const [regenerating, setRegenerating] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [savingTaskId, setSavingTaskId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const selected = plans.find((plan) => plan.id === selectedId) ?? null;

  function upsertPlan(next: PlanRecord) {
    setPlans((current) => current.map((plan) => (plan.id === next.id ? next : plan)));
  }

  function selectPlan(id: string) {
    setSelectedId(id);
    setCreating(false);
    setError(null);
    router.replace(`/planner?plan=${id}`, { scroll: false });
  }

  async function toggleTask(plan: PlanRecord, task: PlanTask) {
    if (savingTaskId) return;
    const completed = new Set(plan.completedTaskIds);
    if (completed.has(task.id)) completed.delete(task.id);
    else completed.add(task.id);
    const nextCompleted = [...completed];
    const optimistic = { ...plan, completedTaskIds: nextCompleted, updatedAt: new Date().toISOString() };
    upsertPlan(optimistic);
    setSavingTaskId(task.id);
    setError(null);
    try {
      const response = await apiFetch<{
        completedTaskIds: string[];
        completedTopics: string[];
        updatedAt: string;
      }>(`/api/plans/${plan.id}`, {
        method: "PATCH",
        body: { completedTaskIds: nextCompleted },
      });
      upsertPlan({
        ...optimistic,
        completedTaskIds: response.completedTaskIds,
        completedTopics: response.completedTopics,
        updatedAt: response.updatedAt,
      });
    } catch (caught) {
      upsertPlan(plan);
      const message = errorMessage(caught);
      setError(message);
      toast.error("Could not save task progress", { description: message });
    } finally {
      setSavingTaskId(null);
    }
  }

  async function regenerate() {
    if (!selected || regenerating) return;
    setRegenerating(true);
    setError(null);
    try {
      const response = await apiFetch<RegenerateResponse>(
        `/api/plans/${selected.id}/regenerate`,
        { method: "POST" },
      );
      upsertPlan({
        ...selected,
        title: response.plan.title,
        topics: response.plan.topics,
        days: response.plan.days,
        summary: response.plan.summary,
        completedTaskIds: [],
        mode: response.mode,
        model: response.model,
        updatedAt: response.updatedAt,
        notice: response.note,
      });
      setRegenerateOpen(false);
      toast.success("Study plan regenerated", {
        description:
          response.mode === "LIVE"
            ? "Gemini rebuilt the schedule. Completed topics were preserved."
            : "The local deterministic scheduler rebuilt the schedule. No AI was called.",
      });
    } catch (caught) {
      const message = errorMessage(caught);
      setError(message);
      toast.error("Could not regenerate the plan", { description: message });
    } finally {
      setRegenerating(false);
    }
  }

  async function deletePlan() {
    if (!selected || deleting) return;
    setDeleting(true);
    setError(null);
    try {
      await apiFetch(`/api/plans/${selected.id}`, { method: "DELETE" });
      const remaining = plans.filter((plan) => plan.id !== selected.id);
      setPlans(remaining);
      setSelectedId(remaining[0]?.id ?? null);
      setDeleteOpen(false);
      setCreating(remaining.length === 0);
      toast.success("Study plan deleted", {
        description: "The plan and its task progress were removed. Documents and notes are unchanged.",
      });
      router.replace("/planner", { scroll: false });
    } catch (caught) {
      const message = errorMessage(caught);
      setError(message);
      toast.error("Could not delete the plan", { description: message });
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div>
      <PageHeader
        eyebrow="Day-by-day study runway"
        title={creating ? "Build a plan around the time you actually have." : "A plan that fits the runway."}
        description="Study sessions, spaced revision, timed practice and buffer. Plans adapt to your available daily minutes and preserve topics you have already completed."
        actions={
          <>
            {!creating && (
              <Button
                type="button"
                variant={plans.length === 0 ? "violet" : "outline"}
                onClick={() => {
                  setCreating(true);
                  setError(null);
                }}
              >
                <Plus className="h-4 w-4" /> New plan
              </Button>
            )}
            {creating && plans.length > 0 && (
              <Button type="button" variant="ghost" onClick={() => setCreating(false)}>
                Cancel
              </Button>
            )}
          </>
        }
      />

      {error && !creating && (
        <div className="mb-4 flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-rose-600" />
          <p className="text-[12px] leading-5 text-rose-800">{error}</p>
        </div>
      )}

      {creating ? (
        <PlanForm
          aiConfigured={aiConfigured}
          onCancel={plans.length > 0 ? () => setCreating(false) : undefined}
          onCreated={(plan) => {
            setPlans((current) => [plan, ...current]);
            setSelectedId(plan.id);
            setCreating(false);
            router.replace(`/planner?plan=${plan.id}`, { scroll: false });
          }}
        />
      ) : plans.length === 0 || !selected ? (
        <EmptyState
          icon={CalendarPlus}
          title="No study plan yet"
          description="Create a plan from a syllabus, subject outline or topic list. It will be scheduled day by day around your exam date and daily minutes."
          action={
            <Button type="button" variant="violet" onClick={() => setCreating(true)}>
              <Plus className="h-4 w-4" /> Create your first plan
            </Button>
          }
        />
      ) : (
        <div className="grid gap-6 xl:grid-cols-[260px_minmax(0,1fr)]">
          <aside className="xl:sticky xl:top-24 xl:self-start">
            <div className="rounded-2xl border border-hairline bg-white p-3">
              <div className="flex items-center justify-between px-1.5 pb-2.5 pt-1">
                <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-ink-400">
                  Your plans · {plans.length}
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setCreating(true);
                    setError(null);
                  }}
                  className="inline-flex h-6 w-6 items-center justify-center rounded-md text-ink-400 transition hover:bg-violet-50 hover:text-violet-700"
                  aria-label="Create a new study plan"
                >
                  <Plus className="h-3.5 w-3.5" />
                </button>
              </div>
              <div className="max-h-[65vh] space-y-1 overflow-y-auto">
                {plans.map((plan) => {
                  const active = plan.id === selected.id;
                  const completed = new Set(plan.completedTaskIds);
                  const total = plan.days.reduce((sum, day) => sum + day.tasks.length, 0);
                  const done = plan.days.reduce(
                    (sum, day) => sum + day.tasks.filter((task) => completed.has(task.id)).length,
                    0,
                  );
                  const daysLeft = differenceInCalendarDays(parseDate(plan.examDate), new Date());
                  return (
                    <button
                      key={plan.id}
                      type="button"
                      onClick={() => selectPlan(plan.id)}
                      className={cn(
                        "w-full rounded-xl border p-3 text-left transition",
                        active
                          ? "border-violet-200 bg-violet-50/70"
                          : "border-transparent hover:border-hairline hover:bg-parchment",
                      )}
                      aria-current={active ? "true" : undefined}
                    >
                      <div className="flex items-center gap-2">
                        <span
                          className={cn(
                            "h-1.5 w-1.5 rounded-full",
                            plan.mode === "LIVE" ? "bg-emerald-500" : "bg-amber-500",
                          )}
                        />
                        <p className={cn("truncate text-[12px] font-semibold", active ? "text-violet-900" : "text-ink-800")}>
                          {plan.title}
                        </p>
                      </div>
                      <p className="mt-0.5 truncate text-[10px] text-ink-400">{plan.subject}</p>
                      <div className="mt-2">
                        <div className="h-1 overflow-hidden rounded-full bg-white">
                          <div
                            className={cn("h-full rounded-full", plan.mode === "LIVE" ? "bg-emerald-500" : "bg-violet-500")}
                            style={{ width: `${total > 0 ? (done / total) * 100 : 0}%` }}
                          />
                        </div>
                        <div className="mt-1 flex items-center justify-between text-[9px] text-ink-400">
                          <span>{done}/{total} tasks</span>
                          <span>
                            {daysLeft < 0
                              ? "exam passed"
                              : daysLeft === 0
                                ? "exam today"
                                : `${daysLeft}d left`}
                          </span>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="mt-3 rounded-xl border border-hairline bg-white p-3.5">
              <div className="flex items-center gap-1.5">
                <Sparkles className="h-3.5 w-3.5 text-violet-500" />
                <p className="text-[10.5px] font-semibold text-ink-800">
                  {aiConfigured ? "Gemini planner active" : "Local scheduler mode"}
                </p>
              </div>
              <p className="mt-1.5 text-[10px] leading-4 text-ink-400">
                {aiConfigured
                  ? "New plans are generated by Gemini, then validated, date-bounded and length-capped."
                  : "No key: plans come from a deterministic scheduler and are labelled Non-AI. Add a Gemini key to switch to AI planning."}
              </p>
            </div>
          </aside>

          <div className="min-w-0">
            <PlanDetail
              key={selected.id}
              plan={selected}
              savingTaskId={savingTaskId}
              onToggleTask={(task) => toggleTask(selected, task)}
              onRegenerate={() => setRegenerateOpen(true)}
              onDelete={() => setDeleteOpen(true)}
            />
          </div>
        </div>
      )}

      <Dialog open={regenerateOpen} onOpenChange={setRegenerateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Regenerate this plan?</DialogTitle>
            <DialogDescription>
              The daily tasks are replaced using the same exam date, syllabus and daily minutes.
              Completed topics are preserved, but individual task ticks are reset.{" "}
              {aiConfigured
                ? "This makes a live Gemini call."
                : "This runs the local deterministic scheduler; no AI is called."}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline">
                Keep current plan
              </Button>
            </DialogClose>
            <Button type="button" variant="violet" onClick={regenerate} loading={regenerating}>
              {!regenerating && <RefreshCw className="h-4 w-4" />} Regenerate
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete this study plan?</DialogTitle>
            <DialogDescription>
              The plan and its task-completion history will be permanently removed. Documents, notes and
              quizzes are not affected.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline">
                Keep plan
              </Button>
            </DialogClose>
            <Button type="button" variant="danger" onClick={deletePlan} loading={deleting}>
              <Trash2 className="h-4 w-4" /> Delete plan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function PlanForm({
  aiConfigured,
  onCreated,
  onCancel,
}: {
  aiConfigured: boolean;
  onCreated: (plan: PlanRecord) => void;
  onCancel?: () => void;
}) {
  const [title, setTitle] = useState("");
  const [subject, setSubject] = useState("");
  const [examDate, setExamDate] = useState(format(addDays(new Date(), 21), "yyyy-MM-dd"));
  const [dailyMinutes, setDailyMinutes] = useState("60");
  const [language, setLanguage] = useState("simple_en");
  const [syllabus, setSyllabus] = useState("");
  const [completed, setCompleted] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (submitting) return;
    setError(null);
    if (title.trim().length < 2) {
      setError("Give the plan a title of at least 2 characters.");
      return;
    }
    if (subject.trim().length < 2) {
      setError("Add the subject or course name.");
      return;
    }
    if (!examDate) {
      setError("Choose the exam date.");
      return;
    }
    const minutes = Number(dailyMinutes);
    if (!Number.isFinite(minutes) || minutes < 15 || minutes > 360) {
      setError("Daily minutes must be between 15 and 360.");
      return;
    }
    if (syllabus.trim().length < 10) {
      setError("Add at least 10 characters of syllabus or topic list.");
      return;
    }

    const completedTopics = completed
      .split(",")
      .map((topic) => topic.trim())
      .filter(Boolean)
      .slice(0, 60);

    setSubmitting(true);
    try {
      const response = await apiFetch<CreateResponse>("/api/plans", {
        method: "POST",
        body: {
          title: title.trim(),
          subject: subject.trim(),
          examDate,
          dailyMinutes: minutes,
          language,
          syllabus: syllabus.trim(),
          completedTopics,
        },
      });
      const now = new Date().toISOString();
      const record: PlanRecord = {
        id: response.id,
        title: response.plan.title,
        subject: subject.trim(),
        examDate: new Date(`${examDate}T12:00:00`).toISOString(),
        dailyMinutes: minutes,
        language,
        syllabus: syllabus.trim(),
        topics: response.plan.topics,
        days: response.plan.days,
        completedTopics,
        completedTaskIds: [],
        summary: response.plan.summary,
        mode: response.mode,
        model: response.model,
        createdAt: now,
        updatedAt: now,
        notice: response.note,
      };
      onCreated(record);
      toast.success("Study plan created", {
        description:
          response.mode === "LIVE"
            ? "Gemini built and validated a day-by-day plan."
            : "Built by the local deterministic scheduler. Clearly labelled Non-AI.",
      });
    } catch (caught) {
      const message = errorMessage(caught);
      setError(message);
      toast.error("Could not create the plan", { description: message });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_330px]">
      <form
        onSubmit={submit}
        className="rounded-2xl border border-hairline bg-white p-5 sm:p-6"
      >
        <div className="flex items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-violet-50 text-violet-600">
            <CalendarPlus className="h-5 w-5" />
          </span>
          <div>
            <h2 className="font-display text-lg font-semibold text-ink-900">New study plan</h2>
            <p className="mt-0.5 text-[12px] leading-5 text-ink-500">
              Use one topic per line in the syllabus box. The scheduler builds a day-by-day mix of new
              study, spaced revision, timed practice and buffer.
            </p>
          </div>
        </div>

        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="plan-title">Plan title</Label>
            <Input
              id="plan-title"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="e.g. Semester 4 finals — 3-week sprint"
              maxLength={160}
              disabled={submitting}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="plan-subject">Subject / course</Label>
            <Input
              id="plan-subject"
              value={subject}
              onChange={(event) => setSubject(event.target.value)}
              placeholder="e.g. Data Structures & Algorithms"
              maxLength={120}
              disabled={submitting}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="plan-exam">Exam date</Label>
            <Input
              id="plan-exam"
              type="date"
              value={examDate}
              min={format(new Date(), "yyyy-MM-dd")}
              onChange={(event) => setExamDate(event.target.value)}
              disabled={submitting}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="plan-minutes">Daily study minutes</Label>
            <Input
              id="plan-minutes"
              type="number"
              min={15}
              max={360}
              step={5}
              value={dailyMinutes}
              onChange={(event) => setDailyMinutes(event.target.value)}
              disabled={submitting}
            />
            <p className="text-[10px] text-ink-400">15–360 minutes. Plans are capped at 60 days.</p>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="plan-language">Explanation language</Label>
            <Select
              id="plan-language"
              value={language}
              onChange={(event) => setLanguage(event.target.value)}
              disabled={submitting}
            >
              <option value="simple_en">Simple English</option>
              <option value="hinglish">Hinglish</option>
            </Select>
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="plan-syllabus">Syllabus / topics</Label>
              <span className="text-[10px] text-ink-300">{syllabus.length.toLocaleString()} / 30,000</span>
            </div>
            <Textarea
              id="plan-syllabus"
              value={syllabus}
              onChange={(event) => setSyllabus(event.target.value)}
              placeholder={"Module 1: Arrays, linked lists, stacks, queues\nModule 2: Trees, BST, heaps\nModule 3: Graphs, BFS, DFS\nModule 4: Sorting and searching\nModule 5: Dynamic programming basics"}
              className="min-h-[170px] font-mono text-[12px] leading-6"
              maxLength={30_000}
              disabled={submitting}
            />
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="plan-completed">Already comfortable with (optional)</Label>
            <Input
              id="plan-completed"
              value={completed}
              onChange={(event) => setCompleted(event.target.value)}
              placeholder="Comma-separated topics the schedule should not introduce as new"
              maxLength={1_000}
              disabled={submitting}
            />
          </div>
        </div>

        {error && (
          <div className="mt-4 flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-rose-600" />
            <p className="text-[11.5px] leading-5 text-rose-800">{error}</p>
          </div>
        )}

        <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-[#f0f0f0] pt-4">
          <p className="text-[10.5px] leading-4 text-ink-400">
            {aiConfigured
              ? "Gemini generates the schedule; dates and durations are validated before saving."
              : "No Gemini key: the deterministic local scheduler will build this plan and mark it Non-AI."}
          </p>
          <div className="flex items-center gap-2">
            {onCancel && (
              <Button type="button" variant="outline" onClick={onCancel} disabled={submitting}>
                Cancel
              </Button>
            )}
            <Button type="submit" variant="violet" loading={submitting}>
              {!submitting && <Sparkles className="h-4 w-4" />} Create plan
            </Button>
          </div>
        </div>
      </form>

      <aside className="space-y-4">
        <div className="rounded-2xl border border-hairline bg-white p-5">
          <div className="flex items-center gap-2">
            <BookOpen className="h-4 w-4 text-violet-600" />
            <h2 className="text-[12.5px] font-semibold text-ink-900">What goes into every plan</h2>
          </div>
          <ul className="mt-3 space-y-2.5">
            {[
              { icon: BookOpen, text: "New-topic study sessions sized to your daily minutes." },
              { icon: RotateCcw, text: "Spaced revision on a repeating schedule, not just one pass." },
              { icon: Target, text: "Timed practice and weak-topic drills before the exam." },
              { icon: Coffee, text: "Buffer and lighter final-day consolidation." },
            ].map((item) => (
              <li key={item.text} className="flex items-start gap-2.5">
                <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-[#e8e8ed] text-ink-500">
                  <item.icon className="h-3 w-3" />
                </span>
                <p className="text-[11px] leading-5 text-ink-500">{item.text}</p>
              </li>
            ))}
          </ul>
        </div>
        {!aiConfigured && (
          <Callout variant="warning" title="Demo Mode planner">
            AI generation is off, so this plan will be produced by a deterministic local scheduler. It
            will carry a “Non-AI scheduler” label everywhere. Add{" "}
            <code className="rounded bg-white/70 px-1">GEMINI_API_KEY</code> to use Gemini.
          </Callout>
        )}
      </aside>
    </div>
  );
}

const TASK_ICONS = {
  study: BookOpen,
  revision: RotateCcw,
  practice: Target,
  buffer: Coffee,
} as const;

const TASK_STYLES: Record<string, string> = {
  study: "border-violet-100 bg-violet-50 text-violet-700",
  revision: "border-amber-100 bg-amber-50 text-amber-700",
  practice: "border-emerald-100 bg-emerald-50 text-emerald-700",
  buffer: "border-hairline bg-parchment text-ink-500",
};

function PlanDetail({
  plan,
  savingTaskId,
  onToggleTask,
  onRegenerate,
  onDelete,
}: {
  plan: PlanRecord;
  savingTaskId: string | null;
  onToggleTask: (task: PlanTask) => void;
  onRegenerate: () => void;
  onDelete: () => void;
}) {
  const todayKey = format(new Date(), "yyyy-MM-dd");
  const completed = useMemo(() => new Set(plan.completedTaskIds), [plan.completedTaskIds]);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  const allTasks = plan.days.flatMap((day) => day.tasks);
  const doneCount = allTasks.filter((task) => completed.has(task.id)).length;
  const totalMinutes = allTasks.reduce((sum, task) => sum + task.durationMinutes, 0);
  const remainingMinutes = allTasks
    .filter((task) => !completed.has(task.id))
    .reduce((sum, task) => sum + task.durationMinutes, 0);
  const progress = allTasks.length > 0 ? (doneCount / allTasks.length) * 100 : 0;
  const daysLeft = differenceInCalendarDays(parseDate(plan.examDate), new Date());
  const nextDay =
    plan.days.find((day) => day.date >= todayKey && day.tasks.some((task) => !completed.has(task.id))) ??
    plan.days.find((day) => day.tasks.some((task) => !completed.has(task.id))) ??
    null;

  function isOpen(day: PlanDay, index: number): boolean {
    if (day.date in expanded) return expanded[day.date];
    return index < 2 || day.date === todayKey;
  }

  return (
    <div className="space-y-4">
      <div className="overflow-hidden rounded-2xl border border-hairline bg-white">
        <div className="bg-parchment p-5 sm:p-6">
          <div className="flex flex-wrap items-center gap-2">
            {plan.mode === "LIVE" ? (
              <ModeBadge mode="LIVE" />
            ) : (
              <Badge
                variant="amber"
                title="Built by a deterministic local scheduler because no Gemini API key is configured. Not AI output."
              >
                <Timer className="h-3 w-3" /> Non-AI scheduler
              </Badge>
            )}
            <Badge variant="default">
              <GraduationCap className="h-3 w-3" /> {plan.subject}
            </Badge>
            <Badge variant="default">
              <Languages className="h-3 w-3" /> {languageLabel(plan.language)}
            </Badge>
            {plan.model && <span className="font-mono text-[9.5px] text-ink-300">{plan.model}</span>}
          </div>

          <h1 className="mt-3 font-display text-[clamp(1.55rem,2.7vw,2.2rem)] font-semibold leading-tight tracking-[-0.035em] text-ink-950">
            {plan.title}
          </h1>
          {plan.summary && (
            <p className="mt-2 max-w-3xl text-[13px] leading-6 text-ink-500">{plan.summary}</p>
          )}

          <div className="mt-4 grid gap-2.5 sm:grid-cols-3">
            <div className="flex items-center gap-2.5 rounded-xl border border-white bg-white/80 px-3 py-2.5">
              <CalendarDays className="h-4 w-4 text-violet-600" />
              <div>
                <p className="text-[9px] font-semibold uppercase tracking-wider text-ink-400">Exam</p>
                <p className="text-[11.5px] font-semibold text-ink-800">
                  {parseDate(plan.examDate).toLocaleDateString("en-GB", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                    timeZone: "UTC",
                  })}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2.5 rounded-xl border border-white bg-white/80 px-3 py-2.5">
              <Timer className="h-4 w-4 text-sky-600" />
              <div>
                <p className="text-[9px] font-semibold uppercase tracking-wider text-ink-400">Runway</p>
                <p className="text-[11.5px] font-semibold text-ink-800">
                  {daysLeft > 0 ? `${daysLeft} day${daysLeft === 1 ? "" : "s"} left` : daysLeft === 0 ? "Exam is today" : "Exam date passed"}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2.5 rounded-xl border border-white bg-white/80 px-3 py-2.5">
              <PencilRuler className="h-4 w-4 text-emerald-600" />
              <div>
                <p className="text-[9px] font-semibold uppercase tracking-wider text-ink-400">Planned</p>
                <p className="text-[11.5px] font-semibold text-ink-800">
                  {formatDuration(remainingMinutes)} left of {formatDuration(totalMinutes)}
                </p>
              </div>
            </div>
          </div>

          {plan.notice && (
            <p className="mt-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-[10.5px] leading-5 text-amber-800">
              {plan.notice}
            </p>
          )}
        </div>

        <div className="border-t border-[#f0f0f0] p-5 sm:p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-[11px] font-semibold text-ink-800">
                {doneCount} of {allTasks.length} tasks complete · {percent(progress / 100)}
              </p>
              <p className="text-[10px] text-ink-400">
                {plan.days.length} study days · {plan.topics.length} topics · updated <TimeAgo value={plan.updatedAt} />
              </p>
            </div>
            <div className="flex flex-wrap items-center justify-end gap-2">
              {nextDay && (
                <Button
                  type="button"
                  size="sm"
                  variant="secondary"
                  onClick={() => {
                    document.getElementById(`day-${nextDay.date}`)?.scrollIntoView({ behavior: "smooth", block: "start" });
                    setExpanded((current) => ({ ...current, [nextDay.date]: true }));
                  }}
                >
                  <ArrowRight className="h-3.5 w-3.5" /> Next task
                </Button>
              )}
              <Button type="button" size="sm" variant="outline" onClick={onRegenerate}>
                <RefreshCw className="h-3.5 w-3.5" /> Regenerate
              </Button>
              <Button
                type="button"
                size="icon-sm"
                variant="ghost"
                onClick={onDelete}
                className="text-ink-400 hover:bg-rose-50 hover:text-rose-600"
                aria-label="Delete this study plan"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
          <Progress value={progress} className="mt-3 h-2" />
        </div>

        {plan.completedTopics.length > 0 && (
          <div className="border-t border-[#f0f0f0] bg-emerald-50/30 px-5 py-3.5 sm:px-6">
            <p className="text-[9.5px] font-semibold uppercase tracking-[0.13em] text-emerald-800">
              Preserved completed topics
            </p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {plan.completedTopics.map((topic) => (
                <Badge key={topic} variant="green" size="sm">
                  <Check className="h-2.5 w-2.5" /> {topic}
                </Badge>
              ))}
            </div>
          </div>
        )}
      </div>

      {plan.mode !== "LIVE" && (
        <Callout variant="info" title="This plan is not AI output">
          It was built by a deterministic local scheduler because no Gemini key is configured. The
          schedule structure is real and editable; the prose is template-based. Add a key and regenerate
          to use Gemini, or keep a transparent offline plan.
        </Callout>
      )}

      <div className="relative space-y-3">
        {plan.days.map((day, dayIndex) => {
          const dayDone = day.tasks.filter((task) => completed.has(task.id)).length;
          const dayMinutes = day.tasks.reduce((sum, task) => sum + task.durationMinutes, 0);
          const isToday = day.date === todayKey;
          const isPast = day.date < todayKey;
          const dayComplete = dayDone === day.tasks.length;
          const open = isOpen(day, dayIndex);
          return (
            <section
              key={day.date}
              id={`day-${day.date}`}
              className={cn(
                "scroll-mt-24 overflow-hidden rounded-2xl border bg-white",
                isToday ? "border-violet-300 ring-2 ring-violet-100" : "border-hairline",
              )}
            >
              <button
                type="button"
                onClick={() =>
                  setExpanded((current) => ({ ...current, [day.date]: !open }))
                }
                className="flex w-full items-center gap-3 px-4 py-3.5 text-left transition hover:bg-parchment sm:px-5"
                aria-expanded={open}
              >
                <span
                  className={cn(
                    "flex h-9 w-9 shrink-0 flex-col items-center justify-center rounded-xl border",
                    dayComplete
                      ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                      : isToday
                        ? "border-violet-200 bg-violet-50 text-violet-700"
                        : "border-hairline bg-parchment text-ink-500",
                  )}
                >
                  {dayComplete ? (
                    <CheckCircle2 className="h-4 w-4" />
                  ) : (
                    <>
                      <span className="text-[9px] font-semibold uppercase leading-none">
                        {format(parseDate(day.date), "MMM")}
                      </span>
                      <span className="text-[12px] font-semibold leading-tight">
                        {format(parseDate(day.date), "d")}
                      </span>
                    </>
                  )}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <p className="text-[12.5px] font-semibold text-ink-900">{day.label}</p>
                    {isToday && <Badge variant="violet" size="sm">Today</Badge>}
                    {isPast && !dayComplete && <Badge variant="orange" size="sm">Overdue</Badge>}
                    {dayComplete && <Badge variant="green" size="sm">Complete</Badge>}
                  </div>
                  <p className="truncate text-[10.5px] text-ink-400">
                    {day.focus} · {day.tasks.length} tasks · {formatDuration(dayMinutes)}
                  </p>
                </div>
                <div className="hidden items-center gap-1 sm:flex">
                  <span className="font-mono text-[9.5px] text-ink-400">
                    {dayDone}/{day.tasks.length}
                  </span>
                  <span className="h-1 w-14 overflow-hidden rounded-full bg-[#e8e8ed]">
                    <span
                      className={cn("block h-full rounded-full", dayComplete ? "bg-emerald-500" : "bg-violet-500")}
                      style={{ width: `${(dayDone / day.tasks.length) * 100}%` }}
                    />
                  </span>
                </div>
                <ChevronDown
                  className={cn("h-4 w-4 shrink-0 text-ink-300 transition-transform", open && "rotate-180")}
                  aria-hidden="true"
                />
              </button>

              {open && (
                <div className="space-y-2 border-t border-[#f0f0f0] p-3 sm:p-4">
                  {day.tasks.map((task) => {
                    const done = completed.has(task.id);
                    const Icon = TASK_ICONS[task.type] ?? BookOpen;
                    const saving = savingTaskId === task.id;
                    return (
                      <div
                        key={task.id}
                        className={cn(
                          "flex items-start gap-3 rounded-xl border p-3 transition",
                          done ? "border-[#f0f0f0] bg-parchment/60" : "border-hairline bg-white",
                        )}
                      >
                        <button
                          type="button"
                          onClick={() => onToggleTask(task)}
                          disabled={Boolean(savingTaskId)}
                          className={cn(
                            "mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border transition",
                            done
                              ? "border-emerald-500 bg-emerald-500 text-white"
                              : "border-slate-300 bg-white hover:border-violet-400",
                            saving && "opacity-60",
                          )}
                          aria-label={`Mark “${task.title}” as ${done ? "not complete" : "complete"}`}
                          aria-pressed={done}
                        >
                          {saving ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          ) : done ? (
                            <Check className="h-3 w-3" />
                          ) : null}
                        </button>
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <p
                              className={cn(
                                "text-[12px] font-semibold leading-5",
                                done ? "text-ink-400 line-through" : "text-ink-800",
                              )}
                            >
                              {task.title}
                            </p>
                            <Badge variant="default" size="sm" className={TASK_STYLES[task.type]}>
                              <Icon className="h-2.5 w-2.5" /> {taskTypeLabel(task.type)}
                            </Badge>
                            <span className="text-[9.5px] text-ink-400">{task.durationMinutes} min</span>
                          </div>
                          <p className={cn("mt-1 text-[10.5px] leading-4", done ? "text-ink-300" : "text-ink-500")}>
                            {task.description}
                          </p>
                          <p className="mt-0.5 text-[9px] uppercase tracking-wider text-ink-300">
                            {task.topic}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>
          );
        })}
      </div>

      <div className="rounded-2xl border border-hairline bg-white p-5">
        <div className="flex items-center gap-2">
          <GraduationCap className="h-4 w-4 text-violet-600" />
          <h2 className="text-[12.5px] font-semibold text-ink-900">Topics in this plan</h2>
        </div>
        <div className="mt-2.5 flex flex-wrap gap-1.5">
          {plan.topics.map((topic) => (
            <Badge key={topic} variant="default" size="sm">
              {topic}
            </Badge>
          ))}
        </div>
        <p className="mt-3 flex items-start gap-1.5 text-[10px] leading-4 text-ink-400">
          <TriangleAlert className="mt-0.5 h-3 w-3 shrink-0" />
          A plan is a prompt, not a guarantee. If a day slips, mark tasks honestly and protect the
          revision blocks first.
        </p>
      </div>
    </div>
  );
}
