import { useCallback, useEffect, useState, type ReactNode } from "react";
import { toast } from "sonner";
import { type AttemptInput, GoalsContext } from "@/contexts/goals-context";
import { errorMessage, nativeApi } from "@/lib/native";
import { goalMeta, toAttemptSummary, type Goal, type GoalAttempt, type GoalDetailsInput } from "@/types/goal";

function generateId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function GoalsProvider({ children }: { children: ReactNode }) {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const load = useCallback(async (options?: { background?: boolean }) => {
    const background = options?.background ?? false;
    if (!background) {
      setIsLoading(true);
    }
    try {
      const loaded = await nativeApi.listGoals();
      setGoals(
        loaded.map((goal) => ({
          ...goal,
          attempts: goal.attempts ?? [],
        })),
      );
    } catch (error) {
      toast.error(errorMessage(error));
    } finally {
      if (!background) {
        setIsLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => void load(), 0);
    return () => window.clearTimeout(timer);
  }, [load]);

  useEffect(() => {
    function handleFocus() {
      void load({ background: true });
    }
    window.addEventListener("focus", handleFocus);
    return () => window.removeEventListener("focus", handleFocus);
  }, [load]);

  async function addGoal(data: Omit<Goal, "id" | "createdAt" | "completed" | "attempts">) {
    if (goals.some((goal) => goal.quizId === data.quizId)) {
      toast.error("This quiz already has a goal.");
      return false;
    }
    const newGoal: Goal = {
      ...data,
      id: generateId(),
      createdAt: new Date().toISOString(),
      completed: false,
      attempts: [],
    };
    try {
      await nativeApi.upsertGoal(goalMeta(newGoal));
      setGoals((current) => [...current, newGoal]);
      toast.success("Goal created.");
      return true;
    } catch (error) {
      toast.error(errorMessage(error));
      return false;
    }
  }

  async function updateGoal(id: string, data: GoalDetailsInput) {
    const goal = goals.find((item) => item.id === id);
    if (!goal) return false;
    const updated: Goal = {
      ...goal,
      description: data.description,
      targetScore: data.targetScore,
    };
    try {
      await nativeApi.upsertGoal(goalMeta(updated));
      setGoals((current) =>
        current.map((item) => (item.id === id ? updated : item)),
      );
      toast.success("Goal updated.");
      return true;
    } catch (error) {
      toast.error(errorMessage(error));
      return false;
    }
  }

  async function recordAttempt(quizId: string, input: AttemptInput) {
    const targetGoal = goals.find((item) => item.quizId === quizId);
    if (!targetGoal) return;

    const attempt: GoalAttempt = {
      id: generateId(),
      takenAt: new Date().toISOString(),
      score: input.score,
      total: input.total,
      percentage: input.total > 0 ? Math.round((input.score / input.total) * 100) : 0,
      questionResults: input.questionResults,
      incorrectCount: input.questionResults.filter((result) => !result.correct).length,
    };

    try {
      await nativeApi.saveGoalAttempt(targetGoal.id, attempt);
      const summary = toAttemptSummary(attempt);
      setGoals((current) =>
        current.map((goal) =>
          goal.id === targetGoal.id
            ? { ...goal, attempts: [...goal.attempts, summary] }
            : goal,
        ),
      );
    } catch (error) {
      toast.error(errorMessage(error));
    }
  }

  async function completeGoal(id: string) {
    const goal = goals.find((item) => item.id === id);
    if (!goal) return;
    const updated: Goal = {
      ...goal,
      completed: true,
      completedAt: new Date().toISOString(),
    };
    try {
      await nativeApi.upsertGoal(goalMeta(updated));
      setGoals((current) =>
        current.map((item) => (item.id === id ? updated : item)),
      );
      toast.success("Goal marked as complete.");
    } catch (error) {
      toast.error(errorMessage(error));
    }
  }

  async function reopenGoal(id: string) {
    const goal = goals.find((item) => item.id === id);
    if (!goal) return;
    const updated: Goal = {
      ...goal,
      completed: false,
      completedAt: undefined,
    };
    try {
      await nativeApi.upsertGoal(goalMeta(updated));
      setGoals((current) =>
        current.map((item) => (item.id === id ? updated : item)),
      );
      toast.success("Goal moved back to active.");
    } catch (error) {
      toast.error(errorMessage(error));
    }
  }

  async function deleteGoal(id: string) {
    try {
      await nativeApi.deleteGoal(id);
      setGoals((current) => current.filter((goal) => goal.id !== id));
      toast.success("Goal deleted.");
      return true;
    } catch (error) {
      toast.error(errorMessage(error));
      return false;
    }
  }

  async function deleteAttempt(goalId: string, attemptId: string) {
    try {
      await nativeApi.deleteGoalAttempt(goalId, attemptId);
      setGoals((current) =>
        current.map((goal) =>
          goal.id === goalId
            ? {
                ...goal,
                attempts: goal.attempts.filter((attempt) => attempt.id !== attemptId),
              }
            : goal,
        ),
      );
      toast.success("Attempt deleted.");
    } catch (error) {
      toast.error(errorMessage(error));
    }
  }

  async function loadGoalAttempt(goalId: string, attemptId: string) {
    const attempt = await nativeApi.getGoalAttempt(goalId, attemptId);
    return {
      ...attempt,
      incorrectCount: attempt.questionResults.filter((result) => !result.correct).length,
    };
  }

  return (
    <GoalsContext.Provider
      value={{
        goals,
        isLoading,
        addGoal,
        updateGoal,
        recordAttempt,
        completeGoal,
        reopenGoal,
        deleteGoal,
        deleteAttempt,
        loadGoalAttempt,
      }}
    >
      {children}
    </GoalsContext.Provider>
  );
}
