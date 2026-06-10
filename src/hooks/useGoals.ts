import { GoalsContext } from "@/contexts/goals-context";
import { createContextHook } from "@/hooks/createContextHook";

export const useGoals = createContextHook(GoalsContext, "GoalsProvider");
