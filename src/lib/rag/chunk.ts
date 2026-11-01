import type { ExtractionBlock } from "@/lib/schemas";

const MAX_CHUNK_CHARS = 1_450;
const MAX_CHUNKS = 250;

export type ChunkDraft = {
  chunkIndex: number;
  content: string;
  page: number | null;
  startSeconds: number | null;
  endSeconds: number | null;
  confidence: number | null;
  sourceLabel: string;
};

function formatSeconds(seconds: number): string {
  const total = Math.max(0, Math.round(seconds));
  const minutes = Math.floor(total / 60);
  const remaining = total % 60;
  return `${String(minutes).padStart(2, "0")}:${String(remaining).padStart(2, "0")}`;
}

export function audioLabel(start: number | null, end: number | null): string {
  if (start == null && end == null) return "Audio";
  if (start != null && end != null) return `Audio ${formatSeconds(start)}–${formatSeconds(end)}`;
  if (start != null) return `Audio from ${formatSeconds(start)}`;
  return `Audio to ${formatSeconds(end!)}`;
}

function splitLongText(text: string, limit: number): string[] {
  if (text.length <= limit) return [text];
  const pieces: string[] = [];
  let remaining = text;
  while (remaining.length > limit) {
    const slice = remaining.slice(0, limit);
    const boundary = Math.max(
      slice.lastIndexOf("\n\n"),
      slice.lastIndexOf(". "),
      slice.lastIndexOf("; "),
      slice.lastIndexOf("\n"),
    );
    const cut = boundary > limit * 0.5 ? boundary + 1 : limit;
    pieces.push(remaining.slice(0, cut).trim());
    remaining = remaining.slice(cut).trim();
  }
  if (remaining) pieces.push(remaining);
  return pieces.filter(Boolean);
}

function pageLabel(minPage: number | null, maxPage: number | null): string {
  if (minPage == null) return "Document";
  if (maxPage == null || minPage === maxPage) return `Page ${minPage}`;
  return `Pages ${minPage}–${maxPage}`;
}

/**
 * Groups meaningful blocks into retrieval chunks. Page boundaries are respected
 * so every citation can point at the page it actually came from. Audio chunks
 * carry start/end timestamps.
 */
export function buildChunks(
  blocks: ExtractionBlock[],
  documentTitle: string,
): { chunks: ChunkDraft[]; truncated: boolean } {
  const usable = blocks.filter((block) => block.text.trim().length > 0);
  if (usable.length === 0) return { chunks: [], truncated: false };

  type Working = {
    lines: string[];
    heading: string | null;
    pageStart: number | null;
    pageEnd: number | null;
    timeStart: number | null;
    timeEnd: number | null;
    confidenceWeighted: number;
    confidenceChars: number;
  };

  const chunks: ChunkDraft[] = [];
  let currentHeading: string | null = null;
  let current: Working | null = null;

  const start = (): Working => ({
    lines: [],
    heading: currentHeading,
    pageStart: null,
    pageEnd: null,
    timeStart: null,
    timeEnd: null,
    confidenceWeighted: 0,
    confidenceChars: 0,
  });

  const flush = () => {
    if (!current || current.lines.length === 0) {
      current = null;
      return;
    }
    const body = current.lines.join("\n\n").trim();
    const prefix = current.heading && !body.startsWith(current.heading) ? `${current.heading}\n\n` : "";
    const content = `${prefix}${body}`.trim();
    if (!content) {
      current = null;
      return;
    }
    const confidence =
      current.confidenceChars > 0
        ? Math.round((current.confidenceWeighted / current.confidenceChars) * 100) / 100
        : null;

    let sourceLabel: string;
    if (current.timeStart != null) {
      sourceLabel = audioLabel(current.timeStart, current.timeEnd);
    } else {
      sourceLabel = pageLabel(current.pageStart, current.pageEnd);
    }

    chunks.push({
      chunkIndex: chunks.length,
      content,
      page: current.pageStart,
      startSeconds: current.timeStart,
      endSeconds: current.timeEnd,
      confidence,
      sourceLabel,
    });
    current = null;
  };

  const ensureCurrent = (): Working => {
    if (!current) current = start();
    return current;
  };

  for (const block of usable) {
    if (block.type === "heading") {
      currentHeading = block.text.trim();
    }

    const target = ensureCurrent();

    const pageChanged =
      block.page != null &&
      target.pageStart != null &&
      target.pageEnd != null &&
      block.page !== target.pageEnd;
    if (pageChanged && target.lines.length > 0) {
      flush();
    }

    const pieces = splitLongText(block.text.trim(), MAX_CHUNK_CHARS - 100);
    for (const piece of pieces) {
      const work = ensureCurrent();
      const prospective = work.lines.join("\n\n").length + piece.length + 2;
      if (prospective > MAX_CHUNK_CHARS && work.lines.length > 0) {
        flush();
      }
      const next = ensureCurrent();
      if (next.heading == null && currentHeading) next.heading = currentHeading;
      next.lines.push(piece);
      if (block.page != null) {
        if (next.pageStart == null) next.pageStart = block.page;
        next.pageEnd = block.page;
      }
      if (block.startSeconds != null) {
        if (next.timeStart == null) next.timeStart = block.startSeconds;
      }
      if (block.endSeconds != null) {
        next.timeEnd = block.endSeconds;
      } else if (block.startSeconds != null) {
        next.timeEnd = Math.max(next.timeEnd ?? 0, block.startSeconds);
      }
      next.confidenceWeighted += block.confidence * piece.length;
      next.confidenceChars += piece.length;
    }
  }
  flush();

  const truncated = chunks.length > MAX_CHUNKS;
  return {
    chunks: chunks.slice(0, MAX_CHUNKS).map((chunk, index) => ({ ...chunk, chunkIndex: index })),
    truncated,
  };
}

