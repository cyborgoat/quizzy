import { questionLinkKey } from "@/lib/knowledgeLinks";
import type { KnowledgeItem, KnowledgeLinkWarning } from "@/types/knowledge";
import type { QuizSource } from "@/types/quiz";

export function getLinkWarnings(
  item: Pick<KnowledgeItem, "linkedQuizQuestions">,
  quizzes: QuizSource[],
): KnowledgeLinkWarning[] {
  const warnings: KnowledgeLinkWarning[] = [];

  for (const link of item.linkedQuizQuestions) {
    const quiz = quizzes.find((source) => source.quiz.id === link.quizId);
    if (!quiz) {
      warnings.push({
        quizId: link.quizId,
        questionId: link.questionId,
        reason: "unknown_quiz",
      });
      continue;
    }

    const question = quiz.quiz.questions.find((entry) => entry.id === link.questionId);
    if (!question) {
      warnings.push({
        quizId: link.quizId,
        questionId: link.questionId,
        reason: "unknown_question",
      });
    }
  }

  return warnings;
}

export function linkWarningKey(warning: KnowledgeLinkWarning) {
  return questionLinkKey(warning.quizId, warning.questionId);
}
