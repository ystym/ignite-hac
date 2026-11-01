import {
  GoogleGenAI,
  type GenerateContentResponse,
  type Part,
  type ThinkingConfig,
} from "@google/genai";
import { z } from "zod";
import { AIError, toAppError } from "@/lib/errors";
import { getAIStatus } from "@/lib/env";
import { toGeminiJsonSchema } from "@/lib/ai/json-schema";

type GlobalWithGenAI = typeof globalThis & {
  __studymateGenAI?: GoogleGenAI;
};

export function getGenAI(): GoogleGenAI {
  return genAI();
}

function genAI(): GoogleGenAI {
  const status = getAIStatus();
  if (!status.configured) {
    throw new AIError({
      message:
        status.reason ??
        "Live AI is disabled. Add GEMINI_API_KEY to .env and restart the server to analyse new material.",
      code: "AI_NOT_CONFIGURED",
      status: 412,
      retryable: false,
    });
  }

  const globalCache = globalThis as GlobalWithGenAI;
  if (!globalCache.__studymateGenAI) {
    globalCache.__studymateGenAI = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY!.trim(),
    });
  }
  return globalCache.__studymateGenAI;
}

export function getConfiguredModel(): string {
  return getAIStatus().model;
}

const RETRYABLE_PATTERN =
  /429|rate.?limit|resource_exhausted|quota|503|unavailable|500 internal|fetch failed|econnreset|etimedout|timeout|network/i;
const SCHEMA_PATTERN = /schema|response_json|responsejsonschema|invalid argument|unknown name/i;

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Gemini 3 models think by default. Without a low thinking level, a small
 * maxOutputTokens budget can be consumed by hidden reasoning and return no
 * visible text at all. Older models keep their provider defaults.
 */
function thinkingConfigFor(model: string): ThinkingConfig | undefined {
  const configured = (process.env.GEMINI_THINKING_LEVEL ?? "low").trim().toLowerCase();
  if (!configured || configured === "off" || configured === "default") return undefined;
  if (!/^gemini-(3|4)(\.|-)|^gemini-omni/.test(model)) return undefined;
  const level =
    (["minimal", "low", "medium", "high"] as const).includes(
      configured as "minimal" | "low" | "medium" | "high",
    )
      ? (configured as NonNullable<ThinkingConfig["thinkingLevel"]>)
      : ("low" as NonNullable<ThinkingConfig["thinkingLevel"]>);
  return { thinkingLevel: level };
}

function extractJson(text: string): unknown {
  const cleaned = text
    .replace(/^\s*```(?:json)?\s*/i, "")
    .replace(/\s*```\s*$/i, "")
    .trim();

  try {
    return JSON.parse(cleaned);
  } catch {
    const first = cleaned.indexOf("{");
    const last = cleaned.lastIndexOf("}");
    if (first >= 0 && last > first) {
      return JSON.parse(cleaned.slice(first, last + 1));
    }
    throw new AIError({
      message: "The AI returned a response that was not valid JSON. Please retry.",
      code: "AI_INVALID_JSON",
      status: 502,
      retryable: true,
    });
  }
}

function readResponseText(response: GenerateContentResponse): string {
  const parts = response.candidates?.[0]?.content?.parts ?? [];
  const text = parts
    .map((part) => part.text ?? "")
    .filter(Boolean)
    .join("\n")
    .trim();

  if (text) return text;
  if (response.promptFeedback?.blockReason) {
    throw new AIError({
      message:
        "The AI provider blocked this request. Try a smaller excerpt or a different question. No answer was invented.",
      code: "AI_BLOCKED",
      status: 422,
      retryable: false,
    });
  }
  throw new AIError({
    message: "The AI returned an empty response. Please retry.",
    code: "AI_EMPTY_RESPONSE",
    status: 502,
    retryable: true,
  });
}

export type MediaInput = {
  buffer: Buffer;
  mimeType: string;
  displayName: string;
};

export type PreparedMedia = {
  part: Part;
  cleanup: () => Promise<void>;
};

/**
 * Small media is inlined. Larger PDFs/audio use the Gemini Files API and are
 * deleted afterwards. This avoids the inline request size ceiling.
 */
