import { z } from "zod";

/* -------------------------------------------------------------------------- */
/* Shared                                                                     */
/* -------------------------------------------------------------------------- */

export const languageSchema = z.enum(["simple_en", "hinglish"]);
export type Language = z.infer<typeof languageSchema>;

export const confidenceSchema = z.number().min(0).max(1);

export const warningSchema = z.object({
  message: z.string().min(3).max(600),
  severity: z.enum(["info", "warning", "critical"]).default("warning"),
  location: z.string().max(160).optional(),
});
export type ExtractionWarning = z.infer<typeof warningSchema>;

/* -------------------------------------------------------------------------- */
/* Extraction                                                                 */
/* -------------------------------------------------------------------------- */

export const extractionBlockTypeSchema = z.enum([
  "heading",
  "paragraph",
  "list",
  "formula",
  "diagram",
  "table",
  "example",
  "unreadable",
]);

export const extractionBlockSchema = z.object({
  id: z.string().min(1).max(80),
  type: extractionBlockTypeSchema,
  text: z.string().max(20_000),
  page: z.number().int().min(1).max(1_000).optional(),
  startSeconds: z.number().min(0).max(86_400).optional(),
  endSeconds: z.number().min(0).max(86_400).optional(),
  confidence: confidenceSchema,
  uncertain: z.boolean().default(false),
  note: z.string().max(500).optional(),
});
export type ExtractionBlock = z.infer<typeof extractionBlockSchema>;

export const extractionSchema = z.object({
  title: z.string().min(1).max(180),
  detectedLanguage: z.string().min(1).max(80).default("unknown"),
  overallConfidence: confidenceSchema,
  blocks: z.array(extractionBlockSchema).min(1).max(400),
  warnings: z.array(warningSchema).max(40).default([]),
});
export type ExtractionResult = z.infer<typeof extractionSchema>;

/* -------------------------------------------------------------------------- */
/* Notes                                                                      */
/* -------------------------------------------------------------------------- */

export const definitionSchema = z.object({
  term: z.string().min(1).max(160),
  definition: z.string().min(1).max(1_200),
});

export const formulaSchema = z.object({
  formula: z.string().min(1).max(500),
  explanation: z.string().min(1).max(800),
});

export const noteSectionSchema = z.object({
  heading: z.string().min(1).max(180),
  explanation: z.string().min(1).max(6_000),
  keyPoints: z.array(z.string().min(1).max(900)).max(20).default([]),
  definitions: z.array(definitionSchema).max(20).default([]),
  formulas: z.array(formulaSchema).max(20).default([]),
  examples: z.array(z.string().min(1).max(1_500)).max(15).default([]),
  examTips: z.array(z.string().min(1).max(900)).max(15).default([]),
});

export const notesSchema = z.object({
  title: z.string().min(1).max(180),
  overview: z.string().min(1).max(3_000),
  sections: z.array(noteSectionSchema).min(1).max(24),
  keyTakeaways: z.array(z.string().min(1).max(900)).max(24).default([]),
  importantExamPoints: z.array(z.string().min(1).max(900)).max(24).default([]),
  uncertainAreas: z
    .array(
      z.object({
        topic: z.string().min(1).max(180),
        reason: z.string().min(1).max(500),
      }),
    )
    .max(20)
    .default([]),
});
export type NotesContent = z.infer<typeof notesSchema>;

/* -------------------------------------------------------------------------- */
/* Quiz                                                                       */
/* -------------------------------------------------------------------------- */

export const quizQuestionSchema = z.object({
  id: z.string().min(1).max(80),
  question: z.string().min(5).max(1_000),
  options: z.array(z.string().min(1).max(500)).length(4),
  correctIndex: z.number().int().min(0).max(3),
  explanation: z.string().min(5).max(1_500),
  difficulty: z.enum(["easy", "medium", "hard"]),
  concept: z.string().min(1).max(180),
  sourceExcerpt: z.string().min(5).max(1_000),
});

export const quizSchema = z.object({
  title: z.string().min(1).max(180),
  difficulty: z.enum(["easy", "medium", "hard", "mixed"]),
  questions: z.array(quizQuestionSchema).min(3).max(12),
});
export type QuizContent = z.infer<typeof quizSchema>;
export type QuizQuestion = z.infer<typeof quizQuestionSchema>;
export type QuizDifficulty = "easy" | "medium" | "hard" | "mixed";

