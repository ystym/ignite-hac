# STUDYMATE AI

**Messy notes in. Exam-ready knowledge out.**

STUDYMATE AI is a local-first, multimodal study workspace. It accepts handwritten photos, PDFs, audio recordings and typed material, then produces structured notes, grounded practice quizzes, a day-by-day study plan and cited answers about the source.

It is built for the case where a study assistant must be useful **and honest**: every AI-looking result is either a real model response from your own Gemini key, or an explicitly labelled curated sample. There is no hidden sample fallback and no invented accuracy score.

![Stack](https://img.shields.io/badge/Next.js-16.4.3-000?style=flat-square)
![React](https://img.shields.io/badge/React-19.3.1-149ECA?style=flat-square)
![Gemini](https://img.shields.io/badge/Google-Gemini-0066CC?style=flat-square)
![Database](https://img.shields.io/badge/SQLite-Prisma-2D3748?style=flat-square)
![Design](https://img.shields.io/badge/Interface-Apple--inspired-1D1D1F?style=flat-square)

---

## Contents

- [What it does](#what-it-does)
- [Why the honesty layer matters](#why-the-honesty-layer-matters)
- [Demo Mode vs Live Mode](#demo-mode-vs-live-mode)
- [Quick start](#quick-start)
- [Five-minute judge demo](#five-minute-judge-demo)
- [Live-mode setup and verification](#live-mode-setup-and-verification)
- [How an upload is processed](#how-an-upload-is-processed)
- [How grounding and confidence work](#how-grounding-and-confidence-work)
- [Pages and flows](#pages-and-flows)
- [Architecture](#architecture)
- [Data model](#data-model)
- [API surface](#api-surface)
- [Limits and validation](#limits-and-validation)
- [Scripts](#scripts)
- [Verification status](#verification-status)
- [Known limitations](#known-limitations)
- [Resetting the demo](#resetting-the-demo)

---

## What it does

| Area | Behaviour |
| --- | --- |
| **Multimodal intake** | JPG, JPEG, PNG, WEBP, PDF, MP3, WAV, M4A, OGG, WEBM, FLAC, AAC, plus typed/pasted material. Files are validated by extension **and magic bytes**. |
| **Real extraction** | Gemini vision OCR for images, PDF text-layer extraction for digital PDFs, per-page Gemini OCR for scanned PDFs, and timestamped Gemini transcription for audio. |
| **Visible uncertainty** | Every block has a model-reported confidence and uncertain flag. Warnings are preserved, including critical ones. Unreadable content is marked, never guessed. |
| **Structured notes** | Simple English or Hinglish notes with overview, sections, key points, definitions, formulas, worked examples, exam tips, takeaways and uncertain areas. |
| **Grounded quizzes** | 3–10 MCQs generated from the extracted source, excerpt-checked before saving, scored on the server. Explanations and source excerpts unlock only after submission. |
| **Study planner** | Day-by-day plan with study, revision, practice and buffer tasks. Live plans use Gemini; Demo Mode uses a deterministic local scheduler labelled **Non-AI**. |
| **Cited Q&A** | Retrieval over persisted chunk embeddings, with page or audio-timestamp citations. Live answers that do not cite a retrieved passage are rejected; low-relevance questions get an explicit “I couldn't find this” answer. |
| **Knowledge search** | One search page with two modes. **My material** runs a weighted lexical search across documents, notes, passages, quizzes and plans. **Web research** uses Gemini Google Search grounding and lists the actual source URLs returned by the provider. |
| **Learn a topic** | Structured notes for a topic that is not in the uploaded material. Always labelled as external/general knowledge, never embedded, indexed, cited or used for grounded quizzes. |
| **Manual correction** | Correct an extraction block, preserve the original warnings as an audit trail, mark the text as human-corrected, and rebuild the retrieval index. |
| **Reliability lab** | A deliberately ambiguous calculus fixture. The correct behaviour is to admit the exponent is unreadable, not to produce a confident digit. Curated reference and real stores are kept separate. |
| **Setup diagnostics** | Server-side configuration status, workspace counts, real Gemini connection test, environment reference, capability matrix and limits. |

The interface is a complete responsive SaaS shell: dashboard, library, upload studio, document workspace, quiz runner, planner, reliability lab and setup/status. Empty, loading, error and retry states are implemented throughout.

---

## Why the honesty layer matters

This project deliberately avoids the common demo pattern where pre-written “AI” output is presented as a live result.

- **Mode is stored per record.** `Document`, `Note`, `Quiz`, `ChatMessage`, `StudyPlan` and `ReliabilityRun` carry `LIVE` or `DEMO`, and the UI labels them independently.
- **Demo Mode is not a fallback.** If a live upload or generation fails, the app shows an error and retry guidance. It does not silently replace the result with a curated sample.
- **No fabricated success.** Without a key, the “Test Gemini connection” button is disabled rather than showing a fake green result.
- **No accuracy percentage.** Confidence values are the model's own self-assessment, not calibrated probabilities. The app states this wherever confidence appears.
- **Grounding is a guardrail, not a guarantee.** A verified quote proves the quote exists; it does not prove the explanation or pedagogy is correct.
- **Manual edits are separate.** Human-corrected text is marked as human, with the date, and the original extraction warnings remain visible.

---

## Demo Mode vs Live Mode

| Capability | With `GEMINI_API_KEY` | Without a key (Demo Mode) |
| --- | --- | --- |
| Arbitrary image / PDF / audio upload | Processed through the live pipeline | **Blocked by design** |
| Typed material | Processed through the live pipeline | **Blocked by design** |
| Vision OCR / audio transcription | Real Gemini call | Curated examples only |
| Notes | Generated, schema-validated, grounded in extraction | Curated samples, read-only |
| Quiz generation | Generated and excerpt-checked | Curated quizzes only |
| Quiz scoring | Server-side; attempts persist | Server-side; attempts persist |
| Study planner | Gemini plan | Deterministic scheduler, labelled Non-AI |
| Cited Q&A | Gemini embeddings + grounded generation | Local hashed-token retrieval over curated passages |
| Knowledge search (my material) | Local lexical search over every workspace record | Local lexical search over the curated workspace |
| Web research | Gemini Google Search grounding with real source URLs | **Blocked by design** — no fabricated web answers |
| Learn a topic | Separate general-knowledge notes, labelled external | **Blocked by design** — no fabricated topic notes |
| Manual correction + reindex | Available | Available (local demo vectors) |
| Reliability live run | Real model output stored unchanged | Disabled; curated reference remains |
| Connection test | Available | Disabled |

Demo Mode is selected when `GEMINI_API_KEY` is empty, or when `FORCE_DEMO_MODE="true"`. The server decides; the browser cannot enable live mode.

---

## Quick start

### Prerequisites

- **Node.js 20.9+** (tested with Node 22.23.4)
- npm 10+
- Optional: a Gemini API key from [Google AI Studio](https://aistudio.google.com/apikey) for live mode

No external database or Docker is required. SQLite and sample assets are local.

### Install and run

```bash
npm install

# Windows PowerShell
Copy-Item .env.example .env

# macOS / Linux
cp .env.example .env

npm run setup
npm run dev
```

Open **http://localhost:3000**.

`npm run setup` does three things:

1. Generates Prisma Client.
2. Applies the SQLite migration to `data/studymate.db`.
3. Seeds the idempotent curated demo workspace.

The seed creates:

- 3 demo documents: handwritten kinematics notes, a DSA syllabus PDF and a noisy kinematics lecture
- 3 structured notes
- 3 grounded quizzes
- 1 14-day DSA study plan
- 1 reliability reference run
- 1 short authored demo conversation on the kinematics document

All seeded records are stored with `mode = DEMO`.

### Environment file

The minimum working `.env` is:

```dotenv
DATABASE_URL="file:../data/studymate.db"
GEMINI_API_KEY=""
```

For live AI, paste a key:

```dotenv
GEMINI_API_KEY="your-key-here"
```

Restart `npm run dev` after editing `.env`. The key is read on the server only; it is never prefixed with `NEXT_PUBLIC_` and never sent to the browser.

---

## Five-minute judge demo

No API key is needed. Every sample below is labelled **Curated demo** or **DEMO**.

1. **Landing page** (`/`)
   Read the “messy inputs, one workflow” section. Click **Load the curated workspace**. This calls the idempotent seed endpoint and opens the dashboard.

2. **Dashboard** (`/dashboard`)
   Confirm the demo banner, 3 documents, 3 notes and 0 quiz attempts. Note that the cards show real persisted statuses and confidence values.

3. **Handwritten document** (`/library` → “Kinematics — handwritten physics notes”)
   - **Notes** tab: structured Simple English notes with a curated-demo label.
   - **Extracted** tab: 18 blocks, per-block confidence and 6 warnings, including the smudged exponent. This is the “did it really read it?” view.
   - Click **Correct** on any block, edit the text, save, and watch the block become **Human-corrected**. The index becomes stale; use **Rebuild index** to make it ready again.
   - **Ask** tab: ask “What is displacement and how is it different from distance?”. The answer includes a cited passage with page/relevance information. Ask an unrelated question such as “What is the capital of France?” to see the explicit no-answer path. Use **Clear** to reset the conversation.
   - The right-hand **Original source** panel shows the actual uploaded file, size, extraction method, index status and warnings.

4. **Quiz runner** (`/quiz`)
   Open the DSA quiz (8 questions), answer every question, and submit. The score is computed on the server and persisted; explanations and source excerpts appear only after submission. Check the **To review** filter and the attempt history.

5. **Planner** (`/planner`)
   The demo plan is labelled **Non-AI scheduler**. Toggle a task; the progress and “Next task” update. Reload to verify persistence. **Regenerate** shows a confirmation dialog, preserves completed topics, and resets individual ticks. The demo notice explicitly says no AI was called.

6. **Reliability lab** (`/reliability`)
   Inspect the fixed ambiguous handwriting fixture and the curated reference. Q7's exponent is unrecoverable; the correct output is “unreadable + warning”, not a guessed digit. Use **Edit correction** to record a human review. The original model output stays unchanged.

7. **Setup & status** (`/setup`)
   See server-side Demo Mode status, the disabled live test, real workspace counts, the environment reference, the live/demo capability matrix and the limits.

8. **Mobile navigation**
   At a narrow viewport, use **Open navigation** and switch pages. The menu closes after navigation.

### Direct demo links

| Page | URL |
| --- | --- |
| Handwritten kinematics | `/documents/demo-doc-kinematics` |
| DSA syllabus | `/documents/demo-doc-dsa` |
| Audio lecture | `/documents/demo-doc-audio` |
| DSA quiz | `/quiz/demo-quiz-dsa` |
| Kinematics quiz | `/quiz/demo-quiz-kinematics` |
| Audio quiz | `/quiz/demo-quiz-audio` |
| DSA plan | `/planner?plan=demo-plan-dsa` |
| Reliability lab | `/reliability` |

---

## Live-mode setup and verification

1. Create a key at [Google AI Studio](https://aistudio.google.com/apikey).
2. Put it in `.env`:
   ```dotenv
   GEMINI_API_KEY="..."
   ```
3. Restart the dev server.
4. Open `/setup`. The banner should change to **Live AI is configured**.
5. Click **Test Gemini connection**. A passing result is a real provider response containing a short model reply and latency. Configuration alone is not treated as proof.
6. Upload `public/samples/handwritten-notes.png` from `/upload`. Watch the persisted stages: reading → extracting → chunking → embedding → notes → done.
7. Open the document and verify:
   - the extraction has real blocks, confidences and warnings;
   - the search index shows ready;
   - generating a Hinglish note produces a new note labelled live;
   - generating a quiz produces questions whose source excerpts exist in the extraction;
   - asking an off-topic question returns the no-answer path, not a fabricated answer;
   - correcting a block marks the index stale and rebuilding it restores retrieval.
8. Create a plan from `/planner` and verify it is labelled with the Gemini model.
9. Run the reliability live test at `/reliability`. The result is stored unchanged; a confident guess is shown as a failure of judgement, not hidden.

### Optional environment variables

| Variable | Default | Purpose |
| --- | --- | --- |
| `DATABASE_URL` | `file:../data/studymate.db` | SQLite path, resolved relative to `prisma/schema.prisma`. |
| `GEMINI_API_KEY` | empty | Enables live AI. Server-side only. |
| `GEMINI_MODEL` | `gemini-3-flash-preview` | Vision, audio, notes, quizzes, plans and grounded answers. |
| `GEMINI_EMBEDDING_MODEL` | `gemini-embedding-001` | Embeddings for the persisted retrieval index. |
| `GEMINI_EMBEDDING_DIMENSIONS` | `768` | 128–3072 supported. Changing it requires rebuilding every index. |
| `FORCE_DEMO_MODE` | `false` | Keep curated Demo Mode even when a key exists. Useful for judging without spend. |
| `NEXT_PUBLIC_APP_URL` | `http://localhost:3000` | Metadata and deployment links only. Never used for AI calls. |

Start from `.env.example`.

---

## How an upload is processed

The browser never simulates progress. The pipeline writes real stages to the document row, and the upload studio polls the document API.

```text
Upload / sample / typed material
              │
              ▼
        Document created
              │
              ▼
  reading → extracting → chunking → embedding → notes → done
              │             │          │            │
              │             │          │            └─ structured notes, schema-validated
              │             │          └─ Gemini embeddings, persisted per chunk
              │             └─ page- and timestamp-aware retrieval chunks
              └─ image OCR / PDF text or OCR / audio transcription / typed blocks
```

Important behaviours:

- **Partial failure is kept honest.** If embeddings fail, the extraction stays usable and the index is marked failed. The workspace offers a targeted reindex. Notes generation failure does not throw away a successful extraction.
- **PDF handling is explicit.** Digital text-layer PDFs use `unpdf`. Scanned or image-only PDFs go through Gemini OCR. Mixed PDFs warn that pages without a text layer are not silently OCR'd in text mode.
- **Large media uses the Files API.** Payloads over 12 MB are uploaded to Gemini's Files API, polled until active, and deleted in a `finally` block. The local file limits still apply: images 10 MB, PDFs 20 MB, audio 25 MB.
- **Chunks preserve provenance.** Page boundaries are respected, and audio chunks carry start/end seconds. Citations point to a page or a time range, never a vague “document”.
- **No audio or image is stored inside SQLite.** The original file lives under `data/uploads`; the database stores metadata and the storage path.

---

## How grounding and confidence work

### Extraction confidence

Each block carries a confidence from 0 to 1 and an uncertain flag. The UI displays a badge and a bar, with a tooltip that says the value is model-reported. A manual correction sets confidence to 100% and marks the block **Human-corrected**, but it does not erase the original warnings.

### Notes

Notes are generated from the extracted blocks, not directly from the original image or audio. The prompt requires preservation of formulas and technical terms, and asks the model to flag uncertain content. The response is validated against a Zod schema before it is stored. A schema failure surfaces as an error; it is not stored as a partial note.

### Quizzes

- Generated questions are accepted only if all four options are unique and the quoted source excerpt has at least **72% token overlap** with the source text.
- If fewer than 3 valid questions remain, the quiz is rejected rather than saved with invented citations.
- The browser receives question IDs and options only. Correct indexes, explanations and source excerpts arrive after the attempt is scored on the server.
- Attempts are persisted; no score is calculated in the browser.

### Cited Q&A

- Six nearest chunks are retrieved by cosine similarity over persisted vectors.
- In live mode, if the top relevance is below **0.2**, the app returns an explicit no-answer response without calling the generation model.
- The generation schema requires `grounded` and one or more cited chunk IDs. If the model returns no valid citation, the answer is rejected with a retryable error.
- In Demo Mode, retrieval uses a local hashed-token embedding and returns extractive sentences from curated passages at a lower threshold. It is labelled **Demo response**.
- Every assistant message stores its sources. The UI shows page or audio time, a short excerpt and a relevance value.

### Reliability lab

The fixture contains Q6 (legible) and Q7 (smudged exponent). The page does not pretend there is a hidden ground truth digit; the test is whether the system admits uncertainty. The curated reference is authored sample output. A live run stores the current model's actual blocks and warnings without cosmetic edits.

### Planner

Live plans are schema-validated, date-bounded, capped at 60 days, and required to stay inside the requested daily minutes. Regeneration preserves completed topics but resets individual task ticks. Demo plans come from a deterministic local scheduler and are labelled **Non-AI scheduler**; the page does not describe them as AI output.

---

## Pages and flows

| Route | Purpose |
| --- | --- |
| `/` | Landing page: product story, sample inputs, workflow, limitations and demo entry point. |
| `/dashboard` | Workspace overview: counts, recent material, plan progress, recent attempts and next actions. |
| `/library` | Searchable/filterable document library with mode, status, confidence and index state. |
| `/search` | Combined knowledge search: local material search and live web research, with filters, highlighted snippets and real source links. |
| `/upload` | Drag/drop or choose images, PDFs and audio; typed-material tab; sample catalog; validation and real processing stages. |
| `/documents/[id]` | Document workspace: Notes, Extracted, Practice, Ask + original source panel, correction, retry, reindex and delete. |
| `/quiz` | Quiz index with mode, difficulty, attempts and average score (labelled as an attempt statistic, not an accuracy claim). |
| `/quiz/[id]` | Intro, question runner, server-scored results, explanations, source excerpts, filters and retake. |
| `/planner` | Plan creation, day-by-day schedule, task ticks, progress, regeneration and deletion. |
| `/learn` | External topic notes with Simple English / Hinglish output, clearly separated from grounded material. |
| `/reliability` | Fixed ambiguity fixture, pass criteria, curated reference, stored runs, live test and human correction. |
| `/setup` | Server-side status, live connection test, workspace snapshot, env reference, capability matrix and limits. |

The app shell includes a persistent desktop sidebar, a mobile sheet navigation, a Demo Mode banner, and links to setup/status.

---

## Architecture

### Stack

- **Next.js 16.4.3** (App Router, Turbopack)
- **React 19.3.1**
- **TypeScript 5.7**
- **Tailwind CSS 3.4**
- **Prisma 6.19 + SQLite**
- **Google Gen AI SDK 2.32**
- **Zod 4**
- **Radix UI primitives**, **lucide-react**, **sonner**, **KaTeX**, **date-fns**, **unpdf**
- Local WOFF2 fonts via `next/font/local`; no external font/CDN dependency

### Key directories

```text
src/
  app/
    (app)/                 # dashboard, library, upload, documents, planner, quiz, reliability, setup
    api/                   # server-only route handlers
    page.tsx               # landing page
  components/
    document/              # notes, extraction, practice, ask, source panels
    planner/               # plan workspace and forms
    quiz/                  # quiz runner and results
    reliability/           # curated/live reports and correction
    setup/                 # diagnostics and copy control
    ui/                    # buttons, cards, badges, dialogs, inputs, feedback
  lib/
    ai/                    # Gemini client, prompts, extraction, notes, quiz, plan, embeddings, answers
    rag/                   # provenance-aware chunking and local demo embeddings
    demo/                  # curated data and idempotent seed
    client/                # browser API helper and display labels
    process-document.ts    # persisted ingestion/index/notes pipeline
    files.ts               # upload validation and storage
    schemas.ts             # Zod contracts shared across the app
prisma/
  schema.prisma
  migrations/
  seed.ts
public/
  samples/                 # committed demo images, PDF and WAV
data/
  studymate.db             # SQLite, gitignored
  uploads/                 # originals, gitignored
```

### Request boundaries

- **Server Components** read Prisma directly for pages.
- **Client Components** handle interaction and call route handlers through a small `apiFetch` helper.
- **Route handlers** own all Gemini calls, validation, persistence and scoring.
- The Gemini client is cached on `globalThis` in development to avoid re-instantiating it on every hot reload.
- The API key is never included in a client bundle. `NEXT_PUBLIC_*` is limited to the app URL.

### AI output contracts

Every model response used by the app is validated against a Zod schema:

- extraction result and reliability report
- structured notes
- quiz content
- study plan
- grounded answer

The Gemini request also receives a JSON schema derived from the Zod contract. If the provider rejects the schema, the client falls back to a schema-in-prompt attempt. Transient 429/5xx/network errors are retried with a small backoff. JSON is parsed defensively only after the structured attempt fails, then validated. No unvalidated model text is stored as a structured result.

---

## Data model

| Model | Stores |
| --- | --- |
| `Document` | Source metadata, mode, status, persisted processing stage, extraction blocks/warnings, confidence, page count, extraction method/model, index status and error. |
| `Note` | One structured note per document, language, JSON content, model and mode. |
| `Quiz` | Title, difficulty, question count, JSON questions (including answer key), model and mode. |
| `QuizAttempt` | Submitted answers, server-computed score, total, mode and completion time. |
| `Chunk` | Retrieval text, page/audio range, confidence, source label and persisted embedding JSON. |
| `ChatMessage` | Role, content, cited sources JSON, confidence, mode and time. |
| `StudyPlan` | Inputs, JSON topics/days, completed topics, completed task IDs, summary, mode/model. |
| `ReliabilityRun` | Image key, mode, model, JSON result and optional human correction. |

Cascade deletes are configured for document-owned notes, quizzes, chunks and messages. Deleting a document removes its derived data; the original file is removed from disk by the delete route.

---

## API surface

| Method | Route | Purpose |
| --- | --- | --- |
| `POST` | `/api/documents/upload` | Validate and store a live upload (blocked in Demo Mode). |
| `POST` | `/api/documents/text` | Create a typed document (blocked in Demo Mode). |
| `POST` | `/api/documents/sample` | Load a curated sample document (demo or live sample flow). |
| `GET/PATCH/DELETE` | `/api/documents/[id]` | Read, correct metadata/blocks, or delete a document. |
| `POST` | `/api/documents/[id]/process` | Run extraction, chunking, embeddings and notes; retry a failed live document. |
| `GET` | `/api/documents/[id]/file` | Stream the original with HTTP range support for audio seeking. |
| `GET/POST` | `/api/documents/[id]/notes` | Read or generate/regenerate structured notes. |
| `GET/POST` | `/api/documents/[id]/quiz` | List quizzes or generate a grounded quiz. |
| `GET/POST/DELETE` | `/api/documents/[id]/ask` | Conversation history, cited answer, or clear conversation. |
| `POST` | `/api/documents/[id]/reindex` | Rebuild embeddings from corrected/stored chunks. |
| `GET` | `/api/search` | Weighted local search across documents, notes, passages, quizzes and plans. |
| `POST` | `/api/search/web` | Live Gemini Google Search research with extracted source URLs. |
| `POST` | `/api/topics/notes` | External/general-knowledge topic notes; never persisted or indexed. |
| `POST` | `/api/quizzes/[id]/attempts` | Server-score and persist an attempt. |
| `GET/POST` | `/api/plans` | List or create plans. |
| `GET/PATCH/DELETE` | `/api/plans/[id]` | Read, update progress, or delete a plan. |
| `POST` | `/api/plans/[id]/regenerate` | Rebuild a plan while preserving completed topics. |
| `GET/POST` | `/api/reliability/run` | List stored runs or run the fixed live test. |
| `POST` | `/api/reliability/[id]/correction` | Record a human correction alongside a run. |
| `GET` | `/api/status` | Server-side AI status and workspace counts. |
| `POST` | `/api/ai/test` | Real minimal Gemini connection test (disabled without a key). |
| `POST` | `/api/demo/seed` | Idempotently create the curated demo workspace. |

All AI routes use `runtime = "nodejs"` and `dynamic = "force-dynamic"` where they touch the database or provider.

---

## Limits and validation

| Limit | Value |
| --- | --- |
| Image upload | 10 MB |
| PDF upload | 20 MB |
| Audio upload | 25 MB |
| Typed material | 200,000 characters |
| Question length | 2–1,000 characters |
| Quiz generation | 3–10 questions (schema allows up to 12) |
| Plan duration | Up to 60 days |
| Daily study time | 15–360 minutes |
| Syllabus input | 10–30,000 characters |
| Retrieval chunks per document | Up to 250 |
| Chunk size | Up to 1,450 characters |
| Chat history loaded | Latest 60 messages |
| Reliability run list | 12 most recent |
| Gemini Files API threshold | 12 MB, with cleanup |

Validation happens twice: in the browser for fast feedback, and again on the server. Server checks include extension, magic bytes, declared-vs-detected type, empty files and size. Client validation is a convenience, not a security boundary.

---

## Scripts

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start the development server. |
| `npm run build` | Generate Prisma Client and create a production build. |
| `npm start` | Start the production build. |
| `npm run typecheck` | TypeScript check with `tsc --noEmit`. |
| `npm run setup` | Generate client, apply migrations and seed the demo. |
| `npm run db:generate` | Regenerate Prisma Client. |
| `npm run db:migrate` | Create/apply a development migration. |
| `npm run db:deploy` | Apply committed migrations. |
| `npm run db:push` | Push the schema without a migration. |
| `npm run db:seed` | Re-run the idempotent demo seed. |
| `npm run samples` | Regenerate sample assets with Python (assets are already committed). |

---

## Verification status

The following was exercised in this workspace:

- `npm run typecheck` passes.
- `npm run build` passes after the final interface pass; all routes compile. Turbopack reports two non-blocking dynamic-filesystem tracing warnings in the document file routes.
- Browser layouts at **320 px, 390 px and 1440 px**: landing, dashboard, library, search, upload, planner, quiz, learn, reliability, setup and the document workspace. No page-level horizontal overflow was found. The fixed decorative web layer extends beyond the viewport by design; it cannot receive pointer events or be read by assistive technology.
- Seeded demo workspace: 3 documents, 3 notes, 3 quizzes, 1 plan, 1 reliability reference and a demo conversation.
- Mobile navigation, local knowledge search with kind filters, and search empty states.
- Manual correction on the demo document: warning audit preserved, block marked human-corrected, index marked stale, rebuild restored ready.
- Demo Ask: cited response and clear-conversation flow.
- Quiz: all questions answered, submitted, scored on the server, explanations/excerpts shown, attempt persisted.
- Planner: task tick persisted across reload; regeneration dialog, deterministic regeneration and completion reset.
- Reliability: human correction saved and persisted.
- Learn a topic: live topic notes returned a validated response in an earlier verification run; the interface also renders the external-knowledge notice correctly.

**Live verification is partial, not claimed as complete.** A Gemini key is configured in this workspace, but the model's daily request quota was exhausted during the final pass. The connection test therefore surfaced the provider's quota error honestly instead of returning a fake success. Live web research, a fresh end-to-end upload, live diagram extraction and live quiz/plan generation remain to be re-run when quota resets or billing is enabled. The app never substitutes curated output for a failed live call.

There is no automated browser test suite. Validation for this build was manual plus TypeScript and production-build checks.

---

## Known limitations

- **Single local workspace.** There is no authentication or per-user ownership. Anyone who can open the app can read, edit and delete the data. Add auth and tenant isolation before any public deployment.
- **SQLite and local disk.** Deliberate for a local demo: easy to inspect and reset. It is not a production multi-user database.
- **Confidence is self-reported.** It is not a calibrated probability, and no accuracy percentage is claimed anywhere.
- **Grounding is bounded.** The quiz check verifies quoted excerpts; the Q&A check verifies citations. Neither proves that the explanation, formula or study advice is correct.
- **Model judgement can still fail.** The reliability lab exists to show that a confident wrong answer is possible. Inspect warnings and sources.
- **Live AI needs network and quota.** Rate limits, quota exhaustion or provider outages surface as errors with retry guidance. The app does not silently substitute curated content.
- **Mixed PDFs.** In digital-PDF mode only the text layer is used. Pages without a text layer are marked unreadable rather than silently OCR'd; use an image-based flow if every page must be OCR'd.
- **Web sources are real but unvetted.** Web research reports the URLs returned by Gemini Google Search grounding. It does not score source authority, check publication dates or verify every claim. Open the original page before relying on it.
- **Files API cleanup is best-effort.** Uploaded Gemini files are deleted in a `finally` block, but a process crash can leave a provider-side file. It is not referenced by the app.
- **Daily quota can interrupt every live flow.** Provider quota exhaustion is surfaced as a retryable error. It is never hidden behind curated output.
- **No automated tests.** Type checking, the production build and manual browser flows were used. A CI suite would be the next engineering step.

---

## Resetting the demo

The seed is idempotent and safe to run again:

```bash
npm run db:seed
```

It creates missing demo records but does not overwrite edits, quiz attempts or corrections you made. For a clean factory reset:

1. Stop the dev server.
2. Delete `data/studymate.db` (and optionally `data/uploads/*`).
3. Run:
   ```bash
   npm run setup
   ```

This recreates the database, applies migrations and seeds the pristine curated workspace.

---

## Design notes

- **Follows the supplied Apple design spec.** `DESIGN.md` is the visual reference: one Action Blue accent, Apple ink and parchment neutrals, hairline borders, 18px utility cards, pill controls, 600-weight headlines and no decorative card shadows.
- **One canvas, one quiet texture.** A fixed, low-contrast spider-web SVG sits behind the app in `SpiderWebBackground`. It is `aria-hidden`, pointer-events-free, hidden in print and deliberately faint enough for long reading sessions.
- **Local fonts** keep the UI fully offline and avoid layout shift or CDN dependencies.
- **Server-side keys only.** `GEMINI_API_KEY` is never exposed through `NEXT_PUBLIC_*`.
- **Persisted progress.** The browser polls real database stages; there is no `setTimeout`-driven fake progress bar.
- **Citation-first UI.** Source panels show page/timestamp ranges, excerpts, confidence and index state next to the interpretation.
- **Demo labels are not decoration.** They are stored with each record and rendered in the relevant surface, including chat messages and quiz attempts.
- **No hidden fallback.** A failed live run stays failed and offers retry; it never becomes a curated sample.

---

**STUDYMATE AI** — built to make study material easier to trust, not just easier to generate.
