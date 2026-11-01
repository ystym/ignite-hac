import { AIError } from "@/lib/errors";
import {
  notesSchema,
  type ExtractionWarning,
  type Language,
  type NotesContent,
} from "@/lib/schemas";
import { NOTES_SYSTEM, notesPrompt } from "@/lib/ai/prompts";
import { generateStructured, getConfiguredModel } from "@/lib/ai/gemini";
import { blocksToSourceText } from "@/lib/rag/chunk";
import type { ExtractionBlock } from "@/lib/schemas";

const MAX_SOURCE_CHARS = 70_000;

export type NotesGenerationResult = {
  notes: NotesContent;
  model: string;
  truncated: boolean;
};

export async function generateNotes(options: {
  title: string;
  blocks: ExtractionBlock[];
  warnings: ExtractionWarning[];
  language: Language;
}): Promise<NotesGenerationResult> {
  let sourceText = blocksToSourceText(options.blocks);
  let truncated = false;
  const warnings = options.warnings.map((warning) => warning.message).filter(Boolean);

  if (sourceText.length > MAX_SOURCE_CHARS) {
    sourceText = `${sourceText.slice(0, MAX_SOURCE_CHARS)}\n\n[Source truncated by STUDYMATE AI at ${MAX_SOURCE_CHARS} characters. The notes below may not cover the end of this document.]`;
    truncated = true;
    warnings.push(
      `The source was longer than ${MAX_SOURCE_CHARS.toLocaleString()} characters and was truncated for note generation. Some later material may be missing.`,
    );
  }

  if (sourceText.trim().length < 40) {
    throw new AIError({
      message:
        "There is not enough extracted text to generate useful notes. Check the source or correct the extraction first.",
      code: "SOURCE_TOO_SHORT",
      status: 422,
      retryable: false,
    });
  }

  const notes = await generateStructured({
    schema: notesSchema,
    systemInstruction: NOTES_SYSTEM,
    prompt: notesPrompt({
      title: options.title,
      text: sourceText,
      language: options.language,
      warnings,
    }),
    temperature: 0.3,
    maxOutputTokens: 16000,
  });

  const uncertain = [...notes.uncertainAreas];
  for (const warning of options.warnings) {
    if (warning.severity === "info") continue;
    const key = `${warning.location ?? "source"}:${warning.message}`.toLowerCase();
    if (
      uncertain.some(
        (area) => `${area.topic}:${area.reason}`.toLowerCase() === key,
      )
    ) {
      continue;
    }
    if (uncertain.length >= 20) break;
    uncertain.push({
      topic: warning.location ?? "Source uncertainty",
      reason: warning.message,
    });
  }

  const seen = new Set<string>();
  const dedupedUncertain = uncertain.filter((area) => {
    const key = `${area.topic}-${area.reason}`.toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  return {
    notes: {
      ...notes,
      title: notes.title.trim() || options.title,
      uncertainAreas: dedupedUncertain.slice(0, 20),
    },
    model: getConfiguredModel(),
    truncated,
  };
}
