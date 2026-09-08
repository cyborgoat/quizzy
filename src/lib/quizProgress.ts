import type { Goal } from "@/types/goal";
import type { QuizSource } from "@/types/quiz";

export type QuizProgressStatus =
  | "not-started"
  | "in-progress"
  | "target-reached";

export type QuizProgressMetrics = {
  attemptCount: number;
  highestScore?: number;
};

export type QuizLibraryFilter = "all" | QuizProgressStatus | "archived";

export const QUIZ_LIBRARY_FILTERS: Array<{
  value: QuizLibraryFilter;
  label: string;
}> = [
  { value: "all", label: "All active" },
  { value: "not-started", label: "Not started" },
  { value: "in-progress", label: "In progress" },
  { value: "target-reached", label: "Target reached" },
  { value: "archived", label: "Archived" },
];

export function filterQuizSources(
  sources: QuizSource[],
  goals: Goal[],
  filter: QuizLibraryFilter,
): QuizSource[] {
  if (filter === "archived") return sources.filter((source) => source.archived);

  const activeSources = sources.filter((source) => !source.archived);
  if (filter === "all") return activeSources;
  return activeSources.filter(
    (source) =>
      quizProgressStatus(goals.find((goal) => goal.quizId === source.quiz.id)) === filter,
  );
}

export function quizProgressMetrics(goal: Goal | undefined): QuizProgressMetrics {
  if (!goal || goal.attempts.length === 0) return { attemptCount: 0 };

  return {
    attemptCount: goal.attempts.length,
    highestScore: Math.max(...goal.attempts.map((attempt) => attempt.percentage)),
  };
}

export function quizProgressStatus(goal: Goal | undefined): QuizProgressStatus {
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
