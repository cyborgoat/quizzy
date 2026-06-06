import { useCallback, useEffect, useState, type ReactNode } from "react";
import { toast } from "sonner";
import { GoalsContext } from "@/contexts/goals-context";
import { errorMessage, nativeApi } from "@/lib/native";
import type { Goal } from "@/types/goal";

function generateId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function GoalsProvider({ children }: { children: ReactNode }) {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const load = useCallback(async () => {
    setIsLoading(true);
    try {
      const loaded = await nativeApi.getGoals();
      setGoals(loaded);
    } catch (error) {
      toast.error(errorMessage(error));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function persist(updated: Goal[]) {
    await nativeApi.saveGoals(updated);
    setGoals(updated);
  }

  async function addGoal(data: Omit<Goal, "id" | "createdAt" | "completed">) {
    try {
      const newGoal: Goal = {
        ...data,
        id: generateId(),
        createdAt: new Date().toISOString(),
        completed: false,
      };
      await persist([...goals, newGoal]);
      toast.success("Goal created.");
    } catch (error) {
      toast.error(errorMessage(error));
    }
  }

  async function finishGoal(id: string) {
    try {
      const updated = goals.map((g) =>
        g.id === id
          ? { ...g, completed: true, completedAt: new Date().toISOString() }
          : g,
      );
      await persist(updated);
      toast.success("Goal marked as finished.");
    } catch (error) {
      toast.error(errorMessage(error));
    }
  }

  async function deleteGoal(id: string) {
    try {
      await persist(goals.filter((g) => g.id !== id));
      toast.success("Goal deleted.");
    } catch (error) {
      toast.error(errorMessage(error));
    }
  }

  return (
    <GoalsContext.Provider value={{ goals, isLoading, addGoal, finishGoal, deleteGoal }}>
      {children}
    </GoalsContext.Provider>
  );
}
