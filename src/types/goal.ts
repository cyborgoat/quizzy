import type { SubmittedAnswer } from "@/types/quiz";

export type QuestionResult = {
  questionId: string;
  prompt: string;
  correct: boolean;
  answer?: SubmittedAnswer;
  /** Options as shown during the attempt (for remapping shuffled answers on review). */
  options?: string[];
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
  createdAt: string;
  completed: boolean;
  completedAt?: string;
  attempts: AttemptSummary[];
};

export type GoalDetailsFormValues = {
  description: string;
  targetScore: string;
};

export type GoalDetailsInput = {
  description: string;
  targetScore?: number;
};

export function goalToDetailsForm(goal: Goal): GoalDetailsFormValues {
  return {
    description: goal.description,
    targetScore: goal.targetScore !== undefined ? String(goal.targetScore) : "",
  };
}

export function detailsFormToGoalInput(values: GoalDetailsFormValues): GoalDetailsInput {
  const targetScore = values.targetScore.trim();
  return {
    description: values.description.trim(),
    targetScore: targetScore ? Number(targetScore) : undefined,
  };
}

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

export function goalMeta(goal: Goal): Omit<Goal, "attempts"> {
  return {
    id: goal.id,
    quizId: goal.quizId,
    quizTitle: goal.quizTitle,
    description: goal.description,
    targetScore: goal.targetScore,
    createdAt: goal.createdAt,
    completed: goal.completed,
    completedAt: goal.completedAt,
  };
}

export function anyAttemptMetTarget(goal: Goal): boolean {
  if (goal.targetScore === undefined) return true;
  return goal.attempts.some((attempt) => attempt.percentage >= goal.targetScore!);
}

export function latestAttempt(goal: Goal): AttemptSummary | undefined {
  return goal.attempts.at(-1);
}

export function attemptPassed(
  attempt: AttemptSummary,
  targetScore: number | undefined,
): boolean {
  if (targetScore !== undefined) return attempt.percentage >= targetScore;
  return attempt.incorrectCount === 0;
}
