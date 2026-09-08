import type { AttemptSummary, Goal, GoalAttempt } from "@/types/goal";

export type ReviewScoreSummaryData = {
  score: number;
  total: number;
  percentage: number;
  incorrectCount: number;
  unansweredCount: number;
  indexItems: { id: string; isCorrect: boolean; flagged: boolean }[];
};

export type ReviewGoalContext = {
  goal: Goal;
  attemptTakenAt: string;
  targetScore?: number;
  attemptHistory?: {
    quizId: string;
    attempts: AttemptSummary[];
    currentAttemptId: string;
  };
};

export function reviewScoreFromAttempt(attempt: GoalAttempt): ReviewScoreSummaryData {
  const unansweredCount = attempt.questionResults.filter((result) => !result.answer).length;

  return {
    score: attempt.score,
    total: attempt.total,
    percentage: attempt.percentage,
    incorrectCount: attempt.incorrectCount,
    unansweredCount,
    indexItems: attempt.questionResults.map((result, index) => ({
      id: `${result.questionId}-${index}`,
      isCorrect: result.correct,
      flagged: result.flagged ?? false,
    })),
  };
}
