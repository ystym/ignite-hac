"use client";

import { useState } from "react";
import {
  AlertCircle,
  CheckCircle2,
  Database,
  KeyRound,
  RefreshCw,
  ServerCog,
  Sparkles,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";
import { apiFetch, errorMessage } from "@/lib/client/api";
import type { AIStatus } from "@/lib/env";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ModeBadge } from "@/components/mode-badges";

type WorkspaceSnapshot = {
  documents: number;
  demoDocuments: number;
  liveDocuments: number;
  notes: number;
  quizAttempts: number;
};

type StatusResponse = {
  ai: AIStatus;
  workspace: WorkspaceSnapshot;
  time: string;
};

type TestResponse = {
  configured: boolean;
  ok?: boolean;
  model?: string;
  latencyMs?: number;
  text?: string;
  message?: string;
};

function clockTime(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "unknown";
  return date.toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    timeZone: "UTC",
  });
}

export function SetupDiagnostics({
  initialAi,
  initialWorkspace,
  initialTime,
  hasKey,
}: {
  initialAi: AIStatus;
  initialWorkspace: WorkspaceSnapshot;
  initialTime: string;
  hasKey: boolean;
}) {
  const [ai, setAi] = useState(initialAi);
  const [workspace, setWorkspace] = useState(initialWorkspace);
  const [snapshotAt, setSnapshotAt] = useState(initialTime);
  const [refreshing, setRefreshing] = useState(false);
  const [testing, setTesting] = useState(false);
  const [test, setTest] = useState<TestResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function refresh() {
    if (refreshing) return;
    setRefreshing(true);
    setError(null);
    try {
      const data = await apiFetch<StatusResponse>("/api/status", { cache: "no-store" });
      setAi(data.ai);
      setWorkspace(data.workspace);
      setSnapshotAt(data.time);
      toast.success("Status refreshed", {
        description: "The server was queried again with a no-store request.",
      });
    } catch (caught) {
      const message = errorMessage(caught);
      setError(message);
      toast.error("Could not refresh status", { description: message });
    } finally {
      setRefreshing(false);
    }
  }

  async function testConnection() {
    if (!ai.configured || testing) return;
    setTesting(true);
    setTest(null);
    setError(null);
    try {
      const data = await apiFetch<TestResponse>("/api/ai/test", { method: "POST" });
      setTest(data);
      if (data.ok) {
        toast.success("Gemini responded", {
          description: `${data.model ?? ai.model} · ${data.latencyMs ?? 0} ms`,
        });
      } else {
        toast.error("Gemini test failed", {
          description: data.message ?? "The provider returned an error.",
        });
      }
    } catch (caught) {
      const message = errorMessage(caught);
      setError(message);
      toast.error("Could not run the connection test", { description: message });
    } finally {
      setTesting(false);
    }
  }

  const checks = [
    {
      icon: KeyRound,
      label: "Gemini API key",
      value: hasKey ? "Detected server-side" : "Not set",
      detail: hasKey
        ? "Loaded from .env. It is never sent to the browser."
        : "Add GEMINI_API_KEY to .env, then restart the dev server.",
      ok: hasKey,
    },
    {
      icon: ServerCog,
      label: "Live calls",
      value: ai.configured ? "Enabled" : ai.forceDemo ? "Forced demo" : "Disabled",
      detail: ai.reason ?? "Key and demo-mode gates both pass.",
      ok: ai.configured,
    },
    {
      icon: Sparkles,
      label: "Generation model",
      value: ai.model,
      detail: "Used for extraction, notes, quizzes, plans and grounded answers.",
      ok: true,
    },
    {
      icon: Database,
      label: "Embedding model",
      value: `${ai.embeddingModel} · ${ai.embeddingDimensions} dims`,
      detail: "Vectors are persisted in SQLite and reused for retrieval.",
      ok: true,
    },
    {
      icon: Database,
      label: "Workspace database",
      value: `${workspace.documents} document${workspace.documents === 1 ? "" : "s"} reachable`,
      detail: "A read-only aggregate query succeeded through the app database.",
      ok: true,
    },
  ];

  return (
    <div className="grid gap-5 lg:grid-cols-[minmax(0,1.35fr)_minmax(290px,0.65fr)]">
      <section className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-card">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 bg-[linear-gradient(135deg,#F8F5FF,#FFFFFF)] px-5 py-4">
          <div className="flex items-center gap-3">
            <span
              className={cn(
                "flex h-9 w-9 items-center justify-center rounded-xl",
                ai.configured ? "bg-emerald-50 text-emerald-600" : "bg-amber-50 text-amber-600",
              )}
            >
              <ServerCog className="h-[18px] w-[18px]" />
            </span>
            <div>
              <h2 className="font-display text-[16px] font-bold text-ink-900">Connection diagnostics</h2>
              <p className="text-[10.5px] text-ink-400">
                Configuration is checked on the server. Nothing is inferred from the user interface.
              </p>
            </div>
          </div>
          <ModeBadge mode={ai.configured ? "LIVE" : "DEMO"} />
        </div>

        <div className="divide-y divide-slate-100">
          {checks.map((check) => (
            <div key={check.label} className="flex items-start gap-3 px-5 py-3">
              <span
                className={cn(
                  "mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg",
                  check.ok ? "bg-emerald-50 text-emerald-600" : "bg-amber-50 text-amber-600",
                )}
              >
                <check.icon className="h-3.5 w-3.5" />
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                  <p className="text-[11.5px] font-bold text-ink-800">{check.label}</p>
                  <span className="font-mono text-[10px] text-ink-500">{check.value}</span>
                </div>
                <p className="mt-0.5 text-[10.5px] leading-4 text-ink-400">{check.detail}</p>
              </div>
              {check.ok ? (
                <CheckCircle2 className="mt-1 h-3.5 w-3.5 shrink-0 text-emerald-500" aria-label="Passing" />
              ) : (
                <AlertCircle className="mt-1 h-3.5 w-3.5 shrink-0 text-amber-500" aria-label="Needs setup" />
              )}
            </div>
          ))}
        </div>

        <div className="border-t border-slate-100 bg-slate-50/60 p-5">
          <div className="flex flex-wrap items-center gap-2">
            <Button
              type="button"
              size="sm"
              variant="violet"
              onClick={testConnection}
              loading={testing}
              disabled={!ai.configured}
              title={
                ai.configured
                  ? "Make one minimal live generation call to Gemini"
                  : "Add GEMINI_API_KEY to enable the live test"
              }
            >
              {!testing && <Sparkles className="h-3.5 w-3.5" />} Test Gemini connection
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={refresh}
              loading={refreshing}
            >
              {!refreshing && <RefreshCw className="h-3.5 w-3.5" />} Refresh status
            </Button>
            <span className="ml-auto text-[9.5px] text-ink-300">
              Snapshot {clockTime(snapshotAt)}
            </span>
          </div>

          {!ai.configured && (
            <p className="mt-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-[10.5px] leading-4 text-amber-800">
              The connection test is disabled because no key is configured. Curated demo content stays
              available; this app never fabricates a successful test.
            </p>
          )}

          {test && (
            <div
              className={cn(
                "mt-3 rounded-xl border p-3",
                test.ok
                  ? "border-emerald-200 bg-emerald-50"
                  : "border-rose-200 bg-rose-50",
              )}
            >
              <div className="flex items-start gap-2">
                {test.ok ? (
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                ) : (
                  <XCircle className="mt-0.5 h-4 w-4 shrink-0 text-rose-600" />
                )}
                <div className="min-w-0 flex-1">
                  <p
                    className={cn(
                      "text-[11.5px] font-bold",
                      test.ok ? "text-emerald-900" : "text-rose-900",
                    )}
                  >
                    {test.ok ? "Live call succeeded" : "Live call failed"}
                  </p>
                  <p
                    className={cn(
                      "mt-0.5 text-[10.5px] leading-4",
                      test.ok ? "text-emerald-800" : "text-rose-800",
                    )}
                  >
                    {test.message}
                  </p>
                  {test.ok && (
                    <p className="mt-1 font-mono text-[9.5px] text-emerald-700/80">
                      {test.model} · {test.latencyMs} ms · reply “{test.text}”
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {error && (
            <div className="mt-3 flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-rose-600" />
              <p className="text-[11px] leading-5 text-rose-800">{error}</p>
            </div>
          )}
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-card">
        <div className="flex items-center justify-between gap-2">
          <h2 className="font-display text-[16px] font-bold text-ink-900">Workspace right now</h2>
          <Badge variant="default">SQLite</Badge>
        </div>
        <p className="mt-1 text-[10.5px] leading-4 text-ink-400">
          Real persisted counts from the same database the pages read.
        </p>

        <div className="mt-4 grid grid-cols-2 gap-2.5">
          {[
            { label: "Documents", value: workspace.documents },
            { label: "Curated demo docs", value: workspace.demoDocuments },
            { label: "Notes stored", value: workspace.notes },
            { label: "Quiz attempts", value: workspace.quizAttempts },
          ].map((item) => (
            <div key={item.label} className="rounded-xl border border-slate-100 bg-slate-50/70 p-3">
              <p className="font-display text-xl font-extrabold tracking-[-0.04em] text-ink-950">
                {item.value}
              </p>
              <p className="mt-0.5 text-[9.5px] font-medium uppercase tracking-wider text-ink-400">
                {item.label}
              </p>
            </div>
          ))}
        </div>

        <div className="mt-4 space-y-1.5 border-t border-slate-100 pt-3 text-[10.5px] leading-5 text-ink-400">
          <p>
            {workspace.liveDocuments === 0
              ? "No live documents yet. Every stored document is a curated sample."
              : `${workspace.liveDocuments} live document${workspace.liveDocuments === 1 ? "" : "s"} in this workspace.`}
          </p>
          <p>
            Counting documents does not prove AI accuracy. Open a document to inspect its extraction,
            warnings and citations.
          </p>
        </div>
      </section>
    </div>
  );
}
