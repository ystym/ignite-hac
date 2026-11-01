import { PrismaClient } from "@prisma/client";
import { addDays, format } from "date-fns";
import { stat } from "node:fs/promises";
import path from "node:path";
import { buildChunks } from "@/lib/rag/chunk";
import { localEmbedding } from "@/lib/rag/local-embedding";
import { buildLocalPlan } from "@/lib/ai/plan";
import type { PlanInput, SourceReference } from "@/lib/schemas";
import {
  audioExtraction,
  audioNotes,
  audioQuiz,
  handwrittenExtraction,
  handwrittenNotes,
  handwrittenQuiz,
  reliabilityDemo,
  syllabusExtraction,
  syllabusNotes,
  syllabusQuiz,
} from "@/lib/demo/data";

type Scenario = {
  key: string;
  docId: string;
  noteId: string;
  quizId: string;
  title: string;
  fileName: string;
  sampleFile: string;
  mimeType: string;
  fileType: "image" | "pdf" | "audio";
  extraction: typeof handwrittenExtraction;
  notes: typeof handwrittenNotes;
  quiz: typeof handwrittenQuiz;
  pageCount: number | null;
  extractionMethod: string;
};

const SCENARIOS: Scenario[] = [
  {
    key: "handwritten",
    docId: "demo-doc-kinematics",
    noteId: "demo-note-kinematics",
    quizId: "demo-quiz-kinematics",
    title: "Kinematics — handwritten physics notes",
    fileName: "handwritten-notes.png",
    sampleFile: "handwritten-notes.png",
    mimeType: "image/png",
    fileType: "image",
    extraction: handwrittenExtraction,
    notes: handwrittenNotes,
    quiz: handwrittenQuiz,
    pageCount: 1,
    extractionMethod: "vision_ocr",
  },
  {
    key: "syllabus",
    docId: "demo-doc-dsa",
    noteId: "demo-note-dsa",
    quizId: "demo-quiz-dsa",
    title: "CS204 · Data Structures & Algorithms — Semester 4 syllabus",
    fileName: "sample-syllabus.pdf",
    sampleFile: "sample-syllabus.pdf",
    mimeType: "application/pdf",
    fileType: "pdf",
    extraction: syllabusExtraction,
    notes: syllabusNotes,
    quiz: syllabusQuiz,
    pageCount: 5,
    extractionMethod: "pdf_text",
  },
  {
    key: "audio",
    docId: "demo-doc-audio",
    noteId: "demo-note-audio",
    quizId: "demo-quiz-audio",
    title: "Kinematics lecture — noisy recording",
    fileName: "lecture-kinematics.wav",
    sampleFile: "lecture-kinematics.wav",
    mimeType: "audio/wav",
    fileType: "audio",
    extraction: audioExtraction,
    notes: audioNotes,
    quiz: audioQuiz,
    pageCount: null,
    extractionMethod: "audio_transcription",
  },
];

async function sampleSize(fileName: string): Promise<number> {
  try {
    const info = await stat(path.join(process.cwd(), "public", "samples", fileName));
    return info.size;
  } catch {
    return 0;
  }
}

export type DemoWorkspace = {
  documentIds: string[];
  planId: string | null;
  reliabilityRunId: string;
};

/**
 * Idempotently loads the curated demo workspace. Everything is marked mode=DEMO
 * at the database boundary and surfaced with explicit "curated demo" labels.
 */
