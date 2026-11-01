import { AIError } from "@/lib/errors";
import { getAIStatus } from "@/lib/env";
import {
  extractionSchema,
  reliabilityRunResultSchema,
  type ExtractionBlock,
  type ExtractionResult,
  type ExtractionWarning,
  type ReliabilityRunResult,
} from "@/lib/schemas";
import {
  AUDIO_SYSTEM,
  EXTRACTION_SYSTEM,
  OCR_PROMPT,
  PDF_OCR_PROMPT,
  RELIABILITY_SYSTEM,
} from "@/lib/ai/prompts";
import { generateStructured, getConfiguredModel } from "@/lib/ai/gemini";
import { blocksFromPdfPages } from "@/lib/rag/chunk";
import { humanizeFileName, type PdfParseResult } from "@/lib/pdf";

export type ExtractionMethod = "vision_ocr" | "pdf_text" | "audio_transcription" | "typed";

export type ExtractionOutcome = {
  result: ExtractionResult;
  method: ExtractionMethod;
  model: string | null;
  pageCount: number | null;
};

function uniqueId(base: string, used: Set<string>): string {
  let candidate = base.replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 60) || "block";
  let index = 2;
  while (used.has(candidate)) {
    candidate = `${base}-${index++}`.slice(0, 70);
  }
  used.add(candidate);
  return candidate;
}

function formatTimestamp(seconds?: number): string {
  if (seconds == null) return "unknown time";
  const total = Math.max(0, Math.round(seconds));
  return `${String(Math.floor(total / 60)).padStart(2, "0")}:${String(total % 60).padStart(2, "0")}`;
}

function guessLanguage(text: string): string {
  const devanagari = (text.match(/[\u0900-\u097F]/g) ?? []).length;
  const latin = (text.match(/[A-Za-z]/g) ?? []).length;
  if (devanagari > 20 && devanagari > latin * 0.15) return "Hindi / Devanagari";
  if (latin > 50) return "English (assumed from script)";
  return "unknown";
}

/**
 * Adds honest uncertainty warnings and enforces a few safety properties that
 * Zod cannot express. We do not "fix" low-confidence text or guess a symbol.
 */
