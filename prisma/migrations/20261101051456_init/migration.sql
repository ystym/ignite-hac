-- CreateTable
CREATE TABLE "Document" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "fileSize" INTEGER NOT NULL,
    "fileType" TEXT NOT NULL,
    "source" TEXT NOT NULL DEFAULT 'UPLOAD',
    "sampleKey" TEXT,
    "storagePath" TEXT,
    "status" TEXT NOT NULL DEFAULT 'UPLOADED',
    "processingStage" TEXT NOT NULL DEFAULT 'queued',
    "processingError" TEXT,
    "mode" TEXT NOT NULL DEFAULT 'LIVE',
    "extractedText" TEXT,
    "blocksJson" TEXT,
    "warningsJson" TEXT,
    "overallConfidence" REAL,
    "pageCount" INTEGER,
    "language" TEXT,
    "extractionMethod" TEXT,
    "extractionModel" TEXT,
    "indexStatus" TEXT NOT NULL DEFAULT 'PENDING',
    "indexError" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Note" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "documentId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "language" TEXT NOT NULL DEFAULT 'simple_en',
    "contentJson" TEXT NOT NULL,
    "model" TEXT,
    "mode" TEXT NOT NULL DEFAULT 'LIVE',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Note_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "Document" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Quiz" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "documentId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "difficulty" TEXT NOT NULL DEFAULT 'mixed',
    "questionCount" INTEGER NOT NULL,
    "questionsJson" TEXT NOT NULL,
    "model" TEXT,
    "mode" TEXT NOT NULL DEFAULT 'LIVE',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Quiz_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "Document" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "QuizAttempt" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "quizId" TEXT NOT NULL,
    "answersJson" TEXT NOT NULL,
    "score" INTEGER NOT NULL,
    "total" INTEGER NOT NULL,
    "mode" TEXT NOT NULL DEFAULT 'LIVE',
    "completedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "QuizAttempt_quizId_fkey" FOREIGN KEY ("quizId") REFERENCES "Quiz" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Chunk" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "documentId" TEXT NOT NULL,
    "chunkIndex" INTEGER NOT NULL,
    "content" TEXT NOT NULL,
    "page" INTEGER,
    "startSeconds" REAL,
    "endSeconds" REAL,
    "confidence" REAL,
    "sourceLabel" TEXT,
    "embeddingJson" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Chunk_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "Document" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ChatMessage" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "documentId" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "sourcesJson" TEXT,
    "confidence" REAL,
    "mode" TEXT NOT NULL DEFAULT 'LIVE',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ChatMessage_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "Document" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "StudyPlan" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "examDate" DATETIME NOT NULL,
    "dailyMinutes" INTEGER NOT NULL,
    "language" TEXT NOT NULL DEFAULT 'simple_en',
    "syllabus" TEXT NOT NULL,
    "topicsJson" TEXT NOT NULL,
    "daysJson" TEXT NOT NULL,
    "completedTopicsJson" TEXT NOT NULL,
    "completedTaskIdsJson" TEXT NOT NULL,
    "summary" TEXT,
    "mode" TEXT NOT NULL DEFAULT 'LIVE',
    "model" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "ReliabilityRun" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "imageKey" TEXT NOT NULL,
    "mode" TEXT NOT NULL DEFAULT 'LIVE',
    "model" TEXT,
    "resultJson" TEXT NOT NULL,
    "humanCorrection" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateIndex
CREATE INDEX "Document_createdAt_idx" ON "Document"("createdAt");

-- CreateIndex
CREATE INDEX "Document_status_idx" ON "Document"("status");

-- CreateIndex
CREATE UNIQUE INDEX "Note_documentId_key" ON "Note"("documentId");

-- CreateIndex
CREATE INDEX "Quiz_documentId_idx" ON "Quiz"("documentId");

-- CreateIndex
CREATE INDEX "QuizAttempt_quizId_idx" ON "QuizAttempt"("quizId");

-- CreateIndex
CREATE INDEX "Chunk_documentId_idx" ON "Chunk"("documentId");

-- CreateIndex
CREATE INDEX "ChatMessage_documentId_createdAt_idx" ON "ChatMessage"("documentId", "createdAt");
