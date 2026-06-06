import { createContext } from "react";
import type { Goal } from "@/types/goal";

export type GoalsContextValue = {
  goals: Goal[];
  isLoading: boolean;
  addGoal: (goal: Omit<Goal, "id" | "createdAt" | "completed">) => Promise<void>;
  finishGoal: (id: string) => Promise<void>;
  deleteGoal: (id: string) => Promise<void>;
};

export const GoalsContext = createContext<GoalsContextValue | null>(null);
