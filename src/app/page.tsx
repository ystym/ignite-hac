import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  ArrowUpRight,
  AudioLines,
  CalendarRange,
  CheckCircle2,
  CircleHelp,
  FileSearch,
  FileText,
  Fingerprint,
  GraduationCap,
  ListChecks,
  MessagesSquare,
  NotebookPen,
  ScanText,
  Search,
  ShieldCheck,
  TriangleAlert,
} from "lucide-react";
import { BrandLockup } from "@/components/brand";
import { DemoLaunchButton } from "@/components/demo-launch-button";
import { Button } from "@/components/ui/button";
import { getAIStatus } from "@/lib/env";

const FEATURES = [
  {
    icon: ScanText,
    title: "Messy-input vision",
    body: "Tilted phone photos, uneven light, handwritten formulas and scans. Vision OCR transcribes only what is visible.",
  },
  {
    icon: AudioLines,
    title: "Lecture transcription",
    body: "Real Gemini audio understanding with approximate timestamps, preserved technical terms and inaudible markers.",
  },
  {
    icon: NotebookPen,
    title: "Notes that explain",
    body: "Topic-wise notes in simple English or Hinglish, with definitions, formulas, examples and exam tips.",
  },
  {
    icon: ListChecks,
    title: "Grounded quizzes",
    body: "Four-option MCQs with verified source excerpts, difficulty levels and server-side scoring.",
  },
  {
    icon: CalendarRange,
    title: "A realistic planner",
    body: "Day-by-day study, spaced revision, timed practice and buffer — built around your exam date and daily minutes.",
  },
  {
    icon: MessagesSquare,
    title: "Citation-backed answers",
    body: "Embedded chunks, semantic retrieval and page or audio citations. If it is not in your material, the assistant says so.",
  },
];

const STEPS = [
  {
    n: "01",
    title: "Bring the real thing",
    body: "A photo of your notebook, a scanned syllabus, a noisy lecture or typed notes. No clean-up required.",
  },
  {
    n: "02",
    title: "See exactly what was read",
    body: "Every block carries confidence. Ambiguous symbols are flagged, not guessed. Correct anything by hand.",
  },
  {
    n: "03",
    title: "Build your study set",
    body: "Generate notes and quizzes from the extracted source, then reindex with one click after corrections.",
  },
  {
    n: "04",
    title: "Ask, cite, revise",
    body: "Study with a grounded assistant, then follow a day-by-day plan that adapts as you complete topics.",
  },
];

