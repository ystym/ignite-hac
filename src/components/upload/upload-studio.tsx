"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  AlertCircle,
  ArrowRight,
  AudioLines,
  CheckCircle2,
  Circle,
  ExternalLink,
  FileText,
  Image as ImageIcon,
  Info,
  Loader2,
  ClipboardPaste,
  RefreshCw,
  Sparkles,
  Trash2,
  UploadCloud,
  X,
} from "lucide-react";
import { toast } from "sonner";
import type { DocumentSummary } from "@/lib/documents";
import {
  ACCEPT_ATTRIBUTE,
  fileTypeFromKind,
  formatBytes,
  SAMPLE_CATALOG,
  validateFileMeta,
  type FileKind,
} from "@/lib/file-config";
import { apiFetch, errorMessage } from "@/lib/client/api";
import { cn, STUDY_STAGES, stageIndex } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input, Label, Textarea } from "@/components/ui/input";
import { Progress } from "@/components/ui/feedback";
import { Badge } from "@/components/ui/badge";
import { Callout } from "@/components/ui/callout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ModeBadge } from "@/components/mode-badges";
import { FileTypeIcon } from "@/components/file-type-icon";

type JobStatus = "queued" | "uploading" | "processing" | "ready" | "failed";

type Job = {
  id: string;
  name: string;
  size: number;
  fileType: string;
  previewUrl: string | null;
  file: File | null;
  status: JobStatus;
  progress: number;
  stage: string;
  detail: string;
  documentId: string | null;
  error: string | null;
  notesGenerated: boolean;
  mode: "upload" | "text";
};

type DocResponse = {
  document: { id: string; status: string; processingStage: string; processingError: string | null; title: string };
};

const STAGE_PROGRESS: Record<string, number> = {
  queued: 8,
  reading: 18,
  extracting: 34,
  chunking: 52,
  embedding: 66,
  notes: 82,
  done: 96,
  failed: 100,
};

