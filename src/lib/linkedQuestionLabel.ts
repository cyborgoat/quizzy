import { resolveLinkedQuestion } from "@/lib/linkedQuestionLookup";
import type { LinkedQuizQuestion } from "@/types/knowledge";
import type { QuizQuestion, QuizSource } from "@/types/quiz";

export function getQuestionNumber(
  questions: QuizQuestion[],
  questionId: string,
): number | null {
  const index = questions.findIndex((question) => question.id === questionId);
  return index >= 0 ? index + 1 : null;
}

function questionNumberLabel(
  link: LinkedQuizQuestion,
  quizzes: QuizSource[],
): string {
  const resolved = resolveLinkedQuestion(link, quizzes);
  if (resolved?.questionNumber) return `Q${resolved.questionNumber}`;
  return link.questionId;
}

export type QuizQuestionLabelOptions = {
  quizTitleFallback?: string;
  /** When true, only the question number (or id) is shown. */
  quizScoped?: boolean;
};

export function formatQuizQuestionLabel(
  link: LinkedQuizQuestion,
  quizzes: QuizSource[],
  options: QuizQuestionLabelOptions = {},
): string {
  const questionLabel = questionNumberLabel(link, quizzes);
  if (options.quizScoped) return questionLabel;

  const quizTitle =
    resolveLinkedQuestion(link, quizzes)?.quiz.title ??
    options.quizTitleFallback ??
    link.quizId;
  return `${quizTitle} · ${questionLabel}`;
}