export async function ensureDemoWorkspace(prisma: PrismaClient): Promise<DemoWorkspace> {
  const documentIds: string[] = [];

  for (const scenario of SCENARIOS) {
    const size = await sampleSize(scenario.sampleFile);
    const chunks = buildChunks(scenario.extraction.blocks, scenario.title).chunks;
    const chunkRows = chunks.map((chunk, index) => ({
      id: `demo-${scenario.key}-chunk-${index}`,
      documentId: scenario.docId,
      chunkIndex: index,
      content: chunk.content,
      page: chunk.page,
      startSeconds: chunk.startSeconds,
      endSeconds: chunk.endSeconds,
      confidence: chunk.confidence,
      sourceLabel: chunk.sourceLabel,
      embeddingJson: JSON.stringify(localEmbedding(chunk.content)),
    }));

    await prisma.document.upsert({
      where: { id: scenario.docId },
      create: {
        id: scenario.docId,
        title: scenario.title,
        fileName: scenario.fileName,
        mimeType: scenario.mimeType,
        fileSize: size,
        fileType: scenario.fileType,
        source: "DEMO",
        sampleKey: scenario.key,
        status: "READY",
        processingStage: "done",
        mode: "DEMO",
        extractedText: scenario.extraction.blocks.map((block) => block.text).join("\n\n"),
        blocksJson: JSON.stringify(scenario.extraction.blocks),
        warningsJson: JSON.stringify(scenario.extraction.warnings),
        overallConfidence: scenario.extraction.overallConfidence,
        pageCount: scenario.pageCount,
        language: scenario.extraction.detectedLanguage,
        extractionMethod: scenario.extractionMethod,
        extractionModel: "curated demo (not a live model run)",
        indexStatus: "READY",
        createdAt: new Date(),
      },
      update: {
        title: scenario.title,
        fileName: scenario.fileName,
        mimeType: scenario.mimeType,
        fileSize: size,
        fileType: scenario.fileType,
        source: "DEMO",
        sampleKey: scenario.key,
        status: "READY",
        processingStage: "done",
        processingError: null,
        mode: "DEMO",
        extractedText: scenario.extraction.blocks.map((block) => block.text).join("\n\n"),
        blocksJson: JSON.stringify(scenario.extraction.blocks),
        warningsJson: JSON.stringify(scenario.extraction.warnings),
        overallConfidence: scenario.extraction.overallConfidence,
        pageCount: scenario.pageCount,
        language: scenario.extraction.detectedLanguage,
        extractionMethod: scenario.extractionMethod,
        extractionModel: "curated demo (not a live model run)",
        indexStatus: "READY",
        indexError: null,
      },
    });

    await prisma.$transaction([
      prisma.chunk.deleteMany({ where: { documentId: scenario.docId } }),
      prisma.chunk.createMany({ data: chunkRows }),
      prisma.note.upsert({
        where: { documentId: scenario.docId },
        create: {
          id: scenario.noteId,
          documentId: scenario.docId,
          title: scenario.notes.title,
          language: "simple_en",
          contentJson: JSON.stringify(scenario.notes),
          mode: "DEMO",
          model: "curated demo",
        },
        update: {
          title: scenario.notes.title,
          contentJson: JSON.stringify(scenario.notes),
          language: "simple_en",
          mode: "DEMO",
          model: "curated demo",
        },
      }),
      prisma.quiz.upsert({
        where: { id: scenario.quizId },
        create: {
          id: scenario.quizId,
          documentId: scenario.docId,
          title: scenario.quiz.title,
          difficulty: scenario.quiz.difficulty,
          questionCount: scenario.quiz.questions.length,
          questionsJson: JSON.stringify(scenario.quiz),
          mode: "DEMO",
          model: "curated demo",
        },
        update: {
          title: scenario.quiz.title,
          difficulty: scenario.quiz.difficulty,
          questionCount: scenario.quiz.questions.length,
          questionsJson: JSON.stringify(scenario.quiz),
          mode: "DEMO",
          model: "curated demo",
        },
      }),
    ]);

    documentIds.push(scenario.docId);
  }

  // A curated, clearly-labelled example conversation demonstrates citations
  // immediately. It is not presented as a live generation.
  const messageCount = await prisma.chatMessage.count({ where: { documentId: "demo-doc-kinematics" } });
  if (messageCount === 0) {
    const chunk = await prisma.chunk.findFirst({
      where: { documentId: "demo-doc-kinematics", content: { contains: "Displacement" } },
      orderBy: { chunkIndex: "asc" },
    });
    const source: SourceReference | null = chunk
      ? {
          chunkId: chunk.id,
          label: chunk.sourceLabel ?? "Page 1",
          page: chunk.page,
          startSeconds: chunk.startSeconds,
          endSeconds: chunk.endSeconds,
          excerpt: chunk.content.replace(/\s+/g, " ").slice(0, 360),
          relevance: 0.82,
          confidence: chunk.confidence,
        }
      : null;

    await prisma.chatMessage.createMany({
      data: [
        {
          id: "demo-chat-user-1",
          documentId: "demo-doc-kinematics",
          role: "user",
          content: "Why can displacement be zero when distance is not?",
          mode: "DEMO",
        },
        {
          id: "demo-chat-assistant-1",
          documentId: "demo-doc-kinematics",
          role: "assistant",
          content:
            "Displacement is the shortest vector from the start to the end, while distance is the total path length. If you walk away and return to the start, the path length is non-zero but the displacement is zero. The notes also flag that one formula exponent is unreadable, but that does not change this definition.",
          sourcesJson: JSON.stringify(source ? [source] : []),
          confidence: 0.86,
          mode: "DEMO",
        },
      ],
    });
  }

  let planId: string | null = null;
  const existingPlan = await prisma.studyPlan.findUnique({ where: { id: "demo-plan-dsa" } });
  if (!existingPlan) {
    const input: PlanInput = {
      title: "DSA 14-day exam sprint",
      subject: "Data Structures & Algorithms",
      examDate: format(addDays(new Date(), 14), "yyyy-MM-dd"),
      dailyMinutes: 90,
      language: "simple_en",
      syllabus: [
        "Arrays & Strings",
        "Linked Lists",
        "Stacks & Queues",
        "Trees & Heaps",
        "Graphs",
        "Hashing",
        "Sorting & Searching",
        "Dynamic Programming",
      ].join("\n"),
      completedTopics: ["Arrays & Strings", "Stacks & Queues"],
    };
    const local = buildLocalPlan(input);
    const plan = await prisma.studyPlan.create({
      data: {
        id: "demo-plan-dsa",
        title: local.plan.title,
        subject: input.subject,
        examDate: new Date(`${input.examDate}T12:00:00`),
        dailyMinutes: input.dailyMinutes,
        language: input.language,
        syllabus: input.syllabus,
        topicsJson: JSON.stringify(local.plan.topics),
        daysJson: JSON.stringify(local.plan.days),
        completedTopicsJson: JSON.stringify(input.completedTopics),
        completedTaskIdsJson: "[]",
        summary: local.plan.summary,
        mode: "DEMO",
        model: "local-scheduler",
      },
    });
    planId = plan.id;
  } else {
    planId = existingPlan.id;
  }

  const reliability = await prisma.reliabilityRun.findUnique({ where: { id: "demo-reliability" } });
  if (!reliability) {
    await prisma.reliabilityRun.create({
      data: {
        id: "demo-reliability",
        imageKey: "ambiguous",
        mode: "DEMO",
        model: "curated demo (not a live model run)",
        resultJson: JSON.stringify(reliabilityDemo),
        humanCorrection:
          "The unresolved exponent was not guessed. The student replaced Q7 with a legible copy of the intended question and excluded the original from revision until it can be verified.",
      },
    });
  }

  return {
    documentIds,
    planId,
    reliabilityRunId: "demo-reliability",
  };
}
