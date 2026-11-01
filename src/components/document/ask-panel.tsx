"use client";

import { useEffect, useRef, useState } from "react";
import {
  AlertCircle,
  ArrowUp,
  BookOpenCheck,
  Info,
  Loader2,
  MessagesSquare,
  ShieldQuestion,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import type { DocumentDetail } from "@/lib/documents";
import type { ChatMessageView } from "@/lib/schemas";
import { formatSeconds, percent } from "@/lib/utils";
import { apiFetch, errorMessage } from "@/lib/client/api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Callout } from "@/components/ui/callout";
import { EmptyState } from "@/components/ui/empty-state";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/input";
import { ModeBadge } from "@/components/mode-badges";
import { TimeAgo } from "@/components/time-ago";

type AskResponse = {
  message: ChatMessageView;
  noAnswer: boolean;
  mode: "LIVE" | "DEMO";
};

export function AskPanel({
  document,
  initialMessages,
  aiConfigured,
}: {
  document: DocumentDetail;
  initialMessages: ChatMessageView[];
  aiConfigured: boolean;
}) {
  const [messages, setMessages] = useState<ChatMessageView[]>(initialMessages);
  const [question, setQuestion] = useState("");
  const [sending, setSending] = useState(false);
  const [clearing, setClearing] = useState(false);
  const [clearOpen, setClearOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const endRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const demoDocument = document.mode === "DEMO";
  const canAsk =
    document.status === "READY" &&
    document.indexStatus === "READY" &&
    (demoDocument || aiConfigured);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages.length, sending]);

  async function ask(value: string) {
    const trimmed = value.trim();
    if (trimmed.length < 2 || sending) return;

    const optimistic: ChatMessageView = {
      id: `optimistic-${Date.now()}`,
      role: "user",
      content: trimmed,
      sources: [],
      confidence: null,
      createdAt: new Date().toISOString(),
      mode: demoDocument ? "DEMO" : "LIVE",
    };
    setMessages((current) => [...current, optimistic]);
    setQuestion("");
    setSending(true);
    setError(null);

    try {
      const response = await apiFetch<AskResponse>(`/api/documents/${document.id}/ask`, {
        method: "POST",
        body: { question: trimmed },
      });
      setMessages((current) => [...current, response.message]);
      if (response.noAnswer) {
        toast.info("No grounded answer", {
          description: "The material did not contain a passage that supports an answer.",
        });
      }
    } catch (caught) {
      const message = errorMessage(caught);
      setError(message);
      setMessages((current) => current.filter((item) => item.id !== optimistic.id));
      setQuestion(trimmed);
      toast.error("Could not answer", { description: message });
    } finally {
      setSending(false);
      textareaRef.current?.focus();
    }
  }

  async function clearConversation() {
    setClearing(true);
    setError(null);
    try {
      await apiFetch(`/api/documents/${document.id}/ask`, { method: "DELETE" });
      setMessages([]);
      setClearOpen(false);
      toast.success("Conversation cleared", {
        description: "This document's chat history was deleted. The material is unchanged.",
      });
    } catch (caught) {
      const message = errorMessage(caught);
      setError(message);
      toast.error("Could not clear the conversation", { description: message });
    } finally {
      setClearing(false);
    }
  }

  const suggestions = buildSuggestions(document, messages.length > 0);

  if (document.status !== "READY") {
    return (
      <EmptyState
        icon={MessagesSquare}
        title="Answers unlock when extraction is ready"
        description="The grounded assistant only answers from indexed source passages. It will not be opened on an empty or failed document."
      />
    );
  }

  return (
    <div className="space-y-4">
      {demoDocument && (
        <Callout variant="info" title="Demo answers are not live model output">
          Demo questions use local hashed-token retrieval over curated passages and return extractive
          quotes. The preseeded conversation is authored sample content. With a Gemini key, live
          documents use Gemini embeddings and a grounded generation step that must cite a retrieved
          chunk.
        </Callout>
      )}

      {!demoDocument && !aiConfigured && (
        <Callout variant="warning" title="Answering this live document needs a Gemini key">
          Its indexed passages are still stored. Add{" "}
          <code className="rounded bg-white/70 px-1">GEMINI_API_KEY</code> and restart to query them.
        </Callout>
      )}

      {document.indexStatus !== "READY" && (
        <Callout variant="warning" title="The search index is not ready">
          Rebuild the search index from the Extracted tab. Asking now would search stale or empty
          vectors.
        </Callout>
      )}

      {error && (
        <div className="flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-rose-600" />
          <p className="text-[12px] leading-5 text-rose-800">{error}</p>
        </div>
      )}

      <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-card">
        <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3.5 sm:px-5">
          <div className="flex items-center gap-2.5">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-50 text-violet-600">
              <MessagesSquare className="h-4 w-4" />
            </span>
            <div>
              <h2 className="text-[13px] font-bold text-ink-900">Ask this material</h2>
              <p className="text-[10px] text-ink-400">
                {messages.length} message{messages.length === 1 ? "" : "s"} · answers cite retrieved
                passages
              </p>
            </div>
          </div>
          <Dialog open={clearOpen} onOpenChange={setClearOpen}>
            <DialogTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                disabled={messages.length === 0}
                title="Clear this conversation"
              >
                <Trash2 className="h-3.5 w-3.5" /> Clear
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Clear this conversation?</DialogTitle>
                <DialogDescription>
                  The chat history for this document will be deleted. Extracted text, notes and quizzes
                  are not affected.
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <DialogClose asChild>
                  <Button type="button" variant="outline">
                    Keep it
                  </Button>
                </DialogClose>
                <Button
                  type="button"
                  variant="danger"
                  onClick={clearConversation}
                  loading={clearing}
                >
                  Clear conversation
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        <div className="max-h-[600px] min-h-[330px] space-y-4 overflow-y-auto bg-[#FBFBFE] p-4 sm:p-5">
          {messages.length === 0 && (
            <div className="flex h-full min-h-[280px] flex-col items-center justify-center text-center">
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-violet-50 text-violet-600 ring-1 ring-violet-100">
                <ShieldQuestion className="h-6 w-6" />
              </span>
              <h3 className="mt-4 font-display text-[16px] font-bold text-ink-900">
                Ask only what the material supports
              </h3>
              <p className="mt-1.5 max-w-md text-[12px] leading-5 text-ink-500">
                The assistant retrieves the six closest passages and answers with citations. If nothing
                is relevant, it says so instead of guessing.
              </p>
              {suggestions.length > 0 && (
                <div className="mt-4 flex max-w-lg flex-wrap justify-center gap-2">
                  {suggestions.map((suggestion) => (
                    <button
                      key={suggestion}
                      type="button"
                      onClick={() => ask(suggestion)}
                      disabled={!canAsk}
                      className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-[11px] font-medium text-ink-600 transition hover:border-violet-200 hover:bg-violet-50 hover:text-violet-800 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {messages.map((message) =>
            message.role === "user" ? (
              <div key={message.id} className="flex justify-end">
                <div className="max-w-[86%] rounded-2xl rounded-br-md bg-ink-900 px-4 py-2.5 text-[12.5px] leading-6 text-white shadow-sm">
                  {message.content}
                </div>
              </div>
            ) : (
              <div key={message.id} className="flex justify-start">
                <div className="w-full max-w-[92%] rounded-2xl rounded-bl-md border border-slate-200/80 bg-white p-4 shadow-sm">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.12em] text-violet-600">
                      <BookOpenCheck className="h-3 w-3" /> Study assistant
                    </span>
                    {message.mode === "DEMO" ? (
                      <Badge
                        variant="amber"
                        size="sm"
                        title="Demo response: curated or locally retrieved content. Not a live model run."
                      >
                        Demo response
                      </Badge>
                    ) : (
                      <ModeBadge mode="LIVE" />
                    )}
                    {message.sources.length === 0 && (
                      <Badge variant="orange" size="sm">
                        No supporting passage
                      </Badge>
                    )}
                    <span className="ml-auto text-[9.5px] text-ink-300">
                      <TimeAgo value={message.createdAt} />
                    </span>
                  </div>
                  <p className="mt-2.5 whitespace-pre-line text-[12.5px] leading-6 text-ink-700">
                    {message.content}
                  </p>

                  {message.sources.length > 0 && (
                    <div className="mt-3 space-y-2">
                      <p className="text-[9.5px] font-bold uppercase tracking-[0.14em] text-ink-400">
                        Sources · {message.sources.length}
                      </p>
                      {message.sources.map((source) => (
                        <div
                          key={source.chunkId}
                          className="rounded-xl border border-slate-100 bg-slate-50/70 p-2.5"
                        >
                          <div className="flex flex-wrap items-center gap-2">
                            <Badge variant="violet" size="sm">
                              {source.label}
                            </Badge>
                            {source.page != null && (
                              <span className="font-mono text-[9px] text-ink-400">
                                Page {source.page}
                              </span>
                            )}
                            {source.startSeconds != null && (
                              <span className="font-mono text-[9px] text-ink-400">
                                {formatSeconds(source.startSeconds)}
                                {source.endSeconds != null ? `–${formatSeconds(source.endSeconds)}` : ""}
                              </span>
                            )}
                            <span className="ml-auto font-mono text-[9px] text-ink-400">
                              relevance {percent(source.relevance)}
                            </span>
                          </div>
                          <p className="mt-1.5 line-clamp-3 text-[10.5px] leading-4 text-ink-500">
                            {source.excerpt}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}

                  {message.sources.length === 0 && (
                    <p className="mt-2 flex items-start gap-1.5 rounded-lg border border-amber-100 bg-amber-50 px-2.5 py-2 text-[10px] leading-4 text-amber-800">
                      <Info className="mt-0.5 h-3 w-3 shrink-0" />
                      No citation crossed the relevance threshold. A grounded assistant refuses rather
                      than inventing an answer.
                    </p>
                  )}
                </div>
              </div>
            ),
          )}

          {sending && (
            <div className="flex justify-start">
              <div className="inline-flex items-center gap-2 rounded-2xl border border-slate-200/80 bg-white px-4 py-3 text-[11.5px] text-ink-500 shadow-sm">
                <Loader2 className="h-3.5 w-3.5 animate-spin text-violet-500" />
                Retrieving passages and checking grounding…
              </div>
            </div>
          )}
          <div ref={endRef} />
        </div>

        <div className="border-t border-slate-100 bg-white p-3.5 sm:p-4">
          {suggestions.length > 0 && messages.length > 0 && (
            <div className="no-scrollbar mb-2.5 flex gap-2 overflow-x-auto">
              {suggestions.slice(0, 3).map((suggestion) => (
                <button
                  key={suggestion}
                  type="button"
                  onClick={() => ask(suggestion)}
                  disabled={!canAsk || sending}
                  className="shrink-0 rounded-full border border-slate-200 px-2.5 py-1 text-[10px] font-medium text-ink-500 transition hover:border-violet-200 hover:bg-violet-50 hover:text-violet-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          )}
          <form
            onSubmit={(event) => {
              event.preventDefault();
              ask(question);
            }}
            className="flex items-end gap-2"
          >
            <Textarea
              ref={textareaRef}
              value={question}
              onChange={(event) => setQuestion(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter" && !event.shiftKey) {
                  event.preventDefault();
                  ask(question);
                }
              }}
              placeholder={
                canAsk
                  ? "Ask about a concept, formula or definition in this material…"
                  : document.indexStatus !== "READY"
                    ? "Rebuild the search index to enable questions."
                    : "Add a Gemini key to ask this live document."
              }
              className="min-h-[48px] max-h-[160px] resize-none text-[12.5px]"
              rows={2}
              maxLength={1_000}
              disabled={!canAsk || sending}
              aria-label="Question about this material"
            />
            <Button
              type="submit"
              size="icon"
              variant="violet"
              className="mb-0.5 h-11 w-11 shrink-0 rounded-xl"
              disabled={!canAsk || sending || question.trim().length < 2}
              aria-label="Send question"
            >
              {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowUp className="h-4 w-4" />}
            </Button>
          </form>
          <p className="mt-1.5 px-1 text-[9.5px] leading-4 text-ink-300">
            Enter to send · Shift+Enter for a new line · answers are limited to retrieved source
            passages.
          </p>
        </div>
      </div>
    </div>
  );
}

function buildSuggestions(document: DocumentDetail, compact: boolean): string[] {
  const base = [
    "What are the key ideas in this material?",
    "Which formulas or definitions matter most?",
    "What is uncertain or unreadable here?",
    "How should I revise this for an exam?",
  ];
  if (document.fileType === "audio") {
    return compact ? base.slice(0, 2) : [
      "What did the lecture say about the main topic?",
      "Which parts of the recording were unclear?",
      ...base.slice(1, 3),
    ];
  }
  return compact ? base.slice(0, 2) : base;
}
