import { NextResponse } from "next/server";
import { errorResponse } from "@/lib/errors";
import { getAIStatus } from "@/lib/env";
import { testGeminiConnection } from "@/lib/ai/gemini";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function POST() {
  try {
    const status = getAIStatus();
    if (!status.configured) {
      return NextResponse.json({
        configured: false,
        ok: false,
        model: status.model,
        message: status.reason,
      });
    }
    const result = await testGeminiConnection();
    return NextResponse.json({ configured: true, ...result });
  } catch (error) {
    return errorResponse(error);
  }
}