export function blocksToPlainText(blocks: ExtractionBlock[]): string {
  const parts: string[] = [];
  let lastPage: number | null = null;
  for (const block of blocks) {
    if (block.page != null && block.page !== lastPage) {
      parts.push(`--- Page ${block.page} ---`);
      lastPage = block.page;
    }
    const unreadable = block.type === "unreadable" ? "[UNREADABLE] " : "";
    parts.push(`${unreadable}${block.text}`.trim());
  }
  return parts.join("\n\n").trim();
}

/**
 * Source text for note generation. Confidence is explicit so the model can
 * avoid presenting an uncertain reading as fact.
 */
export function blocksToSourceText(blocks: ExtractionBlock[]): string {
  const parts: string[] = [];
  let lastPage: number | null = null;

  for (const block of blocks) {
    if (block.page != null && block.page !== lastPage) {
      parts.push(`--- Page ${block.page} ---`);
      lastPage = block.page;
    }
    const meta: string[] = [block.type];
    if (block.uncertain || block.confidence < 0.6) {
      meta.push(`uncertain, confidence ${block.confidence.toFixed(2)}`);
    } else if (block.confidence < 0.8) {
      meta.push(`confidence ${block.confidence.toFixed(2)}`);
    }
    if (block.startSeconds != null) {
      meta.push(`timestamp ${block.startSeconds.toFixed(0)}s`);
    }
    const note = block.note ? ` Note: ${block.note}` : "";
    parts.push(`[${meta.join(" | ")}]${note}\n${block.text}`);
  }

  return parts.join("\n\n").trim();
}

/** Builds blocks from digital PDF text without pretending it was OCR. */
export function blocksFromPdfPages(
  pages: Array<{ page: number; text: string }>,
  documentTitle: string,
): ExtractionBlock[] {
  const blocks: ExtractionBlock[] = [];
  let counter = 0;

  for (const page of pages) {
    if (!page.text.trim()) continue;
    const lines = page.text.split("\n");
    let paragraph: string[] = [];

    const flushParagraph = () => {
      if (paragraph.length === 0) return;
      const text = paragraph.join(" ").replace(/\s+/g, " ").trim();
      if (text) {
        blocks.push({
          id: `pdf-p${page.page}-b${++counter}`,
          type: /^(module|unit|chapter|section|assessment|course outcomes|high-yield)/i.test(text) && text.length < 120
            ? "heading"
            : "paragraph",
          text,
          page: page.page,
          confidence: 0.99,
          uncertain: false,
        });
      }
      paragraph = [];
    };

    for (const rawLine of lines) {
      const line = rawLine.trim();
      if (!line) {
        flushParagraph();
        continue;
      }

      const looksHeading =
        line.length <= 100 &&
        !/[.!?;:]$/.test(line) &&
        (/^(module|unit|chapter|section|assessment|course outcomes|high-yield)/i.test(line) ||
          (line === line.toUpperCase() && /[A-Z]/.test(line)));

      if (looksHeading) {
        flushParagraph();
        blocks.push({
          id: `pdf-p${page.page}-b${++counter}`,
          type: "heading",
          text: line,
          page: page.page,
          confidence: 0.99,
          uncertain: false,
        });
      } else {
        paragraph.push(line);
        if (paragraph.join(" ").length > 1_100) flushParagraph();
      }
    }
    flushParagraph();
  }

  if (blocks.length === 0) {
    blocks.push({
      id: "pdf-empty",
      type: "unreadable",
      text: "[No machine-readable text found]",
      page: 1,
      confidence: 0.2,
      uncertain: true,
      note: "The PDF has no digital text layer. Use vision OCR to read the scanned pages.",
    });
  }
  return blocks;
}
