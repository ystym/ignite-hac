import { NextResponse } from "next/server";
import { z } from "zod";
import { AppError, errorResponse } from "@/lib/errors";
import { getAIStatus } from "@/lib/env";
import { generateWebResearch } from "@/lib/ai/gemini";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 120;

const inputSchema = z.object({
  query: z.string().trim().min(2, "Enter at least 2 characters.").max(180),
});

export async function POST(request: Request) {
  try {
    if (!getAIStatus().configured) {
      throw new AppError({
        message:
          "Web search needs a Gemini API key. Demo mode does not invent web answers. Add GEMINI_API_KEY to .env and restart the server.",
        code: "AI_NOT_CONFIGURED",
        status: 412,
        retryable: false,
      });
    }

    const parsed = inputSchema.safeParse(await request.json().catch(() => ({})));
    if (!parsed.success) {
      throw new AppError({
        message: parsed.error.issues[0]?.message ?? "Enter a topic to search the web.",
        code: "INVALID_QUERY",
        status: 400,
        retryable: false,
      });
    }

    const result = await generateWebResearch(parsed.data.query);
    return NextResponse.json({ result });
  } catch (error) {
    return errorResponse(error);
  }
}
