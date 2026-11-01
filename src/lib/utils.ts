import { clsx, type ClassValue } from "clsx";
import { format, formatDistanceToNowStrict } from "date-fns";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function parseDate(value: string | Date): Date {
  if (value instanceof Date) return value;
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return new Date(`${value}T12:00:00`);
  return new Date(value);
}

export function formatLongDate(value: string | Date): string {
  return format(parseDate(value), "EEEE, d MMMM yyyy");
}

export function formatShortDate(value: string | Date): string {
  return format(parseDate(value), "d MMM yyyy");
}

export function formatDayLabel(value: string | Date): string {
  return format(parseDate(value), "EEE, d MMM");
}

export function relativeTime(value: string | Date): string {
  return formatDistanceToNowStrict(parseDate(value), { addSuffix: true });
}

export function formatSeconds(seconds: number | null | undefined): string {
  if (seconds == null) return "—";
  const total = Math.max(0, Math.round(seconds));
  return `${String(Math.floor(total / 60)).padStart(2, "0")}:${String(total % 60).padStart(2, "0")}`;
}

export type ConfidenceMeta = {
  label: string;
  tone: "high" | "medium" | "low" | "critical";
  textClass: string;
  bgClass: string;
  borderClass: string;
  barClass: string;
};

export function confidenceMeta(score: number | null | undefined): ConfidenceMeta {
  if (score == null) {
    return {
      label: "Not scored",
      tone: "medium",
      textClass: "text-ink-500",
      bgClass: "bg-slate-100",
      borderClass: "border-slate-200",
      barClass: "bg-slate-400",
    };
  }
  if (score >= 0.85) {
    return {
      label: "High",
      tone: "high",
      textClass: "text-emerald-700",
      bgClass: "bg-emerald-50",
      borderClass: "border-emerald-200",
      barClass: "bg-emerald-500",
    };
  }
  if (score >= 0.65) {
    return {
      label: "Moderate",
      tone: "medium",
      textClass: "text-amber-700",
      bgClass: "bg-amber-50",
      borderClass: "border-amber-200",
      barClass: "bg-amber-500",
    };
  }
  if (score >= 0.45) {
    return {
      label: "Low",
      tone: "low",
      textClass: "text-orange-700",
      bgClass: "bg-orange-50",
      borderClass: "border-orange-200",
      barClass: "bg-orange-500",
    };
  }
  return {
    label: "Very low",
    tone: "critical",
    textClass: "text-rose-700",
    bgClass: "bg-rose-50",
    borderClass: "border-rose-200",
    barClass: "bg-rose-500",
  };
}

export function percent(value: number | null | undefined): string {
  if (value == null) return "—";
  return `${Math.round(value * 100)}%`;
}

export function initials(name: string): string {
  return name
    .split(/\s+/)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .slice(0, 2)
    .join("");
}

export function truncate(value: string, max: number): string {
  if (value.length <= max) return value;
  return `${value.slice(0, Math.max(0, max - 1)).trimEnd()}…`;
}

export function pluralize(count: number, singular: string, plural?: string): string {
  return `${count} ${count === 1 ? singular : (plural ?? `${singular}s`)}`;
}

export const STUDY_STAGES = [
  { key: "queued", label: "Queued", detail: "Waiting for a worker" },
  { key: "reading", label: "Reading the original", detail: "Validating the stored file" },
  { key: "extracting", label: "Extracting content", detail: "Vision OCR, PDF text or audio transcription" },
  { key: "chunking", label: "Chunking", detail: "Splitting content into cited passages" },
  { key: "embedding", label: "Building the search index", detail: "Gemini embeddings" },
  { key: "notes", label: "Writing structured notes", detail: "Grounded in the extracted source" },
  { key: "done", label: "Ready", detail: "Notes and sources are available" },
] as const;

export function stageIndex(stage: string | null | undefined): number {
  const index = STUDY_STAGES.findIndex((item) => item.key === stage);
  return index < 0 ? 0 : index;
}

export function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return rest ? `${hours}h ${rest}m` : `${hours}h`;
}

export function formatBytesLabel(bytes: number): string {
  if (!bytes) return "Bundled sample";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
