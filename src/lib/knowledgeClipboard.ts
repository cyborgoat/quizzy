import { serializeKnowledgeFile } from "@/lib/frontMatter";
import type { KnowledgeItem } from "@/types/knowledge";

export function formatKnowledgeNoteMarkdown(item: KnowledgeItem) {
  return serializeKnowledgeFile(item, item.content);
}

export async function copyKnowledgeNoteMarkdown(item: KnowledgeItem) {
  const text = formatKnowledgeNoteMarkdown(item);
  if (!navigator.clipboard?.writeText) {
    throw new Error("Clipboard is not available in this environment.");
  }
  await navigator.clipboard.writeText(text);
}
