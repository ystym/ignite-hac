import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { AppError, errorResponse } from "@/lib/errors";
import { getAIStatus } from "@/lib/env";
import { validateAndStoreUpload } from "@/lib/files";
import { humanizeFileName } from "@/lib/pdf";
import { toDocumentSummary } from "@/lib/documents";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

export async function POST(request: Request) {
  try {
    const status = getAIStatus();
    if (!status.configured) {
      throw new AppError({
        message:
          "Live uploads are disabled in Demo Mode. Add GEMINI_API_KEY to .env and restart the server, or open a curated sample document.",
        code: "DEMO_MODE",
        status: 412,
        retryable: false,
      });
    }

    const form = await request.formData();
    const file = form.get("file");
    if (!(file instanceof File)) {
      throw new AppError({
        message: "No file was included. Choose an image, PDF or audio recording.",
        code: "NO_FILE",
        status: 400,
      });
    }

    const stored = await validateAndStoreUpload(file);
    const document = await prisma.document.create({
      data: {
        title: humanizeFileName(file.name),
        fileName: file.name.slice(0, 240),
        mimeType: stored.mimeType,
        fileSize: stored.fileSize,
        fileType: stored.fileType,
        source: "UPLOAD",
        storagePath: stored.storagePath,
        status: "UPLOADED",
        processingStage: "queued",
        mode: "LIVE",
        indexStatus: "PENDING",
      },
    });

    return NextResponse.json({ document: toDocumentSummary(document) }, { status: 201 });
  } catch (error) {
    return errorResponse(error);
  }
}
