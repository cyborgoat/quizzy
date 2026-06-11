import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useGoals } from "@/hooks/useGoals";
import { useMistakeLogSettings } from "@/hooks/useMistakeLogSettings";
import {
  aggregateQuestionResults,
  buildMistakeEntries,
  detectEmptyReason,
  summarizeMistakeEntries,
  type AttemptQuestionData,
} from "@/lib/mistakeLog";
import type { MistakeLogEmptyReason, MistakeLogSummary } from "@/types/mistakeLog";

export function useMistakeLog() {
  const { goals, isLoading: goalsLoading, goalsVersion, loadGoalAttempt } = useGoals();
  const { minMistakes, minFlags, maxCorrectnessPercentage } = useMistakeLogSettings();
  const [attemptData, setAttemptData] = useState<AttemptQuestionData[]>([]);
  const [isLoadingAttempts, setIsLoadingAttempts] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const hasLoadedAttemptsRef = useRef(false);
  const goalsRef = useRef(goals);

  useEffect(() => {
    goalsRef.current = goals;
  }, [goals]);

  const loadAttempts = useCallback(async (background = false) => {
    if (!background) {
      setIsLoadingAttempts(true);
    }
    setError(null);

    try {
      const seen = new Set<string>();
      const loaded: AttemptQuestionData[] = [];

      for (const goal of goalsRef.current) {
        for (const summary of goal.attempts) {
          const dedupeKey = `${goal.quizId}:${summary.id}`;
          if (seen.has(dedupeKey)) continue;
          seen.add(dedupeKey);

          const attempt = await loadGoalAttempt(goal.id, summary.id);
          loaded.push({
            quizId: goal.quizId,
            quizTitle: goal.quizTitle,
            takenAt: attempt.takenAt,
            questionResults: attempt.questionResults,
          });
        }
      }

      setAttemptData(loaded);
      hasLoadedAttemptsRef.current = true;
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : String(loadError));
      setAttemptData([]);
    } finally {
      if (!background) {
        setIsLoadingAttempts(false);
      }
    }
  }, [loadGoalAttempt]);

  useEffect(() => {
    if (goalsLoading) return;
    void loadAttempts(hasLoadedAttemptsRef.current);
  }, [goalsLoading, goalsVersion, loadAttempts]);

  const thresholds = useMemo(
    () => ({ minMistakes, minFlags, maxCorrectnessPercentage }),
    [minMistakes, minFlags, maxCorrectnessPercentage],
  );

  const qualifyingEntries = useMemo(
    () => buildMistakeEntries(attemptData, thresholds),
    [attemptData, thresholds],
  );

  const rawEntries = useMemo(() => aggregateQuestionResults(attemptData), [attemptData]);

  const hasScoredAttempts = attemptData.length > 0;
  const hasAnyMistakes = rawEntries.some(
    (entry) => entry.mistakeCount > 0 || entry.flaggedCount > 0,
  );

  const summary: MistakeLogSummary = useMemo(
    () => summarizeMistakeEntries(qualifyingEntries),
    [qualifyingEntries],
  );

  const emptyReason: MistakeLogEmptyReason = useMemo(
    () => detectEmptyReason(hasScoredAttempts, hasAnyMistakes, qualifyingEntries.length),
    [hasScoredAttempts, hasAnyMistakes, qualifyingEntries.length],
  );

  const quizzesWithMistakes = useMemo(() => {
    const byQuiz = new Map<string, string>();
    for (const entry of qualifyingEntries) {
      byQuiz.set(entry.quizId, entry.quizTitle);
    }
    return Array.from(byQuiz.entries())
      .map(([quizId, quizTitle]) => ({ quizId, quizTitle }))
      .sort((a, b) => a.quizTitle.localeCompare(b.quizTitle));
  }, [qualifyingEntries]);

  return {
    qualifyingEntries,
    rawEntries,
    attemptData,
    summary,
    emptyReason,
    quizzesWithMistakes,
    thresholds,
    isLoading: goalsLoading || isLoadingAttempts,
    error,
    refetch: () => loadAttempts(false),
  };
}
