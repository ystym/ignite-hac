import { NextResponse } from "next/server";
import { z } from "zod";
import { AppError, errorResponse } from "@/lib/errors";
import { getAIStatus } from "@/lib/env";
import { languageSchema } from "@/lib/schemas";
import { generateTopicNotes } from "@/lib/ai/topic-notes";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 180;

const inputSchema = z.object({
  topic: z
    .string()
    .trim()
    .min(3, "Enter at least 3 characters.")
    .max(180, "Keep the topic under 180 characters.")
    .transform((value) => value.replace(/\s+/g, " ")),
  language: languageSchema.default("simple_en"),
});

export async function POST(request: Request) {
  try {
    if (!getAIStatus().configured) {
      throw new AppError({
        message:
          "Learning a topic outside your material needs a Gemini API key. Demo mode never invents general-knowledge notes.",
        code: "AI_NOT_CONFIGURED",
        status: 412,
        retryable: false,
      });
    }

    const parsed = inputSchema.safeParse(await request.json().catch(() => ({})));
    if (!parsed.success) {
      throw new AppError({
        message:
          parsed.error.issues[0]?.message ??
          "Enter a topic between 3 and 180 characters, then try again.",
        code: "INVALID_TOPIC",
        status: 400,
        retryable: false,
      });
    }

    const generated = await generateTopicNotes(parsed.data);

    return NextResponse.json({
      scope: "GENERAL_KNOWLEDGE",
      grounding: "none",
      note: {
        topic: generated.topic,
        language: parsed.data.language,
        model: generated.model,
        mode: "LIVE",
        content: generated.notes,
      },
    });
  } catch (error) {
    return errorResponse(error);
  }
}
