"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowUpRight,
  FileSearch,
  Search,
  SlidersHorizontal,
  Sparkles,
  UploadCloud,
  X,
} from "lucide-react";
import type { DocumentSummary } from "@/lib/documents";
import { cn, formatBytesLabel } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input, Select } from "@/components/ui/input";
import { EmptyState } from "@/components/ui/empty-state";
import { FileTypeIcon, fileTypeLabel } from "@/components/file-type-icon";
import { TimeAgo } from "@/components/time-ago";
import { ConfidenceBadge, ModeBadge } from "@/components/mode-badges";
import { DemoLaunchButton } from "@/components/demo-launch-button";

type LibraryDocument = DocumentSummary & {
  noteCount: number;
  quizCount: number;
  warningCount: number;
};

export function DocumentLibrary({
  documents,
  demoMode,
}: {
  documents: LibraryDocument[];
  demoMode: boolean;
}) {
  const [query, setQuery] = useState("");
  const [type, setType] = useState("all");
  const [mode, setMode] = useState("all");
  const [status, setStatus] = useState("all");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return documents.filter((doc) => {
      if (type !== "all" && doc.fileType !== type) return false;
      if (mode !== "all" && doc.mode !== mode) return false;
      if (status !== "all" && doc.status !== status) return false;
      if (!q) return true;
      return (
        doc.title.toLowerCase().includes(q) ||
        doc.fileName.toLowerCase().includes(q) ||
        (doc.extractionMethod ?? "").toLowerCase().includes(q)
      );
    });
  }, [documents, query, type, mode, status]);

  const hasFilters = query || type !== "all" || mode !== "all" || status !== "all";

  function reset() {
    setQuery("");
    setType("all");
    setMode("all");
    setStatus("all");
  }

  if (documents.length === 0) {
    return (
      <EmptyState
        icon={FileSearch}
        title="Your library is empty"
        description={
          demoMode
            ? "Load the curated demo to explore three fully processed inputs: a handwritten page, a syllabus PDF and a noisy lecture."
            : "Upload a handwritten page, PDF, lecture recording or typed notes to build your library."
        }
        action={
          demoMode ? (
            <DemoLaunchButton label="Load the curated demo" redirectTo="/library" />
          ) : (
            <Button asChild variant="violet">
              <Link href="/upload">Upload material</Link>
            </Button>
          )
        }
      />
    );
  }

  return (
    <div>
      <div className="rounded-2xl border border-hairline bg-white p-3">
        <div className="flex flex-col gap-2.5 lg:flex-row lg:items-center">
          <div className="relative min-w-0 flex-1">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-300" />
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search by title, filename or extraction method…"
              className="border-transparent bg-parchment pl-10 shadow-none focus:bg-white"
              aria-label="Search documents"
            />
          </div>
          <div className="grid grid-cols-1 gap-2 min-[420px]:grid-cols-3 lg:flex">
            <Select value={type} onChange={(event) => setType(event.target.value)} className="min-w-0 lg:w-[132px]" aria-label="Filter by type">
              <option value="all">All types</option>
              <option value="image">Images</option>
              <option value="pdf">PDFs</option>
              <option value="audio">Audio</option>
              <option value="text">Typed text</option>
            </Select>
            <Select value={mode} onChange={(event) => setMode(event.target.value)} className="min-w-0 lg:w-[122px]" aria-label="Filter by mode">
              <option value="all">All modes</option>
              <option value="LIVE">Live AI</option>
              <option value="DEMO">Demo</option>
            </Select>
            <Select value={status} onChange={(event) => setStatus(event.target.value)} className="min-w-0 lg:w-[132px]" aria-label="Filter by status">
              <option value="all">Any status</option>
              <option value="READY">Ready</option>
              <option value="PROCESSING">Processing</option>
              <option value="FAILED">Failed</option>
            </Select>
          </div>
        </div>
        <div className="mt-2.5 flex items-center justify-between px-1">
          <p className="text-[11px] text-ink-400">
            Showing <span className="font-semibold text-ink-600">{filtered.length}</span> of {documents.length} documents
          </p>
          {hasFilters && (
            <button
              type="button"
              onClick={reset}
              className="inline-flex items-center gap-1 text-[11px] font-semibold text-violet-700 hover:text-violet-900"
            >
              <X className="h-3 w-3" /> Clear filters
            </button>
          )}
        </div>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={SlidersHorizontal}
          title="No material matches those filters"
          description="Try a different file type or status. Your documents were not modified."
          action={<Button variant="outline" onClick={reset}>Clear filters</Button>}
          className="mt-5"
        />
      ) : (
        <div className="mt-5 grid min-w-0 gap-4 xl:grid-cols-2">
          {filtered.map((doc) => {
            const statusVariant =
              doc.status === "READY" ? "green" : doc.status === "FAILED" ? "rose" : "amber";
            return (
              <Link
                key={doc.id}
                href={`/documents/${doc.id}`}
                className="group card-lift min-w-0 overflow-hidden rounded-2xl border border-hairline bg-white p-5"
              >
                <div className="flex items-start gap-4">
                  <FileTypeIcon type={doc.fileType} className="h-12 w-12" />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant={statusVariant}>
                        {doc.status === "READY" ? "Ready" : doc.status === "FAILED" ? "Failed" : "Processing"}
                      </Badge>
                      <ModeBadge mode={doc.mode} />
                      {doc.warningCount > 0 && (
                        <Badge variant="amber">
                          {doc.warningCount} warning{doc.warningCount === 1 ? "" : "s"}
                        </Badge>
                      )}
                    </div>
                    <h3 className="mt-2 truncate font-display text-[16px] font-semibold text-ink-900 transition group-hover:text-violet-800">
                      {doc.title}
                    </h3>
                    <p className="mt-0.5 truncate text-[11.5px] text-ink-400">
                      {fileTypeLabel(doc.fileType)} · {doc.fileName} · {formatBytesLabel(doc.fileSize || 0)}
                    </p>

                    <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2">
                      <ConfidenceBadge score={doc.overallConfidence} />
                      <span className="text-[11px] text-ink-400">
                        {doc.noteCount > 0 ? "Notes ready" : "No notes"}
                      </span>
                      <span className="text-[11px] text-ink-400">
                        {doc.quizCount} quiz{doc.quizCount === 1 ? "" : "zes"}
                      </span>
                      <span className="text-[11px] text-ink-300"><TimeAgo value={doc.updatedAt} /></span>
                    </div>
                  </div>
                  <ArrowUpRight className="mt-1 h-4 w-4 shrink-0 text-ink-300 transition group-hover:text-violet-600" />
                </div>
              </Link>
            );
          })}
        </div>
      )}

      {demoMode && (
        <div className="mt-6 flex flex-col items-start justify-between gap-3 rounded-2xl border border-amber-200 bg-amber-50/70 p-4 sm:flex-row sm:items-center">
          <div className="flex items-start gap-2.5">
            <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
            <p className="text-[12px] leading-5 text-amber-900">
              Curated demo documents stay available alongside live material. They are never counted as live model runs.
            </p>
          </div>
          <Button asChild variant="outline" size="sm" className="shrink-0 bg-white">
            <Link href="/upload">
              <UploadCloud className="h-3.5 w-3.5" /> Add material
            </Link>
          </Button>
        </div>
      )}
    </div>
  );
}
