import type { Goal } from "@/types/goal";

export type RecentAttemptEntry = {
  goalId: string;
  attemptId: string;
  quizId: string;
  quizTitle: string;
  takenAt: string;
  score: number;
  total: number;
  percentage: number;
  incorrectCount: number;
  goalCompleted: boolean;
};

export const RECENT_ATTEMPTS_INITIAL_COUNT = 3;

export function collectRecentAttempts(
  goals: Goal[],
  limit?: number,
): RecentAttemptEntry[] {
  const sorted = goals
    .flatMap((goal) =>
      goal.attempts.map((attempt) => ({
        goalId: goal.id,
        attemptId: attempt.id,
        quizId: goal.quizId,
        quizTitle: goal.quizTitle,
        takenAt: attempt.takenAt,
        score: attempt.score,
        total: attempt.total,
        percentage: attempt.percentage,
        incorrectCount: attempt.incorrectCount,
        goalCompleted: goal.completed,
      })),
    )
    .sort((left, right) => right.takenAt.localeCompare(left.takenAt));

  return limit === undefined ? sorted : sorted.slice(0, limit);
}