export async function prepareMedia(media: MediaInput): Promise<PreparedMedia> {
  const ai = genAI();
  const inlineLimit = 12 * 1024 * 1024;

  if (media.buffer.byteLength <= inlineLimit) {
    return {
      part: {
        inlineData: {
          data: media.buffer.toString("base64"),
          mimeType: media.mimeType,
          displayName: media.displayName,
        },
      },
      cleanup: async () => {},
    };
  }

  let uploaded;
  try {
    uploaded = await ai.files.upload({
      file: new Blob([new Uint8Array(media.buffer)], { type: media.mimeType }),
      config: {
        mimeType: media.mimeType,
        displayName: media.displayName,
      },
    });
  } catch (error) {
    const appError = toAppError(error);
    throw new AIError({
      message: `The file could not be uploaded to Gemini. ${appError.message}`,
      code: "AI_FILE_UPLOAD_FAILED",
      status: 502,
      retryable: true,
      cause: error,
    });
  }

  if (!uploaded.name) {
    throw new AIError({
      message: "Gemini did not return a file handle. Please retry the analysis.",
      code: "AI_FILE_UPLOAD_FAILED",
      status: 502,
      retryable: true,
    });
  }

  for (let attempt = 0; attempt < 45; attempt++) {
    const file = await ai.files.get({ name: uploaded.name });
    if (file.state === "ACTIVE") {
      if (!file.uri) {
        throw new AIError({
          message: "Gemini could not prepare this file. Please retry with a smaller file.",
          code: "AI_FILE_NOT_READY",
          status: 502,
          retryable: true,
        });
      }
      return {
        part: {
          fileData: {
            fileUri: file.uri,
            mimeType: file.mimeType ?? media.mimeType,
            displayName: media.displayName,
          },
        },
        cleanup: async () => {
          try {
            await ai.files.delete({ name: uploaded!.name! });
          } catch {
            // Files expire automatically; cleanup failure is not fatal.
          }
        },
      };
    }
    if (file.state === "FAILED") {
      throw new AIError({
        message: `Gemini could not process this file${file.error?.message ? `: ${file.error.message}` : "."} Try a smaller or clearer file.`,
        code: "AI_FILE_PROCESSING_FAILED",
        status: 502,
        retryable: false,
      });
    }
    await sleep(1_500);
  }

  throw new AIError({
    message: "Gemini took too long to prepare this file. Please try a shorter recording or a smaller PDF.",
    code: "AI_FILE_TIMEOUT",
    status: 504,
    retryable: true,
  });
}

export type StructuredOptions<T> = {
  schema: z.ZodType<T>;
  systemInstruction: string;
  prompt: string;
  media?: MediaInput | null;
  temperature?: number;
  maxOutputTokens?: number;
  model?: string;
};

/**
 * Generates JSON, enforces the shape with both a Gemini response schema and Zod,
 * and retries transient provider errors. No fallback content is invented.
 */
export async function generateStructured<T>(options: StructuredOptions<T>): Promise<T> {
  const ai = genAI();
  const model = options.model ?? getConfiguredModel();
  const media = options.media ? await prepareMedia(options.media) : null;
  const jsonSchema = toGeminiJsonSchema(options.schema);
  // The provider-side schema is not honoured by every Gemini model/version.
  // Always include the exact contract in the prompt as well, so the model is
  // never asked to guess field names or types.
  const prompt = `${options.prompt}

Return one JSON object that conforms exactly to this JSON Schema. Use every required field with the stated type. Do not wrap it in Markdown.
${JSON.stringify(jsonSchema)}`;
  const parts: Part[] = [{ text: prompt }];
  if (media) parts.push(media.part);

  const thinking = thinkingConfigFor(model);
  const configBase = {
    systemInstruction: options.systemInstruction,
    temperature: options.temperature ?? 0.2,
    maxOutputTokens: options.maxOutputTokens ?? 8192,
    responseMimeType: "application/json",
    ...(thinking ? { thinkingConfig: thinking } : {}),
  };
  let useSchema = true;
  let lastError: unknown = null;

  try {
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        let response: GenerateContentResponse;
        try {
          response = await ai.models.generateContent({
            model,
            contents: [{ role: "user", parts }],
            config: {
              ...configBase,
              ...(useSchema ? { responseJsonSchema: jsonSchema } : {}),
            },
          });
        } catch (error) {
          const message = error instanceof Error ? error.message : String(error);
          if (useSchema && SCHEMA_PATTERN.test(message) && !RETRYABLE_PATTERN.test(message)) {
            // Some models reject parts of the JSON Schema subset. Prompt-level
            // JSON + Zod is still enforced; never accept unvalidated output.
            useSchema = false;
            lastError = error;
            continue;
          }
          throw error;
        }

        const text = readResponseText(response);
        const parsed = options.schema.safeParse(extractJson(text));
        if (!parsed.success) {
          lastError = new AIError({
            message:
              "The AI response did not match the required structure, so it was rejected. Please retry. Nothing was saved.",
            code: "AI_INVALID_STRUCTURE",
            status: 502,
            retryable: true,
            details: parsed.error.issues.slice(0, 8),
          });
          await sleep(900);
          continue;
        }
        return parsed.data;
      } catch (error) {
        lastError = error;
        const message = error instanceof Error ? error.message : String(error);
        if (attempt < 2 && RETRYABLE_PATTERN.test(message)) {
          await sleep(1_500 * (attempt + 1));
          continue;
        }
        throw error;
      }
    }
    throw lastError ?? new Error("AI generation failed");
  } catch (error) {
    if (error instanceof AIError) throw error;
    throw new AIError({
      message: toAppError(error).message,
      code: toAppError(error).code,
      status: toAppError(error).status,
      retryable: toAppError(error).retryable,
      cause: error,
    });
  } finally {
    if (media) await media.cleanup();
  }
}

