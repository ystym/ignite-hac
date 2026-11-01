import Link from "next/link";
import { UploadCloud } from "lucide-react";
import { prisma } from "@/lib/db";
import { getAIStatus } from "@/lib/env";
import { toDocumentSummary, parseWarnings } from "@/lib/documents";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { DocumentLibrary } from "@/components/library/document-library";

export const dynamic = "force-dynamic";

export const metadata = { title: "Library" };

export default async function LibraryPage() {
  const ai = getAIStatus();
  const documents = await prisma.document.findMany({
    orderBy: [{ updatedAt: "desc" }],
    include: {
      notes: { select: { id: true } },
      quizzes: { select: { id: true } },
    },
  });

  const library = documents.map((doc) => ({
    ...toDocumentSummary(doc),
    noteCount: doc.notes ? 1 : 0,
    quizCount: doc.quizzes.length,
    warningCount: parseWarnings(doc.warningsJson).length,
  }));

  return (
    <div>
      <PageHeader
        eyebrow={`${documents.length} item${documents.length === 1 ? "" : "s"} in your workspace`}
        title="Material library"
        description="Every original, extraction, note set and quiz lives together. Open a document to inspect what the AI read and how sure it was."
        actions={
          <Button asChild variant="violet">
            <Link href="/upload">
              <UploadCloud className="h-4 w-4" /> Upload material
            </Link>
          </Button>
        }
      />
      <DocumentLibrary documents={library} demoMode={ai.mode === "demo"} />
    </div>
  );
}
