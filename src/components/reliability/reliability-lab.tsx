"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  FlaskConical,
  Image as ImageIcon,
  Info,
  Loader2,
  PencilLine,
  Quote,
  ScanLine,
  ShieldAlert,
  Sparkles,
  TriangleAlert,
} from "lucide-react";
import { toast } from "sonner";
import type { ReliabilityRunResult } from "@/lib/schemas";
import { confidenceMeta, cn, percent } from "@/lib/utils";
import { apiFetch, errorMessage } from "@/lib/client/api";
import { PageHeader } from "@/components/ui/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Callout } from "@/components/ui/callout";
import { EmptyState } from "@/components/ui/empty-state";
import { Textarea } from "@/components/ui/input";
import { ConfidenceBadge, ConfidenceBar, ModeBadge } from "@/components/mode-badges";
import { MathText } from "@/components/math-text";
import { TimeAgo } from "@/components/time-ago";
import { DemoLaunchButton } from "@/components/demo-launch-button";

export type StoredRun = {
  id: string;
  mode: string;
  model: string | null;
  humanCorrection: string | null;
  createdAt: string;
  result: ReliabilityRunResult;
};

type Entry =
  | {
      key: string;
      kind: "curated";
      mode: "DEMO";
      model: string;
      createdAt: null;
      humanCorrection: string | null;
      result: ReliabilityRunResult;
    }
  | {
      key: string;
      kind: "stored";
      mode: string;
      model: string | null;
      createdAt: string;
      humanCorrection: string | null;
      storedId: string;
      result: ReliabilityRunResult;
    };

const BLOCK_LABELS: Record<string, string> = {
  heading: "Heading",
  paragraph: "Paragraph",
  list: "List",
  formula: "Formula",
  diagram: "Diagram",
  table: "Table",
  example: "Example",
  unreadable: "Unreadable",
};

