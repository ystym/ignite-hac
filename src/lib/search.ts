import { prisma } from "@/lib/db";
import { parseNotes, parseQuiz, parseStringArray } from "@/lib/documents";

export type SearchKind = "document" | "notes" | "passage" | "quiz" | "plan";

export type SearchHit = {
  id: string;
  kind: SearchKind;
  title: string;
  snippet: string;
  href: string;
  meta: string;
  score: number;
  mode: string;
  documentId?: string;
  sourceLabel?: string;
  confidence?: number | null;
};

export type LocalSearchResult = {
  query: string;
  hits: SearchHit[];
  counts: Record<SearchKind, number>;
  total: number;
  tookMs: number;
};

const MAX_HITS = 40;
const MAX_CHUNKS = 12_000;

const STOPWORDS = new Set([
  "a", "about", "an", "and", "are", "as", "at", "be", "been", "being", "by", "can",
  "define", "did", "do", "does", "explain", "for", "from", "give", "how", "i", "in",
  "is", "it", "its", "learn", "me", "meaning", "my", "notes", "of", "on", "or",
  "please", "show", "study", "tell", "that", "the", "their", "them", "then", "these",
  "this", "those", "to", "topic", "was", "we", "were", "what", "when", "where",
  "which", "who", "why", "with", "would", "you", "your",
]);

