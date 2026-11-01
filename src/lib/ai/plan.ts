import { addDays, differenceInCalendarDays, format, isBefore, parseISO, startOfDay } from "date-fns";
import { AIError } from "@/lib/errors";
import { getAIStatus } from "@/lib/env";
import {
  studyPlanSchema,
  type PlanDay,
  type PlanInput,
  type PlanTask,
  type StudyPlanContent,
} from "@/lib/schemas";
import { PLAN_SYSTEM, planPrompt } from "@/lib/ai/prompts";
import { generateStructured, getConfiguredModel } from "@/lib/ai/gemini";

const MAX_AI_DAYS = 30;
const MAX_LOCAL_DAYS = 60;

export type PlanGenerationResult = {
  plan: StudyPlanContent;
  mode: "LIVE" | "DEMO";
  model: string | null;
  capped: boolean;
  note: string | null;
};

function isoDate(date: Date): string {
  return format(date, "yyyy-MM-dd");
}

function friendlyLabel(date: Date): string {
  return format(date, "EEE, d MMM");
}

function examDateFromInput(input: PlanInput): Date {
  const exam = startOfDay(parseISO(input.examDate));
  if (Number.isNaN(exam.getTime())) {
    throw new AIError({
      message: "That exam date is not valid.",
      code: "INVALID_EXAM_DATE",
      status: 400,
      retryable: false,
    });
  }
  return exam;
}

function cleanTopics(input: PlanInput): string[] {
  const completed = new Set(input.completedTopics.map((topic) => topic.trim().toLowerCase()));
  const parts = input.syllabus
    .split(/\n|;|,(?=\s*[A-Z0-9])/)
    .map((line) =>
      line
        .replace(/^[-*•\d.)\s]+/, "")
        .replace(/\s+/g, " ")
        .trim(),
    )
    .filter(
      (line) =>
        line.length >= 2 &&
        line.length <= 140 &&
        !/^(syllabus|course|credits?|marks?|semester|exam date|assessment|internal|end[- ]semester)\b/i.test(line),
    );

  const concise = parts
    .filter((line) => !completed.has(line.toLowerCase()))
    .slice(0, 24);

  if (concise.length > 0) return concise;
  return [input.subject];
}

function allocate(dailyMinutes: number, weights: Array<{ weight: number; min: number }>): number[] {
  const totalWeight = weights.reduce((sum, item) => sum + item.weight, 0);
  let durations = weights.map((item) =>
    Math.max(item.min, Math.round(((dailyMinutes * item.weight) / totalWeight) / 5) * 5),
  );
  let total = durations.reduce((sum, value) => sum + value, 0);
  while (total > dailyMinutes) {
    const largest = durations.indexOf(Math.max(...durations));
    if (durations[largest] <= 5) break;
    durations[largest] -= 5;
    total -= 5;
  }
  if (total < dailyMinutes) {
    durations[durations.length - 1] += dailyMinutes - total;
  }
  return durations.map((value) => Math.max(5, value));
}

/**
 * Deterministic scheduler used in demo mode (no API key) and as a transparent
 * fallback explanation. It is NOT presented as AI output.
 */
