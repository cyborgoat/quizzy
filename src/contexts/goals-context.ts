import { createContext } from "react";
import type { Goal, GoalAttempt, GoalDetailsInput, QuestionResult } from "@/types/goal";

export type AttemptInput = {
  score: number;
  total: number;
  questionResults: QuestionResult[];
};

export type RecordedAttempt = {
  goalId: string;
  attemptId: string;
};

export type GoalsRefreshOptions = {
  background?: boolean;
};

export type GoalsContextValue = {
  goals: Goal[];
  isLoading: boolean;
  goalsVersion: number;
  refresh: (options?: GoalsRefreshOptions) => Promise<void>;
  refreshAfterSync: () => Promise<void>;
  clearAttemptCache: () => void;
  addGoal: (goal: Omit<Goal, "id" | "createdAt" | "completed" | "attempts">) => Promise<boolean>;
  updateGoal: (id: string, data: GoalDetailsInput) => Promise<boolean>;
  recordAttempt: (quizId: string, attempt: AttemptInput) => Promise<RecordedAttempt | null>;
  completeGoal: (id: string) => Promise<void>;
  reopenGoal: (id: string) => Promise<void>;
  deleteGoal: (id: string) => Promise<boolean>;
  deleteAttempt: (goalId: string, attemptId: string) => Promise<void>;
  loadGoalAttempt: (goalId: string, attemptId: string) => Promise<GoalAttempt>;
};

export const GoalsContext = createContext<GoalsContextValue | null>(null);
