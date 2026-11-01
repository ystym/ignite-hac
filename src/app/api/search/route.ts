import { NextResponse } from "next/server";
import { z } from "zod";
import { AppError, errorResponse } from "@/lib/errors";
import { searchLocalMaterial } from "@/lib/search";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const querySchema = z.string().trim().max(180);

export async function GET(request: Request) {
  try {
    const raw = new URL(request.url).searchParams.get("q") ?? "";
    const parsed = querySchema.safeParse(raw);
    if (!parsed.success) {
      throw new AppError({
        message: "Keep the search query under 180 characters.",
        code: "INVALID_QUERY",
        status: 400,
        retryable: false,
      });
    }

    const result = await searchLocalMaterial(parsed.data);
    return NextResponse.json({ result });
  } catch (error) {
    return errorResponse(error);
  }
}
