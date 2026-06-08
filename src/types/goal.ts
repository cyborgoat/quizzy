import type { SubmittedAnswer } from "@/types/quiz";

export type QuestionResult = {
  questionId: string;
  prompt: string;
  correct: boolean;
  answer?: SubmittedAnswer;
  flagged?: boolean;
};

export type AttemptSummary = {
  id: string;
  takenAt: string;
  score: number;
  total: number;
  percentage: number;
  incorrectCount: number;
};

export type GoalAttempt = AttemptSummary & {
  questionResults: QuestionResult[];
};

export type Goal = {
  id: string;
  quizId: string;
  quizTitle: string;
  description: string;
  targetScore?: number;
  deadline?: string;
  createdAt: string;
  completed: boolean;
  completedAt?: string;
  attempts: AttemptSummary[];
};

export function toAttemptSummary(attempt: GoalAttempt): AttemptSummary {
  return {
    id: attempt.id,
    takenAt: attempt.takenAt,
    score: attempt.score,
    total: attempt.total,
    percentage: attempt.percentage,
    incorrectCount: attempt.questionResults.filter((result) => !result.correct).length,
  };
}

export function goalMeta(goal: Goal) {
  const { attempts: _attempts, ...meta } = goal;
  return meta;
}

export function anyAttemptMetTarget(goal: Goal): boolean {
  if (goal.targetScore === undefined) return true;
  return goal.attempts.some((attempt) => attempt.percentage >= goal.targetScore!);
}
