import { NextResponse } from "next/server";
import { errorResponse } from "@/lib/errors";
import { processDocument } from "@/lib/process-document";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

export async function POST(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await context.params;
    const result = await processDocument(id);
    return NextResponse.json({ result }, { status: result.status === "READY" ? 200 : 422 });
  } catch (error) {
    return errorResponse(error);
  }
}
