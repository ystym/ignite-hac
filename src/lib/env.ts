export type AIStatus = {
  configured: boolean;
  mode: "live" | "demo";
  forceDemo: boolean;
  model: string;
  embeddingModel: string;
  embeddingDimensions: number;
  reason: string | null;
};

function readInt(value: string | undefined, fallback: number): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

export function getAIStatus(): AIStatus {
  const key = process.env.GEMINI_API_KEY?.trim() ?? "";
  const forceDemo = (process.env.FORCE_DEMO_MODE ?? "").toLowerCase() === "true";
  const model = process.env.GEMINI_MODEL?.trim() || "gemini-3.6-flash";
  const embeddingModel = process.env.GEMINI_EMBEDDING_MODEL?.trim() || "gemini-embedding-001";
  const configured = Boolean(key) && !forceDemo;

  return {
    configured,
    mode: configured ? "live" : "demo",
    forceDemo,
    model,
    embeddingModel,
    embeddingDimensions: readInt(process.env.GEMINI_EMBEDDING_DIMENSIONS, 768),
    reason: configured
      ? null
      : forceDemo
        ? "FORCE_DEMO_MODE is enabled. Live AI calls are intentionally disabled."
        : "GEMINI_API_KEY is not set. Curated demo data is available; live analysis is disabled.",
  };
}

export function requireGeminiKey(): string {
  const status = getAIStatus();
  if (!status.configured) {
    throw new Error(status.reason ?? "Gemini is not configured");
  }
  return process.env.GEMINI_API_KEY!.trim();
}
