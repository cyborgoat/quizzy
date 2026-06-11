import type { KnowledgeItem, LinkedQuizQuestion } from "@/types/knowledge";

const DRAFT_STORAGE_PREFIX = "knowledge-draft:";

export function isUnsavedKnowledgeDraft(item: KnowledgeItem) {
  return item.fileName === "";
}

export function stashKnowledgeDraft(draft: KnowledgeItem) {
  if (!isUnsavedKnowledgeDraft(draft)) return;
  sessionStorage.setItem(`${DRAFT_STORAGE_PREFIX}${draft.id}`, JSON.stringify(draft));
}

export function readKnowledgeDraft(knowledgeId: string): KnowledgeItem | undefined {
  const raw = sessionStorage.getItem(`${DRAFT_STORAGE_PREFIX}${knowledgeId}`);
  if (!raw) return undefined;

  try {
    const parsed = JSON.parse(raw) as KnowledgeItem;
    if (parsed.id !== knowledgeId || !isUnsavedKnowledgeDraft(parsed)) {
      return undefined;
    }
    return parsed;
  } catch {
    return undefined;
  }
}

export function clearKnowledgeDraft(knowledgeId: string) {
  sessionStorage.removeItem(`${DRAFT_STORAGE_PREFIX}${knowledgeId}`);
}

export function resolveKnowledgeNoteSource(
  knowledgeId: string,
  items: KnowledgeItem[],
  fallback?: KnowledgeItem,
): KnowledgeItem | undefined {
  return (
    items.find((entry) => entry.id === knowledgeId) ??
    readKnowledgeDraft(knowledgeId) ??
    (fallback?.id === knowledgeId ? fallback : undefined)
  );
}

export function buildKnowledgeDraft(options?: {
  linkedQuizQuestions?: LinkedQuizQuestion[];
}): KnowledgeItem {
  const now = new Date().toISOString();
  return {
    id: `draft-${crypto.randomUUID()}`,
    fileName: "",
    title: "",
    tags: [],
    content: "",
    linkedQuizQuestions: options?.linkedQuizQuestions ?? [],
    createdAt: now,
    updatedAt: now,
  };
}

export function normalizeTags(tags: string[]) {
  return [...new Set(tags.map((tag) => tag.trim()).filter(Boolean))];
}

export function parseTagsInput(input: string) {
  return normalizeTags(input.split(","));
}

export function formatTagsInput(tags: string[]) {
  return tags.join(", ");
}

export function validateKnowledgeNote(item: Pick<KnowledgeItem, "title" | "content">) {
  if (!item.title.trim()) {
    return "Title is required.";
  }
  if (!item.content.trim()) {
    return "Content is required.";
  }
  return null;
}
