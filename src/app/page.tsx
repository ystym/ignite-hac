import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  ArrowUpRight,
  AudioLines,
  BadgeCheck,
  BookOpenCheck,
  BrainCircuit,
  CalendarRange,
  CheckCircle2,
  CircleHelp,
  FileSearch,
  FileText,
  Fingerprint,
  GraduationCap,
  Image as ImageIcon,
  Layers3,
  ListChecks,
  LockKeyhole,
  MessagesSquare,
  NotebookPen,
  ScanText,
  ShieldCheck,
  Sparkles,
  TriangleAlert,
  Waypoints,
} from "lucide-react";
import { BrandLockup, BrandMark } from "@/components/brand";
import { DemoLaunchButton } from "@/components/demo-launch-button";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ConfidenceBadge } from "@/components/mode-badges";
import { getAIStatus } from "@/lib/env";

const FEATURES = [
  {
    icon: ScanText,
    title: "Messy-input vision",
    body: "Tilted phone photos, uneven light, handwritten formulas and scans. Vision OCR transcribes only what is visible.",
    tone: "bg-violet-50 text-violet-600 border-violet-100",
  },
  {
    icon: AudioLines,
    title: "Lecture transcription",
    body: "Real Gemini audio understanding with approximate timestamps, preserved technical terms and inaudible markers.",
    tone: "bg-sky-50 text-sky-600 border-sky-100",
  },
  {
    icon: NotebookPen,
    title: "Notes that explain",
    body: "Topic-wise notes in simple English or Hinglish, with definitions, formulas, examples and exam tips.",
    tone: "bg-amber-50 text-amber-600 border-amber-100",
  },
  {
    icon: ListChecks,
    title: "Grounded quizzes",
    body: "Four-option MCQs with verified source excerpts, difficulty levels and server-side scoring.",
    tone: "bg-emerald-50 text-emerald-600 border-emerald-100",
  },
  {
    icon: CalendarRange,
    title: "A realistic planner",
    body: "Day-by-day study, spaced revision, timed practice and buffer — built around your exam date and daily minutes.",
    tone: "bg-rose-50 text-rose-600 border-rose-100",
  },
  {
    icon: MessagesSquare,
    title: "Citation-backed answers",
    body: "Embedded chunks, semantic retrieval and page/audio citations. If it is not in your material, the assistant says so.",
    tone: "bg-slate-100 text-ink-700 border-slate-200",
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
    <div className="min-h-screen overflow-x-hidden bg-[#FBFBFE]">
      <div className="bg-ink-950 px-4 py-2 text-center text-[11px] font-medium tracking-wide text-white/70">
        <span className="mr-2 inline-flex items-center gap-1.5 rounded-full border border-white/15 px-2 py-0.5 text-[9px] font-bold uppercase tracking-[0.15em] text-violet-200">
          <Sparkles className="h-2.5 w-2.5" /> Hackathon build
        </span>
        Real Gemini vision, audio, structured generation and embeddings. Honest when it cannot read.
      </div>

      <header className="sticky top-0 z-40 border-b border-slate-200/70 bg-[#FBFBFE]/85 backdrop-blur-xl">
        <div className="container-page flex h-[72px] items-center justify-between">
          <BrandLockup />
          <nav className="hidden items-center gap-7 text-[13px] font-medium text-ink-500 md:flex" aria-label="Landing navigation">
            <a href="#features" className="transition hover:text-ink-900">Features</a>
            <a href="#how" className="transition hover:text-ink-900">How it works</a>
            <a href="#demo" className="transition hover:text-ink-900">Live demo</a>
            <Link href="/reliability" className="transition hover:text-ink-900">Where it breaks</Link>
          </nav>
          <div className="flex items-center gap-2">
            <Link
              href="/dashboard"
              className="hidden rounded-xl px-3.5 py-2 text-[13px] font-semibold text-ink-600 transition hover:bg-slate-100 hover:text-ink-900 sm:inline-flex"
            >
              Open workspace
            </Link>
            {status.mode === "live" ? (
              <Button asChild variant="violet" size="sm">
                <Link href="/upload">Start studying</Link>
              </Button>
            ) : (
              <DemoLaunchButton
                variant="primary"
                size="sm"
                label="Try the demo"
                showIcon={false}
              />
            )}
          </div>
        </div>
      </header>

      <main>
        <section className="relative overflow-hidden">
          <div className="pointer-events-none absolute inset-0 surface-grid opacity-70 [mask-image:radial-gradient(ellipse_65%_65%_at_52%_35%,#000_20%,transparent_100%)]" />
          <div className="pointer-events-none absolute -right-52 -top-48 h-[680px] w-[680px] rounded-full bg-violet-200/40 blur-[120px]" />
          <div className="pointer-events-none absolute -left-60 top-64 h-[500px] w-[500px] rounded-full bg-sky-100/60 blur-[100px]" />

          <div className="container-page relative grid items-center gap-14 pb-20 pt-14 lg:grid-cols-[1.03fr_0.97fr] lg:gap-8 lg:pb-28 lg:pt-20">
            <div className="relative z-10 animate-fade-up">
              <div className="inline-flex items-center gap-2 rounded-full border border-violet-200/70 bg-white/80 py-1 pl-1 pr-3.5 shadow-sm backdrop-blur">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-violet-600">
                  <Sparkles className="h-3 w-3 text-white" aria-hidden="true" />
                </span>
                <span className="text-[11.5px] font-semibold text-ink-600">
                  Multimodal AI · built on Gemini
                </span>
                <span className="h-1 w-1 rounded-full bg-violet-300" />
                <span className="text-[10.5px] font-bold uppercase tracking-[0.12em] text-violet-600">
                  {status.mode === "live" ? "Live" : "Demo ready"}
                </span>
              </div>

              <h1 className="mt-6 font-display text-[clamp(2.9rem,6vw,5rem)] font-extrabold leading-[0.98] tracking-[-0.055em] text-ink-950">
                Messy notes in.
                <br />
                <span className="text-gradient">Exam-ready</span> knowledge out.
              </h1>

              <p className="mt-6 max-w-[565px] text-[16px] leading-[1.75] text-ink-500 sm:text-[17px]">
                Turn handwritten pages, scanned PDFs and noisy lectures into structured notes,
                grounded quizzes, a personalised study plan and answers with real source citations.
              </p>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
                {status.mode === "live" ? (
                  <Button asChild variant="violet" size="lg">
                    <Link href="/upload">
                      Analyze my material <ArrowRight className="h-4 w-4" />
                    </Link>
                  </Button>
                ) : (
                  <DemoLaunchButton label="Open the live demo" />
                )}
                <Button asChild variant="outline" size="lg">
                  <a href="#demo">
                    Explore sample material <ArrowUpRight className="h-4 w-4" />
                  </a>
                </Button>
              </div>

              <div className="mt-8 flex flex-wrap gap-x-5 gap-y-2 text-[12px] font-medium text-ink-500">
                {[
                  "No fake AI responses",
                  "Page-level citations",
                  "Uncertainty shown, never hidden",
                ].map((item) => (
                  <span key={item} className="inline-flex items-center gap-1.5">
                    <CheckCircle2 className="h-[14px] w-[14px] text-emerald-600" aria-hidden="true" />
                    {item}
                  </span>
                ))}
              </div>
            </div>

            <div className="relative mx-auto h-[500px] w-full max-w-[520px] animate-fade-up lg:h-[590px] max-lg:mt-2">
              <div className="absolute left-1/2 top-1/2 h-[400px] w-[400px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-violet-200/60 bg-violet-50/50" />
              <div className="absolute left-1/2 top-1/2 h-[300px] w-[300px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-dashed border-violet-300/60" />

              <div className="absolute right-[2%] top-[3%] w-[60%] rotate-[5deg] rounded-[20px] border border-white/70 bg-white p-2 shadow-[0_40px_80px_-30px_rgba(15,20,51,0.45)] transition-transform duration-500 hover:rotate-[3deg]">
                <div className="relative aspect-[4/5] overflow-hidden rounded-[14px] bg-slate-100">
                  <Image
                    src="/samples/handwritten-notes.png"
                    alt="A real tilted phone photo of handwritten kinematics notes with formulas and a graph"
                    fill
                    priority
                    sizes="(max-width: 1024px) 60vw, 320px"
                    className="object-cover object-top"
                  />
                </div>
                <span className="absolute -left-3 top-5 inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[9px] font-bold uppercase tracking-[0.12em] text-ink-500 shadow-sm">
                  <ImageIcon className="h-3 w-3 text-violet-500" /> Original input
                </span>
              </div>

              <div className="absolute bottom-[0%] left-[0%] w-[72%] -rotate-[2.5deg] rounded-2xl border border-slate-200/80 bg-white p-4 shadow-[0_30px_60px_-26px_rgba(15,20,51,0.35)] sm:p-5">
                <div className="flex items-center justify-between">
                  <span className="inline-flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-[0.14em] text-violet-600">
                    <Sparkles className="h-3 w-3" /> Extracted & structured
                  </span>
                  <ConfidenceBadge score={0.76} showValue={false} className="text-[9px]" />
                </div>
                <p className="mt-3 font-display text-[14px] font-bold text-ink-900">Kinematics · Ch. 3</p>
                <div className="mt-2 space-y-1.5">
                  <p className="text-[11px] leading-5 text-ink-500">
                    Distance = total path length · Displacement = vector from start to end.
                  </p>
                  <div className="flex items-center justify-between rounded-lg bg-violet-50 px-2.5 py-1.5 font-mono text-[10.5px] text-violet-800">
                    <span>v² = u² + 2as</span>
                    <CheckCircle2 className="h-3 w-3 text-emerald-500" />
                  </div>
                  <div className="flex items-center justify-between rounded-lg border border-amber-200 bg-amber-50 px-2.5 py-1.5 font-mono text-[10.5px] text-amber-800">
                    <span>s = ut + ½at<sup>?</sup></span>
                    <span className="text-[8px] font-bold uppercase tracking-wider">Ambiguous</span>
                  </div>
                </div>
                <div className="mt-3 flex gap-1.5">
                  {["Notes", "Quiz", "Ask", "Plan"].map((tab, index) => (
                    <span
                      key={tab}
                      className={
                        index === 0
                          ? "rounded-md bg-ink-900 px-2 py-1 text-[8.5px] font-bold text-white"
                          : "rounded-md bg-slate-100 px-2 py-1 text-[8.5px] font-semibold text-ink-400"
                      }
                    >
                      {tab}
                    </span>
                  ))}
                </div>
              </div>

              <div className="absolute right-[0%] top-[58%] flex rotate-[2deg] items-center gap-2.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 shadow-lg">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-sky-50 text-sky-600">
                  <AudioLines className="h-4 w-4" />
                </span>
                <div>
                  <p className="text-[10px] font-bold text-ink-800">Lecture · 01:57</p>
                  <div className="mt-1 flex h-3 items-end gap-[2px]">
                    {[3, 6, 4, 9, 5, 10, 7, 4, 8, 3, 6, 9, 4, 7].map((h, index) => (
                      <span
                        key={index}
                        className="w-[2px] rounded-full bg-sky-400"
                        style={{ height: `${h * 1.1}px` }}
                      />
                    ))}
                  </div>
                </div>
              </div>

              <div className="absolute -bottom-1 right-[2%] rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 shadow-sm">
                <div className="flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-[0.1em] text-rose-700">
                  <TriangleAlert className="h-3 w-3" /> 1 uncertain reading
                </div>
                <p className="mt-0.5 text-[9.5px] text-rose-600/80">Flagged, not guessed.</p>
              </div>
            </div>
          </div>
        </section>

        <section className="border-y border-slate-200/70 bg-white/70 py-5">
          <div className="container-page flex flex-col items-center justify-between gap-4 sm:flex-row">
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-ink-300">
              Real stack · no mock theatre
            </p>
            <div className="flex flex-wrap items-center justify-center gap-x-7 gap-y-2 text-[12px] font-semibold text-ink-500">
              <span className="inline-flex items-center gap-1.5"><Sparkles className="h-3.5 w-3.5 text-violet-500" /> Gemini</span>
              <span className="inline-flex items-center gap-1.5"><FileText className="h-3.5 w-3.5 text-sky-500" /> unpdf</span>
              <span className="inline-flex items-center gap-1.5"><Layers3 className="h-3.5 w-3.5 text-amber-500" /> Prisma + SQLite</span>
              <span className="inline-flex items-center gap-1.5"><BadgeCheck className="h-3.5 w-3.5 text-emerald-500" /> Zod validation</span>
              <span className="inline-flex items-center gap-1.5"><LockKeyhole className="h-3.5 w-3.5 text-ink-400" /> Server-side keys</span>
            </div>
          </div>
        </section>

        <section id="features" className="relative py-20 lg:py-28">
          <div className="container-page">
            <div className="max-w-2xl">
              <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-violet-600">
                Six real AI capabilities
              </p>
              <h2 className="mt-3 font-display text-[clamp(2rem,4vw,3.15rem)] font-extrabold leading-[1.06] tracking-[-0.04em] text-ink-950">
                Not a chat wrapper.
                <br />
                A complete study workflow.
              </h2>
              <p className="mt-4 max-w-xl text-[15px] leading-7 text-ink-500">
                Every stage is inspectable: what the model read, how confident it was, what it
                generated, which passage supports an answer — and where the system refuses to guess.
              </p>
            </div>

            <div className="mt-11 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {FEATURES.map((feature, index) => (
                <article
                  key={feature.title}
                  className="group relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-6 shadow-card transition-all duration-300 hover:-translate-y-1 hover:shadow-lift"
                >
                  <div className={`mb-5 inline-flex h-11 w-11 items-center justify-center rounded-xl border ${feature.tone}`}>
                    <feature.icon className="h-5 w-5" aria-hidden="true" />
                  </div>
                  <h3 className="font-display text-[17px] font-bold text-ink-900">{feature.title}</h3>
                  <p className="mt-2 text-[13.5px] leading-6 text-ink-500">{feature.body}</p>
                  <span className="absolute right-5 top-6 font-mono text-[10px] text-ink-200">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <div className="pointer-events-none absolute -bottom-12 -right-12 h-28 w-28 rounded-full bg-violet-50 opacity-0 blur-2xl transition-opacity group-hover:opacity-100" />
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="bg-ink-950 py-20 text-white lg:py-24">
          <div className="container-page">
            <div className="grid gap-14 lg:grid-cols-2 lg:items-center">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-violet-300">
                  Designed for uncertainty
                </p>
                <h2 className="mt-3 font-display text-[clamp(2rem,4vw,3.1rem)] font-extrabold leading-[1.07] tracking-[-0.04em]">
                  Real notes are messy.
                  <br />
                  <span className="text-violet-300">Your AI should say so.</span>
                </h2>
                <p className="mt-5 max-w-lg text-[15px] leading-7 text-white/60">
                  A confident-sounding guess is worse than a visible gap. STUDYMATE flags
                  unreadable symbols, preserves extraction-time warnings, and keeps AI
                  interpretation separate from the source.
                </p>
                <div className="mt-8 grid gap-3 sm:grid-cols-2">
                  {[
                    { icon: Fingerprint, title: "Confidence per block", body: "Model-reported, clearly not calibrated." },
                    { icon: TriangleAlert, title: "Uncertainty warnings", body: "Specific location and reason." },
                    { icon: CheckCircle2, title: "Manual correction", body: "You fix the source; the app marks it human-corrected." },
                    { icon: FileSearch, title: "Grounded refusal", body: "No answer is invented when sources are silent." },
                  ].map((item) => (
                    <div key={item.title} className="rounded-xl border border-white/10 bg-white/[0.04] p-4">
                      <item.icon className="h-4 w-4 text-violet-300" aria-hidden="true" />
                      <p className="mt-3 text-[12.5px] font-bold">{item.title}</p>
                      <p className="mt-1 text-[11px] leading-5 text-white/45">{item.body}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="relative">
                <div className="absolute -inset-6 rounded-[32px] bg-violet-500/10 blur-2xl" />
                <div className="relative overflow-hidden rounded-2xl border border-white/15 bg-white/[0.04] shadow-2xl">
                  <div className="flex items-center justify-between border-b border-white/10 px-5 py-3.5">
                    <div className="flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-rose-400" />
                      <span className="h-2 w-2 rounded-full bg-amber-300" />
                      <span className="h-2 w-2 rounded-full bg-emerald-400" />
                      <span className="ml-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-white/35">
                        Extraction trace
                      </span>
                    </div>
                    <span className="rounded-full border border-amber-300/25 bg-amber-300/10 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-amber-200">
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
                          sizes="240px"
                          className="object-cover"
                        />
                      </div>
                    </div>
                    <div className="space-y-2.5 text-[11px]">
                      <div className="rounded-lg border border-white/10 bg-white/[0.05] p-3">
                        <div className="flex items-center justify-between">
                          <span className="font-mono text-[10px] text-white/40">Q6 · formula</span>
                          <span className="text-[9px] font-bold text-emerald-300">0.93</span>
                        </div>
                        <p className="mt-1.5 font-mono text-[12px] text-white/85">∫ x² dx = x³/3 + C</p>
                      </div>
                      <div className="rounded-lg border border-rose-400/25 bg-rose-400/10 p-3">
                        <div className="flex items-center justify-between">
                          <span className="font-mono text-[10px] text-rose-200/60">Q7 · unreadable</span>
                          <span className="text-[9px] font-bold text-rose-300">0.24</span>
                        </div>
                        <p className="mt-1.5 font-mono text-[12px] text-white/85">∫ x<sup>?</sup> dx</p>
                        <p className="mt-1 text-[10px] leading-4 text-rose-200/55">
                          The exponent is smudged into the integral sign. A specific digit would be invented.
                        </p>
                      </div>
                      <div className="rounded-lg border border-amber-300/20 bg-amber-300/[0.06] p-3">
                        <p className="flex items-center gap-1.5 text-[10px] font-bold text-amber-200">
                          <CircleHelp className="h-3 w-3" /> Safe fallback
                        </p>
                        <p className="mt-1 text-[10px] leading-4 text-white/50">
                          Excluded from revision material until a human supplies a legible correction.
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="border-t border-white/10 px-5 py-3">
                    <Link href="/reliability" className="inline-flex items-center gap-1.5 text-[11px] font-bold text-violet-300 hover:text-violet-200">
                      Open the reliability lab <ArrowRight className="h-3 w-3" />
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="demo" className="py-20 lg:py-28">
          <div className="container-page">
            <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-violet-600">
                  Live demo · judge-ready
                </p>
                <h2 className="mt-3 font-display text-[clamp(2rem,4vw,3rem)] font-extrabold leading-[1.08] tracking-[-0.04em] text-ink-950">
                  Three messy inputs.<br />One complete workflow.
                </h2>
              </div>
              <DemoLaunchButton label="Load the curated workspace" variant="primary" />
            </div>

            <div className="mt-9 grid gap-5 lg:grid-cols-3">
              {[
                {
                  image: "/samples/handwritten-notes.png",
                  alt: "Handwritten kinematics notes",
                  type: "Handwritten photo",
                  title: "Physics · Kinematics",
                  detail: "Tilted, dim, smudged exponent",
                  badge: "Vision OCR",
                  color: "bg-violet-600",
                },
                {
                  image: null,
                  type: "Text PDF",
                  title: "DSA · Semester syllabus",
                  detail: "6 modules · 5 pages · diagrams",
                  badge: "PDF extraction",
                  color: "bg-sky-600",
                },
                {
                  image: null,
                  type: "Noisy audio",
                  title: "Kinematics lecture",
                  detail: "01:57 · hum · masked correction",
                  badge: "Audio",
                  color: "bg-amber-500",
                },
              ].map((sample) => (
                <article
                  key={sample.title}
                  className="group card-lift overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-card"
                >
                  <div className="relative h-52 overflow-hidden bg-slate-100">
                    {sample.image ? (
                      <Image
                        src={sample.image}
                        alt={sample.title}
                        fill
                        sizes="(max-width: 1024px) 100vw, 33vw"
                        className="object-cover object-top transition duration-500 group-hover:scale-[1.025]"
                      />
                    ) : sample.type === "Text PDF" ? (
                      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,#E9E3FF_0,transparent_45%),linear-gradient(145deg,#F7F7FB,#EDF1FB)] p-7">
                        <div className="absolute right-8 top-5 h-40 w-28 rotate-3 rounded-md border border-white/80 bg-white p-3 shadow-lg">
                          <div className="h-1.5 w-12 rounded bg-ink-900/80" />
                          <div className="mt-3 space-y-1.5">
                            {[8, 7, 8, 6, 8, 7, 8, 5, 8, 7].map((w, i) => (
                              <div key={i} className="h-1 rounded bg-slate-200" style={{ width: `${w * 10}%` }} />
                            ))}
                          </div>
                          <div className="mt-3 rounded border border-violet-100 bg-violet-50 p-1.5">
                            <div className="h-1 w-10 rounded bg-violet-200" />
                            <div className="mt-1 h-1 w-14 rounded bg-violet-200/70" />
                          </div>
                        </div>
                        <span className="inline-flex items-center gap-1.5 rounded-full border border-sky-200 bg-white/80 px-2.5 py-1 text-[9px] font-bold uppercase tracking-wider text-sky-700">
                          <FileText className="h-3 w-3" /> PDF
                        </span>
                      </div>
                    ) : (
                      <div className="absolute inset-0 overflow-hidden bg-[linear-gradient(145deg,#FFF8EB,#F4EDFF)] p-6">
                        <div className="absolute left-1/2 top-1/2 flex h-28 w-28 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-amber-200 bg-white shadow-xl">
                          <AudioLines className="h-9 w-9 text-amber-500" />
                        </div>
                        <div className="absolute left-5 top-5 flex items-end gap-0.5">
                          {Array.from({ length: 22 }).map((_, i) => (
                            <span
                              key={i}
                              className="w-1 rounded-full bg-amber-300"
                              style={{ height: `${8 + ((i * 17) % 30)}px` }}
                            />
                          ))}
                        </div>
                        <div className="absolute bottom-4 right-5 rounded-full border border-amber-200 bg-white px-3 py-1.5 font-mono text-[10px] text-ink-500">
                          01:57
                        </div>
                      </div>
                    )}
                    <span className={`absolute left-4 top-4 rounded-full px-2.5 py-1 text-[9px] font-bold uppercase tracking-[0.12em] text-white shadow-sm ${sample.color}`}>
                      {sample.badge}
                    </span>
                  </div>
                  <div className="p-5">
                    <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-ink-300">
                      {sample.type}
                    </p>
                    <h3 className="mt-1.5 font-display text-[16px] font-bold text-ink-900">{sample.title}</h3>
                    <p className="mt-1 text-[12px] text-ink-400">{sample.detail}</p>
                  </div>
                </article>
              ))}
            </div>

            <div className="mt-5 rounded-2xl border border-slate-200/80 bg-white p-5 shadow-card">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-start gap-3">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                    <ShieldCheck className="h-[18px] w-[18px]" />
                  </span>
                  <div>
                    <p className="text-[13px] font-bold text-ink-800">
                      What you&apos;re seeing in demo mode is labelled demo data.
                    </p>
                    <p className="mt-0.5 text-[12px] leading-5 text-ink-500">
                      With <code className="rounded bg-slate-100 px-1 py-0.5 text-[11px]">GEMINI_API_KEY</code> set,
                      the same screens run real uploads through Gemini. No sample is ever passed off as a live result.
                    </p>
                  </div>
                </div>
                <Button asChild variant="outline" size="sm" className="shrink-0">
                  <Link href="/setup">
                    See the exact setup <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </section>

        <section id="how" className="border-y border-slate-200/70 bg-white py-20 lg:py-24">
          <div className="container-page">
            <div className="mx-auto max-w-xl text-center">
              <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-violet-600">
                The workflow
              </p>
              <h2 className="mt-3 font-display text-[clamp(2rem,4vw,3rem)] font-extrabold leading-[1.08] tracking-[-0.04em] text-ink-950">
                From a blurry page to a study system.
              </h2>
            </div>
            <div className="mt-12 grid gap-5 md:grid-cols-2 lg:grid-cols-4">
              {STEPS.map((step, index) => (
                <div key={step.n} className="relative rounded-2xl border border-slate-200/80 bg-[#FBFBFE] p-5">
                  {index < STEPS.length - 1 && (
                    <span className="absolute -right-3 top-9 hidden h-px w-6 bg-slate-300 lg:block" aria-hidden="true" />
                  )}
                  <span className="font-mono text-[10px] font-bold text-violet-500">{step.n}</span>
                  <h3 className="mt-7 font-display text-[15px] font-bold text-ink-900">{step.title}</h3>
                  <p className="mt-2 text-[12.5px] leading-6 text-ink-500">{step.body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="py-20 lg:py-28">
          <div className="container-page">
            <div className="relative overflow-hidden rounded-[28px] bg-ink-950 px-7 py-12 text-white sm:px-12 lg:px-16 lg:py-16">
              <div className="pointer-events-none absolute -right-24 -top-24 h-80 w-80 rounded-full bg-violet-600/30 blur-3xl" />
              <div className="pointer-events-none absolute bottom-0 left-1/3 h-52 w-52 rounded-full bg-sky-500/15 blur-3xl" />
              <div className="pointer-events-none absolute inset-0 dot-grid opacity-[0.07]" />
              <div className="relative grid items-center gap-9 lg:grid-cols-[1fr_auto]">
                <div className="max-w-2xl">
                  <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.18em] text-violet-300">
                    <GraduationCap className="h-4 w-4" /> Study smarter, not more
                  </div>
                  <h2 className="mt-4 font-display text-[clamp(2rem,4vw,3.2rem)] font-extrabold leading-[1.04] tracking-[-0.04em]">
                    Your notes have enough potential.
                    <br />
                    <span className="text-violet-300">Give them a system.</span>
                  </h2>
                  <p className="mt-4 max-w-lg text-[14px] leading-7 text-white/55">
                    Load the complete demo workspace in one click — no key, no setup, no
                    fabricated claims about what the AI did.
                  </p>
                </div>
                <div className="flex flex-col gap-3 sm:flex-row lg:flex-col">
                  <DemoLaunchButton variant="white" label="Open the demo" />
                  <Button asChild variant="outline" size="lg" className="border-white/15 bg-white/5 text-white hover:bg-white/10 hover:text-white">
                    <Link href="/reliability">
                      See where it breaks <ArrowUpRight className="h-4 w-4" />
                    </Link>
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-slate-200/80 bg-white">
        <div className="container-page py-10">
          <div className="flex flex-col justify-between gap-8 sm:flex-row">
            <div className="max-w-xs">
              <BrandLockup />
              <p className="mt-4 text-[12px] leading-6 text-ink-400">
                A multimodal study workspace built for students who deserve better than a
                wall of guessing. Gemini vision, audio, embeddings and structured generation.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-x-14 gap-y-2 text-[12px] sm:grid-cols-3">
              <Link href="/dashboard" className="text-ink-500 hover:text-ink-900">Dashboard</Link>
              <Link href="/upload" className="text-ink-500 hover:text-ink-900">Upload</Link>
              <Link href="/library" className="text-ink-500 hover:text-ink-900">Library</Link>
              <Link href="/planner" className="text-ink-500 hover:text-ink-900">Planner</Link>
              <Link href="/quiz" className="text-ink-500 hover:text-ink-900">Quizzes</Link>
              <Link href="/reliability" className="text-ink-500 hover:text-ink-900">Reliability</Link>
              <Link href="/setup" className="text-ink-500 hover:text-ink-900">Setup</Link>
              <a href="#features" className="text-ink-500 hover:text-ink-900">Features</a>
              <a href="#demo" className="text-ink-500 hover:text-ink-900">Demo</a>
            </div>
          </div>
          <div className="mt-8 flex flex-col justify-between gap-2 border-t border-slate-100 pt-5 text-[10.5px] text-ink-300 sm:flex-row">
            <p>© {new Date().getFullYear()} STUDYMATE AI. Built for a national-level hackathon.</p>
            <p className="inline-flex items-center gap-1.5">
              <BrandMark size={13} /> No accuracy percentages are claimed without measurement.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
