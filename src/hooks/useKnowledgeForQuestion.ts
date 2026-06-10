import { useMemo } from "react";
import { useKnowledgeIndex } from "@/hooks/useKnowledgeIndex";
import { getKnowledgeForQuestion } from "@/lib/knowledgeIndex";

export function useKnowledgeForQuestion(quizId: string, questionId: string) {
  const knowledgeIndex = useKnowledgeIndex();

  return useMemo(
    () => getKnowledgeForQuestion(knowledgeIndex, quizId, questionId),
    [knowledgeIndex, quizId, questionId],
  );
}