export default function LandingPage() {
  const status = getAIStatus();

  return (
    <div className="min-h-screen overflow-x-hidden bg-transparent">
      <header className="sticky top-0 z-40 bg-black">
        <div className="container-marketing flex h-12 items-center justify-between gap-4">
          <BrandLockup inverse compact />
          <nav
            className="hidden items-center gap-7 text-[12px] font-normal text-white/70 md:flex"
            aria-label="Landing navigation"
          >
            <a href="#features" className="transition-colors hover:text-white">
              Capabilities
            </a>
            <a href="#how" className="transition-colors hover:text-white">
              How it works
            </a>
            <a href="#demo" className="transition-colors hover:text-white">
              Demo
            </a>
            <Link href="/reliability" className="transition-colors hover:text-white">
              Where it breaks
            </Link>
          </nav>
          <div className="flex shrink-0 items-center gap-4">
            <Link
              href="/dashboard"
              className="hidden text-[12px] text-white/70 transition-colors hover:text-white sm:inline"
            >
              Open workspace
            </Link>
            {status.mode === "live" ? (
              <Button asChild variant="primary" size="sm" className="h-10 px-4 text-[12px]">
                <Link href="/upload">Start studying</Link>
              </Button>
            ) : (
              <DemoLaunchButton
                variant="primary"
                size="sm"
                label="Try the demo"
                showIcon={false}
                className="h-10 px-4 text-[12px]"
              />
            )}
          </div>
        </div>
      </header>

      <main>
        {/* Hero — white parchment showing the web texture through the canvas. */}
        <section className="relative overflow-hidden">
          <div className="container-marketing pb-16 pt-16 text-center sm:pb-20 sm:pt-24">
            <div className="mx-auto flex items-center justify-center gap-2 text-[12px] text-ink-500">
              <span
                className={
                  status.mode === "live"
                    ? "h-1.5 w-1.5 rounded-full bg-emerald-500"
                    : "h-1.5 w-1.5 rounded-full bg-amber-500"
                }
              />
              <span>
                {status.mode === "live" ? "Live Gemini workspace" : "Curated demo ready"}
              </span>
              <span className="text-ink-300">·</span>
              <span>Multimodal study intelligence</span>
            </div>

            <h1 className="mx-auto mt-5 max-w-[820px] font-display text-[clamp(2.4rem,6.4vw,3.9rem)] font-semibold leading-[1.04] tracking-[-0.035em] text-ink-900">
              Messy notes in.
              <br />
              Exam-ready knowledge out.
            </h1>

            <p className="mx-auto mt-6 max-w-[620px] text-[17px] font-normal leading-[1.5] text-ink-500 sm:text-[21px]">
              Turn handwritten pages, scanned PDFs and noisy lectures into structured notes,
              grounded quizzes, a personal study plan and answers with real source citations.
            </p>

            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              {status.mode === "live" ? (
                <Button asChild variant="primary" size="lg" className="w-full sm:w-auto">
                  <Link href="/upload">
                    Analyze my material <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
              ) : (
                <DemoLaunchButton
                  label="Open the live demo"
                  className="w-full sm:w-auto"
                />
              )}
              <Button asChild variant="outline" size="lg" className="w-full sm:w-auto">
                <a href="#demo">
                  Explore sample material <ArrowUpRight className="h-4 w-4" />
                </a>
              </Button>
            </div>

            <p className="mt-6 text-[12px] leading-5 text-ink-400">
              No fabricated AI results&ensp;·&ensp;Page-level citations&ensp;·&ensp;Uncertainty
              shown, never hidden
            </p>
          </div>

          {/* Product render: one clean app window, one product shadow. */}
          <div className="container-marketing pb-20 sm:pb-24">
            <div className="mx-auto w-full max-w-[980px]">
              <div className="overflow-hidden rounded-[22px] border border-hairline bg-white shadow-product">
                <div className="flex h-11 items-center gap-2 border-b border-[#f0f0f0] px-4">
                  <span className="h-2 w-2 rounded-full bg-[#e0e0e0]" />
                  <span className="h-2 w-2 rounded-full bg-[#e0e0e0]" />
                  <span className="h-2 w-2 rounded-full bg-[#e0e0e0]" />
                  <span className="mx-auto hidden max-w-[280px] flex-1 rounded-full bg-parchment px-4 py-1 text-center text-[10px] text-ink-400 sm:block">
                    studymate / kinematics
                  </span>
                  <span className="ml-auto text-[10px] font-medium text-ink-400 sm:ml-0">
                    Live AI
                  </span>
                </div>

                <div className="grid min-h-[390px] sm:grid-cols-[156px_1fr]">
                  <aside className="hidden border-r border-[#f0f0f0] bg-[#fafafc] p-4 sm:block">
                    <p className="text-[9px] font-semibold uppercase tracking-[0.14em] text-ink-400">
                      Workspace
                    </p>
                    <div className="mt-3 space-y-1">
                      {["Dashboard", "Library", "Planner", "Quizzes"].map((item, index) => (
                        <div
                          key={item}
                          className={
                            index === 1
                              ? "rounded-lg bg-white px-2.5 py-1.5 text-[10.5px] font-semibold text-ink-900"
                              : "px-2.5 py-1.5 text-[10.5px] text-ink-500"
                          }
                        >
                          {item}
                        </div>
                      ))}
                    </div>
                    <div className="mt-6 rounded-xl border border-[#e0e0e0] bg-white p-3">
                      <p className="text-[9px] font-semibold text-ink-800">Demo mode</p>
                      <p className="mt-1 text-[9px] leading-4 text-ink-400">
                        Curated samples, always labelled.
                      </p>
                    </div>
                  </aside>

                  <div className="min-w-0 p-4 sm:p-6">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-[10px] font-medium uppercase tracking-[0.14em] text-ink-400">
                          Physics · Notes
                        </p>
                        <h2 className="mt-1 truncate font-display text-[20px] font-semibold tracking-[-0.025em] text-ink-900 sm:text-[24px]">
                          Kinematics — Ch. 3
                        </h2>
                      </div>
                      <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[10px] font-medium text-emerald-700">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                        Extracted
                      </span>
                    </div>

                    <div className="mt-5 grid gap-4 md:grid-cols-[1.2fr_0.8fr]">
                      <div className="min-w-0 rounded-2xl border border-[#f0f0f0] bg-[#fafafc] p-4">
                        <p className="text-[12px] font-semibold text-ink-800">
                          Distance vs. displacement
                        </p>
                        <p className="mt-1.5 text-[11px] leading-5 text-ink-500">
                          Distance is the total path length. Displacement is the vector from the
                          starting point to the final point.
                        </p>
                        <div className="mt-3 flex items-center justify-between gap-2 rounded-xl border border-hairline bg-white px-3 py-2 font-mono text-[11px] text-ink-900">
                          <span className="truncate">v² = u² + 2as</span>
                          <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-emerald-600" />
                        </div>
                        <div className="mt-2 flex items-center justify-between gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 font-mono text-[11px] text-amber-900">
                          <span className="truncate">s = ut + ½at²</span>
                          <span className="shrink-0 text-[8px] font-semibold uppercase tracking-[0.08em]">
                            Check exponent
                          </span>
                        </div>
                      </div>

                      <div className="space-y-3">
                        <div className="rounded-2xl border border-[#f0f0f0] bg-white p-4">
                          <div className="flex items-center justify-between gap-2">
                            <p className="text-[11px] font-medium text-ink-500">
                              Extraction confidence
                            </p>
                            <span className="text-[11px] font-semibold text-ink-900">82%</span>
                          </div>
                          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-[#e8e8ed]">
                            <div className="h-full w-[82%] rounded-full bg-action" />
                          </div>
                          <p className="mt-2 text-[9px] leading-4 text-ink-400">
                            Model-reported, not a calibrated probability.
                          </p>
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                          {["Notes", "Quiz", "Ask", "Plan"].map((tab, index) => (
                            <div
                              key={tab}
                              className={
                                index === 0
                                  ? "rounded-xl bg-ink-900 px-2.5 py-2 text-center text-[10px] font-medium text-white"
                                  : "rounded-xl border border-hairline bg-white px-2.5 py-2 text-center text-[10px] text-ink-600"
                              }
                            >
                              {tab}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <p className="mt-4 text-center text-[11px] text-ink-400">
                A real sample from the curated workspace. Confidence is model-reported, never
                presented as measured accuracy.
              </p>
            </div>
          </div>
        </section>

        <section className="border-y border-hairline bg-white/80">
          <div className="container-marketing flex flex-col items-center justify-between gap-4 py-5 sm:flex-row">
            <p className="text-[10.5px] font-semibold uppercase tracking-[0.14em] text-ink-400">
              Real infrastructure · no mock theatre
            </p>
            <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-[12px] text-ink-500">
              <span>Gemini vision &amp; audio</span>
              <span className="hidden h-1 w-1 rounded-full bg-ink-300 sm:block" />
              <span>PDF text layer</span>
              <span className="hidden h-1 w-1 rounded-full bg-ink-300 sm:block" />
              <span>Prisma + SQLite</span>
              <span className="hidden h-1 w-1 rounded-full bg-ink-300 sm:block" />
              <span>Zod validation</span>
              <span className="hidden h-1 w-1 rounded-full bg-ink-300 sm:block" />
              <span>Server-side keys</span>
            </div>
          </div>
        </section>

        <section id="features" className="bg-white py-20 sm:py-24">
          <div className="container-marketing">
            <div className="mx-auto max-w-2xl text-center">
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-ink-400">
                Six real capabilities
              </p>
              <h2 className="mt-3 font-display text-[clamp(2rem,4vw,2.75rem)] font-semibold leading-[1.08] tracking-[-0.03em] text-ink-900">
                Not a chat wrapper.
                <br />
                A complete study workflow.
              </h2>
              <p className="mt-4 text-[16px] leading-7 text-ink-500">
                Every stage is inspectable: what the model read, how confident it was, what it
                generated, which passage supports an answer — and where the system refuses to guess.
              </p>
            </div>

            <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {FEATURES.map((feature) => (
                <article
                  key={feature.title}
                  className="rounded-2xl border border-hairline bg-white p-6 transition-colors hover:border-[#d2d2d7]"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-parchment text-ink-700">
                    <feature.icon className="h-[18px] w-[18px]" aria-hidden="true" />
                  </div>
                  <h3 className="mt-4 font-display text-[17px] font-semibold tracking-[-0.02em] text-ink-900">
                    {feature.title}
                  </h3>
                  <p className="mt-1.5 text-[13.5px] leading-6 text-ink-500">{feature.body}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="bg-tile-1 py-20 text-white sm:py-24">
          <div className="container-marketing grid gap-14 lg:grid-cols-[0.95fr_1.05fr] lg:items-center">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-white/50">
                Designed for uncertainty
              </p>
              <h2 className="mt-3 font-display text-[clamp(2rem,4vw,2.75rem)] font-semibold leading-[1.08] tracking-[-0.03em]">
                Real notes are messy.
                <br />
                <span className="text-white/55">Your AI should say so.</span>
              </h2>
              <p className="mt-5 max-w-lg text-[16px] font-light leading-7 text-white/65">
                A confident-sounding guess is worse than a visible gap. STUDYMATE flags unreadable
                symbols, preserves extraction-time warnings, and keeps AI interpretation separate
                from the source.
              </p>
              <div className="mt-8 space-y-4">
                {[
                  {
                    icon: Fingerprint,
                    title: "Confidence per block",
                    body: "Model-reported, clearly not calibrated.",
                  },
                  {
                    icon: TriangleAlert,
                    title: "Uncertainty warnings",
                    body: "Specific location and reason.",
                  },
                  {
                    icon: CheckCircle2,
                    title: "Manual correction",
                    body: "You fix the source; the app marks it human-corrected.",
                  },
                  {
                    icon: FileSearch,
                    title: "Grounded refusal",
                    body: "No answer is invented when sources are silent.",
                  },
                ].map((item) => (
                  <div
                    key={item.title}
                    className="flex items-start gap-3 border-t border-white/10 pt-4"
                  >
                    <item.icon className="mt-0.5 h-4 w-4 shrink-0 text-action-dark" aria-hidden="true" />
                    <div>
                      <p className="text-[13px] font-semibold">{item.title}</p>
                      <p className="mt-0.5 text-[12px] leading-5 text-white/50">{item.body}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-tile-2">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 px-5 py-3.5">
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-white/20" />
                  <span className="h-2 w-2 rounded-full bg-white/20" />
                  <span className="h-2 w-2 rounded-full bg-white/20" />
                  <span className="ml-2 text-[10px] font-medium uppercase tracking-[0.14em] text-white/40">
                    Extraction trace
                  </span>
                </div>
                <span className="rounded-full border border-amber-300/25 bg-amber-300/10 px-2 py-0.5 text-[9px] font-medium uppercase tracking-[0.08em] text-amber-200">
                  1 critical warning
                </span>
              </div>
              <div className="grid gap-4 p-5 sm:grid-cols-[0.82fr_1.18fr]">
                <div className="overflow-hidden rounded-xl border border-white/10 bg-white/5">
                  <div className="relative aspect-[3/4]">
                    <Image
                      src="/samples/ambiguous-handwriting.png"
                      alt="An ambiguous handwritten calculus question where the exponent is smudged"
                      fill
                      sizes="(max-width: 640px) 100vw, 260px"
                      className="object-cover"
                    />
                  </div>
                </div>
                <div className="min-w-0 space-y-2.5 text-[11px]">
                  <div className="rounded-xl border border-white/10 bg-white/[0.05] p-3">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-mono text-[10px] text-white/40">Q6 · formula</span>
                      <span className="text-[9px] font-medium text-emerald-300">0.93</span>
                    </div>
                    <p className="mt-1.5 truncate font-mono text-[12px] text-white/85">
                      ∫ x² dx = x³/3 + C
                    </p>
                  </div>
                  <div className="rounded-xl border border-rose-400/25 bg-rose-400/10 p-3">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-mono text-[10px] text-rose-200/60">Q7 · unreadable</span>
                      <span className="text-[9px] font-medium text-rose-300">0.24</span>
                    </div>
                    <p className="mt-1.5 font-mono text-[12px] text-white/85">∫ x? dx</p>
                    <p className="mt-1 text-[10px] leading-4 text-rose-200/60">
                      The exponent is smudged into the integral sign. A specific digit would be
                      invented.
                    </p>
                  </div>
                  <div className="rounded-xl border border-amber-300/20 bg-amber-300/[0.06] p-3">
                    <p className="flex items-center gap-1.5 text-[10px] font-semibold text-amber-200">
                      <CircleHelp className="h-3 w-3" /> Safe fallback
                    </p>
                    <p className="mt-1 text-[10px] leading-4 text-white/55">
                      Excluded from revision material until a human supplies a legible correction.
                    </p>
                  </div>
                </div>
              </div>
              <div className="border-t border-white/10 px-5 py-3">
                <Link
                  href="/reliability"
                  className="inline-flex items-center gap-1.5 text-[12px] font-normal text-action-dark hover:underline"
                >
                  Open the reliability lab <ArrowRight className="h-3 w-3" />
                </Link>
              </div>
            </div>
          </div>
        </section>

        <section id="demo" className="py-20 sm:py-24">
          <div className="container-marketing">
            <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-ink-400">
                  Live demo · judge-ready
                </p>
                <h2 className="mt-3 font-display text-[clamp(2rem,4vw,2.75rem)] font-semibold leading-[1.08] tracking-[-0.03em] text-ink-900">
                  Three messy inputs.
                  <br />
                  One complete workflow.
                </h2>
              </div>
              <DemoLaunchButton
                label="Load the curated workspace"
                variant="outline"
                className="w-full sm:w-auto"
              />
            </div>

            <div className="mt-10 grid gap-5 lg:grid-cols-3">
              {[
                {
                  image: "/samples/handwritten-notes.png",
                  alt: "Handwritten kinematics notes",
                  type: "Handwritten photo",
                  title: "Physics · Kinematics",
                  detail: "Tilted, dim, smudged exponent",
                  badge: "Vision OCR",
                },
                {
                  image: null,
                  alt: "DSA semester syllabus PDF preview",
                  type: "Text PDF",
                  title: "DSA · Semester syllabus",
                  detail: "6 modules · 5 pages · diagrams",
                  badge: "PDF extraction",
                },
                {
                  image: null,
                  alt: "Kinematics lecture audio preview",
                  type: "Noisy audio",
                  title: "Kinematics lecture",
                  detail: "01:57 · hum · masked correction",
                  badge: "Audio",
                },
              ].map((sample) => (
                <article
                  key={sample.title}
                  className="overflow-hidden rounded-2xl border border-hairline bg-white"
                >
                  <div className="relative h-52 overflow-hidden border-b border-[#f0f0f0] bg-parchment">
                    {sample.image ? (
                      <Image
                        src={sample.image}
                        alt={sample.alt}
                        fill
                        sizes="(max-width: 1024px) 100vw, 33vw"
                        className="object-cover object-top"
                      />
                    ) : sample.type === "Text PDF" ? (
                      <div className="absolute inset-0 p-7">
                        <div className="absolute right-8 top-6 h-40 w-28 rotate-3 rounded-lg border border-hairline bg-white p-3">
                          <div className="h-1.5 w-12 rounded bg-ink-900/80" />
                          <div className="mt-3 space-y-1.5">
                            {[8, 7, 8, 6, 8, 7, 8, 5, 8, 7].map((w, i) => (
                              <div
                                key={i}
                                className="h-1 rounded bg-[#e8e8ed]"
                                style={{ width: `${w * 10}%` }}
                              />
                            ))}
                          </div>
                          <div className="mt-3 rounded border border-[#b9dcff] bg-[#f0f7ff] p-1.5">
                            <div className="h-1 w-10 rounded bg-[#b9dcff]" />
                            <div className="mt-1 h-1 w-14 rounded bg-[#dcecfa]" />
                          </div>
                        </div>
                        <span className="inline-flex items-center gap-1.5 rounded-full border border-hairline bg-white px-2.5 py-1 text-[9px] font-medium uppercase tracking-[0.08em] text-ink-600">
                          <FileText className="h-3 w-3" /> PDF
                        </span>
                      </div>
                    ) : (
                      <div className="absolute inset-0 p-6">
                        <div className="absolute left-1/2 top-1/2 flex h-28 w-28 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-hairline bg-white">
                          <AudioLines className="h-9 w-9 text-ink-700" />
                        </div>
                        <div className="absolute left-5 top-5 flex items-end gap-0.5">
                          {Array.from({ length: 22 }).map((_, i) => (
                            <span
                              key={i}
                              className="w-1 rounded-full bg-[#b9dcff]"
                              style={{ height: `${8 + ((i * 17) % 30)}px` }}
                            />
                          ))}
                        </div>
                        <div className="absolute bottom-4 right-5 rounded-full border border-hairline bg-white px-3 py-1.5 font-mono text-[10px] text-ink-500">
                          01:57
                        </div>
                      </div>
                    )}
                    <span className="absolute left-4 top-4 rounded-full border border-hairline bg-white/95 px-2.5 py-1 text-[9px] font-medium uppercase tracking-[0.08em] text-ink-600">
                      {sample.badge}
                    </span>
                  </div>
                  <div className="p-5">
                    <p className="text-[10px] font-medium uppercase tracking-[0.12em] text-ink-400">
                      {sample.type}
                    </p>
                    <h3 className="mt-1.5 font-display text-[17px] font-semibold tracking-[-0.02em] text-ink-900">
                      {sample.title}
                    </h3>
                    <p className="mt-1 text-[12px] text-ink-500">{sample.detail}</p>
                  </div>
                </article>
              ))}
            </div>

            <div className="mt-5 rounded-2xl border border-hairline bg-white p-5">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-start gap-3">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-parchment text-ink-700">
                    <ShieldCheck className="h-[18px] w-[18px]" />
                  </span>
                  <div>
                    <p className="text-[13.5px] font-semibold text-ink-900">
                      In demo mode, every sample is labelled demo data.
                    </p>
                    <p className="mt-0.5 text-[12.5px] leading-5 text-ink-500">
                      With <code className="rounded bg-parchment px-1 py-0.5 text-[11px]">GEMINI_API_KEY</code>{" "}
                      set, the same screens run real uploads through Gemini. No sample is ever passed
                      off as a live result.
                    </p>
                  </div>
                </div>
                <Button asChild variant="ghost" size="sm" className="shrink-0 text-action">
                  <Link href="/setup">
                    See the exact setup <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </section>

        <section id="how" className="bg-white py-20 sm:py-24">
          <div className="container-marketing">
            <div className="mx-auto max-w-xl text-center">
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-ink-400">
                The workflow
              </p>
              <h2 className="mt-3 font-display text-[clamp(2rem,4vw,2.75rem)] font-semibold leading-[1.08] tracking-[-0.03em] text-ink-900">
                From a blurry page to a study system.
              </h2>
            </div>
            <div className="mt-12 grid gap-x-8 gap-y-10 md:grid-cols-2 lg:grid-cols-4">
              {STEPS.map((step) => (
                <div key={step.n} className="border-t border-hairline pt-5">
                  <span className="font-mono text-[11px] font-medium text-ink-400">{step.n}</span>
                  <h3 className="mt-5 font-display text-[17px] font-semibold tracking-[-0.02em] text-ink-900">
                    {step.title}
                  </h3>
                  <p className="mt-2 text-[13.5px] leading-6 text-ink-500">{step.body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="py-20 sm:py-24">
          <div className="container-marketing">
            <div className="mx-auto max-w-2xl text-center">
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-ink-400">
                Beyond one document
              </p>
              <h2 className="mt-3 font-display text-[clamp(2rem,4vw,2.75rem)] font-semibold leading-[1.08] tracking-[-0.03em] text-ink-900">
                Find it. Or learn it.
              </h2>
              <p className="mt-4 text-[16px] leading-7 text-ink-500">
                Search across your own material and the open web, or ask for a topic your uploads do
                not cover — with the boundary between the two always visible.
              </p>
            </div>

            <div className="mt-10 grid gap-5 lg:grid-cols-2">
              <article className="rounded-2xl border border-hairline bg-white p-6 sm:p-8">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-parchment text-ink-700">
                  <Search className="h-[18px] w-[18px]" aria-hidden="true" />
                </div>
                <p className="mt-5 text-[10.5px] font-semibold uppercase tracking-[0.14em] text-ink-400">
                  Knowledge search
                </p>
                <h3 className="mt-2 font-display text-[26px] font-semibold leading-[1.1] tracking-[-0.025em] text-ink-900">
                  Search your notes.
                  <br />
                  Or the open web.
                </h3>
                <p className="mt-3 text-[14px] leading-6 text-ink-500">
                  One search box, two clearly separated modes. Your material is searched locally
                  with highlighted snippets. Web research uses Google Search grounding and lists the
                  real source links it received.
                </p>
                <div className="mt-6 flex items-center gap-2 rounded-full border border-[#d2d2d7] bg-white px-4 py-2.5 text-[13px] text-ink-400">
                  <Search className="h-4 w-4" />
                  <span className="flex-1 truncate">kinematics</span>
                  <span className="rounded-full bg-parchment px-2.5 py-1 text-[10px] font-medium text-ink-500">
                    My material
                  </span>
                </div>
                <Link
                  href="/search"
                  className="mt-5 inline-flex items-center gap-1.5 text-[14px] font-normal text-action hover:underline"
                >
                  Open search <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </article>

              <article className="rounded-2xl border border-hairline bg-white p-6 sm:p-8">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-parchment text-ink-700">
                  <GraduationCap className="h-[18px] w-[18px]" aria-hidden="true" />
                </div>
                <p className="mt-5 text-[10.5px] font-semibold uppercase tracking-[0.14em] text-ink-400">
                  Learn a topic
                </p>
                <h3 className="mt-2 font-display text-[26px] font-semibold leading-[1.1] tracking-[-0.025em] text-ink-900">
                  Learn a topic
                  <br />
                  your uploads don&apos;t cover.
                </h3>
                <p className="mt-3 text-[14px] leading-6 text-ink-500">
                  Ask for a concept, chapter or skill. The notes stay outside your library: not
                  embedded, not searchable in Ask, not cited and never used for grounded quizzes.
                </p>
                <div className="mt-6 rounded-2xl border border-[#f0f0f0] bg-[#fafafc] p-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[10px] font-medium uppercase tracking-[0.1em] text-ink-400">
                      General knowledge · not from your notes
                    </span>
                    <span className="h-1.5 w-1.5 rounded-full bg-action" />
                  </div>
                  <p className="mt-2 text-[12px] leading-5 text-ink-600">
                    A separate, clearly labelled note. Your library stays untouched.
                  </p>
                </div>
                <Link
                  href="/learn"
                  className="mt-5 inline-flex items-center gap-1.5 text-[14px] font-normal text-action hover:underline"
                >
                  Learn a topic <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </article>
            </div>
          </div>
        </section>

        <section className="bg-tile-1 py-20 text-white sm:py-24">
          <div className="container-marketing text-center">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-white/50">
              Study smarter, not more
            </p>
            <h2 className="mx-auto mt-3 max-w-2xl font-display text-[clamp(2rem,4vw,2.75rem)] font-semibold leading-[1.08] tracking-[-0.03em]">
              Your notes have enough potential.
              <br />
              <span className="text-white/55">Give them a system.</span>
            </h2>
            <p className="mx-auto mt-5 max-w-lg text-[16px] font-light leading-7 text-white/60">
              Load the complete demo workspace in one click — no key, no setup, no fabricated
              claims about what the AI did.
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <DemoLaunchButton
                variant="primary"
                label="Open the demo"
                className="w-full sm:w-auto"
              />
              <Button
                asChild
                variant="outline"
                size="lg"
                className="w-full border-white/30 text-white hover:bg-white/10 sm:w-auto"
              >
                <Link href="/reliability">
                  See where it breaks <ArrowUpRight className="h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-hairline">
        <div className="container-marketing py-12">
          <div className="flex flex-col justify-between gap-10 sm:flex-row">
            <div className="max-w-xs">
              <BrandLockup />
              <p className="mt-4 text-[12px] leading-6 text-ink-500">
                A multimodal study workspace built for students who deserve better than a wall of
                guessing. Gemini vision, audio, embeddings and structured generation.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-x-12 gap-y-1 text-[13px] sm:grid-cols-3 sm:gap-x-16">
              {[
                { href: "/dashboard", label: "Dashboard" },
                { href: "/upload", label: "Upload" },
                { href: "/library", label: "Library" },
                { href: "/search", label: "Search" },
                { href: "/planner", label: "Planner" },
                { href: "/quiz", label: "Quizzes" },
                { href: "/learn", label: "Learn a topic" },
                { href: "/reliability", label: "Reliability" },
                { href: "/setup", label: "Setup" },
              ].map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="py-1.5 text-ink-600 transition-colors hover:text-action"
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </div>
          <div className="mt-10 flex flex-col justify-between gap-2 border-t border-hairline pt-5 text-[11px] text-ink-400 sm:flex-row">
            <p>© {new Date().getFullYear()} STUDYMATE AI. Built for a national-level hackathon.</p>
            <p>No accuracy percentages are claimed without measurement.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