export type ConnectionTestResult = {
  ok: boolean;
  model: string;
  latencyMs: number;
  text: string;
  message: string;
};

export async function testGeminiConnection(): Promise<ConnectionTestResult> {
  const ai = genAI();
  const model = getConfiguredModel();
  const started = Date.now();
  const thinking = thinkingConfigFor(model);
  try {
    const response = await ai.models.generateContent({
      model,
      contents: [{ role: "user", parts: [{ text: "Reply with exactly: STUDYMATE_READY" }] }],
      config: {
        temperature: 0,
        // Gemini 3 spends tokens on hidden reasoning, so a tiny cap can yield
        // an empty visible reply even when the key and model are healthy.
        maxOutputTokens: 512,
        ...(thinking ? { thinkingConfig: thinking } : {}),
      },
    });
    const text = readResponseText(response);
    return {
      ok: true,
      model,
      latencyMs: Date.now() - started,
      text,
      message: "Gemini responded successfully. Live features are available.",
    };
  } catch (error) {
    const appError = toAppError(error);
    return {
      ok: false,
      model,
      latencyMs: Date.now() - started,
      text: "",
      message: appError.message,
    };
  }
}

/* -------------------------------------------------------------------------- */
/* Web search                                                                  */
/* -------------------------------------------------------------------------- */

export type WebSource = {
  title: string;
  url: string;
  domain: string | null;
};

export type WebResearchResult = {
  query: string;
  answer: string;
  model: string;
  sources: WebSource[];
  searchQueries: string[];
  grounded: boolean;
  latencyMs: number;
};

const WEB_RESEARCH_SYSTEM = `You are STUDYMATE AI's web research tutor. Use Google Search to research the student's topic.
Write a clear, student-friendly answer in plain text with these exact sections:
1. A direct answer in 2–4 short sentences.
2. A line containing exactly "Key ideas" followed by 4–7 bullet lines starting with "- ".
3. A line containing exactly "How to study this" followed by 3–5 bullet lines starting with "- ".
4. A line containing exactly "Check before relying on this" followed by 1–3 bullet lines, only when something is contested, syllabus-dependent or time-sensitive.

Rules:
- Only state what the search results support. If sources disagree, say so explicitly.
- Never invent a link, book, statistic, date or quotation. Do not add a bibliography; the app lists the real source URLs from search metadata.
- Do not claim the answer came from the student's uploaded notes.
- Keep the whole answer under 450 words. Plain text only; no Markdown tables, no code fences, no raw URLs.`;

export async function generateWebResearch(rawQuery: string): Promise<WebResearchResult> {
  const query = rawQuery.replace(/\s+/g, " ").trim().slice(0, 180);
  const ai = genAI();
  const model = getConfiguredModel();
  const started = Date.now();
  const thinking = thinkingConfigFor(model);

  try {
    const response = await ai.models.generateContent({
      model,
      contents: [
        {
          role: "user",
          parts: [
            {
              text: `${WEB_RESEARCH_SYSTEM}\n\nStudent topic: ${query}\n\nSearch the web, then write the answer.`,
            },
          ],
        },
      ],
      config: {
        temperature: 0.2,
        maxOutputTokens: 4096,
        tools: [{ googleSearch: {} }],
        ...(thinking ? { thinkingConfig: thinking } : {}),
      },
    });

    const answer = readResponseText(response).trim();
    if (!answer) {
      throw new AIError({
        message:
          "The web search returned no visible answer. Nothing was saved. Retry, or use Learn a topic for general-knowledge notes.",
        code: "AI_EMPTY_WEB_ANSWER",
        status: 502,
        retryable: true,
      });
    }

    const metadata = response.candidates?.[0]?.groundingMetadata;
    const seen = new Set<string>();
    const sources: WebSource[] = [];
    for (const chunk of metadata?.groundingChunks ?? []) {
      const web = chunk.web;
      if (!web?.uri) continue;
      if (!/^https?:\/\//i.test(web.uri)) continue;
      if (seen.has(web.uri)) continue;
      seen.add(web.uri);
      let domain: string | null = web.domain ?? null;
      if (!domain) {
        try {
          domain = new URL(web.uri).hostname.replace(/^www\./, "");
        } catch {
          domain = null;
        }
      }
      sources.push({
        title: web.title?.trim() || domain || "Web source",
        url: web.uri,
        domain,
      });
      if (sources.length >= 12) break;
    }

    return {
      query,
      answer,
      model,
      sources,
      searchQueries: metadata?.webSearchQueries ?? [],
      grounded: sources.length > 0,
      latencyMs: Date.now() - started,
    };
  } catch (error) {
    if (error instanceof AIError) throw error;
    const appError = toAppError(error);
    throw new AIError({
      message: appError.message,
      code: appError.code,
      status: appError.status,
      retryable: appError.retryable,
      cause: error,
    });
  }
}