/** What the browser receives before submitting an attempt. */
export type QuizForTaking = {
  id: string;
  title: string;
  difficulty: string;
  questions: Array<{
    id: string;
    question: string;
    options: string[];
    difficulty: string;
    concept: string;
  }>;
};

export const quizSubmissionSchema = z.object({
  answers: z.record(z.string(), z.number().int().min(0).max(3)),
});

/* -------------------------------------------------------------------------- */
/* Study plan                                                                 */
/* -------------------------------------------------------------------------- */

export const planTaskTypeSchema = z.enum(["study", "revision", "practice", "buffer"]);

export const planTaskSchema = z.object({
  id: z.string().min(1).max(80),
  title: z.string().min(1).max(180),
  type: planTaskTypeSchema,
  topic: z.string().min(1).max(180),
  durationMinutes: z.number().int().min(5).max(240),
  description: z.string().min(1).max(600),
});
export type PlanTask = z.infer<typeof planTaskSchema>;

export const planDaySchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  label: z.string().min(1).max(80),
  focus: z.string().min(1).max(240),
  tasks: z.array(planTaskSchema).min(1).max(8),
});
export type PlanDay = z.infer<typeof planDaySchema>;

export const studyPlanSchema = z.object({
  title: z.string().min(1).max(180),
  summary: z.string().min(1).max(1_500),
  topics: z.array(z.string().min(1).max(180)).min(1).max(60),
  days: z.array(planDaySchema).min(1).max(60),
});
export type StudyPlanContent = z.infer<typeof studyPlanSchema>;

export const planInputSchema = z.object({
  title: z.string().min(2).max(160),
  subject: z.string().min(2).max(120),
  examDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  dailyMinutes: z.number().int().min(15).max(360),
  language: languageSchema.default("simple_en"),
  syllabus: z.string().min(10).max(30_000),
  completedTopics: z.array(z.string().min(1).max(180)).max(60).default([]),
});
export type PlanInput = z.infer<typeof planInputSchema>;

/* -------------------------------------------------------------------------- */
/* Grounded Q&A                                                               */
/* -------------------------------------------------------------------------- */

export const askInputSchema = z.object({
  question: z.string().min(2).max(1_000),
});

export const groundedAnswerSchema = z.object({
  answer: z.string().min(1).max(6_000),
  grounded: z.boolean(),
  confidence: confidenceSchema,
  citedChunkIds: z.array(z.string()).max(12).default([]),
  missingInformation: z.string().max(600).optional(),
});
export type GroundedAnswer = z.infer<typeof groundedAnswerSchema>;

export type SourceReference = {
  chunkId: string;
  label: string;
  page: number | null;
  startSeconds: number | null;
  endSeconds: number | null;
  excerpt: string;
  relevance: number;
  confidence: number | null;
};

export const sourceReferenceSchema = z.object({
  chunkId: z.string(),
  label: z.string(),
  page: z.number().int().nullable(),
  startSeconds: z.number().nullable(),
  endSeconds: z.number().nullable(),
  excerpt: z.string(),
  relevance: z.number(),
  confidence: z.number().nullable(),
});

export type ChatMessageView = {
  id: string;
  role: "user" | "assistant";
  content: string;
  sources: SourceReference[];
  confidence: number | null;
  createdAt: string;
  mode: "LIVE" | "DEMO";
};

/* -------------------------------------------------------------------------- */
/* Reliability lab                                                            */
/* -------------------------------------------------------------------------- */

export const reliabilityRunResultSchema = z.object({
  title: z.string().min(1).max(180),
  detectedLanguage: z.string().min(1).max(80),
  overallConfidence: confidenceSchema,
  blocks: z.array(extractionBlockSchema).min(1).max(60),
  warnings: z.array(warningSchema).max(20).default([]),
  modelNote: z.string().max(1_000).optional(),
});
export type ReliabilityRunResult = z.infer<typeof reliabilityRunResultSchema>;

/* -------------------------------------------------------------------------- */
/* API errors                                                                 */
/* -------------------------------------------------------------------------- */

export type ApiErrorBody = {
  error: string;
  code?: string;
  retryable?: boolean;
  details?: unknown;
};