export function postProcessExtraction(
  raw: ExtractionResult,
  options: {
    method: ExtractionMethod;
    fallbackTitle: string;
    pageCount: number | null;
    extraWarnings?: ExtractionWarning[];
  },
): ExtractionResult {
  const used = new Set<string>();
  const warnings: ExtractionWarning[] = [...(options.extraWarnings ?? []), ...raw.warnings];
  const warningKeys = new Set(warnings.map((warning) => warning.message.toLowerCase()));

  const blocks: ExtractionBlock[] = raw.blocks
    .map((block, index) => {
      const id = uniqueId(block.id || `b${index + 1}`, used);
      let confidence = Math.min(1, Math.max(0, block.confidence));
      let uncertain = block.uncertain;
      let text = block.text.trim();
      let type = block.type;
      let note = block.note?.trim();

      if (type === "unreadable") {
        uncertain = true;
        confidence = Math.min(confidence, 0.35);
        if (!text) text = "[unreadable]";
      }

      if (/\[(unreadable|inaudible)\]/i.test(text)) {
        uncertain = true;
        confidence = Math.min(confidence, 0.4);
        if (!note) note = "The source contains a section that could not be read confidently.";
      }

      if (confidence < 0.6) uncertain = true;

      if (uncertain) {
        const key = `uncertain-${id}`;
        if (!warningKeys.has(key) && warnings.length < 24) {
          const location =
            options.method === "audio_transcription"
              ? formatTimestamp(block.startSeconds)
              : block.page != null
                ? `page ${block.page}`
                : "the document";
          const message = `Uncertain extraction near ${location}: ${note ?? "verify this passage against the original."}`;
          warnings.push({
            message,
            severity: confidence < 0.45 ? "critical" : "warning",
            location,
          });
          warningKeys.add(key);
        }
      }

      if (options.method === "vision_ocr" && block.page == null) {
        // A single image is always page 1. For a scanned PDF we cannot invent
        // page numbers; leave the gap and warn if the model omitted them.
        if (options.pageCount === 1) block = { ...block, page: 1 };
      }

      return {
        ...block,
        id,
        text,
        type,
        confidence: Math.round(confidence * 100) / 100,
        uncertain,
        note,
      };
    })
    .filter((block) => block.text.length > 0);

  if (blocks.length === 0) {
    blocks.push({
      id: "empty-1",
      type: "unreadable",
      text: "[No readable content was found]",
      confidence: 0.1,
      uncertain: true,
      note: "The model could not return any readable content. Check the original file and retry.",
      page: options.pageCount === 1 ? 1 : undefined,
    });
    warnings.push({
      message:
        "The model returned no readable content. The file may be blank, extremely blurry, unsupported, or the wrong content type.",
      severity: "critical",
    });
  }

  const hasMissingPages =
    options.method === "vision_ocr" &&
    options.pageCount != null &&
    options.pageCount > 1 &&
    blocks.every((block) => block.page == null);
  if (hasMissingPages) {
    warnings.push({
      message:
        "Page mapping was not returned for this scanned PDF, so citations may be incomplete. Verify against the original PDF.",
      severity: "warning",
    });
  }

  let overall = raw.overallConfidence;
  if (!Number.isFinite(overall)) {
    overall =
      blocks.reduce((sum, block) => sum + block.confidence, 0) / Math.max(1, blocks.length);
  }
  if (blocks.some((block) => block.uncertain) && overall > 0.9) {
    // Do not silently present a document as near-certain when it has
    // recognised ambiguities. Keep this transparent.
    overall = Math.min(overall, 0.88);
  }

  if (overall < 0.55 && !warnings.some((warning) => warning.severity === "critical")) {
    warnings.push({
      message:
        "Overall extraction confidence is low. Treat the generated notes as a draft and verify uncertain passages against the original.",
      severity: "warning",
    });
  }

  const seen = new Set<string>();
  const dedupedWarnings = warnings.filter((warning) => {
    const key = warning.message.toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  return {
    ...raw,
    title: raw.title.trim() || options.fallbackTitle,
    detectedLanguage: raw.detectedLanguage?.trim() || "unknown",
    overallConfidence: Math.round(overall * 100) / 100,
    blocks,
    warnings: dedupedWarnings.slice(0, 32),
  };
}

export async function extractFromImage(
  buffer: Buffer,
  mimeType: string,
  fileName: string,
): Promise<ExtractionOutcome> {
  const fallbackTitle = humanizeFileName(fileName);
  const raw = await generateStructured({
    schema: extractionSchema,
    systemInstruction: EXTRACTION_SYSTEM,
    prompt: `${OCR_PROMPT}\n\nThe uploaded file is named "${fileName}". It may be tilted, cropped, blurry or unevenly lit. Work from the actual pixels, not the filename.`,
    media: { buffer, mimeType, displayName: fileName },
    temperature: 0.1,
    maxOutputTokens: 12000,
  });
  return {
    result: postProcessExtraction(raw, {
      method: "vision_ocr",
      fallbackTitle,
      pageCount: 1,
    }),
    method: "vision_ocr",
    model: getConfiguredModel(),
    pageCount: 1,
  };
}

export async function extractFromScannedPdf(
  buffer: Buffer,
  mimeType: string,
  fileName: string,
  pageCount: number,
): Promise<ExtractionOutcome> {
  const fallbackTitle = humanizeFileName(fileName);
  const raw = await generateStructured({
    schema: extractionSchema,
    systemInstruction: EXTRACTION_SYSTEM,
    prompt: `${PDF_OCR_PROMPT}\n\nThe PDF is named "${fileName}". It has approximately ${pageCount} pages.`,
    media: { buffer, mimeType, displayName: fileName },
    temperature: 0.1,
    maxOutputTokens: 16000,
  });
  return {
    result: postProcessExtraction(raw, {
      method: "vision_ocr",
      fallbackTitle,
      pageCount,
    }),
    method: "vision_ocr",
    model: getConfiguredModel(),
    pageCount,
  };
}

export async function extractFromAudio(
  buffer: Buffer,
  mimeType: string,
  fileName: string,
): Promise<ExtractionOutcome> {
  const fallbackTitle = humanizeFileName(fileName);
  const raw = await generateStructured({
    schema: extractionSchema,
    systemInstruction: AUDIO_SYSTEM,
    prompt: `Transcribe this lecture or spoken study note ("${fileName}") into structured segments.
- Include the full transcript in the blocks, split into coherent segments.
- Provide approximate startSeconds and endSeconds for each segment.
- Use type "formula" when an equation is spoken, "heading" only for clear topic changes.
- If audio is quiet, noisy, clipped or inaudible, mark it. Do not invent words.
- detectedLanguage must describe the spoken language.`,
    media: { buffer, mimeType, displayName: fileName },
    temperature: 0.1,
    maxOutputTokens: 16000,
  });
  return {
    result: postProcessExtraction(raw, {
      method: "audio_transcription",
      fallbackTitle,
      pageCount: null,
    }),
    method: "audio_transcription",
    model: getConfiguredModel(),
    pageCount: null,
  };
}

export function extractFromTypedText(title: string, text: string): ExtractionOutcome {
  const paragraphs = text
    .replace(/\r\n/g, "\n")
    .split(/\n\s*\n/)
    .map((part) => part.trim())
    .filter(Boolean);
  const blocks: ExtractionBlock[] = paragraphs.map((paragraph, index) => {
    const firstLine = paragraph.split("\n")[0]?.trim() ?? "";
    const looksHeading =
      firstLine.length < 100 &&
      !/[.!?]$/.test(firstLine) &&
      (/^(module|unit|chapter|section|topic)\b/i.test(firstLine) ||
        (firstLine === firstLine.toUpperCase() && /[A-Z]/.test(firstLine)));
    return {
      id: `typed-${index + 1}`,
      type: looksHeading ? "heading" : "paragraph",
      text: paragraph,
      confidence: 1,
      uncertain: false,
    };
  });

  if (blocks.length === 0) {
    throw new AIError({
      message: "The pasted study material is empty.",
      code: "EMPTY_TEXT",
      status: 400,
      retryable: false,
    });
  }

  const warnings: ExtractionWarning[] = [
    {
      message:
        "This is text you typed or pasted. Extraction confidence does not apply; only the AI notes are generated interpretations.",
      severity: "info",
    },
  ];

  const result: ExtractionResult = {
    title: title.trim() || "Pasted study material",
    detectedLanguage: guessLanguage(text),
    overallConfidence: 1,
    blocks,
    warnings,
  };

  return {
    result: postProcessExtraction(result, {
      method: "typed",
      fallbackTitle: "Pasted study material",
      pageCount: null,
      extraWarnings: warnings,
    }),
    method: "typed",
    model: null,
    pageCount: null,
  };
}

export function extractFromPdfText(
  parsed: PdfParseResult,
  fileName: string,
): ExtractionOutcome {
  const firstHeading = parsed.pages
    .flatMap((page) => page.text.split("\n"))
    .map((line) => line.trim())
    .find(
      (line) =>
        line.length > 8 &&
        line.length < 140 &&
        (/syllabus|notes|chapter|module|unit/i.test(line) || line === line.toUpperCase()),
    );

  const title =
    parsed.metadataTitle?.trim() ||
    firstHeading ||
    humanizeFileName(fileName);

  const blocks = blocksFromPdfPages(parsed.pages, title);
  const warnings: ExtractionWarning[] = [
    {
      message:
        "Text was extracted directly from this PDF's digital text layer with unpdf/PDF.js — not OCR. Reading order, tables and diagrams can differ from the visual layout.",
      severity: "info",
    },
  ];

  for (const page of parsed.pages) {
    if (page.text.length < 20) {
      warnings.push({
        message: `Page ${page.page} has little or no machine-readable text. It may be a scan, image or diagram; in mixed documents only the text layer is used.`,
        severity: "warning",
        location: `Page ${page.page}`,
      });
      blocks.push({
        id: `pdf-p${page.page}-unreadable`,
        type: "unreadable",
        text: `[Page ${page.page} has no extractable text layer]`,
        page: page.page,
        confidence: 0.2,
        uncertain: true,
        note: "This page may contain a scan or diagram. The text parser cannot read it, and no OCR was run in mixed-PDF mode.",
      });
    }
  }

  if (blocks.some((block) => block.type === "diagram")) {
    warnings.push({
      message:
        "Diagram labels were preserved as text where present. The system does not make confident technical conclusions from diagrams.",
      severity: "warning",
    });
  } else {
    warnings.push({
      message:
        "Diagrams and images inside the PDF are not interpreted unless they contain text in the digital text layer.",
      severity: "info",
    });
  }

  const joinedText = parsed.pages.map((page) => page.text).join("\n");
  const result: ExtractionResult = {
    title: title.slice(0, 160),
    detectedLanguage: guessLanguage(joinedText),
    overallConfidence: 0.99,
    blocks,
    warnings,
  };

  return {
    result: postProcessExtraction(result, {
      method: "pdf_text",
      fallbackTitle: humanizeFileName(fileName),
      pageCount: parsed.totalPages,
      extraWarnings: warnings,
    }),
    method: "pdf_text",
    model: null,
    pageCount: parsed.totalPages,
  };
}

export async function runReliabilityExtraction(buffer: Buffer, fileName: string): Promise<ReliabilityRunResult> {
  if (!getAIStatus().configured) {
    throw new AIError({
      message: "Reliability runs require a configured Gemini key.",
      code: "AI_NOT_CONFIGURED",
      status: 412,
      retryable: false,
    });
  }
  const raw = await generateStructured({
    schema: reliabilityRunResultSchema,
    systemInstruction: RELIABILITY_SYSTEM,
    prompt: `Run a transparent transcription of this deliberately ambiguous handwritten calculus fixture ("${fileName}").
Explain the specific visual ambiguity in modelNote. Do not resolve an exponent you cannot see.`,
    media: { buffer, mimeType: "image/png", displayName: fileName },
    temperature: 0.1,
    maxOutputTokens: 4000,
  });
  return {
    ...raw,
    overallConfidence: Math.round(Math.min(1, Math.max(0, raw.overallConfidence)) * 100) / 100,
    blocks: raw.blocks.map((block) => ({
      ...block,
      uncertain: block.uncertain || block.confidence < 0.6,
      confidence: Math.round(Math.min(1, Math.max(0, block.confidence)) * 100) / 100,
    })),
  };
}
