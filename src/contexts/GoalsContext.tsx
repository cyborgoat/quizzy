import { useCallback, useEffect, useState, type ReactNode } from "react";
import { toast } from "sonner";
import { type AttemptInput, GoalsContext } from "@/contexts/goals-context";
import { errorMessage, nativeApi } from "@/lib/native";
import type { Goal, GoalAttempt } from "@/types/goal";

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
      setGoals(loaded.map((g) => ({ attempts: [], ...g })));
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

  async function addGoal(data: Omit<Goal, "id" | "createdAt" | "completed" | "attempts">) {
    try {
      const newGoal: Goal = {
        ...data,
        id: generateId(),
        createdAt: new Date().toISOString(),
        completed: false,
        attempts: [],
      };
      await persist([...goals, newGoal]);
      toast.success("Goal created.");
    } catch (error) {
      toast.error(errorMessage(error));
    }
  }

  async function recordAttempt(quizId: string, input: AttemptInput) {
    const matching = goals.filter((g) => g.quizId === quizId);
    if (matching.length === 0) return;
    const attempt: GoalAttempt = {
      id: generateId(),
      takenAt: new Date().toISOString(),
      score: input.score,
      total: input.total,
      percentage: input.total > 0 ? Math.round((input.score / input.total) * 100) : 0,
      questionResults: input.questionResults,
    };
    try {
      await persist(
        goals.map((g) =>
          g.quizId === quizId ? { ...g, attempts: [...g.attempts, attempt] } : g,
        ),
      );
    } catch (error) {
      toast.error(errorMessage(error));
    }
  }

  async function completeGoal(id: string) {
    try {
      await persist(
        goals.map((g) =>
          g.id === id ? { ...g, completed: true, completedAt: new Date().toISOString() } : g,
        ),
      );
      toast.success("Goal marked as complete.");
    } catch (error) {
      toast.error(errorMessage(error));
    }
  }

  async function reopenGoal(id: string) {
    try {
      await persist(
        goals.map((g) =>
          g.id === id ? { ...g, completed: false, completedAt: undefined } : g,
        ),
      );
      toast.success("Goal moved back to active.");
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
    <GoalsContext.Provider value={{ goals, isLoading, addGoal, recordAttempt, completeGoal, reopenGoal, deleteGoal }}>
      {children}
    </GoalsContext.Provider>
  );
}
