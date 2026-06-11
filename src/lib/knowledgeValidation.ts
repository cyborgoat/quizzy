import { resolveLinkedQuestion } from "@/lib/linkedQuestionLookup";
import type { KnowledgeItem, KnowledgeLinkWarning } from "@/types/knowledge";
import type { QuizSource } from "@/types/quiz";

export function getLinkWarnings(
  item: Pick<KnowledgeItem, "linkedQuizQuestions">,
  quizzes: QuizSource[],
): KnowledgeLinkWarning[] {
  const warnings: KnowledgeLinkWarning[] = [];

  for (const link of item.linkedQuizQuestions) {
    if (resolveLinkedQuestion(link, quizzes)) continue;

    const quiz = quizzes.find((source) => source.quiz.id === link.quizId);
    warnings.push({
      quizId: link.quizId,
      questionId: link.questionId,
      reason: quiz ? "unknown_question" : "unknown_quiz",
    });
  }

  return warnings;
}
