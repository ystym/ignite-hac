import { getAIStatus } from "@/lib/env";
import { PageHeader } from "@/components/ui/page-header";
import { TopicNotesGenerator } from "@/components/notes/topic-notes-generator";

export const dynamic = "force-dynamic";

export const metadata = { title: "Learn a topic" };

export default async function LearnPage({
  searchParams,
}: {
  searchParams: Promise<{ topic?: string | string[] }>;
}) {
  const params = await searchParams;
  const initialTopic =
    typeof params.topic === "string"
      ? params.topic.slice(0, 180)
      : Array.isArray(params.topic)
        ? (params.topic[0] ?? "").slice(0, 180)
        : "";
  const ai = getAIStatus();

  return (
    <div>
      <PageHeader
        eyebrow="Optional enrichment"
        title="Learn a topic outside your notes"
        description="Request a topic that is not in your uploaded material. These notes come from general knowledge and stay separate from your grounded notes, quizzes and cited answers."
      />
      <TopicNotesGenerator
        aiConfigured={ai.configured}
        model={ai.model}
        initialTopic={initialTopic}
      />
    </div>
  );
}
