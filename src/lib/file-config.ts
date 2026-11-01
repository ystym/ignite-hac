export type FileKind = "image" | "pdf" | "audio" | "text";

export const FILE_LIMITS: Record<FileKind, number> = {
  image: 10 * 1024 * 1024,
  pdf: 20 * 1024 * 1024,
  audio: 25 * 1024 * 1024,
  text: 200_000,
};

export const ACCEPT_ATTRIBUTE =
  ".jpg,.jpeg,.png,.webp,.pdf,.mp3,.wav,.m4a,.ogg,.webm,.flac,.aac,image/jpeg,image/png,image/webp,application/pdf,audio/mpeg,audio/wav,audio/x-wav,audio/mp4,audio/m4a,audio/ogg,audio/webm,audio/flac,audio/aac";

const IMAGE_EXTENSIONS = new Set(["jpg", "jpeg", "png", "webp"]);
const AUDIO_EXTENSIONS = new Set(["mp3", "wav", "m4a", "ogg", "webm", "flac", "aac"]);

export function extensionOf(fileName: string): string {
  const parts = fileName.toLowerCase().split(".");
  return parts.length > 1 ? parts[parts.length - 1] : "";
}

export function kindFromExtension(fileName: string): FileKind | null {
  const ext = extensionOf(fileName);
  if (IMAGE_EXTENSIONS.has(ext)) return "image";
  if (ext === "pdf") return "pdf";
  if (AUDIO_EXTENSIONS.has(ext)) return "audio";
  if (ext === "txt" || ext === "md") return "text";
  return null;
}

export function fileTypeFromKind(kind: FileKind): string {
  return kind;
}

export function mimeFromExtension(fileName: string): string {
  const ext = extensionOf(fileName);
  const map: Record<string, string> = {
    jpg: "image/jpeg",
    jpeg: "image/jpeg",
    png: "image/png",
    webp: "image/webp",
    pdf: "application/pdf",
    mp3: "audio/mpeg",
    wav: "audio/wav",
    m4a: "audio/mp4",
    ogg: "audio/ogg",
    webm: "audio/webm",
    flac: "audio/flac",
    aac: "audio/aac",
    txt: "text/plain",
    md: "text/markdown",
  };
  return map[ext] ?? "application/octet-stream";
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export type FileValidation = {
  ok: boolean;
  kind: FileKind | null;
  error?: string;
};

/**
 * Client-side preflight. The server repeats all checks and verifies magic bytes;
 * client validation is a UX convenience, not a security boundary.
 */
export function validateFileMeta(file: { name: string; size: number; type?: string }): FileValidation {
  const kind = kindFromExtension(file.name);
  if (!kind) {
    return {
      ok: false,
      kind: null,
      error: "Unsupported format. Use JPG, PNG, WEBP, PDF, MP3, WAV, M4A, OGG, WEBM, FLAC, AAC, TXT or MD.",
    };
  }
  if (file.size === 0) {
    return { ok: false, kind, error: "This file is empty." };
  }
  if (file.size > FILE_LIMITS[kind]) {
    return {
      ok: false,
      kind,
      error: `This ${kind} is ${formatBytes(file.size)}. The limit is ${formatBytes(FILE_LIMITS[kind])}.`,
    };
  }
  return { ok: true, kind };
}

export const SAMPLE_CATALOG = [
  {
    key: "handwritten",
    kind: "image" as const,
    title: "Messy handwritten physics notes",
    description: "A tilted, unevenly lit phone photo with formulas and a smudged exponent.",
    file: "/samples/handwritten-notes.png",
    fileName: "handwritten-notes.png",
    mimeType: "image/png",
    pages: "1 page · photo",
  },
  {
    key: "syllabus",
    kind: "pdf" as const,
    title: "Data Structures & Algorithms syllabus",
    description: "A text PDF with modules, diagrams, assessment weights and exam guidance.",
    file: "/samples/sample-syllabus.pdf",
    fileName: "sample-syllabus.pdf",
    mimeType: "application/pdf",
    pages: "5 pages · text PDF",
  },
  {
    key: "audio",
    kind: "audio" as const,
    title: "Noisy kinematics lecture",
    description: "A quiet, hum-laden recording with a deliberately unclear correction.",
    file: "/samples/lecture-kinematics.wav",
    fileName: "lecture-kinematics.wav",
    mimeType: "audio/wav",
    pages: "1:57 · audio",
  },
];