export function buildLocalPlan(input: PlanInput): PlanGenerationResult {
  const today = startOfDay(new Date());
  const exam = examDateFromInput(input);
  if (isBefore(exam, today)) {
    throw new AIError({
      message: "The exam date must be today or in the future.",
      code: "EXAM_DATE_IN_PAST",
      status: 400,
      retryable: false,
    });
  }

  const daysAvailable = differenceInCalendarDays(exam, today);
  const prepDays = Math.max(1, daysAvailable);
  const dayCount = Math.min(prepDays, MAX_LOCAL_DAYS);
  const capped = prepDays > dayCount;
  const topics = cleanTopics(input);
  const allTopics = [...new Set([...input.completedTopics, ...topics])];
  const days: PlanDay[] = [];

  for (let index = 0; index < dayCount; index++) {
    const date = addDays(today, index);
    const topic = topics[index % topics.length];
    const previousTopic = topics[(index + topics.length - 1) % topics.length];
    const isFinal = index === dayCount - 1;
    const isPracticeDay = !isFinal && (index + 1) % 7 === 0;
    const isRevisionDay = !isFinal && (index + 1) % 3 === 0;
    const tasks: PlanTask[] = [];

    if (isFinal) {
      const durations = allocate(input.dailyMinutes, [
        { weight: 0.35, min: 10 },
        { weight: 0.4, min: 10 },
        { weight: 0.25, min: 10 },
      ]);
      tasks.push(
        {
          id: `d${index}-t1`,
          title: `Final recall sweep: ${topic}`,
          type: "revision",
          topic,
          durationMinutes: durations[0],
          description:
            "Close the book and write every definition, formula and complexity you remember. Then check only the gaps.",
        },
        {
          id: `d${index}-t2`,
          title: "Timed mixed practice test",
          type: "practice",
          topic: "Mixed syllabus",
          durationMinutes: durations[1],
          description:
            "Do one timed set across the whole syllabus. Mark it, then write an error log with the reason for each mistake.",
        },
        {
          id: `d${index}-t3`,
          title: "Light review + buffer",
          type: "buffer",
          topic: "Error log",
          durationMinutes: durations[2],
          description:
            "Review only your error log and formula sheet. Stop at the planned time; sleep is part of the plan.",
        },
      );
    } else if (isPracticeDay) {
      const durations = allocate(input.dailyMinutes, [
        { weight: 0.55, min: 15 },
        { weight: 0.3, min: 10 },
        { weight: 0.15, min: 5 },
      ]);
      tasks.push(
        {
          id: `d${index}-t1`,
          title: `Weak-topic drill: ${topic}`,
          type: "study",
          topic,
          durationMinutes: durations[0],
          description:
            "Work through three progressively harder problems without looking at solutions first. Write down the stuck point.",
        },
        {
          id: `d${index}-t2`,
          title: "Mini practice test",
          type: "practice",
          topic: previousTopic,
          durationMinutes: durations[1],
          description:
            "Answer previous-exam-style questions under a timer. Mark strictly and record lost marks by cause.",
        },
        {
          id: `d${index}-t3`,
          title: "Spaced revision",
          type: "revision",
          topic: previousTopic,
          durationMinutes: durations[2],
          description: "Use active recall: cover the notes, write the key ideas, then verify.",
        },
      );
    } else if (isRevisionDay) {
      const durations = allocate(input.dailyMinutes, [
        { weight: 0.6, min: 10 },
        { weight: 0.4, min: 10 },
      ]);
      tasks.push(
        {
          id: `d${index}-t1`,
          title: `Deep study: ${topic}`,
          type: "study",
          topic,
          durationMinutes: durations[0],
          description:
            "Learn the concept, then explain it aloud in simple words. Stop and repair any explanation you cannot finish.",
        },
        {
          id: `d${index}-t2`,
          title: `Spaced revision: ${previousTopic}`,
          type: "revision",
          topic: previousTopic,
          durationMinutes: durations[1],
          description:
            "Return to a topic from 2–3 days ago. Attempt the hardest question again before rereading the notes.",
        },
      );
    } else {
      const durations = allocate(input.dailyMinutes, [
        { weight: 0.7, min: 10 },
        { weight: 0.3, min: 10 },
      ]);
      tasks.push(
        {
          id: `d${index}-t1`,
          title: `Study: ${topic}`,
          type: "study",
          topic,
          durationMinutes: durations[0],
          description:
            "Use a 25/5 focus cycle. Finish with a one-page summary written from memory and two edge cases.",
        },
        {
          id: `d${index}-t2`,
          title: "Active recall warm-down",
          type: "revision",
          topic,
          durationMinutes: durations[1],
          description: "Answer three self-written questions without notes. Log anything you cannot explain.",
        },
      );
    }

    days.push({
      date: isoDate(date),
      label: isFinal ? `${friendlyLabel(date)} · final day` : friendlyLabel(date),
      focus: isFinal ? "Final consolidation" : isPracticeDay ? "Timed practice + weak topics" : isRevisionDay ? "New topic + spaced revision" : topic,
      tasks,
    });
  }

  return {
    plan: {
      title: input.title,
      summary: `A realistic ${dayCount}-day plan for ${input.subject}, using ${input.dailyMinutes} minutes per day. It mixes new topics with spaced revision, a weekly mini test, a full practice test and a buffer. Generated by the local deterministic scheduler — no AI was called.`,
      topics: allTopics.length ? allTopics : [input.subject],
      days,
    },
    mode: "DEMO",
    model: "local-scheduler",
    capped,
    note: capped
      ? `Your exam is more than ${MAX_LOCAL_DAYS} days away, so this plan covers the next ${MAX_LOCAL_DAYS} days. Regenerate later for the remaining weeks.`
      : null,
  };
}

