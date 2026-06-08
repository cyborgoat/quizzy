import { createContext } from "react";
import type { Goal, GoalAttempt, QuestionResult } from "@/types/goal";

export type AttemptInput = {
  score: number;
  total: number;
  questionResults: QuestionResult[];
};

export type GoalsContextValue = {
  goals: Goal[];
  isLoading: boolean;
  addGoal: (goal: Omit<Goal, "id" | "createdAt" | "completed" | "attempts">) => Promise<void>;
  recordAttempt: (quizId: string, attempt: AttemptInput) => Promise<void>;
  completeGoal: (id: string) => Promise<void>;
  reopenGoal: (id: string) => Promise<void>;
  deleteGoal: (id: string) => Promise<void>;
  loadGoalAttempt: (goalId: string, attemptId: string) => Promise<GoalAttempt>;
};

export const GoalsContext = createContext<GoalsContextValue | null>(null);
