import { AIError, toAppError } from "@/lib/errors";
import { getAIStatus } from "@/lib/env";
import { getGenAI } from "@/lib/ai/gemini";

const RETRYABLE_PATTERN =
  /429|rate.?limit|resource_exhausted|quota|503|unavailable|fetch failed|econnreset|etimedout|timeout|network/i;

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export type EmbeddingTaskType = "RETRIEVAL_DOCUMENT" | "RETRIEVAL_QUERY" | "SEMANTIC_SIMILARITY";

/**
 * Real Gemini embeddings, persisted by the caller. Batches are kept small to
 * stay inside per-request limits; every batch is retried on transient errors.
 */
export async function embedTexts(
  texts: string[],
  taskType: EmbeddingTaskType,
): Promise<number[][]> {
  if (texts.length === 0) return [];
  const ai = getGenAI();
  const status = getAIStatus();
  const model = status.embeddingModel;
  const dimensions = status.embeddingDimensions;
  const output: number[][] = [];
  const batchSize = 24;

  for (let batchStart = 0; batchStart < texts.length; batchStart += batchSize) {
    const batch = texts.slice(batchStart, batchStart + batchSize);
    let lastError: unknown = null;

    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        const response = await ai.models.embedContent({
          model,
          contents: batch,
          config: {
            taskType,
            outputDimensionality: dimensions,
          },
        });
        const embeddings = response.embeddings ?? [];
        if (embeddings.length !== batch.length) {
          throw new AIError({
            message: "The embedding service returned an unexpected number of vectors. Please retry indexing.",
            code: "EMBEDDING_COUNT_MISMATCH",
            status: 502,
            retryable: true,
          });
        }
        for (const embedding of embeddings) {
          if (!embedding.values?.length) {
            throw new AIError({
              message: "The embedding service returned an empty vector. Please retry indexing.",
              code: "EMBEDDING_EMPTY",
              status: 502,
              retryable: true,
            });
          }
          output.push(embedding.values);
        }
        lastError = null;
        break;
      } catch (error) {
        lastError = error;
        const message = error instanceof Error ? error.message : String(error);
        if (attempt < 2 && RETRYABLE_PATTERN.test(message)) {
          await sleep(1_200 * (attempt + 1));
          continue;
        }
        const appError = toAppError(error);
        throw new AIError({
          message: `Embedding generation failed. ${appError.message}`,
          code: "EMBEDDING_FAILED",
          status: appError.status,
          retryable: true,
          cause: error,
        });
      }
    }
    if (lastError) throw lastError;
  }

  return output;
}

export async function embedQuery(text: string): Promise<number[]> {
  const [vector] = await embedTexts([text], "RETRIEVAL_QUERY");
  return vector;
}
