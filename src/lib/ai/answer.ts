import { AIError } from "@/lib/errors";
import {
  groundedAnswerSchema,
  type GroundedAnswer,
  type SourceReference,
} from "@/lib/schemas";
import { ASK_SYSTEM, askPrompt } from "@/lib/ai/prompts";
import { generateStructured } from "@/lib/ai/gemini";

export type ChunkWithEmbedding = {
  id: string;
  content: string;
  page: number | null;
  startSeconds: number | null;
  endSeconds: number | null;
  confidence: number | null;
  sourceLabel: string | null;
  embeddingJson: string;
};

export type RetrievedChunk = ChunkWithEmbedding & {
  relevance: number;
  source: SourceReference;
};

function parseVector(json: string): number[] {
  try {
    const parsed = JSON.parse(json);
    return Array.isArray(parsed) && parsed.every((value) => typeof value === "number") ? parsed : [];
  } catch {
    return [];
  }
}

export function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length === 0 || b.length === 0 || a.length !== b.length) return 0;
  let dot = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  if (normA === 0 || normB === 0) return 0;
  return dot / Math.sqrt(normA * normB);
}

function toSource(chunk: ChunkWithEmbedding, relevance: number): SourceReference {
  return {
    chunkId: chunk.id,
    label: chunk.sourceLabel ?? (chunk.page ? `Page ${chunk.page}` : "Source chunk"),
    page: chunk.page,
    startSeconds: chunk.startSeconds,
    endSeconds: chunk.endSeconds,
    excerpt: chunk.content.replace(/\s+/g, " ").trim().slice(0, 420),
    relevance: Math.round(relevance * 100) / 100,
    confidence: chunk.confidence,
  };
}

export function retrieveChunks(
  chunks: ChunkWithEmbedding[],
  queryVector: number[],
  topK = 6,
): RetrievedChunk[] {
  return chunks
    .map((chunk) => {
      const vector = parseVector(chunk.embeddingJson);
      const relevance = cosineSimilarity(vector, queryVector);
      return { ...chunk, relevance, source: toSource(chunk, relevance) };
    })
    .filter((chunk) => chunk.relevance > 0)
    .sort((a, b) => b.relevance - a.relevance)
    .slice(0, topK);
}

export function hasUsableIndex(chunks: ChunkWithEmbedding[]): boolean {
  return chunks.some((chunk) => parseVector(chunk.embeddingJson).length > 0);
}

const STOPWORDS = new Set([
  "the","and","for","with","that","this","from","what","when","where","which","who","why","how",
  "does","did","was","were","are","is","be","been","being","have","has","had","into","about","can",
  "could","should","would","will","you","your","our","their","its","his","her","them","they","a","an",
  "of","to","in","on","at","as","by","or","if","then","than","not","no","but","do","using","use",
]);

function words(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((word) => word.length > 2 && !STOPWORDS.has(word));
}

function sentences(text: string): string[] {
  return text
    .replace(/\n+/g, " ")
    .split(/(?<=[.!?])\s+(?=[A-Z0-9(])/)
    .map((sentence) => sentence.trim())
    .filter((sentence) => sentence.length > 25);
}

/**
 * Demo-mode answer: local extraction from the retrieved chunks, not an LLM.
 * UI labels this clearly. It never claims to have generated new prose.
 */
export function buildExtractiveAnswer(options: {
  question: string;
  chunks: RetrievedChunk[];
  threshold: number;
}): { answer: GroundedAnswer; sources: SourceReference[]; noAnswer: boolean } {
  const queryWords = new Set(words(options.question));
  const best = options.chunks[0];

  if (!best || best.relevance < options.threshold) {
    return {
      answer: {
        answer:
          "I couldn't find this in the uploaded material. The closest passages were not relevant enough to answer safely. Try a more specific question using a term from the document, or add more material.",
        grounded: false,
        confidence: best?.relevance ?? 0,
        citedChunkIds: [],
        missingInformation: "No retrieved passage crossed the relevance threshold.",
      },
      sources: [],
      noAnswer: true,
    };
  }

  const candidates: Array<{ text: string; chunk: RetrievedChunk; score: number }> = [];
  for (const chunk of options.chunks.slice(0, 4)) {
    for (const sentence of sentences(chunk.content)) {
      const sentenceWords = words(sentence);
      let overlap = 0;
      for (const word of sentenceWords) if (queryWords.has(word)) overlap++;
      const specificity = overlap / Math.max(3, Math.min(16, sentenceWords.length));
      const score = specificity + chunk.relevance * 0.45;
      if (sentence.length <= 620) candidates.push({ text: sentence, chunk, score });
    }
  }

  candidates.sort((a, b) => b.score - a.score);
  const selected = candidates.slice(0, 3);
  const used = new Set<string>();
  const answerParts: string[] = [];

  if (selected.length === 0) {
    const fallback = best.content
      .replace(/\s+/g, " ")
      .slice(0, 500)
      .trim();
    answerParts.push(fallback);
    used.add(best.id);
  } else {
    for (const candidate of selected) {
      answerParts.push(candidate.text);
      used.add(candidate.chunk.id);
    }
  }

  const answer = `${answerParts.join(" ")}${answerParts.length === 3 ? " …" : ""}`.trim();
  const cited = options.chunks.filter((chunk) => used.has(chunk.id)).slice(0, 3);
  return {
    answer: {
      answer,
      grounded: true,
      confidence: Math.round(Math.min(0.92, best.relevance + 0.18) * 100) / 100,
      citedChunkIds: cited.map((chunk) => chunk.id),
    },
    sources: cited.map((chunk) => chunk.source),
    noAnswer: false,
  };
}

export async function generateLiveAnswer(options: {
  question: string;
  chunks: RetrievedChunk[];
}): Promise<{ answer: GroundedAnswer; sources: SourceReference[]; noAnswer: boolean }> {
  const chunkMap = new Map(options.chunks.map((chunk) => [chunk.id, chunk]));
  const answer = await generateStructured({
    schema: groundedAnswerSchema,
    systemInstruction: ASK_SYSTEM,
    prompt: askPrompt({
      question: options.question,
      chunks: options.chunks.map((chunk) => ({
        id: chunk.id,
        label: chunk.sourceLabel ?? `Page ${chunk.page ?? 1}`,
        confidence: chunk.confidence,
        content: chunk.content,
      })),
    }),
    temperature: 0.2,
    maxOutputTokens: 4000,
  });

  if (!answer.grounded) {
    return {
      answer,
      sources: [],
      noAnswer: true,
    };
  }

  const citedIds = [...new Set(answer.citedChunkIds)].filter((id) => chunkMap.has(id));
  if (citedIds.length === 0) {
    throw new AIError({
      message:
        "The generated answer did not cite a retrieved passage, so it was rejected as ungrounded. Please retry.",
      code: "ANSWER_UNGROUNDED",
      status: 502,
      retryable: true,
    });
  }

  const sources = citedIds.map((id) => chunkMap.get(id)!.source);
  return {
    answer: { ...answer, citedChunkIds: citedIds },
    sources,
    noAnswer: false,
  };
}
