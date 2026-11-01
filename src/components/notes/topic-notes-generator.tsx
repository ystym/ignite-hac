"use client";

import { useState } from "react";
import Link from "next/link";
import {
  AlertCircle,
  ArrowRight,
  BookOpen,
  GraduationCap,
  Languages,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";
import type { TopicNotesContent } from "@/lib/schemas";
import { apiFetch, errorMessage } from "@/lib/client/api";
import { languageLabel } from "@/lib/client/labels";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Callout } from "@/components/ui/callout";
import { EmptyState } from "@/components/ui/empty-state";
import { Input, Label, Select } from "@/components/ui/input";
import { ModeBadge } from "@/components/mode-badges";
import { TimeAgo } from "@/components/time-ago";
import { NotesContentView } from "@/components/notes/notes-view";

type TopicNote = {
  topic: string;
  language: string;
  model: string;
  mode: string;
  content: TopicNotesContent;
};

type TopicResponse = { note: TopicNote };

const SUGGESTIONS = [
  "Bayes' theorem",
  "Time complexity and Big-O",
  "Electromagnetic induction",
  "Photosynthesis light reactions",
];

export function TopicNotesGenerator({
  aiConfigured,
  model,
  initialTopic = "",
}: {
  aiConfigured: boolean;
  model: string;
  initialTopic?: string;
}) {
  const [topic, setTopic] = useState(initialTopic.slice(0, 180));
  const [language, setLanguage] = useState<"simple_en" | "hinglish">("simple_en");
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [note, setNote] = useState<TopicNote | null>(null);
  const [generatedAt, setGeneratedAt] = useState<string | null>(null);

  const canGenerate = aiConfigured && topic.trim().length >= 3 && !generating;

  async function generate(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (generating) return;
    if (topic.trim().length < 3) {
      setError("Enter the topic you want to learn (at least 3 characters).");
      return;
    }
    setGenerating(true);
    setError(null);
    try {
      const response = await apiFetch<TopicResponse>("/api/topics/notes", {
        method: "POST",
        body: { topic: topic.trim(), language },
      });
      setNote(response.note);
      setGeneratedAt(new Date().toISOString());
      toast.success("Topic notes generated", {
        description: "General knowledge, kept separate from your grounded notes.",
      });
    } catch (caught) {
      const message = errorMessage(caught);
      setError(message);
      toast.error("Could not generate topic notes", { description: message });
    } finally {
      setGenerating(false);
    }
  }

  return (
    <div className="grid min-w-0 gap-5 xl:grid-cols-[minmax(0,0.42fr)_minmax(0,1fr)]">
      <aside className="min-w-0">
        <form
          onSubmit={generate}
          className="rounded-2xl border border-hairline bg-white p-5 sm:p-6"
        >
          <div className="flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-50 text-violet-600">
              <GraduationCap className="h-[18px] w-[18px]" />
            </span>
            <div className="min-w-0">
              <h2 className="font-display text-[16px] font-semibold text-ink-900">Ask for a topic</h2>
              <p className="text-[11px] text-ink-400">Outside your uploaded material</p>
            </div>
          </div>

          <div className="mt-5 space-y-2">
            <Label htmlFor="topic">Topic to learn</Label>
            <Input
              id="topic"
              value={topic}
              onChange={(event) => setTopic(event.target.value)}
              placeholder="e.g. Bayes' theorem"
              maxLength={180}
              autoComplete="off"
              disabled={!aiConfigured || generating}
              invalid={Boolean(error)}
            />
            <p className="text-[10.5px] leading-5 text-ink-400">
              A concept, chapter or skill. Broad requests are scoped to the core.
            </p>
          </div>

          <div className="mt-3 flex flex-wrap gap-1.5">
            {SUGGESTIONS.map((suggestion) => (
              <button
                key={suggestion}
                type="button"
                onClick={() => setTopic(suggestion)}
                disabled={!aiConfigured || generating}
                className="rounded-full border border-hairline bg-white px-2.5 py-1 text-[10.5px] font-medium text-ink-500 transition hover:border-violet-300 hover:text-violet-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {suggestion}
              </button>
            ))}
          </div>

          <div className="mt-5 space-y-2">
            <Label htmlFor="topic-language">Language</Label>
            <div className="relative">
              <Languages className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-ink-400" />
              <Select
                id="topic-language"
                value={language}
                onChange={(event) =>
                  setLanguage(event.target.value === "hinglish" ? "hinglish" : "simple_en")
                }
                className="pl-9 text-[12.5px]"
                disabled={!aiConfigured || generating}
              >
                <option value="simple_en">Simple English</option>
                <option value="hinglish">Hinglish</option>
              </Select>
            </div>
          </div>

          <Button
            type="submit"
            variant="violet"
            className="mt-5 w-full"
            loading={generating}
            disabled={!canGenerate}
          >
            {!generating && <Sparkles className="h-4 w-4" />}
            {generating ? "Writing notes…" : "Generate topic notes"}
          </Button>

          <div className="mt-4 flex items-start gap-2 rounded-xl border border-[#f0f0f0] bg-parchment p-3">
            <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-600" />
            <p className="text-[10.5px] leading-5 text-ink-500">
              These notes are not indexed, not used in grounded quizzes and never cited as your
              material. Your library stays untouched.
            </p>
          </div>
        </form>

        {!aiConfigured && (
          <Callout variant="warning" title="Live AI is required" className="mt-4">
            Topic notes are generated by Gemini and are never faked in demo mode. Add{" "}
            <code className="rounded bg-white/70 px-1">GEMINI_API_KEY</code> to{" "}
            <code className="rounded bg-white/70 px-1">.env</code>, restart the server, then return
            here.
          </Callout>
        )}
      </aside>

      <section className="min-w-0" aria-live="polite">
        {error && (
          <div className="mb-4 flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-rose-600" />
            <p className="text-[12px] leading-5 text-rose-800">{error}</p>
          </div>
        )}

        {generating && (
          <div className="rounded-2xl border border-hairline bg-white p-6">
            <div className="flex items-center gap-2">
              <Badge variant="amber">
                <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                General knowledge
              </Badge>
              <span className="text-[10px] text-ink-400">Writing with {model}</span>
            </div>
            <h2 className="mt-4 font-display text-xl font-semibold text-ink-900">
              Building notes for “{topic.trim()}”…
            </h2>
            <p className="mt-2 text-[12.5px] leading-6 text-ink-500">
              This is a live Gemini request. It usually takes 20–60 seconds. The result will be
              labelled as external knowledge.
            </p>
            <div className="mt-5 space-y-2.5" aria-hidden="true">
              {[100, 92, 78, 96, 64].map((width, index) => (
                <div
                  key={index}
                  className="h-2.5 animate-pulse rounded-full bg-[#e8e8ed]"
                  style={{ width: `${width}%` }}
                />
              ))}
            </div>
          </div>
        )}

        {!generating && !note && (
          <EmptyState
            icon={BookOpen}
            title="Learn something your notes do not cover"
            description="Describe any topic you want to study. You will get structured notes with definitions, formulas, examples and exam tips — clearly marked as general knowledge, not as material from your uploads."
            className="h-full"
          />
        )}

        {!generating && note && (
          <div className="min-w-0 space-y-4">
            <Callout variant="warning" title="General knowledge — not from your uploaded notes">
              <p>{note.content.scopeNote}</p>
              <p className="mt-1.5">
                This output is separate from your library: it is not embedded, not searchable in Ask,
                not cited, and never used to generate grounded quizzes.
              </p>
            </Callout>

            <article className="min-w-0 overflow-hidden rounded-2xl border border-amber-200/70 bg-white">
              <header className="border-b border-amber-100 bg-amber-50 p-5 sm:p-6">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="amber">
                    <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                    External knowledge
                  </Badge>
                  <ModeBadge mode={note.mode} />
                  <Badge variant="default">{languageLabel(note.language)}</Badge>
                  <span className="font-mono text-[10px] text-ink-300">{note.model}</span>
                </div>
                <h2 className="mt-3 break-words font-display text-2xl font-semibold tracking-[-0.03em] text-ink-950">
                  {note.content.title}
                </h2>
                <p className="mt-2.5 max-w-3xl text-[13.5px] leading-6 text-ink-500">
                  {note.content.overview}
                </p>
                <p className="mt-4 text-[10.5px] text-ink-400">
                  Requested topic: {note.topic}
                  {generatedAt ? (
                    <>
                      {" "}
                      · generated <TimeAgo value={generatedAt} />
                    </>
                  ) : null}{" "}
                  · not checked against your course syllabus
                </p>
              </header>

              <NotesContentView
                content={note.content}
                prerequisites={note.content.prerequisites}
              />
            </article>

            <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-hairline bg-white px-4 py-3.5">
              <p className="text-[11.5px] leading-5 text-ink-500">
                Want notes tied to your own uploads instead?
              </p>
              <Button asChild variant="outline" size="sm" className="shrink-0">
                <Link href="/library">
                  Open your library <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </Button>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
