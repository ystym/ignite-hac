"use client";

import {
  AudioLines,
  ExternalLink,
  FileText,
  Fingerprint,
  Info,
  Layers3,
  ScanLine,
  ShieldAlert,
  Sparkles,
} from "lucide-react";
import type { ReactNode } from "react";
import type { DocumentDetail } from "@/lib/documents";
import { extractionMethodLabel } from "@/lib/documents";
import { formatBytesLabel, formatSeconds } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { ConfidenceBar, ModeBadge, OutputSourceTag } from "@/components/mode-badges";
import { FileTypeIcon, fileTypeLabel } from "@/components/file-type-icon";
import { TimeAgo } from "@/components/time-ago";

export function SourcePanel({
  document,
  onShowExtraction,
}: {
  document: DocumentDetail;
  onShowExtraction: () => void;
}) {
  const fileUrl = `/api/documents/${document.id}/file`;
  const duration = document.blocks.reduce((max, block) => Math.max(max, block.endSeconds ?? 0), 0);
  const criticalWarnings = document.warnings.filter((warning) => warning.severity === "critical").length;

  return (
    <div className="space-y-5">
      <div className="overflow-hidden rounded-2xl border border-hairline bg-white">
        <div className="flex items-center justify-between border-b border-[#f0f0f0] px-4 py-3.5">
          <div className="flex items-center gap-2">
            <FileTypeIcon type={document.fileType} className="h-8 w-8 rounded-lg" iconClassName="h-4 w-4" />
            <div>
              <p className="text-[12px] font-semibold text-ink-900">Original source</p>
              <p className="text-[10px] text-ink-400">{document.fileName}</p>
            </div>
          </div>
          <ModeBadge mode={document.mode} />
        </div>

        <div className="bg-parchment p-3">
          {document.fileType === "image" ? (
            // Arbitrary user uploads are served from a private API route, so a
            // plain img is intentional here. The source is never rewritten.
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={fileUrl}
              alt={`Original uploaded material: ${document.title}`}
              className="max-h-[430px] w-full rounded-xl border border-white/80 bg-white object-contain"
            />
          ) : document.fileType === "pdf" ? (
            <div className="overflow-hidden rounded-xl border border-white/80 bg-white">
              <iframe
                src={`${fileUrl}#page=1`}
                title={`PDF preview: ${document.title}`}
                className="h-[430px] w-full"
              />
            </div>
          ) : document.fileType === "audio" ? (
            <div className="rounded-xl border border-white/80 bg-white p-4">
              <div className="flex items-center justify-between">
                <span className="inline-flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-amber-700">
                  <AudioLines className="h-3.5 w-3.5" /> Recorded lecture
                </span>
                <span className="font-mono text-[10px] text-ink-400">
                  {duration > 0 ? formatSeconds(duration) : "Audio"}
                </span>
              </div>
              <div className="mt-4 flex h-20 items-center justify-center gap-[3px] overflow-hidden rounded-lg bg-parchment px-4">
                {Array.from({ length: 48 }).map((_, index) => (
                  <span
                    key={index}
                    className="w-[3px] shrink-0 rounded-full bg-amber-400/80"
                    style={{ height: `${12 + ((index * 37) % 54)}px` }}
                  />
                ))}
              </div>
              <audio controls preload="metadata" src={fileUrl} className="mt-4 w-full">
                Your browser does not support audio playback.
              </audio>
              <p className="mt-2 text-[10px] leading-4 text-ink-400">
                The original audio is streamed with range support. Transcript timestamps are approximate.
              </p>
            </div>
          ) : (
            <div className="max-h-[430px] overflow-y-auto rounded-xl border border-white/80 bg-white p-4">
              <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-ink-300">
                Stored typed source
              </p>
              <pre className="whitespace-pre-wrap break-words font-mono text-[11px] leading-5 text-ink-600">
                {document.extractedText || "No extracted text is stored."}
              </pre>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between gap-3 border-t border-[#f0f0f0] px-4 py-3">
          <p className="text-[10px] leading-4 text-ink-400">
            This is the file the AI actually read.
          </p>
          <a
            href={fileUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex shrink-0 items-center gap-1 text-[11px] font-semibold text-violet-700 hover:text-violet-900"
          >
            Open <ExternalLink className="h-3 w-3" />
          </a>
        </div>
      </div>

      <div className="rounded-2xl border border-hairline bg-white p-4">
        <div className="flex items-center gap-2">
          <Fingerprint className="h-4 w-4 text-violet-600" />
          <h2 className="text-[13px] font-semibold text-ink-900">Source facts</h2>
        </div>
        <dl className="mt-3.5 space-y-2.5 text-[11.5px]">
          <Fact label="Input type" value={fileTypeLabel(document.fileType)} icon={FileText} />
          <Fact label="File" value={document.fileName} />
          <Fact label="Size" value={formatBytesLabel(document.fileSize)} />
          <Fact label="Extraction" value={extractionMethodLabel(document.extractionMethod)} icon={ScanLine} />
          <Fact label="Language" value={document.language || "Not reported"} />
          {document.pageCount ? <Fact label="Pages" value={String(document.pageCount)} /> : null}
          <Fact
            label="Search index"
            value={
              document.indexStatus === "READY"
                ? "Ready"
                : document.indexStatus === "STALE"
                  ? "Stale — rebuild needed"
                  : document.indexStatus === "FAILED"
                    ? "Failed"
                    : document.indexStatus === "INDEXING"
                      ? "Indexing"
                      : "Pending"
            }
          />
          <Fact label="Updated" value={<TimeAgo value={document.updatedAt} />} />
        </dl>

        <div className="mt-4 border-t border-[#f0f0f0] pt-4">
          <ConfidenceBar score={document.overallConfidence} />
          <p className="mt-2 text-[10px] leading-4 text-ink-400">
            Model-reported self-assessment, not a calibrated probability. Manual corrections are marked
            separately and never disguised as model output.
          </p>
        </div>
      </div>

      <div className="rounded-2xl border border-hairline bg-white p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldAlert className="h-4 w-4 text-amber-600" />
            <h2 className="text-[13px] font-semibold text-ink-900">Uncertainty</h2>
          </div>
          <Badge variant={document.warnings.length > 0 ? "amber" : "green"}>
            {document.warnings.length} warning{document.warnings.length === 1 ? "" : "s"}
          </Badge>
        </div>
        {document.warnings.length === 0 ? (
          <p className="mt-3 text-[11.5px] leading-5 text-ink-500">
            The extractor reported no warnings. That is not a guarantee of accuracy.
          </p>
        ) : (
          <div className="mt-3 space-y-2.5">
            {document.warnings.slice(0, 3).map((warning, index) => (
              <div key={`${warning.message}-${index}`} className="flex items-start gap-2">
                <span
                  className={`mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full ${
                    warning.severity === "critical"
                      ? "bg-rose-500"
                      : warning.severity === "warning"
                        ? "bg-amber-500"
                        : "bg-sky-500"
                  }`}
                />
                <p className="text-[10.5px] leading-4 text-ink-500">{warning.message}</p>
              </div>
            ))}
            {document.warnings.length > 3 && (
              <button
                type="button"
                onClick={onShowExtraction}
                className="text-[10.5px] font-semibold text-violet-700 hover:text-violet-900"
              >
                View all {document.warnings.length} warnings
              </button>
            )}
          </div>
        )}
        {criticalWarnings > 0 && (
          <p className="mt-3 rounded-lg border border-rose-100 bg-rose-50 px-2.5 py-2 text-[10px] leading-4 text-rose-700">
            {criticalWarnings} critical reading issue{criticalWarnings === 1 ? "" : "s"}. Verify these
            before trusting the notes.
          </p>
        )}
      </div>

      <div className="rounded-2xl border border-violet-100 bg-violet-50/50 p-4">
        <div className="flex items-center gap-2">
          <Layers3 className="h-4 w-4 text-violet-600" />
          <h2 className="text-[12px] font-semibold text-ink-900">What is what</h2>
        </div>
        <div className="mt-3 space-y-2.5">
          <div className="flex items-center gap-2">
            <OutputSourceTag source="extracted" />
            <span className="text-[10px] text-ink-500">What the extractor read</span>
          </div>
          <div className="flex items-center gap-2">
            <OutputSourceTag source="ai" />
            <span className="text-[10px] text-ink-500">Notes, quizzes and answers</span>
          </div>
          <div className="flex items-center gap-2">
            <OutputSourceTag source="manual" />
            <span className="text-[10px] text-ink-500">Your corrections</span>
          </div>
        </div>
        <p className="mt-3 flex items-start gap-1.5 text-[10px] leading-4 text-ink-400">
          <Info className="mt-0.5 h-3 w-3 shrink-0" />
          Confidence describes extraction, not whether a generated study answer is correct.
        </p>
        <p className="mt-2 flex items-start gap-1.5 text-[10px] leading-4 text-ink-400">
          <Sparkles className="mt-0.5 h-3 w-3 shrink-0" />
          The embedded retrieval index stores {document.blocks.length} extracted block
          {document.blocks.length === 1 ? "" : "s"} as cited chunks.
        </p>
      </div>
    </div>
  );
}

function Fact({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: ReactNode;
  icon?: typeof FileText;
}) {
  return (
    <div className="flex items-start justify-between gap-3">
      <dt className="inline-flex shrink-0 items-center gap-1.5 text-ink-400">
        {Icon && <Icon className="h-3 w-3" />}
        {label}
      </dt>
      <dd className="min-w-0 break-words text-right font-medium text-ink-700">{value}</dd>
    </div>
  );
}
