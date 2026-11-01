"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  CalendarClock,
  FileText,
  ListChecks,
  Loader2,
  MessagesSquare,
  NotebookPen,
  RefreshCw,
  ScanLine,
  Trash2,
  TriangleAlert,
} from "lucide-react";
import { toast } from "sonner";
import type { DocumentDetail } from "@/lib/documents";
import { stageIndex } from "@/lib/utils";
import { apiFetch, errorMessage } from "@/lib/client/api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Callout } from "@/components/ui/callout";
import { Progress } from "@/components/ui/feedback";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ConfidenceBadge, ModeBadge } from "@/components/mode-badges";
import { FileTypeIcon } from "@/components/file-type-icon";
import { NotesPanel } from "@/components/document/notes-panel";
import { ExtractionPanel } from "@/components/document/extraction-panel";
import { PracticePanel } from "@/components/document/practice-panel";
import { AskPanel } from "@/components/document/ask-panel";
import { SourcePanel } from "@/components/document/source-panel";
import { TimeAgo } from "@/components/time-ago";
import type { DocumentWorkspaceData } from "@/components/document/types";

export function DocumentWorkspace({
  data,
  aiConfigured,
}: {
  data: DocumentWorkspaceData;
  aiConfigured: boolean;
}) {
  const router = useRouter();
  const [document, setDocument] = useState<DocumentDetail>(data.document);
  const [note, setNote] = useState(data.note);
  const [quizzes, setQuizzes] = useState(data.quizzes);
  const [tab, setTab] = useState("notes");
  const [retrying, setRetrying] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const processing = document.status === "PROCESSING" || document.status === "UPLOADED";
  const canRetry =
    document.mode === "LIVE" &&
    aiConfigured &&
    (document.status === "FAILED" || document.status === "UPLOADED");

  useEffect(() => {
    if (!processing) return;
    let cancelled = false;
    const timer = setInterval(async () => {
      try {
        const fresh = await apiFetch<{
          document: DocumentDetail;
          quizzes: Array<{
            id: string;
            title: string;
            difficulty: string;
            questionCount: number;
            mode: string;
            createdAt: string;
          }>;
        }>(`/api/documents/${document.id}`, { cache: "no-store" });
        if (cancelled) return;
        setDocument(fresh.document);
        if (fresh.document.status === "READY" || fresh.document.status === "FAILED") {
          clearInterval(timer);
        }
      } catch {
        // Transient polling failures are ignored; the next tick retries.
      }
    }, 1_500);
    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, [document.id, processing]);

  async function retryProcessing() {
    if (retrying) return;
    setRetrying(true);
    try {
      const response = await apiFetch<{
        result: { status: string; notesGenerated: boolean; error?: string };
      }>(`/api/documents/${document.id}/process`, { method: "POST" });
      const fresh = await apiFetch<{ document: DocumentDetail }>(
        `/api/documents/${document.id}`,
        { cache: "no-store" },
      );
      setDocument(fresh.document);
      if (response.result.status === "READY") {
        toast.success("Processing complete", {
          description: response.result.notesGenerated
            ? "Extraction, search index and notes are ready."
            : "Extraction and search index are ready. Generate notes from the Notes tab.",
        });
      } else {
        toast.error("Processing failed", {
          description: response.result.error ?? "Open the Extracted tab for the stored error.",
        });
        setTab("extracted");
      }
    } catch (caught) {
      const message = errorMessage(caught);
      const fresh = await apiFetch<{ document: DocumentDetail }>(
        `/api/documents/${document.id}`,
        { cache: "no-store" },
      ).catch(() => null);
      if (fresh) setDocument(fresh.document);
      toast.error("Processing failed", { description: message });
    } finally {
      setRetrying(false);
    }
  }

  async function deleteDocument() {
    if (deleting) return;
    setDeleting(true);
    try {
      await apiFetch(`/api/documents/${document.id}`, { method: "DELETE" });
      toast.success("Document deleted", {
        description: "Its extracted blocks, notes, quizzes, attempts, chat history and index were removed.",
      });
      router.push("/library");
      router.refresh();
    } catch (caught) {
      toast.error("Could not delete the document", { description: errorMessage(caught) });
      setDeleting(false);
    }
  }

  const statusBadge =
    document.status === "READY"
      ? { label: "Ready", variant: "green" as const }
      : document.status === "FAILED"
        ? { label: "Failed", variant: "rose" as const }
        : { label: "Processing", variant: "amber" as const };

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center gap-2 text-[11px] text-ink-400">
        <Link
          href="/library"
          className="inline-flex items-center gap-1 rounded-lg px-1.5 py-1 font-semibold text-ink-500 transition hover:bg-white hover:text-violet-700"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Library
        </Link>
        <span className="text-ink-200">/</span>
        <span className="inline-flex items-center gap-1">
          <FileText className="h-3 w-3" />
          {document.fileType === "audio" ? "Audio" : document.fileType === "pdf" ? "PDF" : document.fileType === "text" ? "Typed" : "Handwritten"}
        </span>
      </div>

      <header className="flex flex-col gap-5 pb-6 xl:flex-row xl:items-start xl:justify-between">
        <div className="flex min-w-0 items-start gap-3.5">
          <FileTypeIcon type={document.fileType} className="h-14 w-14 rounded-2xl" />
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant={statusBadge.variant}>{statusBadge.label}</Badge>
              <ModeBadge mode={document.mode} />
              <ConfidenceBadge score={document.overallConfidence} />
            </div>
            <h1 className="mt-2 font-display text-[clamp(1.6rem,2.6vw,2.25rem)] font-semibold leading-[1.14] tracking-[-0.035em] text-ink-950">
              {document.title}
            </h1>
            <p className="mt-1.5 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-[11.5px] text-ink-400">
              <span>{document.fileName}</span>
              <span className="text-ink-200">·</span>
              <span className="inline-flex items-center gap-1">
                <CalendarClock className="h-3 w-3" /> Updated <TimeAgo value={document.updatedAt} />
              </span>
              {document.pageCount ? (
                <>
                  <span className="text-ink-200">·</span>
                  <span>{document.pageCount} pages</span>
                </>
              ) : null}
              <span className="text-ink-200">·</span>
              <span className="inline-flex items-center gap-1">
                <ScanLine className="h-3 w-3" /> {document.extractionMethod ? document.extractionMethod.replace(/_/g, " ") : "extraction pending"}
              </span>
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {canRetry && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={retryProcessing}
              loading={retrying}
            >
              {!retrying && <RefreshCw className="h-3.5 w-3.5" />} Retry processing
            </Button>
          )}
          <Button asChild variant="outline" size="sm">
            <a href={`/api/documents/${document.id}/file`} target="_blank" rel="noreferrer">
              <FileText className="h-3.5 w-3.5" /> Open original
            </a>
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            onClick={() => setDeleteOpen(true)}
            className="h-10 w-10 text-ink-400 hover:bg-rose-50 hover:text-rose-600"
            aria-label="Delete this document"
            title="Delete document"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </header>

      {processing && (
        <Callout variant="info" title={`Processing · ${document.processingStage}`} className="mb-5">
          <div className="flex flex-wrap items-center gap-3">
            <Loader2 className="h-4 w-4 animate-spin text-sky-600" />
            <span className="flex-1">
              The server is working through the real pipeline. This page polls the persisted stage —
              nothing advances on a timer.
            </span>
          </div>
          <Progress
            value={Math.round(((stageIndex(document.processingStage) + 1) / 7) * 100)}
            className="mt-3 h-1.5"
            indicatorClassName="bg-sky-500"
          />
        </Callout>
      )}

      {document.status === "FAILED" && (
        <Callout variant="danger" title="This document failed processing" className="mb-5">
          <p>
            {document.processingError ||
              "The pipeline stopped without a stored reason. Retry processing to capture a fresh error."}
          </p>
          {!canRetry && (
            <p className="mt-1.5 font-medium">
              {document.mode === "DEMO"
                ? "Demo documents cannot be reprocessed. Upload your own material to run the live pipeline."
                : "Add a Gemini key and restart to retry live processing."}
            </p>
          )}
        </Callout>
      )}

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.62fr)_minmax(310px,0.78fr)]">
        <div className="min-w-0">
          <Tabs value={tab} onValueChange={setTab}>
            <TabsList className="w-full flex-wrap justify-start">
              <TabsTrigger value="notes">
                <NotebookPen className="h-4 w-4" /> Notes
                {note ? <Count value={note.content.sections.length} /> : null}
              </TabsTrigger>
              <TabsTrigger value="extracted">
                <ScanLine className="h-4 w-4" /> Extracted
                <Count value={document.blocks.length} />
              </TabsTrigger>
              <TabsTrigger value="practice">
                <ListChecks className="h-4 w-4" /> Practice
                <Count value={quizzes.length} />
              </TabsTrigger>
              <TabsTrigger value="ask">
                <MessagesSquare className="h-4 w-4" /> Ask
                <Count value={data.messages.length} />
              </TabsTrigger>
            </TabsList>

            <TabsContent value="notes">
              <NotesPanel
                document={document}
                note={note}
                aiConfigured={aiConfigured}
                onNote={setNote}
              />
            </TabsContent>

            <TabsContent value="extracted">
              <ExtractionPanel
                document={document}
                aiConfigured={aiConfigured}
                onDocumentChange={setDocument}
              />
            </TabsContent>

            <TabsContent value="practice">
              <PracticePanel
                document={document}
                quizzes={quizzes}
                aiConfigured={aiConfigured}
                onQuizzesChange={setQuizzes}
              />
            </TabsContent>

            <TabsContent value="ask">
              <AskPanel
                key={`${document.id}-${document.indexStatus}`}
                document={document}
                initialMessages={data.messages}
                aiConfigured={aiConfigured}
              />
            </TabsContent>
          </Tabs>

          {(document.indexStatus === "STALE" || document.indexStatus === "FAILED") && tab !== "extracted" && (
            <div className="mt-5 flex flex-col items-start justify-between gap-3 rounded-2xl border border-amber-200 bg-amber-50/80 p-4 sm:flex-row sm:items-center">
              <div className="flex items-start gap-2.5">
                <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
                <div>
                  <p className="text-[12px] font-semibold text-amber-900">The search index needs attention</p>
                  <p className="text-[11px] leading-5 text-amber-800/80">
                    {document.indexStatus === "STALE"
                      ? "A correction changed the extracted source. Rebuild the index so Ask uses the fixed text."
                      : "Answers may be unavailable until the index is rebuilt."}
                  </p>
                </div>
              </div>
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="shrink-0 bg-white"
                onClick={() => setTab("extracted")}
              >
                Fix in Extracted
              </Button>
            </div>
          )}
        </div>

        <aside className="min-w-0 xl:sticky xl:top-24 xl:self-start">
          <SourcePanel document={document} onShowExtraction={() => setTab("extracted")} />
        </aside>
      </div>

      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete this document?</DialogTitle>
            <DialogDescription>
              This permanently removes the original file, extracted blocks, notes, quizzes, attempts,
              chat messages and stored embeddings for <strong>{document.title}</strong>. This cannot be
              undone.
            </DialogDescription>
          </DialogHeader>
          {document.mode === "DEMO" && (
            <p className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-[11px] leading-5 text-amber-800">
              This is a curated demo document. Launching the demo again reseeds it with the original
              curated content.
            </p>
          )}
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline">
                Keep document
              </Button>
            </DialogClose>
            <Button type="button" variant="danger" onClick={deleteDocument} loading={deleting}>
              <Trash2 className="h-4 w-4" /> Delete permanently
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Count({ value }: { value: number }) {
  return (
    <span className="rounded-full bg-[#e8e8ed] px-1.5 py-0.5 font-mono text-[9px] font-semibold text-ink-400">
      {value}
    </span>
  );
}