function normaliseAiPlan(plan: StudyPlanContent, input: PlanInput): StudyPlanContent {
  const today = startOfDay(new Date());
  const exam = examDateFromInput(input);
  const seenIds = new Set<string>();

  const days = plan.days
    .map((day, dayIndex) => {
      const parsed = startOfDay(parseISO(day.date));
      if (Number.isNaN(parsed.getTime())) return null;
      const bounded = isBefore(parsed, today) ? today : isBefore(exam, parsed) ? exam : parsed;
      const tasks = day.tasks
        .map((task, taskIndex) => {
          let id = task.id.replace(/[^a-zA-Z0-9_-]/g, "") || `d${dayIndex}-t${taskIndex}`;
          while (seenIds.has(id)) id = `${id}-${taskIndex}`;
          seenIds.add(id);
          return { ...task, id, durationMinutes: Math.max(5, Math.min(240, task.durationMinutes)) };
        })
        .slice(0, 8);

      let total = tasks.reduce((sum, task) => sum + task.durationMinutes, 0);
      while (total > input.dailyMinutes && tasks.length > 0) {
        const largestIndex = tasks.reduce(
          (best, task, index) => (task.durationMinutes > tasks[best].durationMinutes ? index : best),
          0,
        );
        if (tasks[largestIndex].durationMinutes <= 5) break;
        tasks[largestIndex] = {
          ...tasks[largestIndex],
          durationMinutes: tasks[largestIndex].durationMinutes - 5,
        };
        total -= 5;
      }

      return {
        date: isoDate(bounded),
        label: friendlyLabel(bounded),
        focus: day.focus,
        tasks,
      };
    })
    .filter((day): day is PlanDay => Boolean(day) && day!.tasks.length > 0)
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(0, MAX_AI_DAYS);

  if (days.length === 0) {
    throw new AIError({
      message: "The AI plan did not contain valid study days. Please regenerate.",
      code: "PLAN_EMPTY",
      status: 502,
      retryable: true,
    });
  }

  // Guarantee the features the student was promised, without exceeding the
  // daily time budget. We only add to the final planned day.
  const last = days[days.length - 1];
  const hasRevision = days.some((day) => day.tasks.some((task) => task.type === "revision"));
  const hasPractice = days.some((day) => day.tasks.some((task) => task.type === "practice"));
  const used = last.tasks.reduce((sum, task) => sum + task.durationMinutes, 0);
  const room = Math.max(0, input.dailyMinutes - used);

  if (!hasRevision && room >= 10) {
    last.tasks.push({
      id: `ensure-revision-${last.date}`,
      title: "Spaced revision sweep",
      type: "revision",
      topic: "Earlier topics",
      durationMinutes: Math.min(20, room),
      description: "Active recall of earlier topics; verify only the gaps.",
    });
  }
  if (!hasPractice && input.dailyMinutes >= 25) {
    const lastTask = last.tasks[last.tasks.length - 1];
    if (room >= 10) {
      last.tasks.push({
        id: `ensure-practice-${last.date}`,
        title: "Timed practice test",
        type: "practice",
        topic: "Mixed syllabus",
        durationMinutes: Math.min(25, room),
        description: "Complete a short timed set and record every lost mark.",
      });
    } else if (lastTask && lastTask.durationMinutes > 15) {
      lastTask.type = "practice";
      lastTask.title = `Timed practice + review: ${lastTask.topic}`;
      lastTask.description = "Turn the last session into a timed practice set, then review mistakes.";
    }
  }

  return {
    ...plan,
    title: plan.title.trim() || input.title,
    days,
  };
}

export async function generatePlan(input: PlanInput): Promise<PlanGenerationResult> {
  const status = getAIStatus();
  if (!status.configured) {
    return buildLocalPlan(input);
  }

  const today = startOfDay(new Date());
  const exam = examDateFromInput(input);
  if (isBefore(exam, today)) {
    throw new AIError({
      message: "The exam date must be today or in the future.",
      code: "EXAM_DATE_IN_PAST",
      status: 400,
      retryable: false,
    });
  }

  const raw = await generateStructured({
    schema: studyPlanSchema,
    systemInstruction: PLAN_SYSTEM,
    prompt: planPrompt({
      title: input.title,
      subject: input.subject,
      examDate: input.examDate,
      today: isoDate(today),
      dailyMinutes: input.dailyMinutes,
      language: input.language,
      syllabus: input.syllabus,
      completedTopics: input.completedTopics,
    }),
    temperature: 0.4,
    maxOutputTokens: 20000,
  });

  const plan = normaliseAiPlan(raw, input);
  const capped = differenceInCalendarDays(exam, today) > MAX_AI_DAYS;
  return {
    plan,
    mode: "LIVE",
    model: getConfiguredModel(),
    capped,
    note: capped
      ? `For reliability and cost, AI generation is capped at ${MAX_AI_DAYS} days. Regenerate after this block to plan the rest of the runway.`
      : null,
  };
}
