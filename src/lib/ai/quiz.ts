import { AIError } from "@/lib/errors";
import {
  quizSchema,
  type ExtractionBlock,
  type QuizContent,
  type QuizDifficulty,
} from "@/lib/schemas";
import { QUIZ_SYSTEM, quizPrompt } from "@/lib/ai/prompts";
import { generateStructured, getConfiguredModel } from "@/lib/ai/gemini";
import { blocksToSourceText } from "@/lib/rag/chunk";

const MAX_SOURCE_CHARS = 55_000;

function tokens(text: string): Set<string> {
  return new Set(
    text
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, " ")
      .split(/\s+/)
      .filter((token) => token.length > 2),
  );
}

/**
 * A light grounding check: the quoted source excerpt must substantially appear
 * in the source. This does not prove pedagogical quality, but it rejects
 * fabricated citations before they reach a student.
 */
function excerptOverlap(excerpt: string, source: string): number {
  const quoteTokens = tokens(excerpt);
  if (quoteTokens.size === 0) return 0;
  const sourceTokens = tokens(source);
  let found = 0;
  for (const token of quoteTokens) {
    if (sourceTokens.has(token)) found++;
  }
  return found / quoteTokens.size;
}

export type QuizGenerationResult = {
  quiz: QuizContent;
  model: string;
  rejectedQuestions: number;
  truncated: boolean;
};

export async function generateQuiz(options: {
  title: string;
  blocks: ExtractionBlock[];
  difficulty: QuizDifficulty;
  count: number;
}): Promise<QuizGenerationResult> {
  let sourceText = blocksToSourceText(options.blocks);
  let truncated = false;
  if (sourceText.length > MAX_SOURCE_CHARS) {
    sourceText = sourceText.slice(0, MAX_SOURCE_CHARS);
    truncated = true;
  }
  if (sourceText.trim().length < 80) {
    throw new AIError({
      message:
        "There is not enough extracted content to generate a grounded quiz. Add more material or correct the extraction.",
      code: "SOURCE_TOO_SHORT",
      status: 422,
      retryable: false,
    });
  }

  const raw = await generateStructured({
    schema: quizSchema,
    systemInstruction: QUIZ_SYSTEM,
    prompt: quizPrompt({
      title: options.title,
      text: sourceText,
      difficulty: options.difficulty,
      count: options.count,
    }),
    temperature: 0.45,
    maxOutputTokens: 12000,
  });

  const usedIds = new Set<string>();
  const valid = raw.questions.filter((question) => {
    const uniqueOptions = new Set(question.options.map((option) => option.trim().toLowerCase()));
    if (uniqueOptions.size !== 4) return false;
    if (excerptOverlap(question.sourceExcerpt, sourceText) < 0.72) return false;
    return true;
  });

  if (valid.length < 3) {
    throw new AIError({
      message:
        "The generated questions failed the grounding check (their quoted source could not be verified). The quiz was not saved. Please retry.",
      code: "QUIZ_GROUNDING_FAILED",
      status: 502,
      retryable: true,
    });
  }

  const questions = valid.slice(0, options.count).map((question, index) => {
    let id = question.id.replace(/[^a-zA-Z0-9_-]/g, "") || `q${index + 1}`;
    while (usedIds.has(id)) id = `${id}-${index + 1}`;
    usedIds.add(id);
    return {
      ...question,
      id,
      options: question.options.map((option) => option.trim()),
      explanation: question.explanation.trim(),
      sourceExcerpt: question.sourceExcerpt.trim(),
    };
  });

  return {
    quiz: {
      ...raw,
      title: raw.title.trim() || `${options.title} — practice quiz`,
      difficulty: options.difficulty,
      questions,
    },
    model: getConfiguredModel(),
    rejectedQuestions: raw.questions.length - valid.length,
    truncated,
  };
}
