"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  ArrowUpRight,
  BookOpen,
  CalendarRange,
  CheckCircle2,
  ExternalLink,
  FileText,
  Globe2,
  LibraryBig,
  ListChecks,
  Loader2,
  NotebookPen,
  Search,
  Sparkles,
  TriangleAlert,
  X,
} from "lucide-react";
import { toast } from "sonner";
import type { LocalSearchResult, SearchHit, SearchKind } from "@/lib/search";
import type { WebResearchResult } from "@/lib/ai/gemini";
import { apiFetch, errorMessage } from "@/lib/client/api";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Callout } from "@/components/ui/callout";
import { Input } from "@/components/ui/input";
import { ModeBadge } from "@/components/mode-badges";

type Mode = "library" | "web";

type SearchResponse = { result: LocalSearchResult };
type WebResponse = { result: WebResearchResult };

const SUGGESTIONS = ["Photosynthesis", "Linked lists", "Newton's laws", "Bayes' theorem"];

const KIND_META: Record<
  SearchKind,
  { label: string; icon: typeof FileText; iconClass: string; badge: string }
> = {
  document: {
    label: "Document",
    icon: FileText,
    iconClass: "bg-violet-50 text-violet-600 ring-violet-100",
    badge: "violet",
  },
  notes: {
    label: "Note",
    icon: NotebookPen,
    iconClass: "bg-emerald-50 text-emerald-600 ring-emerald-100",
    badge: "green",
  },
  passage: {
    label: "Passage",
    icon: BookOpen,
    iconClass: "bg-sky-50 text-sky-600 ring-sky-100",
    badge: "sky",
  },
  quiz: {
    label: "Practice",
    icon: ListChecks,
    iconClass: "bg-amber-50 text-amber-600 ring-amber-100",
    badge: "amber",
  },
  plan: {
    label: "Study plan",
    icon: CalendarRange,
    iconClass: "bg-rose-50 text-rose-600 ring-rose-100",
    badge: "rose",
  },
};

const FILTERS: Array<{ key: SearchKind | "all"; label: string }> = [
  { key: "all", label: "Everything" },
  { key: "document", label: "Documents" },
  { key: "notes", label: "Notes" },
  { key: "passage", label: "Passages" },
  { key: "quiz", label: "Practice" },
  { key: "plan", label: "Plans" },
];

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function Highlighted({ text, query }: { text: string; query: string }) {
  const phrase = query.trim();
  if (!phrase) return <>{text}</>;

  const tokens = Array.from(
    new Set(
      [phrase, ...phrase.split(/\s+/).filter((token) => token.length > 1)].map((token) =>
        token.toLowerCase(),
      ),
    ),
  ).sort((a, b) => b.length - a.length);

  if (tokens.length === 0) return <>{text}</>;

  const pattern = new RegExp(`(${tokens.map(escapeRegExp).join("|")})`, "gi");
  const parts = text.split(pattern);
  const tokenSet = new Set(tokens);

  return (
    <>
      {parts.map((part, index) =>
        tokenSet.has(part.toLowerCase()) ? (
          <mark
            key={`${part}-${index}`}
            className="rounded bg-amber-100 px-0.5 font-medium text-ink-900"
          >
            {part}
          </mark>
        ) : (
          <span key={`${part}-${index}`}>{part}</span>
        ),
      )}
    </>
  );
}

function stripInlineMarkdown(value: string): string {
  return value
    .replace(/\*\*(.*?)\*\*/g, "$1")
    .replace(/__(.*?)__/g, "$1")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1");
}

type AnswerBlock =
  | { type: "heading"; text: string }
  | { type: "list"; items: string[] }
  | { type: "paragraph"; text: string };