export function ReliabilityLab({
  curated,
  storedRuns: initialRuns,
  aiConfigured,
  configuredModel,
  reason,
}: {
  curated: ReliabilityRunResult;
  storedRuns: StoredRun[];
  aiConfigured: boolean;
  configuredModel: string;
  reason: string | null;
}) {
  const [runs, setRuns] = useState<StoredRun[]>(initialRuns);
  const [activeKey, setActiveKey] = useState(
    initialRuns[0] ? `run:${initialRuns[0].id}` : "curated",
  );
  const [running, setRunning] = useState(false);
  const [runError, setRunError] = useState<string | null>(null);

  const entries = useMemo<Entry[]>(
    () => [
      {
        key: "curated",
        kind: "curated",
        mode: "DEMO",
        model: "curated demo (not a live model run)",
        createdAt: null,
        humanCorrection: null,
        result: curated,
      },
      ...runs.map((run) => ({
        key: `run:${run.id}`,
        kind: "stored" as const,
        mode: run.mode,
        model: run.model,
        createdAt: run.createdAt,
        humanCorrection: run.humanCorrection,
        storedId: run.id,
        result: run.result,
      })),
    ],
    [curated, runs],
  );

  const active = entries.find((entry) => entry.key === activeKey) ?? entries[0];

  async function runLive() {
    if (running) return;
    setRunning(true);
    setRunError(null);
    try {
      const response = await apiFetch<{ run: StoredRun }>("/api/reliability/run", {
        method: "POST",
      });
      setRuns((current) => [response.run, ...current]);
      setActiveKey(`run:${response.run.id}`);
      toast.success("Live run captured", {
        description:
          "Stored exactly as the model returned it. Inspect Q7 below to judge whether it stayed honest.",
      });
    } catch (caught) {
      const message = errorMessage(caught);
      setRunError(message);
      toast.error("Live test failed", { description: message });
    } finally {
      setRunning(false);
    }
  }

  function updateCorrection(id: string, correction: string) {
    setRuns((current) =>
      current.map((run) => (run.id === id ? { ...run, humanCorrection: correction } : run)),
    );
  }

  return (
    <div>
      <PageHeader
        eyebrow="Reliability lab"
        title="A test designed to fail honestly."
        description="The fixture below contains a genuinely ambiguous handwritten exponent. The correct behaviour is to mark it unreadable and explain why — not to produce a confident digit. This page keeps the curated reference and any real model runs separate and clearly labelled."
        actions={
          <Button
            type="button"
            variant="violet"
            onClick={runLive}
            loading={running}
            disabled={!aiConfigured}
            title={
              aiConfigured
                ? "Send the fixed fixture to Gemini and store its actual output"
                : "Add GEMINI_API_KEY to run the live test"
            }
          >
            {!running && <FlaskConical className="h-4 w-4" />}
            {running ? "Running live test…" : "Run live test"}
          </Button>
        }
      />

      <div className="grid min-w-0 gap-5 lg:grid-cols-[minmax(0,0.92fr)_minmax(0,1.08fr)]">
        <div className="overflow-hidden rounded-2xl border border-hairline bg-white">
          <div className="flex items-center justify-between border-b border-[#f0f0f0] px-5 py-3.5">
            <div className="flex items-center gap-2">
              <ImageIcon className="h-4 w-4 text-violet-600" />
              <h2 className="text-[13px] font-semibold text-ink-900">The ambiguous fixture</h2>
            </div>
            <Badge variant="amber">Fixed test input</Badge>
          </div>
          <div className="bg-parchment p-4">
            {/* Static fixture served from public/samples. */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/samples/ambiguous-handwriting.png"
              alt="Handwritten calculus practice with a deliberately smudged exponent in question 7"
              className="w-full rounded-xl border border-white/80 bg-white object-contain"
            />
          </div>
          <div className="space-y-3 p-5">
            <div className="flex items-start gap-2 rounded-lg border border-emerald-100 bg-emerald-50 p-2.5">
              <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-600" />
              <p className="text-[11px] leading-5 text-emerald-900">
                <strong>Q6 is readable:</strong> ∫ x² dx = x³/3 + C. A correct system should transcribe it
                confidently.
              </p>
            </div>
            <div className="flex items-start gap-2 rounded-lg border border-rose-200 bg-rose-50 p-2.5">
              <ShieldAlert className="mt-0.5 h-3.5 w-3.5 shrink-0 text-rose-600" />
              <p className="text-[11px] leading-5 text-rose-900">
                <strong>Q7 is not:</strong> the exponent is smudged into the integral sign. x², x³ and x⁷
                are all visually plausible. Any definite exponent is invented.
              </p>
            </div>
            <div className="flex items-start gap-2 text-[10.5px] leading-5 text-ink-500">
              <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-ink-300" />
              The fixture is deliberately constructed, not cherry-picked after a failure. There is no
              hidden ground-truth digit to score against — the test is whether uncertainty is admitted.
            </div>
          </div>
        </div>

        <div className="flex min-w-0 flex-col gap-5">
          <div className="rounded-2xl border border-hairline bg-white p-5 sm:p-6">
            <div className="flex items-center gap-2">
              <FlaskConical className="h-[18px] w-[18px] text-violet-600" />
              <h2 className="font-display text-[17px] font-semibold text-ink-900">Run the live experiment</h2>
            </div>
            <p className="mt-2 text-[12px] leading-6 text-ink-500">
              The button sends this exact image to Gemini with the production extraction prompt. The
              returned blocks, confidence values and warnings are stored without cosmetic edits. A model
              that guesses confidently will be shown guessing.
            </p>

            <div className="mt-4 grid gap-2 sm:grid-cols-2">
              <div className="rounded-xl border border-[#f0f0f0] bg-parchment p-3">
                <p className="text-[9px] font-semibold uppercase tracking-wider text-ink-400">AI status</p>
                <div className="mt-1 flex items-center gap-1.5">
                  <span
                    className={cn(
                      "h-1.5 w-1.5 rounded-full",
                      aiConfigured ? "animate-pulse-soft bg-emerald-500" : "bg-amber-500",
                    )}
                  />
                  <p className="text-[11px] font-semibold text-ink-800">
                    {aiConfigured ? "Live AI configured" : "Demo mode"}
                  </p>
                </div>
                <p className="mt-0.5 font-mono text-[9px] text-ink-400">
                  {aiConfigured ? configuredModel : "no API key"}
                </p>
              </div>
              <div className="rounded-xl border border-[#f0f0f0] bg-parchment p-3">
                <p className="text-[9px] font-semibold uppercase tracking-wider text-ink-400">Stored runs</p>
                <p className="mt-1 font-display text-lg font-semibold text-ink-900">{runs.length}</p>
                <p className="text-[9px] text-ink-400">Live and seeded runs combined</p>
              </div>
            </div>

            {!aiConfigured && (
              <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-3">
                <p className="flex items-start gap-1.5 text-[11px] leading-5 text-amber-900">
                  <TriangleAlert className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-600" />
                  {reason ??
                    "Add GEMINI_API_KEY to run the live test. The curated reference below remains available and is clearly labelled as authored sample output."}
                </p>
              </div>
            )}

            {runError && (
              <div className="mt-4 flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-rose-600" />
                <p className="text-[11.5px] leading-5 text-rose-800">{runError}</p>
              </div>
            )}

            <Button
              type="button"
              variant="primary"
              size="sm"
              className="mt-4"
              onClick={runLive}
              loading={running}
              disabled={!aiConfigured}
            >
              {!running && <Sparkles className="h-3.5 w-3.5" />}
              {running ? "Waiting for Gemini…" : "Run the fixed test"}
            </Button>
          </div>

          <div className="rounded-2xl border border-violet-100 bg-violet-50/50 p-5">
            <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-violet-700">
              What counts as a pass?
            </p>
            <ul className="mt-2.5 space-y-2">
              {[
                "Q7 is marked unreadable or explicitly uncertain.",
                "The explanation names the smudged exponent, not a plausible guess.",
                "The warning is preserved instead of silently removed.",
                "No revision note claims Q7's integral has a confirmed answer.",
              ].map((item) => (
                <li key={item} className="flex items-start gap-2 text-[11px] leading-5 text-ink-600">
                  <CheckCircle2 className="mt-0.5 h-3 w-3 shrink-0 text-violet-500" />
                  {item}
                </li>
              ))}
            </ul>
            <p className="mt-3 text-[10px] leading-4 text-ink-400">
              Even a failed run is useful: it is stored and shown unchanged, with no accuracy percentage
              claimed anywhere.
            </p>
          </div>
        </div>
      </div>

      <section className="mt-8">
        <div className="mb-3 flex flex-col justify-between gap-2 sm:flex-row sm:items-end">
          <div>
            <h2 className="font-display text-xl font-semibold text-ink-900">Inspect the reports</h2>
            <p className="mt-0.5 text-[11.5px] text-ink-400">
              The curated reference is always available. Stored runs appear after a live test or the
              curated demo seed.
            </p>
          </div>
          {runs.length === 0 && (
            <DemoLaunchButton
              label="Seed the curated demo run"
              redirectTo="/reliability"
              variant="outline"
              size="sm"
              showIcon={false}
            />
          )}
        </div>

        <div className="no-scrollbar mb-4 flex gap-2 overflow-x-auto">
          {entries.map((entry) => {
            const selected = entry.key === active.key;
            return (
              <button
                key={entry.key}
                type="button"
                onClick={() => setActiveKey(entry.key)}
                className={cn(
                  "shrink-0 rounded-xl border px-3.5 py-2 text-left transition",
                  selected
                    ? "border-violet-300 bg-violet-50"
                    : "border-hairline bg-white hover:border-slate-300",
                )}
                aria-pressed={selected}
              >
                <p className={cn("text-[11px] font-semibold", selected ? "text-violet-900" : "text-ink-700")}>
                  {entry.kind === "curated"
                    ? "Curated reference"
                    : entry.mode === "LIVE"
                      ? "Live run"
                      : "Curated run"}
                </p>
                <p className="text-[9px] text-ink-400">
                  {entry.kind === "curated"
                    ? "Authored sample · not a model run"
                    : entry.createdAt
                      ? <><TimeAgo value={entry.createdAt} /> · {entry.model ?? "model not recorded"}</>
                      : "Stored run"}
                </p>
              </button>
            );
          })}
        </div>

        <ReportView
          key={active.key}
          entry={active}
          onCorrection={updateCorrection}
        />
      </section>

      {runs.length > 0 && (
        <section className="mt-6 rounded-2xl border border-hairline bg-white">
          <div className="flex items-center justify-between border-b border-[#f0f0f0] px-5 py-4">
            <div>
              <h2 className="font-display text-[15px] font-semibold text-ink-900">Run history</h2>
              <p className="mt-0.5 text-[10.5px] text-ink-400">
                Real stored outputs, kept separate from the authored reference.
              </p>
            </div>
            <Badge variant="default">{runs.length} run{runs.length === 1 ? "" : "s"}</Badge>
          </div>
          <div className="divide-y divide-[#f0f0f0]">
            {runs.map((run) => (
              <button
                key={run.id}
                type="button"
                onClick={() => setActiveKey(`run:${run.id}`)}
                className="flex w-full items-center gap-2 px-4 py-3 text-left transition hover:bg-parchment sm:gap-3 sm:px-5"
              >
                <ModeBadge mode={run.mode} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[11.5px] font-semibold text-ink-800">
                    {run.result.title}
                  </p>
                  <p className="text-[9.5px] text-ink-400">
                    {run.model ?? "model not recorded"} · <TimeAgo value={run.createdAt} />
                  </p>
                </div>
                <ConfidenceBadge score={run.result.overallConfidence} showValue={false} className="text-[9px]" />
                {run.humanCorrection ? (
                  <Badge variant="green" size="sm" className="hidden sm:inline-flex">Corrected</Badge>
                ) : (
                  <Badge variant="default" size="sm" className="hidden sm:inline-flex">Unreviewed</Badge>
                )}
                <ArrowRight className="h-3.5 w-3.5 shrink-0 text-ink-300" />
              </button>
            ))}
          </div>
        </section>
      )}

      <div className="mt-6 flex flex-col items-start justify-between gap-3 rounded-2xl border border-hairline bg-white p-4 sm:flex-row sm:items-center">
        <div className="flex items-start gap-2.5">
          <Info className="mt-0.5 h-4 w-4 shrink-0 text-ink-300" />
          <p className="text-[10.5px] leading-5 text-ink-400">
            A single fixture is a demonstration of failure modes, not a benchmark. No accuracy,
            precision or reliability percentage is calculated from it. Confidence values are
            model-reported, not calibrated.
          </p>
        </div>
        <Button asChild variant="ghost" size="sm" className="shrink-0">
          <Link href="/setup">
            Setup &amp; limits <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </Button>
      </div>
    </div>
  );
}

function ReportView({
  entry,
  onCorrection,
}: {
  entry: Entry;
  onCorrection: (id: string, correction: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(entry.humanCorrection ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const result = entry.result;
  const meta = confidenceMeta(result.overallConfidence);

  async function save() {
    if (entry.kind !== "stored") return;
    if (draft.trim().length < 10) {
      setError("Write at least 10 characters describing or recording the human correction.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const response = await apiFetch<{ humanCorrection: string }>(
        `/api/reliability/${entry.storedId}/correction`,
        { method: "POST", body: { correction: draft.trim() } },
      );
      onCorrection(entry.storedId, response.humanCorrection);
      setEditing(false);
      toast.success("Human correction recorded", {
        description: "Stored alongside the model output. The original run is unchanged.",
      });
    } catch (caught) {
      const message = errorMessage(caught);
      setError(message);
      toast.error("Could not save the correction", { description: message });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-hairline bg-white">
      <div className="border-b border-[#f0f0f0] bg-parchment p-5 sm:p-6">
        <div className="flex flex-wrap items-center gap-2">
          {entry.kind === "curated" ? (
            <Badge variant="amber" title="Authored sample output, not produced by a live model run.">
              <Quote className="h-3 w-3" /> Curated reference report
            </Badge>
          ) : (
            <ModeBadge mode={entry.mode} />
          )}
          <ConfidenceBadge score={result.overallConfidence} />
          <Badge variant="default">{result.detectedLanguage}</Badge>
          {entry.kind === "stored" && entry.createdAt && (
            <span className="text-[10px] text-ink-400">
              Captured <TimeAgo value={entry.createdAt} />
            </span>
          )}
          {result.warnings.some((warning) => warning.severity === "critical") && (
            <Badge variant="rose">
              <TriangleAlert className="h-3 w-3" /> Critical warning
            </Badge>
          )}
        </div>
        <h2 className="mt-3 font-display text-[20px] font-semibold tracking-[-0.025em] text-ink-950">
          {result.title}
        </h2>
        <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[10.5px] text-ink-400">
          <span className="font-mono">{entry.model ?? "model not recorded"}</span>
          <span className="text-ink-200">·</span>
          <span>
            {entry.kind === "curated"
              ? "Authored sample, not a live run"
              : entry.mode === "LIVE"
                ? "Actual model output"
                : "Seeded curated output"}
          </span>
        </div>
        <div className="mt-4 max-w-sm">
          <ConfidenceBar score={result.overallConfidence} />
          <p className="mt-1 text-[9.5px] leading-4 text-ink-400">
            Model-reported confidence. The low value here is appropriate: the source itself is
            ambiguous. It is not a calibrated probability.
          </p>
        </div>
      </div>

      <div className="space-y-5 p-5 sm:p-6">
        {result.modelNote && (
          <div
            className={cn(
              "rounded-xl border p-3.5",
              entry.kind === "curated"
                ? "border-amber-200 bg-amber-50"
                : "border-sky-100 bg-sky-50/60",
            )}
          >
            <p className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.13em] text-ink-500">
              <Info className="h-3 w-3" /> Model note
            </p>
            <p className="mt-1 text-[11.5px] leading-5 text-ink-600">{result.modelNote}</p>
          </div>
        )}

        {result.warnings.length > 0 && (
          <div>
            <p className="text-[9.5px] font-semibold uppercase tracking-[0.14em] text-ink-400">
              Warnings
            </p>
            <div className="mt-2 space-y-2">
              {result.warnings.map((warning, index) => (
                <div
                  key={`${warning.message}-${index}`}
                  className={cn(
                    "flex items-start gap-2 rounded-lg border p-2.5",
                    warning.severity === "critical"
                      ? "border-rose-200 bg-rose-50"
                      : warning.severity === "info"
                        ? "border-sky-200 bg-sky-50"
                        : "border-amber-200 bg-amber-50",
                  )}
                >
                  {warning.severity === "critical" ? (
                    <ShieldAlert className="mt-0.5 h-3.5 w-3.5 shrink-0 text-rose-600" />
                  ) : (
                    <TriangleAlert className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-600" />
                  )}
                  <div>
                    <p className="text-[11px] leading-5 text-ink-700">{warning.message}</p>
                    {warning.location && (
                      <p className="mt-0.5 font-mono text-[8.5px] uppercase tracking-wider text-ink-400">
                        {warning.location}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div>
          <p className="text-[9.5px] font-semibold uppercase tracking-[0.14em] text-ink-400">
            Extracted blocks
          </p>
          <div className="mt-2 space-y-2">
            {result.blocks.map((block) => {
              const uncertain = block.uncertain || block.type === "unreadable";
              return (
                <div
                  key={block.id}
                  className={cn(
                    "rounded-xl border p-3",
                    uncertain ? "border-rose-200 bg-rose-50/50" : "border-hairline bg-white",
                  )}
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant={uncertain ? "rose" : block.type === "formula" ? "violet" : "default"} size="sm">
                      {BLOCK_LABELS[block.type] ?? block.type}
                    </Badge>
                    <ConfidenceBadge score={block.confidence} className="text-[9px]" />
                    {uncertain && (
                      <Badge variant="rose" size="sm">
                        <TriangleAlert className="h-2.5 w-2.5" /> Not guessed
                      </Badge>
                    )}
                    {block.page != null && (
                      <span className="font-mono text-[9px] text-ink-400">Page {block.page}</span>
                    )}
                  </div>
                  {block.type === "formula" || block.type === "unreadable" ? (
                    <div className="mt-2 overflow-x-auto">
                      <MathText value={block.text} displayMode />
                    </div>
                  ) : (
                    <p className={cn("mt-2 text-[12px] leading-6", uncertain ? "text-rose-900" : "text-ink-700")}>
                      {block.text}
                    </p>
                  )}
                  {block.note && (
                    <p className="mt-2 rounded-lg bg-white/70 px-2.5 py-1.5 text-[10px] leading-4 text-ink-500">
                      {block.note}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {error && (
          <div className="flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-rose-600" />
            <p className="text-[11.5px] leading-5 text-rose-800">{error}</p>
          </div>
        )}

        {entry.kind === "stored" ? (
          <div className="rounded-xl border border-hairline bg-parchment/60 p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="inline-flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.13em] text-ink-500">
                <PencilLine className="h-3 w-3" /> Human review
              </p>
              {entry.humanCorrection && !editing && (
                <Button type="button" size="sm" variant="outline" onClick={() => setEditing(true)}>
                  Edit correction
                </Button>
              )}
            </div>

            {entry.humanCorrection && !editing ? (
              <div className="mt-2 flex items-start gap-2 rounded-lg border border-emerald-200 bg-emerald-50 p-3">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                <div>
                  <p className="text-[9.5px] font-semibold uppercase tracking-wider text-emerald-700">
                    Human-corrected record
                  </p>
                  <p className="mt-1 text-[11.5px] leading-5 text-ink-600">
                    {entry.humanCorrection}
                  </p>
                </div>
              </div>
            ) : editing || !entry.humanCorrection ? (
              <div className="mt-2">
                <Textarea
                  value={draft}
                  onChange={(event) => setDraft(event.target.value)}
                  placeholder="Record what the unreadable part needs — or the correction a human supplied. Do not invent a value."
                  className="min-h-[96px] text-[12px] leading-5"
                  maxLength={3_000}
                  disabled={saving}
                />
                <div className="mt-2 flex items-center justify-between gap-3">
                  <p className="text-[9.5px] leading-4 text-ink-400">
                    This is stored next to the original output, not used to overwrite it.
                  </p>
                  <div className="flex gap-2">
                    {editing && (
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          setEditing(false);
                          setDraft(entry.humanCorrection ?? "");
                          setError(null);
                        }}
                        disabled={saving}
                      >
                        Cancel
                      </Button>
                    )}
                    <Button type="button" size="sm" variant="violet" onClick={save} loading={saving}>
                      Save correction
                    </Button>
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        ) : (
          <Callout variant="warning" title="This reference is not a stored model run">
            It exists to show the desired failure-handling shape. Launch the curated demo to persist a
            run with a sample human correction, or run the live test to capture a real model output.
          </Callout>
        )}
      </div>

      <div className="flex items-start gap-2 border-t border-[#f0f0f0] bg-parchment/60 px-5 py-3">
        <ScanLine className="mt-0.5 h-3.5 w-3.5 shrink-0 text-ink-300" />
        <p className="text-[9.5px] leading-4 text-ink-400">
          Overall confidence {percent(result.overallConfidence)} is the model&apos;s own{" "}
          {meta.label.toLowerCase()} self-assessment. It is shown for inspection, not treated as proof
          of correctness.
        </p>
      </div>
    </div>
  );
}
