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
  const quiz = quizzes.find((source) => source.quiz.id === link.quizId);
  const number = quiz
    ? getQuestionNumber(quiz.quiz.questions, link.questionId)
    : null;
  return number ? `Q${number}` : link.questionId;
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
    quizzes.find((source) => source.quiz.id === link.quizId)?.quiz.title ??
    options.quizTitleFallback ??
    link.quizId;
  return `${quizTitle} · ${questionLabel}`;
}
