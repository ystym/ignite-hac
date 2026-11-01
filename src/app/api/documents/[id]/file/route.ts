import { NextResponse } from "next/server";
import path from "node:path";
import { readFile } from "node:fs/promises";
import { prisma } from "@/lib/db";
import { AppError, errorResponse } from "@/lib/errors";
import { readStoredUpload } from "@/lib/files";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const SAMPLE_DIR = path.join(process.cwd(), "public", "samples");

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await context.params;
    const document = await prisma.document.findUnique({ where: { id } });
    if (!document) {
      throw new AppError({
        message: "That document no longer exists.",
        code: "DOCUMENT_NOT_FOUND",
        status: 404,
      });
    }

    let buffer: Buffer;
    if (document.source === "SAMPLE" || document.source === "DEMO") {
      const safe = path.basename(document.fileName);
      if (safe !== document.fileName) {
        throw new AppError({
          message: "That sample path is invalid.",
          code: "INVALID_SAMPLE",
          status: 400,
        });
      }
      buffer = await readFile(path.join(SAMPLE_DIR, safe)).catch(() => {
        throw new AppError({
          message: "The bundled sample file is missing.",
          code: "SAMPLE_MISSING",
          status: 404,
        });
      });
    } else if (document.storagePath) {
      buffer = await readStoredUpload(document.storagePath);
    } else {
      throw new AppError({
        message: "There is no original file to preview for this document.",
        code: "NO_PREVIEW",
        status: 404,
      });
    }

    const total = buffer.byteLength;
    const range = request.headers.get("range");
    const headers = new Headers({
      "Content-Type": document.mimeType,
      "Content-Disposition": `inline; filename="${encodeURIComponent(document.fileName)}"`,
      "Accept-Ranges": "bytes",
      "Cache-Control": "private, max-age=60",
    });

    if (range) {
      const match = /^bytes=(\d*)-(\d*)$/.exec(range.trim());
      if (match) {
        const start = match[1] ? Number(match[1]) : 0;
        const end = match[2] ? Math.min(Number(match[2]), total - 1) : total - 1;
        if (start <= end && start < total) {
          const slice = buffer.subarray(start, end + 1);
          headers.set("Content-Range", `bytes ${start}-${end}/${total}`);
          headers.set("Content-Length", String(slice.byteLength));
          return new NextResponse(new Uint8Array(slice), { status: 206, headers });
        }
        headers.set("Content-Range", `bytes */${total}`);
        return new NextResponse(null, { status: 416, headers });
      }
    }

    headers.set("Content-Length", String(total));
    return new NextResponse(new Uint8Array(buffer), { status: 200, headers });
  } catch (error) {
    return errorResponse(error);
  }
}
