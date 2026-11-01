import {
  extractionBlockSchema,
  notesSchema,
  planDaySchema,
  quizSchema,
  sourceReferenceSchema,
  warningSchema,
  type ChatMessageView,
  type ExtractionBlock,
  type ExtractionWarning,
  type NotesContent,
  type PlanDay,
  type QuizContent,
  type SourceReference,
} from "@/lib/schemas";

export function safeJson<T>(value: unknown, fallback: T): T {
  if (typeof value !== "string" || !value) return fallback;
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

export function parseBlocks(value: unknown): ExtractionBlock[] {
  const parsed = safeJson<unknown>(value, []);
  if (!Array.isArray(parsed)) return [];
  const blocks: ExtractionBlock[] = [];
  for (const item of parsed) {
    const result = extractionBlockSchema.safeParse(item);
    if (result.success) blocks.push(result.data);
  }
  return blocks;
}

export function parseWarnings(value: unknown): ExtractionWarning[] {
  const parsed = safeJson<unknown>(value, []);
  if (!Array.isArray(parsed)) return [];
  const warnings: ExtractionWarning[] = [];
  for (const item of parsed) {
    const result = warningSchema.safeParse(item);
    if (result.success) warnings.push(result.data);
  }
  return warnings;
}

export function parseNotes(value: unknown): NotesContent | null {
  const parsed = safeJson<unknown>(value, null);
  if (!parsed) return null;
  const result = notesSchema.safeParse(parsed);
  return result.success ? result.data : null;
}

export function parseQuiz(value: unknown): QuizContent | null {
  const parsed = safeJson<unknown>(value, null);
  if (!parsed) return null;
  const result = quizSchema.safeParse(parsed);
  return result.success ? result.data : null;
}

export function parsePlanDays(value: unknown): PlanDay[] {
  const parsed = safeJson<unknown>(value, []);
  if (!Array.isArray(parsed)) return [];
  const days: PlanDay[] = [];
  for (const item of parsed) {
    const result = planDaySchema.safeParse(item);
    if (result.success) days.push(result.data);
  }
  return days;
}

export function parseStringArray(value: unknown): string[] {
  const parsed = safeJson<unknown>(value, []);
  return Array.isArray(parsed) ? parsed.filter((item): item is string => typeof item === "string") : [];
}

export function parseSources(value: unknown): SourceReference[] {
  const parsed = safeJson<unknown>(value, []);
  if (!Array.isArray(parsed)) return [];
  const sources: SourceReference[] = [];
  for (const item of parsed) {
    const result = sourceReferenceSchema.safeParse(item);
    if (result.success) sources.push(result.data);
  }
  return sources;
}

export function toChatMessageView(message: {
  id: string;
  role: string;
  content: string;
  sourcesJson: string | null;
  confidence: number | null;
  createdAt: Date;
  mode: string;
}): ChatMessageView {
  return {
    id: message.id,
    role: message.role === "user" ? "user" : "assistant",
    content: message.content,
    sources: parseSources(message.sourcesJson),
    confidence: message.confidence,
    createdAt: message.createdAt.toISOString(),
    mode: message.mode === "DEMO" ? "DEMO" : "LIVE",
  };
}

export type DocumentSummary = {
  id: string;
  title: string;
  fileName: string;
  fileType: string;
  mimeType: string;
  fileSize: number;
  status: string;
  mode: "LIVE" | "DEMO";
  source: string;
  sampleKey: string | null;
  overallConfidence: number | null;
  pageCount: number | null;
  extractionMethod: string | null;
  indexStatus: string;
  createdAt: string;
  updatedAt: string;
  hasNotes: boolean;
};

export type DocumentDetail = DocumentSummary & {
  processingStage: string;
  processingError: string | null;
  indexError: string | null;
  extractedText: string | null;
  language: string | null;
  extractionModel: string | null;
  blocks: ExtractionBlock[];
  warnings: ExtractionWarning[];
};

type DocumentRecord = {
  id: string;
  title: string;
  fileName: string;
  fileType: string;
  mimeType: string;
  fileSize: number;
  status: string;
  mode: string;
  source: string;
  sampleKey: string | null;
  overallConfidence: number | null;
  pageCount: number | null;
  extractionMethod: string | null;
  indexStatus: string;
  createdAt: Date;
  updatedAt: Date;
  processingStage?: string;
  processingError?: string | null;
  indexError?: string | null;
  extractedText?: string | null;
  language?: string | null;
  extractionModel?: string | null;
  blocksJson?: string | null;
  warningsJson?: string | null;
  notes?: { id: string } | null;
};

export function toDocumentSummary(doc: DocumentRecord): DocumentSummary {
  return {
    id: doc.id,
    title: doc.title,
    fileName: doc.fileName,
    fileType: doc.fileType,
    mimeType: doc.mimeType,
    fileSize: doc.fileSize,
    status: doc.status,
    mode: doc.mode === "DEMO" ? "DEMO" : "LIVE",
    source: doc.source,
    sampleKey: doc.sampleKey,
    overallConfidence: doc.overallConfidence,
    pageCount: doc.pageCount,
    extractionMethod: doc.extractionMethod,
    indexStatus: doc.indexStatus,
    createdAt: doc.createdAt.toISOString(),
    updatedAt: doc.updatedAt.toISOString(),
    hasNotes: Boolean(doc.notes),
  };
}

export function toDocumentDetail(doc: DocumentRecord): DocumentDetail {
  return {
    ...toDocumentSummary(doc),
    processingStage: doc.processingStage ?? "queued",
    processingError: doc.processingError ?? null,
    indexError: doc.indexError ?? null,
    extractedText: doc.extractedText ?? null,
    language: doc.language ?? null,
    extractionModel: doc.extractionModel ?? null,
    blocks: parseBlocks(doc.blocksJson),
    warnings: parseWarnings(doc.warningsJson),
  };
}

export function extractionMethodLabel(method: string | null): string {
  switch (method) {
    case "vision_ocr":
      return "Vision OCR";
    case "pdf_text":
      return "PDF text layer";
    case "audio_transcription":
      return "Audio transcription";
    case "typed":
      return "Typed by student";
    default:
      return "Extraction";
  }
}

export function fileTypeLabel(type: string): string {
  switch (type) {
    case "image":
      return "Handwritten / image";
    case "pdf":
      return "PDF";
    case "audio":
      return "Audio";
    case "text":
      return "Typed text";
    default:
      return "Study material";
  }
}
