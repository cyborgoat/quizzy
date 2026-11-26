import { useCallback, useRef, useState, type ReactNode } from "react";
import { toast } from "sonner";
import { type AttemptInput, GoalsContext } from "@/contexts/goals-context";
import { useBackgroundDataLoader } from "@/hooks/useBackgroundDataLoader";
import { useWorkingDirectory } from "@/hooks/useWorkingDirectory";
import type { LibrarySession } from "@/contexts/working-directory-context";
import { errorMessage, nativeApi } from "@/lib/native";
import { goalMeta, toAttemptSummary, type Goal, type GoalAttempt, type GoalDetailsInput } from "@/types/goal";

function generateId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function attemptCacheKey(goalId: string, attemptId: string) {
  return `${goalId}:${attemptId}`;
}

function normalizeAttempt(attempt: GoalAttempt): GoalAttempt {
  return {
    ...attempt,
    incorrectCount: attempt.questionResults.filter((result) => !result.correct).length,
  };
}

export function GoalsProvider({ children }: { children: ReactNode }) {
  const { session } = useWorkingDirectory();
  const [snapshot, setSnapshot] = useState<{ session: LibrarySession; goals: Goal[] } | null>(null);
  const goals = snapshot?.session === session ? snapshot?.goals ?? [] : [];
  const [goalsVersion, setGoalsVersion] = useState(0);
  const attemptCache = useRef<{ session: LibrarySession; entries: Map<string, GoalAttempt> } | null>(null);

  function attemptsFor(library: LibrarySession) {
    const current = attemptCache.current;
    if (current?.session === library) return current.entries;
    const entries = new Map<string, GoalAttempt>();
    attemptCache.current = { session: library, entries };
    return entries;
  }

  function updateGoals(update: (current: Goal[]) => Goal[]) {
    if (!session?.isCurrent()) return;
    setSnapshot((current) => ({
      session,
      goals: update(current?.session === session ? current.goals : []),
    }));
  }

  const bumpGoalsVersion = useCallback(() => {
    setGoalsVersion((current) => current + 1);
  }, []);

  const load = useCallback(async () => {
    if (!session?.isCurrent()) return;
    try {
      const loaded = await nativeApi.listGoals(session.path);
      if (!session.isCurrent()) return;
      setSnapshot({
        session,
        goals: loaded.map((goal) => ({ ...goal, attempts: goal.attempts ?? [] })),
      });
    } catch (error) {
      if (session.isCurrent()) {
        setSnapshot({ session, goals: [] });
        toast.error(errorMessage(error));
      }
    }
  }, [session]);

  const { refresh, isLoading } = useBackgroundDataLoader(load);

  const clearAttemptCache = useCallback(() => {
    if (session?.isCurrent() && attemptCache.current?.session === session) {
      attemptCache.current.entries.clear();
    }
  }, [session]);

  const refreshAfterSync = useCallback(async () => {
    clearAttemptCache();
    await refresh({ background: true });
    if (session?.isCurrent()) bumpGoalsVersion();
  }, [clearAttemptCache, refresh, session, bumpGoalsVersion]);

  async function addGoal(data: Omit<Goal, "id" | "createdAt" | "attempts">) {
    if (!session?.isCurrent()) return false;
    if (goals.some((goal) => goal.quizId === data.quizId)) {
      toast.error("This quiz already has a goal.");
      return false;
    }
    const newGoal: Goal = {
      ...data,
      id: generateId(),
      createdAt: new Date().toISOString(),
      attempts: [],
    };
    try {
      await nativeApi.upsertGoal(session.path, goalMeta(newGoal));
      if (!session.isCurrent()) return false;
      updateGoals((current) => [...current, newGoal]);
      toast.success("Goal created.");
      return true;
    } catch (error) {
      toast.error(errorMessage(error));
      return false;
    }
  }

  async function updateGoal(id: string, data: GoalDetailsInput) {
    if (!session?.isCurrent()) return false;
    const goal = goals.find((item) => item.id === id);
    if (!goal) return false;
    const updated: Goal = {
      ...goal,
      description: data.description,
      targetScore: data.targetScore,
    };
    try {
      await nativeApi.upsertGoal(session.path, goalMeta(updated));
      if (!session.isCurrent()) return false;
      updateGoals((current) =>
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
    if (!session?.isCurrent()) return null;
    const targetGoal = goals.find((item) => item.quizId === quizId);
    if (!targetGoal) return null;

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
      await nativeApi.saveGoalAttempt(session.path, targetGoal.id, attempt);
      if (!session.isCurrent()) return null;
      const summary = toAttemptSummary(attempt);
      attemptsFor(session).set(
        attemptCacheKey(targetGoal.id, attempt.id),
        attempt,
      );
      updateGoals((current) =>
        current.map((goal) =>
          goal.id === targetGoal.id
            ? { ...goal, attempts: [...goal.attempts, summary] }
            : goal,
        ),
      );
      bumpGoalsVersion();
      return { goalId: targetGoal.id, attemptId: attempt.id };
    } catch (error) {
      toast.error(errorMessage(error));
      return null;
    }
  }

  async function deleteGoal(id: string) {
    if (!session?.isCurrent()) return false;
    try {
      await nativeApi.deleteGoal(session.path, id);
      if (!session.isCurrent()) return false;
      const attempts = attemptsFor(session);
      for (const key of attempts.keys()) {
        if (key.startsWith(`${id}:`)) {
          attempts.delete(key);
        }
      }
      updateGoals((current) => current.filter((goal) => goal.id !== id));
      bumpGoalsVersion();
      toast.success("Goal deleted.");
      return true;
    } catch (error) {
      toast.error(errorMessage(error));
      return false;
    }
  }

  async function deleteAttempt(goalId: string, attemptId: string) {
    if (!session?.isCurrent()) return;
    try {
      await nativeApi.deleteGoalAttempt(session.path, goalId, attemptId);
      if (!session.isCurrent()) return;
      attemptsFor(session).delete(attemptCacheKey(goalId, attemptId));
      updateGoals((current) =>
        current.map((goal) =>
          goal.id === goalId
            ? {
                ...goal,
                attempts: goal.attempts.filter((attempt) => attempt.id !== attemptId),
              }
            : goal,
        ),
      );
      bumpGoalsVersion();
      toast.success("Attempt deleted.");
    } catch (error) {
      toast.error(errorMessage(error));
    }
  }

  async function loadGoalAttempt(goalId: string, attemptId: string) {
    if (!session?.isCurrent()) throw new Error("The working directory changed.");
    const cacheKey = attemptCacheKey(goalId, attemptId);
    const attempts = attemptsFor(session);
    const cached = attempts.get(cacheKey);
    if (cached) return cached;

    const attempt = normalizeAttempt(await nativeApi.getGoalAttempt(session.path, goalId, attemptId));
    if (!session.isCurrent()) throw new Error("The working directory changed.");
    attempts.set(cacheKey, attempt);
    return attempt;
  }

  return (
    <GoalsContext.Provider
      value={{
        goals,
        isLoading: Boolean(session) && (isLoading || snapshot?.session !== session),
        goalsVersion,
        refresh,
        refreshAfterSync,
        clearAttemptCache,
        addGoal,
        updateGoal,
        recordAttempt,
        deleteGoal,
        deleteAttempt,
        loadGoalAttempt,
      }}
    >
      {children}
    </GoalsContext.Provider>
  );
}
