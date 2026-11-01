import Link from "next/link";
import {
  ArrowRight,
  CheckCircle2,
  Database,
  FileText,
  FlaskConical,
  Gauge,
  GraduationCap,
  KeyRound,
  Lock,
  ShieldAlert,
  Sparkles,
  Timer,
  TriangleAlert,
} from "lucide-react";
import { prisma } from "@/lib/db";
import { getAIStatus } from "@/lib/env";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Callout } from "@/components/ui/callout";
import { SetupDiagnostics } from "@/components/setup/setup-diagnostics";
import { CopyButton } from "@/components/setup/copy-button";

export const dynamic = "force-dynamic";

export const metadata = { title: "Setup & status" };

const ENV_SNIPPET = `DATABASE_URL="file:../data/studymate.db"

# Required for live AI. Create one at https://aistudio.google.com/apikey
GEMINI_API_KEY="paste-your-key-here"

# Optional overrides — these are the defaults
GEMINI_MODEL="gemini-3-flash-preview"
GEMINI_EMBEDDING_MODEL="gemini-embedding-001"
GEMINI_EMBEDDING_DIMENSIONS="768"
GEMINI_THINKING_LEVEL="low"
FORCE_DEMO_MODE="false"
`;

const SETUP_COMMANDS = `npm install

# Windows PowerShell
Copy-Item .env.example .env
# macOS / Linux: cp .env.example .env

npm run setup
npm run dev`;

const CONFIG_ROWS = [
  {
    variable: "DATABASE_URL",
    required: "Yes",
    fallback: "file:../data/studymate.db",
    purpose: "SQLite file resolved relative to prisma/schema.prisma.",
  },
  {
    variable: "GEMINI_API_KEY",
    required: "For live AI",
    fallback: "empty",
    purpose: "Server-side only. Without it the app runs in Demo Mode.",
  },
  {
    variable: "GEMINI_MODEL",
    required: "No",
    fallback: "gemini-3-flash-preview",
    purpose: "Vision OCR, audio transcription, notes, quizzes, plans and answers.",
  },
  {
    variable: "GEMINI_EMBEDDING_MODEL",
    required: "No",
    fallback: "gemini-embedding-001",
    purpose: "Embedding model for the persisted retrieval index.",
  },
  {
    variable: "GEMINI_EMBEDDING_DIMENSIONS",
    required: "No",
    fallback: "768",
    purpose: "Vector size. Changing it requires rebuilding every index.",
  },
  {
    variable: "FORCE_DEMO_MODE",
    required: "No",
    fallback: "false",
    purpose: "Keep the curated demo even when a key exists. Useful for judging without spend.",
  },
  {
    variable: "NEXT_PUBLIC_APP_URL",
    required: "No",
    fallback: "http://localhost:3000",
    purpose: "Metadata and deployment links only. Never used for AI calls.",
  },
];

const CAPABILITIES = [
  {
    capability: "Arbitrary image, PDF and audio upload",
    live: "Processed through the live pipeline",
    demo: "Blocked by design",
    blocked: true,
  },
  {
    capability: "Vision OCR and audio transcription",
    live: "Gemini, with block confidence and uncertainty warnings",
    demo: "Curated examples only",
    blocked: false,
  },
  {
    capability: "Diagram labels and relationship summaries",
    live: "Diagram blocks capture captions, labels, axes, legends and visible links",
    demo: "Curated examples only",
    blocked: false,
  },
  {
    capability: "Notes in Simple English or Hinglish",
    live: "Generated, schema-validated and grounded in the extraction",
    demo: "Curated samples, read-only",
    blocked: false,
  },
  {
    capability: "Learn a topic outside the uploaded material",
    live: "Separate general-knowledge notes, labelled and never indexed",
    demo: "Disabled — no fabricated topic notes",
    blocked: true,
  },
  {
    capability: "Grounded MCQ quizzes",
    live: "Generated, excerpt-checked and server-scored",
    demo: "Curated quizzes; attempts are still genuinely scored",
    blocked: false,
  },
  {
    capability: "Day-by-day study planner",
    live: "Gemini plan, date-bounded and length-capped",
    demo: "Deterministic scheduler, labelled Non-AI",
    blocked: false,
  },
  {
    capability: "Cited document Q&A",
    live: "Gemini embeddings, grounded answer or explicit refusal",
    demo: "Local token retrieval with extractive demo answers",
    blocked: false,
  },
  {
    capability: "Manual correction and index rebuild",
    live: "Available; persisted locally",
    demo: "Available; rebuilds local demo vectors",
    blocked: false,
  },
  {
    capability: "Reliability live test",
    live: "Stores the actual model output unchanged",
    demo: "Curated reference only; live run disabled",
    blocked: true,
  },
];