const DEMO_IDS: Record<string, string> = {
  handwritten: "demo-doc-kinematics",
  syllabus: "demo-doc-dsa",
  audio: "demo-doc-audio",
};

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function newId() {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random()}`;
}

function jobFromFile(file: File, kind: FileKind): Job {
  return {
    id: newId(),
    name: file.name,
    size: file.size,
    fileType: fileTypeFromKind(kind),
    previewUrl: URL.createObjectURL(file),
    file,
    status: "queued",
    progress: 0,
    stage: "queued",
    detail: "Ready to analyze",
    documentId: null,
    error: null,
    notesGenerated: false,
    mode: "upload",
  };
}

export function UploadStudio({
  live,
  demoReason,
}: {
  live: boolean;
  demoReason: string | null;
}) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [rejections, setRejections] = useState<string[]>([]);
  const [dragging, setDragging] = useState(false);
  const [running, setRunning] = useState(false);
  const [sampleLoading, setSampleLoading] = useState<string | null>(null);
  const [textTitle, setTextTitle] = useState("");
  const [textBody, setTextBody] = useState("");
  const [textError, setTextError] = useState<string | null>(null);

  function updateJob(id: string, patch: Partial<Job>) {
    setJobs((current) => current.map((job) => (job.id === id ? { ...job, ...patch } : job)));
  }

  function addFiles(incoming: FileList | File[]) {
    if (!live) {
      setRejections([
        "Live uploads are disabled in Demo Mode. Add GEMINI_API_KEY to .env and restart, or open a curated demo sample.",
      ]);
      return;
    }
    const files = Array.from(incoming);
    if (files.length === 0) return;
    if (jobs.length + files.length > 6) {
      setRejections(["You can queue up to 6 files at a time. Analyze these, then add more."]);
      return;
    }
    const accepted: Job[] = [];
    const problems: string[] = [];
    for (const file of files) {
      const check = validateFileMeta(file);
      if (!check.ok || !check.kind) {
        problems.push(`${file.name}: ${check.error ?? "Unsupported file."}`);
        continue;
      }
      if (jobs.some((job) => job.name === file.name && job.size === file.size)) {
        problems.push(`${file.name}: already in the queue.`);
        continue;
      }
      accepted.push(jobFromFile(file, check.kind));
    }
    setRejections(problems);
    if (accepted.length > 0) setJobs((current) => [...current, ...accepted]);
  }

  async function pollUntilDone(jobId: string, documentId: string, initialTitle?: string) {
    let lastStage = "processing";
    let attempts = 0;
    while (attempts < 320) {
      attempts++;
      try {
        const data = await apiFetch<DocResponse>(`/api/documents/${documentId}`, {
          cache: "no-store",
        });
        const doc = data.document;
        const stage = doc.processingStage || (doc.status === "READY" ? "done" : "queued");
        if (stage !== lastStage || doc.status === "READY" || doc.status === "FAILED") {
          lastStage = stage;
          const config = STUDY_STAGES.find((item) => item.key === stage);
          updateJob(jobId, {
            stage,
            progress: STAGE_PROGRESS[stage] ?? 18,
            detail: config?.detail ?? "Working through the pipeline",
          });
        }
        if (doc.status === "READY") {
          updateJob(jobId, {
            status: "ready",
            progress: 100,
            stage: "done",
            detail: initialTitle ? `Ready · ${doc.title || initialTitle}` : "Ready to study",
            documentId,
            error: null,
          });
          return { ok: true as const };
        }
        if (doc.status === "FAILED") {
          updateJob(jobId, {
            status: "failed",
            progress: 100,
            stage: "failed",
            detail: "Processing failed",
            error: doc.processingError || "The document pipeline failed. Open the document for details.",
            documentId,
          });
          return { ok: false as const, error: doc.processingError ?? "Processing failed." };
        }
      } catch {
        // A transient polling error should not be shown as a processing failure.
      }
      await sleep(1_000);
    }
    updateJob(jobId, {
      status: "failed",
      detail: "Timed out",
      error: "The client stopped waiting after about five minutes. The server may still finish — open the library and refresh.",
      documentId,
    });
    return { ok: false as const, error: "Timed out waiting for processing." };
  }

  async function processExisting(jobId: string, documentId: string, title?: string) {
    updateJob(jobId, {
      status: "processing",
      progress: STAGE_PROGRESS.queued,
      stage: "queued",
      detail: "Server accepted the file",
      error: null,
      documentId,
    });
    let processError: unknown = null;
    const processPromise = apiFetch<{ result: { status: string; notesGenerated: boolean } }>(
      `/api/documents/${documentId}/process`,
      { method: "POST" },
    ).catch((error) => {
      processError = error;
      return null;
    });
    let settled = false;
    void processPromise.finally(() => {
      settled = true;
    });

    const pollPromise = pollUntilDone(jobId, documentId, title);
    const result = await processPromise;
    const polled = await pollPromise;
    await sleep(200);
    const data = await apiFetch<DocResponse>(`/api/documents/${documentId}`, { cache: "no-store" }).catch(
      () => null,
    );

    if (data?.document.status === "READY") {
      updateJob(jobId, {
        status: "ready",
        progress: 100,
        stage: "done",
        detail: result?.result.notesGenerated
          ? "Extraction, index and notes ready"
          : "Extraction and index ready — notes can be generated in the workspace",
        documentId,
        error: null,
        notesGenerated: Boolean(result?.result.notesGenerated),
      });
      toast.success("Analysis complete", {
        description: result?.result.notesGenerated
          ? "Your notes and search index are ready."
          : "Extraction is ready. Generate notes from the workspace.",
      });
      return true;
    }

    const message =
      (processError ? errorMessage(processError) : null) ||
      data?.document.processingError ||
      (!polled.ok ? polled.error : null) ||
      "The document could not be processed.";
    updateJob(jobId, {
      status: "failed",
      progress: 100,
      stage: "failed",
      detail: "Processing failed",
      error: message,
      documentId,
    });
    toast.error("Analysis failed", { description: message });
    return false;
  }

  async function uploadAndProcess(job: Job) {
    if (!job.file) return false;
    updateJob(job.id, {
      status: "uploading",
      progress: 5,
      stage: "queued",
      detail: "Uploading the original securely…",
      error: null,
    });
    try {
      const form = new FormData();
      form.append("file", job.file);
      const uploaded = await apiFetch<{ document: DocumentSummary }>("/api/documents/upload", {
        method: "POST",
        body: form,
      });
      setJobs((current) =>
        current.map((item) =>
          item.id === job.id
            ? {
                ...item,
                documentId: uploaded.document.id,
                name: uploaded.document.fileName || item.name,
              }
            : item,
        ),
      );
      return await processExisting(job.id, uploaded.document.id, uploaded.document.title);
    } catch (error) {
      const message = errorMessage(error);
      updateJob(job.id, {
        status: "failed",
        progress: 100,
        stage: "failed",
        detail: "Upload failed",
        error: message,
      });
      toast.error("Upload failed", { description: message });
      return false;
    }
  }

  async function runQueue() {
    const pending = jobs.filter((job) => job.status === "queued" && job.file);
    if (pending.length === 0 || running) return;
    setRunning(true);
    try {
      for (const job of pending) {
        await uploadAndProcess(job);
      }
      router.refresh();
    } finally {
      setRunning(false);
    }
  }

  async function retryJob(job: Job) {
    if (running) return;
    setRunning(true);
    try {
      if (job.documentId) {
        await processExisting(job.id, job.documentId, job.name);
      } else if (job.file) {
        await uploadAndProcess(job);
      }
      router.refresh();
    } finally {
      setRunning(false);
    }
  }

  function removeJob(job: Job) {
    if (job.status === "processing" || job.status === "uploading") return;
    if (job.previewUrl) URL.revokeObjectURL(job.previewUrl);
    setJobs((current) => current.filter((item) => item.id !== job.id));
  }

  async function loadSample(sampleKey: string) {
    if (running || sampleLoading) return;
    const sample = SAMPLE_CATALOG.find((item) => item.key === sampleKey);
    if (!sample) return;
    setSampleLoading(sampleKey);
    try {
      if (!live) {
        await apiFetch("/api/demo/seed", { method: "POST" });
        const docId = DEMO_IDS[sampleKey];
        toast.success("Curated sample opened", {
          description: "This is authored demo content, not a live model run.",
        });
        router.push(`/documents/${docId}`);
        return;
      }

      const response = await fetch(sample.file);
      if (!response.ok) throw new Error("The bundled sample could not be loaded.");
      const blob = await response.blob();
      const file = new File([blob], sample.fileName, { type: sample.mimeType });
      const check = validateFileMeta(file);
      if (!check.ok || !check.kind) throw new Error(check.error ?? "The sample file is invalid.");
      const job = jobFromFile(file, check.kind);
      setJobs((current) => [...current, job]);
      setRunning(true);
      await uploadAndProcess(job);
      router.refresh();
    } catch (error) {
      toast.error("Could not start the sample", { description: errorMessage(error) });
    } finally {
      setSampleLoading(null);
      setRunning(false);
    }
  }

  async function submitTyped() {
    setTextError(null);
    if (textTitle.trim().length < 2) {
      setTextError("Give this material a short title.");
      return;
    }
    if (textBody.trim().length < 40) {
      setTextError("Paste at least 40 characters of study material.");
      return;
    }
    if (running) return;
    setRunning(true);
    const jobId = newId();
    const job: Job = {
      id: jobId,
      name: `${textTitle.trim()}.txt`,
      size: new Blob([textBody]).size,
      fileType: "text",
      previewUrl: null,
      file: null,
      status: "processing",
      progress: 8,
      stage: "queued",
      detail: "Creating the typed document…",
      documentId: null,
      error: null,
      notesGenerated: false,
      mode: "text",
    };
    setJobs((current) => [...current, job]);
    try {
      const created = await apiFetch<{ document: DocumentSummary }>("/api/documents/text", {
        method: "POST",
        body: { title: textTitle.trim(), text: textBody.trim() },
      });
      setJobs((current) =>
        current.map((item) =>
          item.id === jobId ? { ...item, documentId: created.document.id } : item,
        ),
      );
      setTextTitle("");
      setTextBody("");
      await processExisting(jobId, created.document.id, created.document.title);
      router.refresh();
    } catch (error) {
      const message = errorMessage(error);
      updateJob(jobId, {
        status: "failed",
        progress: 100,
        stage: "failed",
        detail: "Could not create the document",
        error: message,
      });
      toast.error("Typed material failed", { description: message });
    } finally {
      setRunning(false);
    }
  }

  return (
    <div>
      <Callout
        variant={live ? "success" : "warning"}
        title={live ? "Live AI is enabled" : "Demo Mode — live uploads are disabled"}
        className="mb-5"
        action={
          !live ? (
            <div className="flex flex-wrap gap-2">
              <Button asChild size="sm" variant="primary">
                <Link href="/setup">Set up Gemini <ArrowRight className="h-3.5 w-3.5" /></Link>
              </Button>
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="bg-white"
                onClick={() => loadSample("handwritten")}
                loading={sampleLoading === "handwritten"}
              >
                Open a curated sample
              </Button>
            </div>
          ) : undefined
        }
      >
        {live
          ? "Files are validated server-side, stored in data/uploads, then run through Gemini vision/audio, embedding and note generation. API keys stay on the server."
          : demoReason ??
            "Add GEMINI_API_KEY to .env and restart the server to analyze your own material. The curated sample workspace remains fully explorable."}
      </Callout>

      <div className="grid gap-5 xl:grid-cols-[1.5fr_1fr]">
        <div className="space-y-5">
          <Tabs defaultValue="files">
            <TabsList>
              <TabsTrigger value="files">
                <UploadCloud className="h-4 w-4" /> Upload files
              </TabsTrigger>
              <TabsTrigger value="text">
                <ClipboardPaste className="h-4 w-4" /> Paste typed material
              </TabsTrigger>
            </TabsList>

            <TabsContent value="files">
              <div
                onDragOver={(event) => {
                  event.preventDefault();
                  if (live) setDragging(true);
                }}
                onDragLeave={(event) => {
                  event.preventDefault();
                  setDragging(false);
                }}
                onDrop={(event) => {
                  event.preventDefault();
                  setDragging(false);
                  if (live) addFiles(event.dataTransfer.files);
                }}
                className={cn(
                  "relative flex min-h-[285px] flex-col items-center justify-center rounded-2xl border-2 border-dashed px-6 py-10 text-center transition-colors",
                  dragging
                    ? "border-violet-400 bg-violet-50"
                    : live
                      ? "border-slate-300 bg-white hover:border-violet-300 hover:bg-violet-50/30"
                      : "border-slate-200 bg-white/60",
                )}
              >
                <input
                  ref={inputRef}
                  type="file"
                  className="sr-only"
                  accept={ACCEPT_ATTRIBUTE}
                  multiple
                  disabled={!live}
                  onChange={(event) => {
                    if (event.target.files) addFiles(event.target.files);
                    event.target.value = "";
                  }}
                />
                <div className={cn("flex h-16 w-16 items-center justify-center rounded-2xl", live ? "bg-violet-50 text-violet-600" : "bg-slate-100 text-slate-400")}>
                  <UploadCloud className="h-8 w-8" strokeWidth={1.6} />
                </div>
                <h2 className="mt-5 font-display text-xl font-bold text-ink-900">
                  Drop your messy material here
                </h2>
                <p className="mt-1.5 max-w-sm text-[13px] leading-6 text-ink-500">
                  Handwritten photos, scanned PDFs, lecture audio or typed notes. The original is
                  stored and shown next to the extraction.
                </p>
                <div className="mt-5 flex flex-wrap justify-center gap-2">
                  <Button
                    type="button"
                    variant="violet"
                    onClick={() => inputRef.current?.click()}
                    disabled={!live}
                  >
                    <ImageIcon className="h-4 w-4" /> Choose files
                  </Button>
                  {live && (
                    <Button type="button" variant="outline" onClick={() => inputRef.current?.click()}>
                      Browse
                    </Button>
                  )}
                </div>
                {!live && (
                  <p className="mt-3 text-[11px] font-medium text-amber-700">
                    Uploads unlock with a Gemini key. Curated samples are available →
                  </p>
                )}
                <p className="mt-4 max-w-md text-[10px] leading-5 text-ink-300">
                  JPG, PNG, WEBP up to 10 MB · PDF up to 20 MB · MP3, WAV, M4A, OGG, WEBM, FLAC,
                  AAC up to 25 MB. File contents are checked against the extension.
                </p>
              </div>

              {rejections.length > 0 && (
                <div className="mt-3 rounded-xl border border-rose-200 bg-rose-50 p-3.5">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-rose-600" />
                    <div className="flex-1">
                      {rejections.map((message) => (
                        <p key={message} className="text-[12px] leading-5 text-rose-800">{message}</p>
                      ))}
                    </div>
                    <button type="button" onClick={() => setRejections([])} aria-label="Dismiss" className="text-rose-400 hover:text-rose-700">
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              )}

              {jobs.filter((job) => job.mode === "upload").length > 0 && (
                <div className="mt-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="text-[12px] font-bold text-ink-700">
                      Queue · {jobs.filter((job) => job.mode === "upload").length} file{jobs.filter((job) => job.mode === "upload").length === 1 ? "" : "s"}
                    </p>
                    <Button
                      type="button"
                      size="sm"
                      variant="violet"
                      onClick={runQueue}
                      loading={running}
                      disabled={!jobs.some((job) => job.status === "queued")}
                    >
                      <Sparkles className="h-3.5 w-3.5" /> Analyze
                    </Button>
                  </div>
                  {jobs
                    .filter((job) => job.mode === "upload")
                    .map((job) => (
                      <JobCard
                        key={job.id}
                        job={job}
                        onRemove={() => removeJob(job)}
                        onRetry={() => retryJob(job)}
                        busy={running}
                      />
                    ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="text">
              <Card className="p-5 sm:p-6">
                <div className="flex items-start gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-50 text-sky-600">
                    <FileText className="h-5 w-5" />
                  </span>
                  <div>
                    <h2 className="font-display text-lg font-bold text-ink-900">Paste your syllabus or notes</h2>
                    <p className="mt-1 text-[12.5px] leading-6 text-ink-500">
                      Typed input is stored verbatim and labelled as typed. AI notes and retrieval
                      are generated from that exact text.
                    </p>
                  </div>
                </div>
                <div className="mt-5 space-y-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="text-title">Material title</Label>
                    <Input
                      id="text-title"
                      value={textTitle}
                      onChange={(event) => setTextTitle(event.target.value)}
                      placeholder="e.g. Operating Systems — Unit 3"
                      maxLength={160}
                      disabled={!live}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="text-body">Study material</Label>
                      <span className="text-[10px] text-ink-300">{textBody.length.toLocaleString()} / 200,000</span>
                    </div>
                    <Textarea
                      id="text-body"
                      value={textBody}
                      onChange={(event) => setTextBody(event.target.value)}
                      placeholder="Paste module headings, descriptions, formulas, exam notes…"
                      className="min-h-[240px] font-mono text-[12.5px] leading-6"
                      maxLength={200_000}
                      disabled={!live}
                    />
                  </div>
                  {textError && (
                    <p className="flex items-center gap-1.5 text-[12px] text-rose-700">
                      <AlertCircle className="h-3.5 w-3.5" /> {textError}
                    </p>
                  )}
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <p className="text-[11px] text-ink-400">
                      {live ? "Minimum 40 characters. Stored in SQLite." : "Typed input follows the same live-AI requirement."}
                    </p>
                    <Button
                      type="button"
                      variant="violet"
                      onClick={submitTyped}
                      loading={running}
                      disabled={!live}
                    >
                      <Sparkles className="h-4 w-4" /> Analyze pasted text
                    </Button>
                  </div>
                </div>
              </Card>
            </TabsContent>
          </Tabs>

          {jobs.some((job) => job.mode === "text") && (
            <div className="space-y-3">
              <p className="text-[12px] font-bold text-ink-700">Typed material queue</p>
              {jobs
                .filter((job) => job.mode === "text")
                .map((job) => (
                  <JobCard
                    key={job.id}
                    job={job}
                    onRemove={() => removeJob(job)}
                    onRetry={() => retryJob(job)}
                    busy={running}
                  />
                ))}
            </div>
          )}
        </div>

        <aside className="space-y-5">
          <Card className="overflow-hidden">
            <div className="border-b border-slate-100 bg-[linear-gradient(135deg,#F7F4FF,#FFF)] px-5 py-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="font-display text-[15px] font-bold text-ink-900">Bundled samples</h2>
                  <p className="mt-0.5 text-[11px] text-ink-400">
                    {live ? "Run real Gemini analysis on these files." : "Open the labelled curated workspace."}
                  </p>
                </div>
                <Badge variant={live ? "green" : "amber"}>{live ? "Live" : "Demo"}</Badge>
              </div>
            </div>
            <div className="divide-y divide-slate-100">
              {SAMPLE_CATALOG.map((sample) => (
                <div key={sample.key} className="flex items-start gap-3 p-4">
                  <FileTypeIcon type={sample.kind} />
                  <div className="min-w-0 flex-1">
                    <p className="text-[12.5px] font-bold text-ink-800">{sample.title}</p>
                    <p className="mt-0.5 text-[10.5px] leading-4 text-ink-400">{sample.description}</p>
                    <p className="mt-1.5 text-[9.5px] font-semibold uppercase tracking-wider text-ink-300">
                      {sample.pages}
                    </p>
                  </div>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    className="shrink-0"
                    onClick={() => loadSample(sample.key)}
                    loading={sampleLoading === sample.key}
                    disabled={running || (sampleLoading !== null && sampleLoading !== sample.key)}
                  >
                    {live ? "Run" : "Open"}
                  </Button>
                </div>
              ))}
            </div>
          </Card>

          <Card className="p-5">
            <div className="flex items-center gap-2">
              <Info className="h-4 w-4 text-sky-600" />
              <h2 className="text-[13px] font-bold text-ink-900">How processing works</h2>
            </div>
            <ol className="mt-4 space-y-3">
              {STUDY_STAGES.map((stage, index) => (
                <li key={stage.key} className="flex items-start gap-2.5">
                  <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-slate-100 font-mono text-[9px] font-bold text-ink-400">
                    {index + 1}
                  </span>
                  <div>
                    <p className="text-[11.5px] font-semibold text-ink-700">{stage.label}</p>
                    <p className="text-[10px] leading-4 text-ink-400">{stage.detail}</p>
                  </div>
                </li>
              ))}
            </ol>
            <p className="mt-4 rounded-lg bg-slate-50 p-2.5 text-[10px] leading-4 text-ink-400">
              Progress is read from persisted database stages, not a simulated timer. Failed notes or
              indexing remain separately retryable.
            </p>
          </Card>

          <Card className="p-5">
            <div className="flex items-center justify-between">
              <h2 className="text-[13px] font-bold text-ink-900">What gets stored</h2>
              <ModeBadge mode={live ? "LIVE" : "DEMO"} />
            </div>
            <div className="mt-3 space-y-2 text-[11px] leading-5 text-ink-500">
              <p>• Original file in <code className="rounded bg-slate-100 px-1">data/uploads</code></p>
              <p>• Extracted blocks, warnings and confidence</p>
              <p>• Retrieval chunks + embedding vectors</p>
              <p>• Notes, quizzes, attempts and study plans in SQLite</p>
            </div>
            <p className="mt-3 text-[10px] leading-4 text-ink-400">
              No authentication is included in this hackathon build. Do not deploy private material
              to a shared public instance without adding access control.
            </p>
          </Card>
        </aside>
      </div>
    </div>
  );
}

function JobCard({
  job,
  onRemove,
  onRetry,
  busy,
}: {
  job: Job;
  onRemove: () => void;
  onRetry: () => void;
  busy: boolean;
}) {
  const currentIndex = stageIndex(job.stage);
  const processing = job.status === "processing" || job.status === "uploading";
  return (
    <div
      className={cn(
        "rounded-2xl border bg-white p-4 shadow-card transition",
        job.status === "failed" ? "border-rose-200" : job.status === "ready" ? "border-emerald-200" : "border-slate-200/80",
      )}
    >
      <div className="flex items-start gap-3">
        <FileTypeIcon type={job.fileType} />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="truncate text-[12.5px] font-bold text-ink-800">{job.name}</p>
            <span className="text-[10px] text-ink-300">{formatBytes(job.size)}</span>
            <StatusBadge status={job.status} />
          </div>
          <p className="mt-0.5 text-[11px] text-ink-400">{job.detail}</p>
          {processing && (
            <div className="mt-3">
              <Progress value={job.progress} indicatorClassName={job.status === "uploading" ? "bg-sky-500" : undefined} />
              <div className="no-scrollbar mt-2 flex gap-2 overflow-x-auto">
                {STUDY_STAGES.map((stage, index) => {
                  const done = index < currentIndex || job.status === "ready";
                  const active = index === currentIndex && processing;
                  return (
                    <span
                      key={stage.key}
                      className={cn(
                        "inline-flex shrink-0 items-center gap-1 text-[9px] font-semibold",
                        done ? "text-emerald-600" : active ? "text-violet-700" : "text-ink-300",
                      )}
                    >
                      {done ? (
                        <CheckCircle2 className="h-2.5 w-2.5" />
                      ) : active ? (
                        <Loader2 className="h-2.5 w-2.5 animate-spin" />
                      ) : (
                        <Circle className="h-2 w-2" />
                      )}
                      {stage.label}
                    </span>
                  );
                })}
              </div>
            </div>
          )}
          {job.status === "failed" && job.error && (
            <div className="mt-2.5 flex items-start gap-2 rounded-lg border border-rose-100 bg-rose-50 p-2.5">
              <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-rose-500" />
              <p className="text-[11px] leading-5 text-rose-800">{job.error}</p>
            </div>
          )}
          {job.status === "ready" && (
            <div className="mt-2.5 flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1 text-[10.5px] font-semibold text-emerald-700">
                <CheckCircle2 className="h-3.5 w-3.5" /> Pipeline complete
              </span>
              {job.previewUrl && (
                <a
                  href={job.previewUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 text-[10.5px] font-semibold text-ink-500 hover:text-violet-700"
                >
                  <ExternalLink className="h-3 w-3" /> Original
                </a>
              )}
            </div>
          )}
        </div>
        <div className="flex shrink-0 items-center gap-1">
          {job.status === "ready" && job.documentId && (
            <Button asChild size="sm" variant="secondary">
              <Link href={`/documents/${job.documentId}`}>Open <ArrowRight className="h-3 w-3" /></Link>
            </Button>
          )}
          {job.status === "failed" && (job.file || job.documentId) && (
            <Button type="button" size="icon-sm" variant="outline" onClick={onRetry} disabled={busy} title="Retry">
              <RefreshCw className="h-3.5 w-3.5" />
            </Button>
          )}
          {!processing && (
            <button
              type="button"
              onClick={onRemove}
              className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-ink-300 transition hover:bg-rose-50 hover:text-rose-600"
              aria-label={`Remove ${job.name} from the queue`}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: JobStatus }) {
  switch (status) {
    case "ready":
      return <Badge variant="green">Ready</Badge>;
    case "failed":
      return <Badge variant="rose">Failed</Badge>;
    case "processing":
      return <Badge variant="violet">Processing</Badge>;
    case "uploading":
      return <Badge variant="blue">Uploading</Badge>;
    default:
      return <Badge variant="default">Queued</Badge>;
  }
}
