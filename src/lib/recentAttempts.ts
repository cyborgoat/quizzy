import type { AttemptSummary, Goal } from "@/types/goal";

export type RecentAttemptEntry = {
  quizId: string;
  quizTitle: string;
  targetScore?: number;
  attempt: AttemptSummary;
};

export const HOME_RECENT_ATTEMPTS_PREVIEW_COUNT = 3;

export function collectRecentAttempts(goals: Goal[]): RecentAttemptEntry[] {
  return goals
    .flatMap((goal) =>
      goal.attempts.map((attempt) => ({
        quizId: goal.quizId,
        quizTitle: goal.quizTitle,
        targetScore: goal.targetScore,
        attempt,
      })),
    )
    .sort(
      (a, b) =>
        new Date(b.attempt.takenAt).getTime() -
        new Date(a.attempt.takenAt).getTime(),
    );
}