function normalize(value: string): string {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function queryTokens(normalizedQuery: string): string[] {
  const all = normalizedQuery.split(" ").filter(Boolean);
  const meaningful = all.filter((token) => token.length > 1 && !STOPWORDS.has(token));
  return meaningful.length > 0 ? meaningful : all;
}

/** Weighted lexical score. Coverage matters: a hit on every query token beats one lucky token. */
function fieldScore(text: string | null | undefined, nq: string, tokens: string[], weight: number): number {
  if (!text) return 0;
  const normalized = normalize(text);
  if (!normalized) return 0;

  let score = 0;
  if (normalized === nq) score += 10 * weight;
  else if (normalized.includes(nq)) score += 5 * weight;

  let matched = 0;
  let occurrences = 0;
  for (const token of tokens) {
    let index = normalized.indexOf(token);
    if (index === -1) continue;
    matched += 1;
    let count = 0;
    while (index !== -1 && count < 4) {
      count += 1;
      index = normalized.indexOf(token, index + token.length);
    }
    occurrences += count;
  }

  if (matched === 0) return 0;
  score += (matched / tokens.length) * weight * 3;
  score += Math.min(occurrences, 8) * weight * 0.25;
  return score;
}

function makeSnippet(text: string | null | undefined, nq: string, tokens: string[], max = 240): string {
  if (!text) return "";
  const flat = text.replace(/\s+/g, " ").trim();
  if (!flat) return "";
  const lower = flat.toLowerCase();

  let index = lower.indexOf(nq);
  if (index === -1) {
    for (const token of tokens) {
      const found = lower.indexOf(token);
      if (found !== -1 && (index === -1 || found < index)) index = found;
    }
  }
  if (index === -1) index = 0;

  const start = Math.max(0, index - 70);
  const end = Math.min(flat.length, start + max);
  const piece = flat.slice(start, end).trim();
  return `${start > 0 ? "…" : ""}${piece}${end < flat.length ? "…" : ""}`;
}

function kindCounts(hits: SearchHit[]): Record<SearchKind, number> {
  const counts: Record<SearchKind, number> = {
    document: 0,
    notes: 0,
    passage: 0,
    quiz: 0,
    plan: 0,
  };
  for (const hit of hits) counts[hit.kind] += 1;
  return counts;
}

export async function searchLocalMaterial(rawQuery: string): Promise<LocalSearchResult> {
  const started = performance.now();
  const query = rawQuery.trim().slice(0, 180);
  const nq = normalize(query);
  const tokens = nq ? queryTokens(nq) : [];

  if (nq.length < 2) {
    return {
      query,
      hits: [],
      counts: kindCounts([]),
      total: 0,
      tookMs: Math.round(performance.now() - started),
    };
  }

  const [documents, notes, chunks, quizzes, plans] = await Promise.all([
    prisma.document.findMany({
      select: {
        id: true,
        title: true,
        fileName: true,
        fileType: true,
        status: true,
        mode: true,
        extractedText: true,
        overallConfidence: true,
        indexStatus: true,
      },
    }),
    prisma.note.findMany({
      select: { id: true, documentId: true, title: true, language: true, contentJson: true, mode: true },
    }),
    prisma.chunk.findMany({
      select: {
        id: true,
        documentId: true,
        content: true,
        sourceLabel: true,
        confidence: true,
      },
      take: MAX_CHUNKS,
    }),
    prisma.quiz.findMany({
      select: {
        id: true,
        documentId: true,
        title: true,
        difficulty: true,
        questionCount: true,
        questionsJson: true,
        mode: true,
      },
    }),
    prisma.studyPlan.findMany({
      select: {
        id: true,
        title: true,
        subject: true,
        syllabus: true,
        topicsJson: true,
        summary: true,
        mode: true,
      },
    }),
  ]);

  const notesByDocument = new Map(notes.map((note) => [note.documentId, note]));
  const documentById = new Map(documents.map((document) => [document.id, document]));
  const hits: SearchHit[] = [];

  for (const document of documents) {
    const score =
      fieldScore(document.title, nq, tokens, 6) +
      fieldScore(document.fileName, nq, tokens, 2) +
      fieldScore(document.extractedText, nq, tokens, 1);

    if (score > 0) {
      hits.push({
        id: `document-${document.id}`,
        kind: "document",
        title: document.title,
        snippet: makeSnippet(document.extractedText, nq, tokens),
        href: `/documents/${document.id}`,
        meta: `${document.fileType.toUpperCase()} · ${document.status.toLowerCase()}${
          document.indexStatus === "READY" ? " · searchable" : ""
        }`,
        score: Math.round(score * 10) / 10,
        mode: document.mode,
        documentId: document.id,
        confidence: document.overallConfidence,
      });
    }

    const note = notesByDocument.get(document.id);
    if (note) {
      const content = parseNotes(note.contentJson);
      if (content) {
        const overviewScore =
          fieldScore(content.title, nq, tokens, 4) +
          fieldScore(content.overview, nq, tokens, 1.5);

        if (overviewScore > 0) {
          hits.push({
            id: `note-overview-${note.id}`,
            kind: "notes",
            title: content.title,
            snippet: makeSnippet(content.overview, nq, tokens),
            href: `/documents/${document.id}`,
            meta: "Grounded note · overview",
            score: Math.round(overviewScore * 10) / 10,
            mode: note.mode,
            documentId: document.id,
          });
        }

        const sectionHits = content.sections
          .map((section, index) => {
            const sectionScore =
              fieldScore(section.heading, nq, tokens, 5) +
              fieldScore(section.explanation, nq, tokens, 1.6) +
              fieldScore(section.keyPoints.join(" "), nq, tokens, 2) +
              fieldScore(
                section.definitions
                  .map((definition) => `${definition.term} ${definition.definition}`)
                  .join(" "),
                nq,
                tokens,
                2.4,
              ) +
              fieldScore(
                section.formulas.map((formula) => `${formula.formula} ${formula.explanation}`).join(" "),
                nq,
                tokens,
                2.2,
              ) +
              fieldScore(section.examples.join(" "), nq, tokens, 1.4) +
              fieldScore(section.examTips.join(" "), nq, tokens, 1.8);

            return {
              index,
              score: sectionScore,
              heading: section.heading,
              explanation: section.explanation,
              keyPoints: section.keyPoints,
            };
          })
          .filter((section) => section.score > 0)
          .sort((a, b) => b.score - a.score)
          .slice(0, 2);

        for (const section of sectionHits) {
          hits.push({
            id: `note-${note.id}-${section.index}`,
            kind: "notes",
            title: section.heading,
            snippet: makeSnippet(
              section.explanation || section.keyPoints.join(" "),
              nq,
              tokens,
            ),
            href: `/documents/${document.id}`,
            meta: `Grounded note · section ${String(section.index + 1).padStart(2, "0")}`,
            score: Math.round(section.score * 10) / 10,
            mode: note.mode,
            documentId: document.id,
          });
        }
      }
    }
  }

  const chunksByDocument = new Map<string, typeof chunks>();
  for (const chunk of chunks) {
    if (fieldScore(chunk.content, nq, tokens, 1) === 0) continue;
    const list = chunksByDocument.get(chunk.documentId) ?? [];
    list.push(chunk);
    chunksByDocument.set(chunk.documentId, list);
  }

  for (const [documentId, documentChunks] of chunksByDocument) {
    const document = documentById.get(documentId);
    if (!document) continue;
    const ranked = documentChunks
      .map((chunk) => ({ chunk, score: fieldScore(chunk.content, nq, tokens, 1) }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 2);

    for (const { chunk, score } of ranked) {
      hits.push({
        id: `chunk-${chunk.id}`,
        kind: "passage",
        title: document.title,
        snippet: makeSnippet(chunk.content, nq, tokens),
        href: `/documents/${documentId}`,
        meta: chunk.sourceLabel ? `Extracted passage · ${chunk.sourceLabel}` : "Extracted passage",
        score: Math.round(score * 10) / 10,
        mode: document.mode,
        documentId,
        sourceLabel: chunk.sourceLabel ?? undefined,
        confidence: chunk.confidence,
      });
    }
  }

  for (const quiz of quizzes) {
    const content = parseQuiz(quiz.questionsJson);
    const questionText = content?.questions
      .map((question) => `${question.concept} ${question.question} ${question.explanation}`)
      .join(" ");
    const score = fieldScore(quiz.title, nq, tokens, 4) + fieldScore(questionText, nq, tokens, 1.4);
    if (score <= 0) continue;

    hits.push({
      id: `quiz-${quiz.id}`,
      kind: "quiz",
      title: quiz.title,
      snippet:
        makeSnippet(questionText, nq, tokens) ||
        `${quiz.questionCount} questions · ${quiz.difficulty}`,
      href: `/quiz/${quiz.id}`,
      meta: `Practice · ${quiz.difficulty} · ${quiz.questionCount} questions`,
      score: Math.round(score * 10) / 10,
      mode: quiz.mode,
      documentId: quiz.documentId,
    });
  }

  for (const plan of plans) {
    const topics = parseStringArray(plan.topicsJson).join(" ");
    const score =
      fieldScore(plan.title, nq, tokens, 4) +
      fieldScore(plan.subject, nq, tokens, 3) +
      fieldScore(plan.syllabus, nq, tokens, 1.6) +
      fieldScore(topics, nq, tokens, 1.8) +
      fieldScore(plan.summary, nq, tokens, 1.2);
    if (score <= 0) continue;

    hits.push({
      id: `plan-${plan.id}`,
      kind: "plan",
      title: plan.title,
      snippet: makeSnippet(plan.summary || plan.syllabus, nq, tokens),
      href: "/planner",
      meta: `Study plan · ${plan.subject}`,
      score: Math.round(score * 10) / 10,
      mode: plan.mode,
    });
  }

  hits.sort((a, b) => b.score - a.score);
  const limited = hits.slice(0, MAX_HITS);

  return {
    query,
    hits: limited,
    counts: kindCounts(limited),
    total: limited.length,
    tookMs: Math.round(performance.now() - started),
  };
}