function parseWebAnswer(answer: string): AnswerBlock[] {
  const lines = answer
    .split(/\r?\n/)
    .map((line) => stripInlineMarkdown(line).trim())
    .filter(Boolean);

  const blocks: AnswerBlock[] = [];
  let list: string[] | null = null;

  const flushList = () => {
    if (list && list.length > 0) blocks.push({ type: "list", items: list });
    list = null;
  };

  for (const line of lines) {
    const heading = line.replace(/:$/, "").trim();
    if (/^(key ideas|how to study this|check before relying on this)$/i.test(heading)) {
      flushList();
      blocks.push({ type: "heading", text: heading });
      continue;
    }

    const bullet = line.match(/^[-*•]\s+(.*)$/) ?? line.match(/^\d+[.)]\s+(.*)$/);
    if (bullet) {
      if (!list) list = [];
      list.push(bullet[1].trim());
      continue;
    }

    flushList();
    if (/^#{1,6}\s+/.test(line)) {
      blocks.push({ type: "heading", text: line.replace(/^#{1,6}\s+/, "") });
    } else {
      blocks.push({ type: "paragraph", text: line });
    }
  }

  flushList();
  return blocks;
}

function WebAnswer({ answer }: { answer: string }) {
  const blocks = parseWebAnswer(answer);

  return (
    <div className="space-y-4">
      {blocks.map((block, index) => {
        if (block.type === "heading") {
          return (
            <h3
              key={index}
              className="flex items-center gap-2 pt-1 font-display text-[15px] font-semibold text-ink-900"
            >
              <span className="h-1.5 w-1.5 rounded-full bg-sky-500" />
              {block.text}
            </h3>
          );
        }
        if (block.type === "list") {
          return (
            <ul key={index} className="space-y-2">
              {block.items.map((item, itemIndex) => (
                <li
                  key={itemIndex}
                  className="flex items-start gap-2.5 text-[13px] leading-6 text-ink-600"
                >
                  <CheckCircle2 className="mt-1 h-3.5 w-3.5 shrink-0 text-sky-500" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          );
        }
        return (
          <p key={index} className="text-[13.5px] leading-6 text-ink-600">
            {block.text}
          </p>
        );
      })}
    </div>
  );
}

function SearchSkeleton({ rows = 4 }: { rows?: number }) {
  return (
    <div className="space-y-3" aria-hidden="true">
      {Array.from({ length: rows }).map((_, index) => (
        <div
          key={index}
          className="rounded-2xl border border-hairline bg-white p-4"
        >
          <div className="flex items-start gap-3.5">
            <div className="h-10 w-10 animate-pulse rounded-xl bg-[#e8e8ed]" />
            <div className="min-w-0 flex-1 space-y-2.5">
              <div className="h-3 w-1/3 animate-pulse rounded-full bg-[#e8e8ed]" />
              <div className="h-3.5 w-2/3 animate-pulse rounded-full bg-[#e8e8ed]" />
              <div className="h-2.5 w-full animate-pulse rounded-full bg-parchment" />
              <div className="h-2.5 w-4/5 animate-pulse rounded-full bg-parchment" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export function KnowledgeSearch({
  aiConfigured,
  model,
  initialQuery = "",
}: {
  aiConfigured: boolean;
  model: string;
  initialQuery?: string;
}) {
  const [query, setQuery] = useState(initialQuery);
  const [submitted, setSubmitted] = useState(initialQuery);
  const [mode, setMode] = useState<Mode>("library");
  const [filter, setFilter] = useState<SearchKind | "all">("all");

  const [local, setLocal] = useState<LocalSearchResult | null>(null);
  const [localLoading, setLocalLoading] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  const [web, setWeb] = useState<WebResearchResult | null>(null);
  const [webLoading, setWebLoading] = useState(false);
  const [webError, setWebError] = useState<string | null>(null);

  const inputRef = useRef<HTMLInputElement>(null);
  const didInitialSearch = useRef(false);

  async function runLocal(value: string) {
    const trimmed = value.trim();
    if (trimmed.length < 2) {
      setLocalError("Type at least 2 characters to search your material.");
      return;
    }
    setMode("library");
    setSubmitted(trimmed);
    setLocalError(null);
    setLocalLoading(true);
    window.history.replaceState(null, "", `/search?q=${encodeURIComponent(trimmed)}`);
    try {
      const response = await apiFetch<SearchResponse>(
        `/api/search?q=${encodeURIComponent(trimmed)}`,
      );
      setLocal(response.result);
      setFilter("all");
    } catch (caught) {
      setLocalError(errorMessage(caught));
    } finally {
      setLocalLoading(false);
    }
  }

  async function runWeb(value: string) {
    const trimmed = value.trim();
    if (trimmed.length < 2) {
      setWebError("Type at least 2 characters to search the web.");
      return;
    }
    if (!aiConfigured) {
      setWebError(
        "Web research needs a Gemini API key. Add GEMINI_API_KEY to .env, restart the server, then try again.",
      );
      return;
    }
    setMode("web");
    setSubmitted(trimmed);
    setWebError(null);
    setWebLoading(true);
    window.history.replaceState(null, "", `/search?q=${encodeURIComponent(trimmed)}`);
    try {
      const response = await apiFetch<WebResponse>("/api/search/web", {
        method: "POST",
        body: { query: trimmed },
      });
      setWeb(response.result);
      if (!response.result.grounded) {
        toast.warning("No web sources returned", {
          description: "Treat the answer as unverified until you check it yourself.",
        });
      }
    } catch (caught) {
      const message = errorMessage(caught);
      setWebError(message);
      toast.error("Web search failed", { description: message });
    } finally {
      setWebLoading(false);
    }
  }

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (mode === "library") void runLocal(query);
    else void runWeb(query);
  }

  function useSuggestion(suggestion: string) {
    setQuery(suggestion);
    if (mode === "library") void runLocal(suggestion);
    else void runWeb(suggestion);
  }

  useEffect(() => {
    if (didInitialSearch.current) return;
    didInitialSearch.current = true;
    if (initialQuery.trim().length >= 2) void runLocal(initialQuery);
    // Only the server-provided initial query should trigger the first search.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key !== "/" || event.metaKey || event.ctrlKey || event.altKey) return;
      const target = event.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.tagName === "SELECT" ||
          target.isContentEditable)
      ) {
        return;
      }
      event.preventDefault();
      inputRef.current?.focus();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const filteredHits =
    local?.hits.filter((hit) => filter === "all" || hit.kind === filter) ?? [];
  const hasLocal = Boolean(local && local.hits.length > 0);
  const showLocalEmpty = Boolean(
    local && local.hits.length === 0 && submitted && !localLoading && !localError,
  );

  return (
    <div className="min-w-0">
      <section className="rounded-2xl border border-hairline bg-white p-5 sm:p-7">
        <div className="relative">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="violet" className="gap-1.5">
              <Search className="h-3 w-3" /> Knowledge search
            </Badge>
            <span className="text-[11px] font-medium text-ink-400">
              Your material first · real web sources when you need more
            </span>
          </div>

          <h1 className="mt-3 max-w-3xl font-display text-[clamp(1.6rem,3vw,2.25rem)] font-semibold leading-[1.1] tracking-[-0.032em] text-ink-950">
            Find it in your notes. Or learn it from the web.
          </h1>
          <p className="mt-2 max-w-2xl text-[13px] leading-6 text-ink-500">
            Search every upload, generated note, extracted passage, quiz and study plan. If the
            topic is not in your library, switch to Web research for a sourced explanation.
          </p>

          <form onSubmit={submit} className="mt-6">
            <div className="flex flex-col gap-2 sm:flex-row">
              <div className="relative min-w-0 flex-1">
                <Search
                  className="pointer-events-none absolute left-4 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-ink-400"
                  aria-hidden="true"
                />
                <Input
                  ref={inputRef}
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Try “photosynthesis”, “linked lists” or a full question…"
                  aria-label="Search your material or the web"
                  className="h-12 pl-11 pr-10 text-[14px] placeholder:text-ink-400"
                  maxLength={180}
                  autoComplete="off"
                />
                {query && (
                  <button
                    type="button"
                    onClick={() => {
                      setQuery("");
                      inputRef.current?.focus();
                    }}
                    className="absolute right-3 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full text-ink-300 transition hover:bg-[#e8e8ed] hover:text-ink-600"
                    aria-label="Clear search"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
              <Button
                type="submit"
                variant="primary"
                size="lg"
                className="h-12 px-6"
                loading={localLoading || webLoading}
              >
                {!localLoading && !webLoading && <Search className="h-4 w-4" />}
                Search
              </Button>
            </div>

            <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div
                className="inline-flex w-full rounded-xl border border-hairline bg-white/80 p-1 sm:w-auto"
                role="group"
                aria-label="Search source"
              >
                <button
                  type="button"
                  onClick={() => setMode("library")}
                  aria-pressed={mode === "library"}
                  className={cn(
                    "inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg px-3 py-1.5 text-[11.5px] font-semibold transition sm:flex-none",
                    mode === "library"
                      ? "bg-violet-600 text-white"
                      : "text-ink-500 hover:text-ink-800",
                  )}
                >
                  <LibraryBig className="h-3.5 w-3.5" /> My material
                </button>
                <button
                  type="button"
                  onClick={() => setMode("web")}
                  aria-pressed={mode === "web"}
                  className={cn(
                    "inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg px-3 py-1.5 text-[11.5px] font-semibold transition sm:flex-none",
                    mode === "web"
                      ? "bg-sky-600 text-white"
                      : "text-ink-500 hover:text-ink-800",
                  )}
                >
                  <Globe2 className="h-3.5 w-3.5" /> Web research
                </button>
              </div>

              <p className="hidden items-center gap-1.5 text-[10.5px] text-ink-400 sm:flex">
                Press <kbd className="rounded border border-hairline bg-white px-1.5 py-0.5 font-mono text-[10px]">/</kbd>{" "}
                to search
              </p>
            </div>
          </form>

          <div className="mt-4 flex flex-wrap items-center gap-1.5">
            <span className="mr-0.5 text-[10.5px] font-semibold uppercase tracking-wider text-ink-300">
              Try
            </span>
            {SUGGESTIONS.map((suggestion) => (
              <button
                key={suggestion}
                type="button"
                onClick={() => useSuggestion(suggestion)}
                className="rounded-full border border-hairline bg-parchment px-2.5 py-1 text-[10.5px] font-medium text-ink-500 transition hover:border-[#d2d2d7] hover:bg-white hover:text-action"
              >
                {suggestion}
              </button>
            ))}
          </div>
        </div>
      </section>

      {mode === "library" ? (
        <section className="mt-5 min-w-0" aria-live="polite">
          {localError && (
            <Callout variant="danger" title="Search failed" className="mb-4">
              {localError}
            </Callout>
          )}

          {localLoading && <SearchSkeleton />}

          {!localLoading && hasLocal && local && (
            <>
              <div className="mb-3 flex flex-wrap items-end justify-between gap-x-4 gap-y-2">
                <div className="min-w-0">
                  <h2 className="font-display text-lg font-semibold text-ink-900">
                    {local.total} result{local.total === 1 ? "" : "s"} for “{local.query}”
                  </h2>
                  <p className="mt-0.5 text-[11px] text-ink-400">
                    Searched titles, extracted text, notes, passages, practice and plans ·{" "}
                    {local.tookMs} ms
                  </p>
                </div>
                <Button asChild variant="outline" size="sm" className="shrink-0">
                  <Link
                    href={`/learn?topic=${encodeURIComponent(local.query)}`}
                    className="inline-flex items-center gap-1.5"
                  >
                    <Sparkles className="h-3.5 w-3.5" /> Learn it separately
                  </Link>
                </Button>
              </div>

              <div className="mb-3 flex flex-wrap gap-1.5">
                {FILTERS.map((item) => {
                  const count =
                    item.key === "all" ? local.total : local.counts[item.key] ?? 0;
                  const active = filter === item.key;
                  return (
                    <button
                      key={item.key}
                      type="button"
                      onClick={() => setFilter(item.key)}
                      aria-pressed={active}
                      className={cn(
                        "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[11px] font-semibold transition",
                        active
                          ? "border-action bg-action text-white"
                          : "border-hairline bg-white text-ink-500 hover:border-[#d2d2d7] hover:text-ink-800",
                      )}
                    >
                      {item.label}
                      <span
                        className={cn(
                          "rounded-full px-1.5 text-[9.5px] font-semibold",
                          active ? "bg-white/20 text-white" : "bg-[#e8e8ed] text-ink-400",
                        )}
                      >
                        {count}
                      </span>
                    </button>
                  );
                })}
              </div>

              <div className="space-y-2.5">
                {filteredHits.map((hit) => (
                  <LocalResultCard key={hit.id} hit={hit} query={local.query} />
                ))}
                {filteredHits.length === 0 && (
                  <div className="rounded-2xl border border-hairline bg-white p-8 text-center">
                    <p className="text-[13px] font-semibold text-ink-700">
                      No {filter === "all" ? "" : FILTERS.find((item) => item.key === filter)?.label.toLowerCase()}{" "}
                      results in this search.
                    </p>
                    <button
                      type="button"
                      onClick={() => setFilter("all")}
                      className="mt-1 text-[11.5px] font-semibold text-violet-700 hover:underline"
                    >
                      Show everything
                    </button>
                  </div>
                )}
              </div>
            </>
          )}

          {!localLoading && showLocalEmpty && (
            <div className="overflow-hidden rounded-2xl border border-amber-200/80 bg-[#fffaf0]">
              <div className="p-6 sm:p-8">
                <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-amber-100 text-amber-700">
                  <BookOpen className="h-5 w-5" />
                </span>
                <h2 className="mt-4 font-display text-xl font-semibold text-ink-950">
                  “{submitted}” is not in your material yet
                </h2>
                <p className="mt-2 max-w-2xl text-[13px] leading-6 text-ink-500">
                  Your library search only covers what you uploaded or generated. You can research
                  this topic on the web with real source links, or create separate general-knowledge
                  notes and keep them out of your grounded library.
                </p>
                <div className="mt-5 flex flex-col gap-2 sm:flex-row">
                  <Button
                    type="button"
                    variant="violet"
                    onClick={() => void runWeb(submitted)}
                    disabled={!aiConfigured}
                    title={
                      aiConfigured
                        ? "Search the web with Gemini Google Search grounding"
                        : "Add GEMINI_API_KEY to enable web research"
                    }
                  >
                    <Globe2 className="h-4 w-4" /> Search the web
                  </Button>
                  <Button asChild variant="outline">
                    <Link href={`/learn?topic=${encodeURIComponent(submitted)}`}>
                      <Sparkles className="h-4 w-4" /> Generate topic notes
                    </Link>
                  </Button>
                </div>
              </div>
              <div className="border-t border-amber-100 bg-amber-50/60 px-6 py-3 text-[10.5px] leading-5 text-amber-800 sm:px-8">
                {aiConfigured
                  ? "Web research uses your Gemini quota. It never changes your notes, index or quizzes."
                  : "Web research needs a live Gemini key. Demo mode never invents web answers."}
              </div>
            </div>
          )}

          {!localLoading && !local && !localError && !showLocalEmpty && (
            <EmptyDiscovery onPick={useSuggestion} />
          )}
        </section>
      ) : (
        <section className="mt-5 min-w-0" aria-live="polite">
          {!aiConfigured && (
            <Callout variant="warning" title="Web research needs a live Gemini key">
              Add <code className="rounded bg-white/70 px-1">GEMINI_API_KEY</code> to{" "}
              <code className="rounded bg-white/70 px-1">.env</code>, restart the server, then
              search the web. Demo mode never fabricates web answers.
            </Callout>
          )}

          {webError && (
            <Callout variant="danger" title="Web research failed" className="mb-4">
              {webError}
            </Callout>
          )}

          {webLoading && (
            <div className="rounded-2xl border border-sky-100 bg-[#f5faff] p-6 sm:p-8">
              <div className="flex items-center gap-2 text-sky-700">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="text-[12px] font-semibold">Researching “{submitted}” on the web…</span>
              </div>
              <p className="mt-2 text-[12px] leading-6 text-ink-500">
                Gemini is searching and reading live sources. This usually takes 20–60 seconds and
                uses one live request.
              </p>
              <div className="mt-5 space-y-2.5" aria-hidden="true">
                {[100, 94, 82, 90, 70].map((width, index) => (
                  <div
                    key={index}
                    className="h-2.5 animate-pulse rounded-full bg-sky-100/70"
                    style={{ width: `${width}%` }}
                  />
                ))}
              </div>
            </div>
          )}

          {!webLoading && web && <WebResearchCard result={web} />}

          {!webLoading && !web && !webError && (
            <div className="overflow-hidden rounded-2xl border border-sky-100 bg-white">
              <div className="grid gap-6 p-6 sm:p-8 lg:grid-cols-[1.2fr_0.8fr] lg:items-center">
                <div>
                  <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-sky-100 text-sky-700">
                    <Globe2 className="h-5 w-5" />
                  </span>
                  <h2 className="mt-4 font-display text-xl font-semibold text-ink-950">
                    Research a topic you have not uploaded
                  </h2>
                  <p className="mt-2 max-w-xl text-[13px] leading-6 text-ink-500">
                    Ask anything. Gemini searches the live web, writes a study-friendly explanation,
                    and shows the actual pages it used. Nothing is added to your library or used in
                    grounded quizzes.
                  </p>
                  {query.trim().length >= 2 ? (
                    <Button
                      type="button"
                      variant="sky"
                      className="mt-5"
                      onClick={() => void runWeb(query)}
                      disabled={!aiConfigured}
                    >
                      <Search className="h-4 w-4" /> Research “{query.trim()}”
                    </Button>
                  ) : (
                    <p className="mt-4 text-[11.5px] font-medium text-ink-400">
                      Type a topic above to begin.
                    </p>
                  )}
                </div>
                <div className="space-y-2.5">
                  {[
                    "Real source links, not invented citations",
                    "Clear answer, key ideas and study steps",
                    "Kept separate from your grounded notes",
                  ].map((item) => (
                    <div
                      key={item}
                      className="flex items-start gap-2.5 rounded-xl border border-white bg-white/80 p-3 text-[11.5px] leading-5 text-ink-600"
                    >
                      <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-500" />
                      {item}
                    </div>
                  ))}
                </div>
              </div>
              <div className="border-t border-sky-100 bg-sky-50/60 px-6 py-3 text-[10.5px] leading-5 text-sky-900 sm:px-8">
                Web answers can be outdated or wrong. Verify important facts against your syllabus
                and the linked sources. Model: {model}.
              </div>
            </div>
          )}
        </section>
      )}
    </div>
  );
}

function LocalResultCard({ hit, query }: { hit: SearchHit; query: string }) {
  const meta = KIND_META[hit.kind];
  const Icon = meta.icon;

  return (
    <Link
      href={hit.href}
      className="group flex min-w-0 items-start gap-3.5 rounded-2xl border border-hairline bg-white p-4 transition hover:-translate-y-0.5 hover:border-violet-200 sm:p-5"
    >
      <span
        className={cn(
          "mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ring-1",
          meta.iconClass,
        )}
      >
        <Icon className="h-[18px] w-[18px]" />
      </span>

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-1.5">
          <Badge variant={meta.badge as "violet" | "green" | "sky" | "amber" | "rose"}>
            {meta.label}
          </Badge>
          <ModeBadge mode={hit.mode} />
          {hit.confidence != null && (
            <span className="text-[9.5px] text-ink-300">
              {Math.round(hit.confidence * 100)}% extraction confidence
            </span>
          )}
        </div>
        <h3 className="mt-1.5 break-words font-display text-[15px] font-semibold leading-snug text-ink-900 group-hover:text-violet-800">
          <Highlighted text={hit.title} query={query} />
        </h3>
        {hit.snippet && (
          <p className="mt-1 line-clamp-3 break-words text-[12px] leading-5 text-ink-500">
            <Highlighted text={hit.snippet} query={query} />
          </p>
        )}
        <p className="mt-1.5 truncate text-[10px] text-ink-400">{hit.meta}</p>
      </div>

      <ArrowUpRight className="mt-1 h-4 w-4 shrink-0 text-ink-300 transition group-hover:text-violet-600" />
    </Link>
  );
}

function WebResearchCard({ result }: { result: WebResearchResult }) {
  return (
    <div className="min-w-0 space-y-4">
      {!result.grounded && (
        <Callout variant="warning" title="No web source links were returned">
          Gemini produced an answer but did not attach any sources. Treat it as unverified and check
          the topic in a textbook or your course material before relying on it.
        </Callout>
      )}

      <article className="min-w-0 overflow-hidden rounded-2xl border border-sky-200/70 bg-white">
        <header className="border-b border-sky-100 bg-[#f5faff] p-5 sm:p-6">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="sky" className="gap-1.5">
              <Globe2 className="h-3 w-3" /> Web-grounded
            </Badge>
            <ModeBadge mode="LIVE" />
            <span className="font-mono text-[10px] text-ink-300">{result.model}</span>
            <span className="text-[10px] text-ink-400">{result.latencyMs} ms</span>
          </div>
          <h2 className="mt-3 break-words font-display text-2xl font-semibold tracking-[-0.03em] text-ink-950">
            {result.query}
          </h2>
          <p className="mt-1.5 text-[10.5px] text-ink-400">
            Live web research, not your uploaded material. It is not indexed and never feeds grounded
            quizzes or cited answers.
          </p>
          {result.searchQueries.length > 0 && (
            <div className="mt-3 flex flex-wrap items-center gap-1.5">
              <span className="inline-flex items-center gap-1 text-[9.5px] font-semibold uppercase tracking-wider text-ink-300">
                <Search className="h-3 w-3" /> Searched
              </span>
              {result.searchQueries.slice(0, 4).map((searchQuery) => (
                <span
                  key={searchQuery}
                  className="max-w-full truncate rounded-full bg-white/80 px-2 py-0.5 text-[9.5px] text-ink-500 ring-1 ring-sky-100"
                >
                  {searchQuery}
                </span>
              ))}
            </div>
          )}
        </header>

        <div className="p-5 sm:p-6">
          <WebAnswer answer={result.answer} />
        </div>

        {result.sources.length > 0 && (
          <div className="border-t border-[#f0f0f0] bg-parchment/60 p-5 sm:p-6">
            <div className="flex items-center justify-between gap-3">
              <h3 className="flex items-center gap-2 text-[12px] font-semibold text-ink-800">
                <ExternalLink className="h-3.5 w-3.5 text-sky-600" />
                Sources used
              </h3>
              <span className="text-[10px] text-ink-400">
                {result.sources.length} page{result.sources.length === 1 ? "" : "s"}
              </span>
            </div>
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              {result.sources.map((source, index) => (
                <a
                  key={source.url}
                  href={source.url}
                  target="_blank"
                  rel="noopener noreferrer nofollow"
                  className="group flex min-w-0 items-start gap-2.5 rounded-xl border border-hairline bg-white p-3 transition hover:border-sky-300"
                >
                  <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-sky-50 font-mono text-[9.5px] font-semibold text-sky-700">
                    {index + 1}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[11.5px] font-semibold text-ink-800 group-hover:text-sky-800">
                      {source.title}
                    </span>
                    <span className="mt-0.5 block truncate text-[10px] text-ink-400">
                      {source.domain ?? source.url}
                    </span>
                  </span>
                  <ArrowUpRight className="mt-0.5 h-3.5 w-3.5 shrink-0 text-ink-300 group-hover:text-sky-600" />
                </a>
              ))}
            </div>
            <p className="mt-3 flex items-start gap-1.5 text-[10px] leading-4 text-ink-400">
              <TriangleAlert className="mt-0.5 h-3 w-3 shrink-0" />
              Links come from Google Search grounding metadata. Always check the original page before
              trusting a fact, date or formula.
            </p>
          </div>
        )}
      </article>

      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-hairline bg-white px-4 py-3.5">
        <p className="text-[11.5px] leading-5 text-ink-500">
          Want structured practice on this topic from your own notes?
        </p>
        <Button asChild variant="outline" size="sm" className="shrink-0">
          <Link href="/library">
            Open library <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </Button>
      </div>
    </div>
  );
}

function EmptyDiscovery({ onPick }: { onPick: (suggestion: string) => void }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-hairline bg-white">
      <div className="grid gap-6 p-6 sm:p-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
        <div>
          <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-violet-50 text-violet-600 ring-1 ring-violet-100">
            <LibraryBig className="h-5 w-5" />
          </span>
          <h2 className="mt-4 font-display text-xl font-semibold text-ink-950">
            One search across your whole study workspace
          </h2>
          <p className="mt-2 max-w-xl text-[13px] leading-6 text-ink-500">
            Results rank titles above passing mentions, and every hit tells you what it is: a
            document, a generated note, a source passage, practice or a plan.
          </p>
          <div className="mt-5 flex flex-wrap gap-1.5">
            {SUGGESTIONS.map((suggestion) => (
              <button
                key={suggestion}
                type="button"
                onClick={() => onPick(suggestion)}
                className="rounded-full border border-hairline bg-white px-2.5 py-1 text-[10.5px] font-medium text-ink-500 transition hover:border-violet-300 hover:text-violet-700"
              >
                {suggestion}
              </button>
            ))}
          </div>
        </div>
        <div className="grid gap-2">
          {(
            [
              ["document", "Uploads and their extracted text", FileText],
              ["notes", "Generated notes, section by section", NotebookPen],
              ["passage", "The exact passage that supports an answer", BookOpen],
              ["quiz", "Practice questions and explanations", ListChecks],
            ] as const
          ).map(([kind, description, Icon]) => (
            <div
              key={kind}
              className="flex items-center gap-3 rounded-xl border border-[#f0f0f0] bg-parchment/60 p-3"
            >
              <span
                className={cn(
                  "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ring-1",
                  KIND_META[kind].iconClass,
                )}
              >
                <Icon className="h-4 w-4" />
              </span>
              <span className="text-[11.5px] leading-5 text-ink-600">{description}</span>
            </div>
          ))}
        </div>
      </div>
      <div className="border-t border-[#f0f0f0] bg-parchment/50 px-6 py-3 text-[10.5px] text-ink-400 sm:px-8">
        Demo documents work too. Live uploads appear here as soon as extraction finishes.
      </div>
    </div>
  );
}
