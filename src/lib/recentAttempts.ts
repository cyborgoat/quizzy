import type { AttemptSummary, Goal } from "@/types/goal";

export type RecentAttemptEntry = {
  goalId: string;
  quizTitle: string;
  targetScore?: number;
  attempt: AttemptSummary;
};

export const RECENT_ATTEMPTS_INITIAL_COUNT = 5;
export const RECENT_ATTEMPTS_LOAD_MORE_COUNT = 5;
export const HOME_RECENT_ATTEMPTS_PREVIEW_COUNT = 3;

export function collectRecentAttempts(goals: Goal[]): RecentAttemptEntry[] {
  return goals
    .flatMap((goal) =>
      goal.attempts.map((attempt) => ({
        goalId: goal.id,
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
