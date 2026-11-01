import { NextResponse } from "next/server";
import { errorResponse } from "@/lib/errors";
import { reindexDocument } from "@/lib/process-document";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 180;

export async function POST(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await context.params;
    const result = await reindexDocument(id);
    return NextResponse.json({ result });
  } catch (error) {
    return errorResponse(error);
  }
}