const LIMITS = [
  {
    icon: Lock,
    title: "One local workspace",
    body: "There is no authentication or per-user ownership. Anyone who can open the app can read and delete everything in the database. Keep it local, or add real auth and tenant isolation before deploying it publicly.",
  },
  {
    icon: Gauge,
    title: "Confidence is self-reported",
    body: "Every confidence value is the model's own estimate. It is not a calibrated probability, and this project never claims an accuracy percentage. Use it to decide what to verify, not as proof of correctness.",
  },
  {
    icon: ShieldAlert,
    title: "Grounding is a guardrail, not a guarantee",
    body: "Quiz generation checks that a quoted source excerpt really exists, and live Q&A rejects answers without a citation. That proves the quote exists — not that the explanation, formula or pedagogical judgment is correct.",
  },
  {
    icon: GraduationCap,
    title: "Topic notes are external knowledge",
    body: "Learn a topic does not read your uploads. Its notes are general knowledge, kept out of the database index, the grounded notes, quizzes and cited answers, and labelled as external everywhere they appear. Verify them against your own syllabus.",
  },
  {
    icon: Timer,
    title: "Live AI needs network and quota",
    body: "Live extraction, notes, quizzes, plans and answers call Gemini. Rate limits, quota exhaustion or provider outages surface as errors with retry guidance. The app does not silently substitute curated content for a failed live run.",
  },
  {
    icon: FileText,
    title: "Hard file and size limits",
    body: "Images up to 10 MB, PDFs up to 20 MB, audio up to 25 MB, and typed material up to 200,000 characters. Plans cap at 60 days and AI quizzes at 10 questions. Larger or unsupported files are rejected before processing.",
  },
  {
    icon: Database,
    title: "SQLite and local disk",
    body: "Data lives in data/studymate.db and uploaded originals in data/uploads. This is intentional for a local demo: simple to inspect and reset. It is not a production multi-user database.",
  },
];

