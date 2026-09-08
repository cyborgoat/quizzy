import type { Goal } from "@/types/goal";

export type QuizProgressStatus =
  | "not-started"
  | "in-progress"
  | "target-reached"
  | "completed";

export type QuizProgressMetrics = {
  attemptCount: number;
  highestScore?: number;
};

export const QUIZ_PROGRESS_FILTERS: Array<{
  value: "all" | QuizProgressStatus;
  label: string;
}> = [
  { value: "all", label: "All" },
  { value: "not-started", label: "Not started" },
  { value: "in-progress", label: "In progress" },
  { value: "target-reached", label: "Target reached" },
  { value: "completed", label: "Completed" },
];

export function quizProgressMetrics(goal: Goal | undefined): QuizProgressMetrics {
  if (!goal || goal.attempts.length === 0) return { attemptCount: 0 };

  return {
    attemptCount: goal.attempts.length,
    highestScore: Math.max(...goal.attempts.map((attempt) => attempt.percentage)),
  };
}

export function quizProgressStatus(goal: Goal | undefined): QuizProgressStatus {
  if (goal?.completed) return "completed";

  const { attemptCount, highestScore } = quizProgressMetrics(goal);
  if (attemptCount === 0) return "not-started";
  if (
    goal?.targetScore !== undefined &&
    highestScore !== undefined &&
    highestScore >= goal.targetScore
  ) {
    return "target-reached";
  }
  return "in-progress";
}
