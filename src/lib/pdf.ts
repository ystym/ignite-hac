import { extractText, getDocumentProxy } from "unpdf";
import { AppError } from "@/lib/errors";

export type PdfPage = {
  page: number;
  text: string;
};

export type PdfParseResult = {
  pages: PdfPage[];
  totalPages: number;
  metadataTitle: string | null;
  hasReliableTextLayer: boolean;
  totalCharacters: number;
};

export async function parsePdf(buffer: Buffer): Promise<PdfParseResult> {
  try {
    const data = new Uint8Array(buffer);
    const pdf = await getDocumentProxy(data);

    let metadataTitle: string | null = null;
    try {
      const metadata = await pdf.getMetadata();
      const info = metadata.info as Record<string, unknown> | undefined;
      const title = info?.Title;
      if (typeof title === "string" && title.trim().length > 2) {
        metadataTitle = title.trim();
      }
    } catch {
      // Metadata is optional.
    }

    const result = await extractText(pdf, { mergePages: false });
    const pages: PdfPage[] = (result.text as string[]).map((text, index) => ({
      page: index + 1,
      text: cleanPdfText(text),
    }));
    const totalCharacters = pages.reduce((sum, page) => sum + page.text.length, 0);
    const pagesWithText = pages.filter((page) => page.text.length > 20).length;
    const coverage = pages.length === 0 ? 0 : pagesWithText / pages.length;

    return {
      pages,
      totalPages: result.totalPages,
      metadataTitle,
      hasReliableTextLayer: totalCharacters > 180 && coverage >= 0.5,
      totalCharacters,
    };
  } catch (error) {
    throw new AppError({
      message:
        "This PDF could not be parsed. It may be encrypted, corrupted or password-protected. Try re-exporting it, or upload a photo of the pages.",
      code: "PDF_PARSE_FAILED",
      status: 422,
      retryable: false,
      cause: error,
    });
  }
}

function cleanPdfText(text: string): string {
  return text
    .replace(/\r\n/g, "\n")
    .replace(/\u0000/g, "")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export function humanizeFileName(fileName: string): string {
  const base = fileName.replace(/\.[^.]+$/, "").replace(/[_-]+/g, " ").trim();
  if (!base) return "Untitled study material";
  return base
    .split(/\s+/)
    .map((part) => (part.length > 2 ? part.charAt(0).toUpperCase() + part.slice(1) : part))
    .join(" ")
    .slice(0, 120);
}