export default async function SetupPage() {
  const ai = getAIStatus();
  const hasKey = Boolean(process.env.GEMINI_API_KEY?.trim());
  const [documents, demoDocuments, notes, quizAttempts] = await Promise.all([
    prisma.document.count(),
    prisma.document.count({ where: { mode: "DEMO" } }),
    prisma.note.count(),
    prisma.quizAttempt.count(),
  ]);
  const snapshotAt = new Date().toISOString();

  return (
    <div>
      <PageHeader
        eyebrow="Setup & status"
        title="Know exactly what is live."
        description="This page reports server-side configuration and persisted workspace facts. Configuration is not the same as a successful model call — run the connection test to verify the provider actually responds."
        actions={
          <Button asChild variant="outline">
            <Link href="/reliability">
              <FlaskConical className="h-4 w-4" /> See the honesty tests
            </Link>
          </Button>
        }
      />

      {ai.configured ? (
        <Callout variant="success" title="Live AI is configured" className="mb-5">
          A Gemini key is loaded on the server only. Run the connection test below to confirm a real
          provider response before trusting any live feature. Model-reported output can still be wrong;
          inspect the source and the warnings.
        </Callout>
      ) : (
        <Callout variant="warning" title="Demo Mode is active" className="mb-5">
          Curated samples are labelled everywhere and arbitrary uploads are intentionally blocked.
          Add a Gemini key below, restart the server, then run the connection test. Until then, every
          AI-looking sample on this site is authored demo content, not a live run.
        </Callout>
      )}

      <SetupDiagnostics
        initialAi={ai}
        initialWorkspace={{
          documents,
          demoDocuments,
          liveDocuments: Math.max(0, documents - demoDocuments),
          notes,
          quizAttempts,
        }}
        initialTime={snapshotAt}
        hasKey={hasKey}
      />

      <section id="live-setup" className="mt-9 scroll-mt-24">
        <div className="mb-4">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-violet-600">
            Live setup
          </p>
          <h2 className="mt-1 font-display text-[clamp(1.35rem,2.2vw,1.75rem)] font-semibold tracking-[-0.03em] text-ink-950">
            Switch from curated demo to live AI
          </h2>
          <p className="mt-1.5 max-w-3xl text-[12.5px] leading-6 text-ink-500">
            The demo is a complete, inspectable workspace — not a fallback that pretends to be AI.
            Live mode uses the same UI and pipeline, with real Gemini calls in place of curated output.
          </p>
        </div>

        <div className="grid min-w-0 gap-5 xl:grid-cols-[1.06fr_0.94fr]">
          <div className="min-w-0 rounded-2xl border border-hairline bg-white p-5 sm:p-6">
            <div className="flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-50 text-violet-600">
                <Sparkles className="h-4 w-4" />
              </span>
              <h3 className="font-display text-[15px] font-semibold text-ink-900">From zero to running</h3>
              <Badge variant="default" className="ml-auto">
                Node 20+
              </Badge>
            </div>

            <ol className="mt-4 space-y-3">
              {[
                {
                  title: "Install dependencies",
                  body: "Prisma Client is generated by postinstall as well, so the first install is enough.",
                },
                {
                  title: "Create the environment file",
                  body: "Start from the documented template. Paste your Gemini key into GEMINI_API_KEY. The key is read on the server only.",
                },
                {
                  title: "Create the database and curated samples",
                  body: "Applies the SQLite migration and seeds the idempotent demo workspace. Safe to run again.",
                },
                {
                  title: "Start the app and verify",
                  body: "Open http://localhost:3000, then run Test Gemini connection above. A green result is a real provider response.",
                },
              ].map((step, index) => (
                <li key={step.title} className="flex items-start gap-3">
                  <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-ink-900 font-mono text-[10px] font-semibold text-white">
                    {index + 1}
                  </span>
                  <div>
                    <p className="text-[12px] font-semibold text-ink-800">{step.title}</p>
                    <p className="mt-0.5 text-[11px] leading-5 text-ink-500">{step.body}</p>
                  </div>
                </li>
              ))}
            </ol>

            <div className="mt-4 overflow-hidden rounded-xl border border-ink-800 bg-ink-950">
              <div className="flex items-center justify-between border-b border-white/10 px-3.5 py-2">
                <span className="text-[9px] font-semibold uppercase tracking-[0.16em] text-white/40">
                  Terminal
                </span>
                <span className="font-mono text-[9px] text-white/30">bash / PowerShell</span>
              </div>
              <pre className="overflow-x-auto p-4 font-mono text-[11px] leading-6 text-white/80">
                <code>{SETUP_COMMANDS}</code>
              </pre>
            </div>

            <p className="mt-3 flex items-start gap-1.5 text-[10px] leading-4 text-ink-400">
              <TriangleAlert className="mt-0.5 h-3 w-3 shrink-0 text-amber-500" />
              Restart the dev server after editing .env. Use <code className="rounded bg-[#e8e8ed] px-1">npm run db:push</code>{" "}
              for a fresh database without the seed, or <code className="rounded bg-[#e8e8ed] px-1">npm run db:seed</code>{" "}
              to reload only the demo.
            </p>
          </div>

          <div className="min-w-0 space-y-4">
            <div className="min-w-0 overflow-hidden rounded-2xl border border-hairline bg-white">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#f0f0f0] px-5 py-3.5">
                <div className="flex items-center gap-2">
                  <KeyRound className="h-4 w-4 text-violet-600" />
                  <h3 className="text-[12.5px] font-semibold text-ink-900">Minimum live configuration</h3>
                </div>
                <CopyButton value={ENV_SNIPPET} label="Copy .env" />
              </div>
              <pre className="overflow-x-auto bg-parchment p-4 font-mono text-[10.5px] leading-5 text-ink-600">
                <code>{ENV_SNIPPET}</code>
              </pre>
              <p className="border-t border-[#f0f0f0] bg-parchment/60 px-4 py-2.5 text-[10px] leading-4 text-ink-400">
                Never commit <code className="rounded bg-white px-1">.env</code>. The key is not
                prefixed with <code className="rounded bg-white px-1">NEXT_PUBLIC_</code>, so it stays
                out of client bundles.
              </p>
            </div>

            <div className="rounded-2xl border border-emerald-200/70 bg-emerald-50/50 p-5">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                <h3 className="text-[12.5px] font-semibold text-emerald-900">What to verify, honestly</h3>
              </div>
              <ul className="mt-2.5 space-y-2">
                {[
                  "The connection test returns STUDYMATE_READY from the provider.",
                  "An uploaded file reaches READY and shows real extraction warnings.",
                  "A quiz shows source excerpts that exist in the extracted text.",
                  "Ask refuses an off-topic question instead of inventing an answer.",
                  "The reliability live test stores the model's actual Q7 uncertainty.",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-2 text-[11px] leading-5 text-ink-600">
                    <CheckCircle2 className="mt-0.5 h-3 w-3 shrink-0 text-emerald-500" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      <section className="mt-9">
        <div className="mb-3 flex flex-col justify-between gap-2 sm:flex-row sm:items-end">
          <div>
            <h2 className="font-display text-xl font-semibold text-ink-900">What changes with a key</h2>
            <p className="mt-0.5 text-[11.5px] text-ink-400">
              Same interface, same database. The table states exactly which behaviour is live and which
              is curated.
            </p>
          </div>
          <Button asChild variant="ghost" size="sm" className="shrink-0">
            <Link href="/upload">
              Upload real material <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </Button>
        </div>

        <div className="min-w-0 overflow-hidden rounded-2xl border border-hairline bg-white">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-left">
              <thead>
                <tr className="border-b border-[#f0f0f0] bg-parchment text-[9.5px] font-semibold uppercase tracking-[0.13em] text-ink-400">
                  <th className="px-5 py-3 font-semibold">Capability</th>
                  <th className="px-5 py-3 font-semibold">With GEMINI_API_KEY</th>
                  <th className="px-5 py-3 font-semibold">Without a key (Demo Mode)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f0f0f0]">
                {CAPABILITIES.map((row) => (
                  <tr key={row.capability} className="align-top">
                    <td className="px-5 py-3 text-[11.5px] font-semibold text-ink-800">
                      {row.capability}
                    </td>
                    <td className="px-5 py-3 text-[11px] leading-5 text-ink-500">
                      <span className="mb-1 block">
                        <Badge variant="green" size="sm">
                          Live
                        </Badge>
                      </span>
                      {row.live}
                    </td>
                    <td className="px-5 py-3 text-[11px] leading-5 text-ink-500">
                      <span className="mb-1 block">
                        <Badge variant={row.blocked ? "rose" : "amber"} size="sm">
                          {row.blocked ? "Blocked" : "Curated"}
                        </Badge>
                      </span>
                      {row.demo}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="border-t border-[#f0f0f0] bg-parchment/60 px-5 py-3 text-[10px] leading-4 text-ink-400">
            Demo documents are read-only for AI note and quiz generation, but manual correction and local
            index rebuilding stay enabled so the reliability workflow remains inspectable.
          </p>
        </div>
      </section>

      <section className="mt-9">
        <div className="mb-3">
          <h2 className="font-display text-xl font-semibold text-ink-900">Environment reference</h2>
          <p className="mt-0.5 text-[11.5px] text-ink-400">
            Values are read by the server at request time. Secrets are never rendered on this page.
          </p>
        </div>
        <div className="min-w-0 overflow-hidden rounded-2xl border border-hairline bg-white">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-left">
              <thead>
                <tr className="border-b border-[#f0f0f0] bg-parchment text-[9.5px] font-semibold uppercase tracking-[0.13em] text-ink-400">
                  <th className="px-5 py-3 font-semibold">Variable</th>
                  <th className="px-5 py-3 font-semibold">Required</th>
                  <th className="px-5 py-3 font-semibold">Default</th>
                  <th className="px-5 py-3 font-semibold">Purpose</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f0f0f0]">
                {CONFIG_ROWS.map((row) => (
                  <tr key={row.variable}>
                    <td className="px-5 py-3">
                      <code className="rounded-md bg-[#e8e8ed] px-1.5 py-0.5 font-mono text-[10.5px] font-semibold text-ink-800">
                        {row.variable}
                      </code>
                    </td>
                    <td className="px-5 py-3 text-[10.5px] text-ink-500">{row.required}</td>
                    <td className="px-5 py-3 font-mono text-[10px] text-ink-400">{row.fallback}</td>
                    <td className="px-5 py-3 text-[10.5px] leading-5 text-ink-500">{row.purpose}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <section className="mt-9">
        <div className="mb-3">
          <h2 className="font-display text-xl font-semibold text-ink-900">Limits and honest boundaries</h2>
          <p className="mt-0.5 text-[11.5px] text-ink-400">
            These are part of the design, not footnotes. They are stated here so a demo cannot imply more
            than it does.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {LIMITS.map((limit) => (
            <article
              key={limit.title}
              className="rounded-2xl border border-hairline bg-white p-5"
            >
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#e8e8ed] text-ink-600">
                <limit.icon className="h-4 w-4" />
              </span>
              <h3 className="mt-3 text-[12.5px] font-semibold text-ink-900">{limit.title}</h3>
              <p className="mt-1.5 text-[11px] leading-5 text-ink-500">{limit.body}</p>
            </article>
          ))}
        </div>
      </section>

      <div className="mt-8 flex flex-col items-start justify-between gap-3 rounded-2xl border border-hairline bg-parchment p-5 sm:flex-row sm:items-center">
        <div className="flex items-start gap-2.5">
          <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0 text-violet-500" />
          <p className="max-w-2xl text-[10.5px] leading-5 text-ink-500">
            No accuracy percentage is claimed anywhere in this application. Confidence is model-reported,
            the reliability fixture is a demonstration of failure modes rather than a benchmark, and every
            curated sample is explicitly labelled.
          </p>
        </div>
        <div className="flex shrink-0 flex-wrap gap-2">
          <Button asChild variant="outline" size="sm">
            <Link href="/reliability">
              <FlaskConical className="h-3.5 w-3.5" /> Reliability lab
            </Link>
          </Button>
          <Button asChild variant="violet" size="sm">
            <Link href="/dashboard">
              Open dashboard <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
