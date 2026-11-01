"use client";

import { useState } from "react";
import {
  AlertCircle,
  BookOpenCheck,
  ClipboardList,
  FlaskConical,
  Languages,
  Lightbulb,
  ListChecks,
  NotebookPen,
  RefreshCw,
  Sparkles,
  TriangleAlert,
} from "lucide-react";
import { toast } from "sonner";
import type { DocumentDetail } from "@/lib/documents";
import type { NotesContent } from "@/lib/schemas";
import { apiFetch, errorMessage } from "@/lib/client/api";
import { languageLabel } from "@/lib/client/labels";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Callout } from "@/components/ui/callout";
import { EmptyState } from "@/components/ui/empty-state";
import { Select } from "@/components/ui/input";
import { MathText } from "@/components/math-text";
import { ModeBadge, OutputSourceTag } from "@/components/mode-badges";
import { TimeAgo } from "@/components/time-ago";
import type { NoteRecord } from "@/components/document/types";

type NoteResponse = {
  note: {
    id: string;
    title: string;
    language: string;
    mode: string;
    model: string | null;
    content: NotesContent;
  };
};

export function NotesPanel({
  document,
  note,
  aiConfigured,
  onNote,
}: {
  document: DocumentDetail;
  note: NoteRecord | null;
  aiConfigured: boolean;
  onNote: (note: NoteRecord) => void;
}) {
  const [language, setLanguage] = useState(note?.language === "hinglish" ? "hinglish" : "simple_en");
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isDemoDocument = document.mode === "DEMO";
  const canGenerate = aiConfigured && !isDemoDocument && document.status === "READY";

  async function generate() {
    if (generating) return;
    setGenerating(true);
    setError(null);
    try {
      const response = await apiFetch<NoteResponse>(`/api/documents/${document.id}/notes`, {
        method: "POST",
        body: { language },
      });
      onNote({
        ...response.note,
        updatedAt: new Date().toISOString(),
      });
      toast.success(note ? "Notes regenerated" : "Notes generated", {
        description: `Grounded in the extracted source, in ${languageLabel(response.note.language)}.`,
      });
    } catch (caught) {
      const message = errorMessage(caught);
      setError(message);
      toast.error("Could not generate notes", { description: message });
    } finally {
      setGenerating(false);
    }
  }

  const controls = (
    <div className="flex flex-wrap items-center gap-2">
      <div className="relative">
        <Languages className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-ink-400" />
        <Select
          value={language}
          onChange={(event) => setLanguage(event.target.value)}
          className="h-9 w-[158px] pl-8 text-[12px]"
          aria-label="Note language"
          disabled={generating}
        >
          <option value="simple_en">Simple English</option>
          <option value="hinglish">Hinglish</option>
        </Select>
      </div>
      <Button
        type="button"
        size="sm"
        variant="violet"
        onClick={generate}
        loading={generating}
        disabled={!canGenerate}
        title={
          !aiConfigured
            ? "Add GEMINI_API_KEY to generate live notes"
            : isDemoDocument
              ? "Curated demo documents are read-only for AI generation"
              : document.status !== "READY"
                ? "Wait for extraction to finish"
                : undefined
        }
      >
        {!generating && (note ? <RefreshCw className="h-3.5 w-3.5" /> : <Sparkles className="h-3.5 w-3.5" />)}
        {note ? "Regenerate" : "Generate notes"}
      </Button>
    </div>
  );

  if (!note) {
    return (
      <div className="space-y-5">
        {error && <ErrorLine message={error} />}
        {isDemoDocument ? (
          <Callout variant="warning" title="No curated note is attached to this demo document">
            Curated demo notes ship with the seeded samples. This document was created in the workspace
            and cannot be generated from in demo mode. Add a Gemini API key, then generate live notes
            from its extracted source.
          </Callout>
        ) : !aiConfigured ? (
          <Callout variant="warning" title="Notes generation needs a Gemini key">
            The extracted source is ready, but generating notes requires live AI. Add{" "}
            <code className="rounded bg-white/70 px-1">GEMINI_API_KEY</code> to{" "}
            <code className="rounded bg-white/70 px-1">.env</code>, restart the server, then return here.
          </Callout>
        ) : null}

        <EmptyState
          icon={NotebookPen}
          title="No structured notes yet"
          description={
            document.status === "READY"
              ? "Turn the extracted blocks into topic-wise notes with definitions, formulas, examples and exam tips. The source stays visible next to every generation."
              : "Notes become available once extraction finishes. Nothing is generated from a failed or empty source."
          }
          action={
            canGenerate ? (
              controls
            ) : (
              <span className="text-[11px] text-ink-400">
                {isDemoDocument
                  ? "Demo documents are read-only for AI generation."
                  : !aiConfigured
                    ? "Demo Mode — add a Gemini key to unlock."
                    : "Waiting for a ready source."}
              </span>
            )
          }
        />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {error && <ErrorLine message={error} />}

      <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-card">
        <div className="border-b border-slate-100 bg-[linear-gradient(135deg,#F8F5FF,#FFFFFF)] p-5 sm:p-6">
          <div className="flex flex-wrap items-center gap-2">
            <OutputSourceTag source="ai" />
            <ModeBadge mode={note.mode} />
            <Badge variant="default">{languageLabel(note.language)}</Badge>
            {note.model && (
              <span className="font-mono text-[10px] text-ink-300">{note.model}</span>
            )}
          </div>
          <h2 className="mt-3 font-display text-2xl font-extrabold tracking-[-0.03em] text-ink-950">
            {note.content.title}
          </h2>
          <p className="mt-2.5 max-w-3xl text-[13.5px] leading-6 text-ink-500">
            {note.content.overview}
          </p>
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
            <p className="text-[10.5px] text-ink-400">
              Updated <TimeAgo value={note.updatedAt} /> · grounded in the extracted source, not the original
              image directly.
            </p>
            {controls}
          </div>
          {isDemoDocument && (
            <p className="mt-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-[10.5px] leading-5 text-amber-800">
              Curated demo note: authored sample output, not a live Gemini run. Upload your own material
              to generate notes in simple English or Hinglish.
            </p>
          )}
          {!isDemoDocument && !aiConfigured && (
            <p className="mt-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-[10.5px] leading-5 text-amber-800">
              This note was generated earlier. Regeneration is disabled until a Gemini key is added.
            </p>
          )}
        </div>

        <div className="space-y-6 p-5 sm:p-6">
          {note.content.sections.map((section, index) => (
            <section key={`${section.heading}-${index}`} className="scroll-mt-6">
              <div className="flex items-start gap-3">
                <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-violet-50 font-mono text-[11px] font-bold text-violet-700">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <div className="min-w-0 flex-1">
                  <h3 className="font-display text-[17px] font-bold leading-snug text-ink-900">
                    {section.heading}
                  </h3>
                  <p className="mt-2 whitespace-pre-line text-[13.5px] leading-6 text-ink-600">
                    {section.explanation}
                  </p>

                  {section.keyPoints.length > 0 && (
                    <div className="mt-3 rounded-xl border border-slate-100 bg-slate-50/60 p-3.5">
                      <p className="mb-1.5 text-[10px] font-bold uppercase tracking-[0.13em] text-ink-400">
                        Key points
                      </p>
                      <ul className="space-y-1.5">
                        {section.keyPoints.map((point) => (
                          <li key={point} className="flex items-start gap-2 text-[12.5px] leading-5 text-ink-600">
                            <span className="mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full bg-violet-400" />
                            {point}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {section.definitions.length > 0 && (
                    <div className="mt-3 grid gap-2 sm:grid-cols-2">
                      {section.definitions.map((definition) => (
                        <div key={definition.term} className="rounded-xl border border-slate-100 p-3">
                          <p className="text-[11px] font-bold text-ink-900">{definition.term}</p>
                          <p className="mt-1 text-[11.5px] leading-5 text-ink-500">{definition.definition}</p>
                        </div>
                      ))}
                    </div>
                  )}

                  {section.formulas.length > 0 && (
                    <div className="mt-3 space-y-2">
                      {section.formulas.map((formula, formulaIndex) => (
                        <div key={`${formula.formula}-${formulaIndex}`} className="rounded-xl border border-violet-100 bg-violet-50/50 p-3.5">
                          <MathText value={formula.formula} displayMode className="text-ink-900" />
                          <p className="mt-2 text-[11px] leading-5 text-ink-500">{formula.explanation}</p>
                        </div>
                      ))}
                    </div>
                  )}

                  {section.examples.length > 0 && (
                    <div className="mt-3 rounded-xl border border-sky-100 bg-sky-50/60 p-3.5">
                      <p className="mb-1.5 inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.13em] text-sky-700">
                        <FlaskConical className="h-3 w-3" /> Worked example
                      </p>
                      {section.examples.map((example, exampleIndex) => (
                        <p key={exampleIndex} className="mt-1 text-[12px] leading-6 text-ink-600">
                          {example}
                        </p>
                      ))}
                    </div>
                  )}

                  {section.examTips.length > 0 && (
                    <div className="mt-3 rounded-xl border border-amber-100 bg-amber-50/60 p-3.5">
                      <p className="mb-1.5 inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.13em] text-amber-700">
                        <Lightbulb className="h-3 w-3" /> Exam tips
                      </p>
                      <ul className="space-y-1.5">
                        {section.examTips.map((tip) => (
                          <li key={tip} className="flex items-start gap-2 text-[12px] leading-5 text-ink-600">
                            <span className="mt-[7px] h-1 w-1 shrink-0 rounded-full bg-amber-500" />
                            {tip}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            </section>
          ))}
        </div>

        <div className="grid gap-4 border-t border-slate-100 bg-slate-50/50 p-5 sm:grid-cols-2 sm:p-6">
          <div className="rounded-xl border border-slate-200/70 bg-white p-4">
            <div className="flex items-center gap-2 text-emerald-700">
              <BookOpenCheck className="h-4 w-4" />
              <h3 className="text-[12px] font-bold">Key takeaways</h3>
            </div>
            <ul className="mt-2.5 space-y-2">
              {note.content.keyTakeaways.map((takeaway) => (
                <li key={takeaway} className="flex items-start gap-2 text-[11.5px] leading-5 text-ink-600">
                  <ListChecks className="mt-0.5 h-3 w-3 shrink-0 text-emerald-500" />
                  {takeaway}
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-xl border border-slate-200/70 bg-white p-4">
            <div className="flex items-center gap-2 text-violet-700">
              <ClipboardList className="h-4 w-4" />
              <h3 className="text-[12px] font-bold">Important exam points</h3>
            </div>
            <ul className="mt-2.5 space-y-2">
              {note.content.importantExamPoints.map((point) => (
                <li key={point} className="flex items-start gap-2 text-[11.5px] leading-5 text-ink-600">
                  <ListChecks className="mt-0.5 h-3 w-3 shrink-0 text-violet-400" />
                  {point}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {note.content.uncertainAreas.length > 0 && (
          <div className="border-t border-rose-100 bg-rose-50/50 p-5 sm:p-6">
            <div className="flex items-center gap-2 text-rose-700">
              <TriangleAlert className="h-4 w-4" />
              <h3 className="text-[12px] font-bold">Uncertain areas carried into the notes</h3>
            </div>
            <div className="mt-3 space-y-2">
              {note.content.uncertainAreas.map((area) => (
                <div key={area.topic} className="rounded-lg border border-rose-100 bg-white/80 p-3">
                  <p className="text-[11.5px] font-bold text-rose-900">{area.topic}</p>
                  <p className="mt-0.5 text-[11px] leading-5 text-ink-500">{area.reason}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function ErrorLine({ message }: { message: string }) {
  return (
    <div className="flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3">
      <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-rose-600" />
      <p className="text-[12px] leading-5 text-rose-800">{message}</p>
    </div>
  );
}
