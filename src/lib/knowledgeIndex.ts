import { questionLinkKey } from "@/lib/knowledgeLinks";
import type { KnowledgeItem } from "@/types/knowledge";

export function buildKnowledgeIndex(items: KnowledgeItem[]) {
  const index = new Map<string, KnowledgeItem[]>();

  for (const item of items) {
    for (const link of item.linkedQuizQuestions) {
      const key = questionLinkKey(link.quizId, link.questionId);
      const existing = index.get(key) ?? [];
      existing.push(item);
      index.set(key, existing);
    }
  }

  for (const [key, linkedItems] of index) {
    index.set(
      key,
      [...linkedItems].sort(
        (left, right) => Date.parse(right.updatedAt) - Date.parse(left.updatedAt),
      ),
    );
  }

  return index;
}

export function getKnowledgeForQuestion(
  index: Map<string, KnowledgeItem[]>,
  quizId: string,
  questionId: string,
) {
  return index.get(questionLinkKey(quizId, questionId)) ?? [];
}
