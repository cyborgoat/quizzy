export type QuizSessionMode = "practice" | "scored";

export type QuizSessionConfig = {
  mode: QuizSessionMode;
  questionCount?: number;
};

export function defaultPracticeQuestionCount(totalQuestions: number) {
  if (totalQuestions <= 1) return 1;
  return Math.min(10, totalQuestions);
}
