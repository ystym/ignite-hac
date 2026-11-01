import { type Language, type TopicNotesContent, topicNotesSchema } from "@/lib/schemas";
import { TOPIC_NOTES_SYSTEM, topicNotesPrompt } from "@/lib/ai/prompts";
import { generateStructured, getConfiguredModel } from "@/lib/ai/gemini";

export type TopicNotesResult = {
  topic: string;
  notes: TopicNotesContent;
  model: string;
};

/**
 * Generates standalone notes for a requested topic from general knowledge.
 *
 * This is deliberately not connected to a document, its embeddings, its stored
 * note, its quizzes or the cited Ask flow. The output is labelled as external
 * knowledge everywhere it is returned or rendered.
 */
export async function generateTopicNotes(options: {
  topic: string;
  language: Language;
}): Promise<TopicNotesResult> {
  const topic = options.topic.replace(/\s+/g, " ").trim();

  const notes = await generateStructured({
    schema: topicNotesSchema,
    systemInstruction: TOPIC_NOTES_SYSTEM,
    prompt: topicNotesPrompt({ topic, language: options.language }),
    temperature: 0.35,
    maxOutputTokens: 16000,
  });

  return {
    topic,
    notes: {
      ...notes,
      title: notes.title.trim() || topic,
      scopeNote: notes.scopeNote.trim(),
    },
    model: getConfiguredModel(),
  };
}
