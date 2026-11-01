import { randomUUID } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { AppError } from "@/lib/errors";
import {
  extensionOf,
  FILE_LIMITS,
  kindFromExtension,
  mimeFromExtension,
  type FileKind,
} from "@/lib/file-config";

const UPLOAD_DIR = path.join(process.cwd(), "data", "uploads");

const DETECTED_MIME: Record<string, { kind: FileKind; mime: string }> = {
  "image/jpeg": { kind: "image", mime: "image/jpeg" },
  "image/png": { kind: "image", mime: "image/png" },
  "image/webp": { kind: "image", mime: "image/webp" },
  "application/pdf": { kind: "pdf", mime: "application/pdf" },
  "audio/mpeg": { kind: "audio", mime: "audio/mpeg" },
  "audio/wav": { kind: "audio", mime: "audio/wav" },
  "audio/mp4": { kind: "audio", mime: "audio/mp4" },
  "audio/ogg": { kind: "audio", mime: "audio/ogg" },
  "audio/webm": { kind: "audio", mime: "audio/webm" },
  "audio/flac": { kind: "audio", mime: "audio/flac" },
  "audio/aac": { kind: "audio", mime: "audio/aac" },
};

function startsWith(buffer: Buffer, bytes: number[]): boolean {
  return bytes.every((byte, index) => buffer[index] === byte);
}

function ascii(buffer: Buffer, start: number, end: number): string {
  return buffer.subarray(start, end).toString("ascii");
}

/**
 * Content-based detection. A file with a .png extension but PDF bytes is
 * rejected, not handed to the AI.
 */
export function detectMime(buffer: Buffer): { kind: FileKind; mime: string } | null {
  if (buffer.length < 4) return null;
  if (startsWith(buffer, [0xff, 0xd8, 0xff])) return DETECTED_MIME["image/jpeg"];
  if (startsWith(buffer, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) {
    return DETECTED_MIME["image/png"];
  }
  if (ascii(buffer, 0, 4) === "RIFF" && ascii(buffer, 8, 12) === "WEBP") {
    return DETECTED_MIME["image/webp"];
  }
  if (ascii(buffer, 0, 5) === "%PDF-") return DETECTED_MIME["application/pdf"];
  if (ascii(buffer, 0, 4) === "RIFF" && ascii(buffer, 8, 12) === "WAVE") {
    return DETECTED_MIME["audio/wav"];
  }
  if (ascii(buffer, 0, 4) === "OggS") return DETECTED_MIME["audio/ogg"];
  if (ascii(buffer, 0, 4) === "fLaC") return DETECTED_MIME["audio/flac"];
  if (ascii(buffer, 0, 3) === "ID3" || startsWith(buffer, [0xff, 0xfb]) || startsWith(buffer, [0xff, 0xf3])) {
    return DETECTED_MIME["audio/mpeg"];
  }
  if (ascii(buffer, 4, 8) === "ftyp") {
    const brand = ascii(buffer, 8, 12);
    if (brand.includes("M4A") || brand.includes("mp42") || brand.includes("isom")) {
      return DETECTED_MIME["audio/mp4"];
    }
  }
  if (startsWith(buffer, [0x1a, 0x45, 0xdf, 0xa3])) {
    return DETECTED_MIME["audio/webm"];
  }
  // ADTS AAC frame sync (12 bits set).
  if (buffer[0] === 0xff && (buffer[1] & 0xf6) === 0xf0) {
    return DETECTED_MIME["audio/aac"];
  }
  return null;
}

export type StoredUpload = {
  storagePath: string;
  mimeType: string;
  fileType: FileKind;
  fileSize: number;
  extension: string;
};

export async function validateAndStoreUpload(file: File): Promise<StoredUpload> {
  const buffer = Buffer.from(await file.arrayBuffer());
  if (buffer.byteLength === 0) {
    throw new AppError({ message: "That file is empty.", code: "EMPTY_FILE", status: 400 });
  }

  const claimedKind = kindFromExtension(file.name);
  if (!claimedKind) {
    throw new AppError({
      message:
        "Unsupported file type. Upload JPG, PNG, WEBP, PDF, MP3, WAV, M4A, OGG, WEBM, FLAC or AAC.",
      code: "UNSUPPORTED_FILE_TYPE",
      status: 415,
    });
  }

  const detected = detectMime(buffer);
  if (!detected) {
    throw new AppError({
      message:
        "We could not verify this file's format from its contents. Try exporting it again as a standard JPG, PNG, WEBP, PDF or audio file.",
      code: "UNVERIFIED_FILE",
      status: 415,
    });
  }

  if (detected.kind !== claimedKind) {
    throw new AppError({
      message: `The file extension says ${claimedKind}, but its contents are ${detected.kind}. For safety it was not processed.`,
      code: "FILE_TYPE_MISMATCH",
      status: 415,
    });
  }

  if (buffer.byteLength > FILE_LIMITS[detected.kind]) {
    throw new AppError({
      message: `This file is too large. The ${detected.kind} limit is ${Math.round(FILE_LIMITS[detected.kind] / 1024 / 1024)} MB.`,
      code: "FILE_TOO_LARGE",
      status: 413,
    });
  }

  await mkdir(UPLOAD_DIR, { recursive: true });
  const extension = extensionOf(file.name) || extensionForMime(detected.mime);
  const storedName = `${randomUUID()}.${extension}`;
  const absolute = path.join(UPLOAD_DIR, storedName);
  await writeFile(absolute, buffer);

  return {
    storagePath: path.relative(process.cwd(), absolute),
    mimeType: detected.mime,
    fileType: detected.kind,
    fileSize: buffer.byteLength,
    extension,
  };
}

export function extensionForMime(mime: string): string {
  const map: Record<string, string> = {
    "image/jpeg": "jpg",
    "image/png": "png",
    "image/webp": "webp",
    "application/pdf": "pdf",
    "audio/mpeg": "mp3",
    "audio/wav": "wav",
    "audio/mp4": "m4a",
    "audio/ogg": "ogg",
    "audio/webm": "webm",
    "audio/flac": "flac",
    "audio/aac": "aac",
  };
  return map[mime] ?? "bin";
}

export async function readStoredUpload(storagePath: string): Promise<Buffer> {
  const absolute = path.resolve(process.cwd(), storagePath);
  const root = path.resolve(UPLOAD_DIR);
  if (!absolute.startsWith(root + path.sep)) {
    throw new AppError({ message: "Invalid stored file path.", code: "INVALID_PATH", status: 400 });
  }
  try {
    return await readFile(absolute);
  } catch {
    throw new AppError({
      message:
        "The original file is no longer on disk. Demo documents use bundled samples; uploaded files must remain in data/uploads.",
      code: "FILE_MISSING",
      status: 410,
    });
  }
}

export function publicSamplePath(sampleKey: string | null): string | null {
  switch (sampleKey) {
    case "handwritten":
      return "/samples/handwritten-notes.png";
    case "syllabus":
      return "/samples/sample-syllabus.pdf";
    case "audio":
      return "/samples/lecture-kinematics.wav";
    case "ambiguous":
      return "/samples/ambiguous-handwriting.png";
    default:
      return null;
  }
}

export function mimeForStoredFile(fileName: string): string {
  return mimeFromExtension(fileName);
}
