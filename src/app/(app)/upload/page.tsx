import { getAIStatus } from "@/lib/env";
import { PageHeader } from "@/components/ui/page-header";
import { UploadStudio } from "@/components/upload/upload-studio";

export const dynamic = "force-dynamic";

export const metadata = { title: "Upload material" };

export default function UploadPage() {
  const ai = getAIStatus();

  return (
    <div>
      <PageHeader
        eyebrow="New study material"
        title="Bring the real thing."
        description="A tilted phone photo, a scanned syllabus, a noisy lecture or typed notes. The real pipeline shows each stage and preserves the original next to the extraction."
      />
      <UploadStudio live={ai.configured} demoReason={ai.reason} />
    </div>
  );
}
