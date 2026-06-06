import { useContext } from "react";
import { GoalsContext } from "@/contexts/goals-context";

export function useGoals() {
  const context = useContext(GoalsContext);
  if (!context) {
    throw new Error("useGoals must be used within GoalsProvider.");
  }
  return context;
}
