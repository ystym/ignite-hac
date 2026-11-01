"use client";

import { useMemo, useState } from "react";
import {
  AlertCircle,
  CheckCircle2,
  Database,
  FileWarning,
  Info,
  PencilLine,
  RefreshCw,
  RotateCcw,
  ScanLine,
  ShieldAlert,
  TriangleAlert,
  X,
} from "lucide-react";
import { toast } from "sonner";
import type { DocumentDetail } from "@/lib/documents";
import { extractionMethodLabel } from "@/lib/documents";
import type { ExtractionBlock, ExtractionWarning } from "@/lib/schemas";
import { formatSeconds } from "@/lib/utils";
import { apiFetch, errorMessage } from "@/lib/client/api";
import { indexStatusLabel } from "@/lib/client/labels";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Callout } from "@/components/ui/callout";
import { Textarea } from "@/components/ui/input";
import { ConfidenceBadge, OutputSourceTag } from "@/components/mode-badges";
import { MathText } from "@/components/math-text";

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

export function ExtractionPanel({
  document,
  aiConfigured,
  onDocumentChange,
}: {
  document: DocumentDetail;
  aiConfigured: boolean;
  onDocumentChange: (document: DocumentDetail) => void;
}) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const [saving, setSaving] = useState(false);
  const [rebuilding, setRebuilding] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const groups = useMemo(() => {
    const map = new Map<string, ExtractionBlock[]>();
    for (const block of document.blocks) {
      const key =
        block.page != null
          ? `Page ${block.page}`
          : block.startSeconds != null
            ? "Audio timeline"
            : "Extracted content";
      const list = map.get(key) ?? [];
      list.push(block);
      map.set(key, list);
    }
    return [...map.entries()];
  }, [document.blocks]);

  function startCorrection(block: ExtractionBlock) {
    setEditingId(block.id);
    setDraft(block.text);
    setError(null);
  }

  async function saveCorrection(block: ExtractionBlock) {
    if (!draft.trim()) {
      setError("The corrected text cannot be empty. Cancel instead if there is nothing readable.");
      return;
    }
    if (draft.trim() === block.text.trim()) {
      setEditingId(null);
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const response = await apiFetch<{ document: DocumentDetail }>(
        `/api/documents/${document.id}`,
        {
          method: "PATCH",
          body: { blockId: block.id, text: draft.trim() },
        },
      );
      onDocumentChange(response.document);
      setEditingId(null);
      setDraft("");
      toast.success("Correction saved", {
        description: "Marked as human-corrected. Rebuild the index so answers use the fixed text.",
      });
    } catch (caught) {
      const message = errorMessage(caught);
      setError(message);
      toast.error("Could not save the correction", { description: message });
    } finally {
      setSaving(false);
    }
  }

  async function rebuildIndex() {
    if (rebuilding) return;
    setRebuilding(true);
    setError(null);
    try {
      const result = await apiFetch<{ result: { chunkCount: number } }>(
        `/api/documents/${document.id}/reindex`,
        { method: "POST" },
      );
      const fresh = await apiFetch<{ document: DocumentDetail }>(
        `/api/documents/${document.id}`,
        { cache: "no-store" },
      );
      onDocumentChange(fresh.document);
      toast.success("Search index rebuilt", {
        description: `${result.result.chunkCount} passage${result.result.chunkCount === 1 ? "" : "s"} indexed from the current extracted text.`,
      });
    } catch (caught) {
      const message = errorMessage(caught);
      setError(message);
      toast.error("Could not rebuild the index", { description: message });
    } finally {
      setRebuilding(false);
    }
  }

  const canRebuild =
    document.status === "READY" &&
    (document.mode === "DEMO" || aiConfigured) &&
    document.indexStatus !== "INDEXING";

  return (
    <div className="space-y-5">
      {error && (
        <div className="flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-rose-600" />
          <p className="text-[12px] leading-5 text-rose-800">{error}</p>
        </div>
      )}

      {document.status === "FAILED" && (
        <Callout variant="danger" title="Extraction stopped with an error">
          {document.processingError ||
            "The pipeline failed without a stored reason. Retry processing from the document actions."}
        </Callout>
      )}

      {document.indexStatus === "STALE" && (
        <Callout
          variant="warning"
          title="The search index is stale"
          action={
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="bg-white"
              onClick={rebuildIndex}
              loading={rebuilding}
              disabled={!canRebuild}
              title={!canRebuild ? "Reindexing needs a ready source and a Gemini key for live documents." : undefined}
            >
              <RefreshCw className="h-3.5 w-3.5" /> Rebuild index
            </Button>
          }
        >
          A block was corrected after the last index build. Answers and retrieval will keep using the old
          text until you rebuild.
        </Callout>
      )}

      {document.indexStatus === "FAILED" && (
        <Callout
          variant="danger"
          title="The search index failed"
          action={
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="bg-white"
              onClick={rebuildIndex}
              loading={rebuilding}
              disabled={!canRebuild}
            >
              <RefreshCw className="h-3.5 w-3.5" /> Retry index
            </Button>
          }
        >
          {document.indexError ||
            "The extraction succeeded, but embeddings could not be stored. Notes remain readable; reopening the index is a separate retry."}
        </Callout>
      )}

      {document.mode === "DEMO" && (
        <Callout variant="info" title="Curated extraction — inspect and correct it">
          This is authored demo extraction, not a live model run. Manual correction and local reindexing
          stay enabled so the full reliability workflow is visible. AI note and quiz generation remains
          disabled; reseeding the demo restores the curated text.
        </Callout>
      )}

      <div className="rounded-2xl border border-hairline bg-white">
        <div className="flex flex-col gap-3 border-b border-[#f0f0f0] px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="font-display text-[16px] font-semibold text-ink-900">
                What the extractor read
              </h2>
              <Badge variant="default">
                <ScanLine className="h-3 w-3" /> {extractionMethodLabel(document.extractionMethod)}
              </Badge>
              <OutputSourceTag source="extracted" />
            </div>
            <p className="mt-1 text-[11px] leading-5 text-ink-400">
              {document.blocks.length} block{document.blocks.length === 1 ? "" : "s"} ·{" "}
              {document.warnings.length} warning{document.warnings.length === 1 ? "" : "s"} · index{" "}
              {indexStatusLabel(document.indexStatus).toLowerCase()}
              {document.extractionModel ? ` · ${document.extractionModel}` : ""}
            </p>
          </div>
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={rebuildIndex}
            loading={rebuilding}
            disabled={!canRebuild}
            title={
              !canRebuild
                ? "Reindexing needs a ready source and a Gemini key for live documents."
                : "Recompute chunks and embeddings from the current extracted text."
            }
          >
            {!rebuilding && <Database className="h-3.5 w-3.5" />} Rebuild index
          </Button>
        </div>

        {document.warnings.length > 0 && (
          <div className="border-b border-[#f0f0f0] bg-amber-50/40 px-5 py-4">
            <div className="flex items-center gap-2">
              <TriangleAlert className="h-4 w-4 text-amber-600" />
              <h3 className="text-[12px] font-semibold text-ink-900">Extraction warnings</h3>
            </div>
            <div className="mt-3 space-y-2">
              {document.warnings.map((warning, index) => (
                <WarningRow key={`${warning.message}-${index}`} warning={warning} />
              ))}
            </div>
          </div>
        )}

        <div className="space-y-5 p-5">
          {document.blocks.length === 0 && (
            <div className="rounded-xl border border-dashed border-hairline p-8 text-center">
              <FileWarning className="mx-auto h-6 w-6 text-ink-300" />
              <p className="mt-2 text-[12.5px] text-ink-500">
                No extraction blocks are stored. Nothing was invented to fill the space.
              </p>
            </div>
          )}

          {groups.map(([group, blocks]) => (
            <section key={group}>
              <div className="mb-2.5 flex items-center gap-2">
                <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-ink-400">{group}</p>
                <span className="h-px flex-1 bg-[#e8e8ed]" />
                <span className="text-[10px] text-ink-300">{blocks.length} blocks</span>
              </div>
              <div className="space-y-2">
                {blocks.map((block) => {
                  const uncertain = block.uncertain || block.type === "unreadable";
                  const manuallyCorrected = block.note?.startsWith("Manually corrected");
                  const isEditing = editingId === block.id;
                  return (
                    <article
                      key={block.id}
                      className={`rounded-xl border p-3.5 transition ${
                        uncertain
                          ? "border-rose-200 bg-rose-50/40"
                          : manuallyCorrected
                            ? "border-emerald-200 bg-emerald-50/30"
                            : "border-hairline bg-white"
                      }`}
                    >
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge
                          variant={
                            block.type === "formula"
                              ? "violet"
                              : block.type === "unreadable"
                                ? "rose"
                                : "default"
                          }
                          size="sm"
                        >
                          {BLOCK_LABELS[block.type] ?? block.type}
                        </Badge>
                        {block.startSeconds != null && (
                          <span className="font-mono text-[9.5px] text-ink-400">
                            {formatSeconds(block.startSeconds)}
                            {block.endSeconds != null ? `–${formatSeconds(block.endSeconds)}` : ""}
                          </span>
                        )}
                        <ConfidenceBadge score={block.confidence} className="text-[9px]" />
                        {uncertain && (
                          <Badge variant="rose" size="sm">
                            <TriangleAlert className="h-2.5 w-2.5" /> Uncertain
                          </Badge>
                        )}
                        {manuallyCorrected && <OutputSourceTag source="manual" className="text-[9px]" />}
                        <div className="ml-auto">
                          {!isEditing ? (
                            <button
                              type="button"
                              onClick={() => startCorrection(block)}
                              className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-[10px] font-semibold text-violet-700 transition hover:bg-violet-50"
                            >
                              <PencilLine className="h-3 w-3" /> Correct
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => {
                                setEditingId(null);
                                setDraft("");
                              }}
                              className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-[10px] font-semibold text-ink-400 transition hover:bg-[#e8e8ed]"
                            >
                              <X className="h-3 w-3" /> Cancel
                            </button>
                          )}
                        </div>
                      </div>

                      {isEditing ? (
                        <div className="mt-2.5">
                          <Textarea
                            value={draft}
                            onChange={(event) => setDraft(event.target.value)}
                            className="min-h-[92px] font-mono text-[12px] leading-5"
                            aria-label="Corrected block text"
                            autoFocus
                          />
                          <div className="mt-2 flex items-center justify-between gap-3">
                            <p className="text-[10px] leading-4 text-ink-400">
                              Only replace what you can verify. This is marked as human-corrected.
                            </p>
                            <Button
                              type="button"
                              size="sm"
                              variant="violet"
                              onClick={() => saveCorrection(block)}
                              loading={saving}
                            >
                              Save correction
                            </Button>
                          </div>
                        </div>
                      ) : block.type === "formula" ? (
                        <div className="mt-2 overflow-x-auto">
                          <MathText value={block.text} displayMode />
                        </div>
                      ) : (
                        <p
                          className={`mt-2 whitespace-pre-line text-[12.5px] leading-6 ${
                            uncertain ? "text-rose-900" : "text-ink-700"
                          }`}
                        >
                          {block.text}
                        </p>
                      )}

                      {block.note && !isEditing && (
                        <p className="mt-2 flex items-start gap-1.5 rounded-lg bg-parchment px-2.5 py-2 text-[10px] leading-4 text-ink-500">
                          <Info className="mt-0.5 h-3 w-3 shrink-0" />
                          {block.note}
                        </p>
                      )}
                    </article>
                  );
                })}
              </div>
            </section>
          ))}
        </div>

        <div className="flex items-start gap-2 border-t border-[#f0f0f0] bg-parchment/60 px-5 py-3.5">
          <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-ink-300" />
          <p className="text-[10.5px] leading-5 text-ink-400">
            Confidence is model-reported, not calibrated. Corrections set the search index to stale and
            preserve the original warning audit trail above.
          </p>
        </div>
      </div>
    </div>
  );
}

function WarningRow({ warning }: { warning: ExtractionWarning }) {
  const critical = warning.severity === "critical";
  const info = warning.severity === "info";
  return (
    <div
      className={`flex items-start gap-2 rounded-lg border px-3 py-2.5 ${
        critical
          ? "border-rose-200 bg-rose-50"
          : info
            ? "border-sky-200 bg-sky-50"
            : "border-amber-200 bg-amber-50"
      }`}
    >
      {critical ? (
        <ShieldAlert className="mt-0.5 h-3.5 w-3.5 shrink-0 text-rose-600" />
      ) : info ? (
        <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-sky-600" />
      ) : (
        <TriangleAlert className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-600" />
      )}
      <div className="min-w-0 flex-1">
        <p
          className={`text-[11.5px] leading-5 ${
            critical ? "text-rose-900" : info ? "text-sky-900" : "text-amber-900"
          }`}
        >
          {warning.message}
        </p>
        {warning.location && (
          <p className="mt-0.5 font-mono text-[9px] uppercase tracking-wider opacity-60">
            {warning.location}
          </p>
        )}
      </div>
    </div>
  );
}
