import { useMemo } from "react";
import { useKnowledgeLibrary } from "@/hooks/useKnowledgeLibrary";

export function useKnowledgeForQuestion(quizId: string, questionId: string) {
  const { getNotesForQuestion } = useKnowledgeLibrary();

  return useMemo(
    () => getNotesForQuestion(quizId, questionId),
    [getNotesForQuestion, quizId, questionId],
  );
}
