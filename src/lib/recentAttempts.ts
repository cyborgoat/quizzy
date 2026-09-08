import { attemptPassed, type AttemptSummary, type Goal } from "@/types/goal";
import type { QuizSource } from "@/types/quiz";

export type AttemptHistorySort = "newest" | "oldest";

export type AttemptHistoryEntry = {
  goalId: string;
  quizId: string;
  quizTitle: string;
  quizTags: string[];
  archived: boolean;
  quizAvailable: boolean;
  targetScore?: number;
  attempt: AttemptSummary;
};

export type AttemptHistoryFilters = {
  query: string;
  quizId: string;
  sort: AttemptHistorySort;
};

export type AttemptHistoryStats = {
  count: number;
  averageScore?: number;
  bestScore?: number;
  passRate?: number;
};

export function collectAttemptHistory(
  goals: Goal[],
  sources: QuizSource[],
): AttemptHistoryEntry[] {
  const sourceByQuizId = new Map(
    sources.map((source) => [source.quiz.id, source]),
  );

  return goals.flatMap((goal) => {
    const source = sourceByQuizId.get(goal.quizId);
    return goal.attempts.map((attempt) => ({
      goalId: goal.id,
      quizId: goal.quizId,
      quizTitle: source?.quiz.title || goal.quizTitle,
      quizTags: source?.quiz.tags ?? [],
      archived: source?.archived ?? false,
      quizAvailable: Boolean(source),
      targetScore: goal.targetScore,
      attempt,
    }));
  });
}

export function filterAttemptHistory(
  entries: AttemptHistoryEntry[],
  filters: AttemptHistoryFilters,
): AttemptHistoryEntry[] {
  const query = filters.query.trim().toLocaleLowerCase();

  return entries
    .filter((entry) => {
      if (filters.quizId && entry.quizId !== filters.quizId) return false;
      if (!query) return true;
      return [entry.quizTitle, ...entry.quizTags]
        .join(" ")
        .toLocaleLowerCase()
        .includes(query);
    })
    .sort((a, b) => {
      const difference =
        new Date(b.attempt.takenAt).getTime() -
        new Date(a.attempt.takenAt).getTime();
      return filters.sort === "newest" ? difference : -difference;
    });
}

export function attemptHistoryStats(
  entries: AttemptHistoryEntry[],
): AttemptHistoryStats {
  if (entries.length === 0) return { count: 0 };

  const totalScore = entries.reduce(
    (sum, entry) => sum + entry.attempt.percentage,
    0,
  );
  const passedCount = entries.filter((entry) =>
    attemptPassed(entry.attempt, entry.targetScore),
  ).length;

  return {
    count: entries.length,
    averageScore: Math.round(totalScore / entries.length),
    bestScore: Math.max(...entries.map((entry) => entry.attempt.percentage)),
    passRate: Math.round((passedCount / entries.length) * 100),
  };
}

export function attemptLocalDateKey(takenAt: string): string {
  const date = new Date(takenAt);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}
