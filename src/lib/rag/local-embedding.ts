/**
 * Lightweight deterministic embeddings used ONLY by the explicitly labelled
 * demo mode. This is not an AI model and the UI says so. It exists so judges
 * can exercise retrieval, citations, and the no-answer path without an API key.
 * Live uploads always use Gemini embeddings.
 */

const DIMENSIONS = 384;

function hash(value: string): number {
  let h = 2166136261;
  for (let i = 0; i < value.length; i++) {
    h ^= value.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h);
}

function normalise(text: string): string {
  return text
    .toLowerCase()
    .replace(/[’']/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function addToken(vector: number[], token: string, weight: number) {
  if (!token) return;
  const index = hash(token) % DIMENSIONS;
  const sign = hash(`sign:${token}`) % 2 === 0 ? 1 : -1;
  vector[index] += sign * weight;
}

export function localEmbedding(text: string): number[] {
  const vector = new Array<number>(DIMENSIONS).fill(0);
  const clean = normalise(text);
  const tokens = clean.match(/[a-z0-9\u0900-\u097f]+(?:[.'-][a-z0-9]+)*/g) ?? [];

  for (const token of tokens) {
    const weight = token.length <= 2 ? 0.35 : token.length >= 9 ? 1.25 : 1;
    addToken(vector, token, weight);
    // Character trigrams make the demo robust to small OCR/spelling changes.
    if (token.length > 4) {
      for (let i = 0; i < token.length - 2; i++) {
        addToken(vector, `#${token.slice(i, i + 3)}`, 0.3);
      }
    }
  }

  for (let i = 0; i < tokens.length - 1; i++) {
    addToken(vector, `${tokens[i]}_${tokens[i + 1]}`, 0.45);
  }

  const norm = Math.sqrt(vector.reduce((sum, value) => sum + value * value, 0));
  return norm === 0 ? vector : vector.map((value) => value / norm);
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

export const DEMO_EMBEDDING_LABEL = "Local hashed-token vectors (demo, not AI)";
