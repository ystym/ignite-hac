import { z } from "zod";

/**
 * Gemini accepts JSON Schema through `responseJsonSchema`. We strip keywords
 * that are not in the documented subset. The SDK/API also validates it, so the
 * AI layer falls back to prompt-enforced JSON if a schema is rejected.
 */
export function toGeminiJsonSchema(schema: z.ZodType): Record<string, unknown> {
  const raw = z.toJSONSchema(schema, {
    io: "output",
    unrepresentable: "any",
  }) as Record<string, unknown>;
  return sanitize(raw) as Record<string, unknown>;
}

function sanitize(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(sanitize);
  if (!value || typeof value !== "object") return value;

  const output: Record<string, unknown> = {};
  for (const [key, child] of Object.entries(value as Record<string, unknown>)) {
    if (key === "$schema" || key === "default" || key === "$id" || key === "$anchor") {
      continue;
    }
    output[key] = sanitize(child);
  }
  return output;
}
