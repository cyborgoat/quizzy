import { getQuestionNumber } from "@/lib/linkedQuestionLabel";
import type { LinkedQuizQuestion } from "@/types/knowledge";
import type { Quiz, QuizQuestion, QuizSource } from "@/types/quiz";

export type ResolvedLinkedQuestion = {
  quiz: Quiz;
  question: QuizQuestion;
  questionNumber: number | null;
};

export function resolveLinkedQuestion(
  link: LinkedQuizQuestion,
  quizzes: QuizSource[],
): ResolvedLinkedQuestion | null {
  const source = quizzes.find((entry) => entry.quiz.id === link.quizId);
  if (!source) return null;

  const question = source.quiz.questions.find((entry) => entry.id === link.questionId);
  if (!question) return null;

  return {
    quiz: source.quiz,
    question,
    questionNumber: getQuestionNumber(source.quiz.questions, link.questionId),
  };
}
