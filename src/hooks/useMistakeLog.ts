import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useGoals } from "@/hooks/useGoals";
import { useMistakeLogSettings } from "@/hooks/useMistakeLogSettings";
import {
  buildQualifyingEntries,
  detectEmptyReason,
  summarizeMistakeEntries,
} from "@/lib/mistakeLog";
import { nativeApi } from "@/lib/native";
import type { MistakeEntry, MistakeLogEmptyReason, MistakeLogSummary } from "@/types/mistakeLog";

export function useMistakeLog() {
  const { isLoading: goalsLoading, goalsVersion } = useGoals();
  const { minMistakes, minFlags, maxCorrectnessPercentage } = useMistakeLogSettings();
  const [rawEntries, setRawEntries] = useState<MistakeEntry[]>([]);
  const [scoredAttemptCount, setScoredAttemptCount] = useState(0);
  const [isLoadingIndex, setIsLoadingIndex] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const hasLoadedIndexRef = useRef(false);

  const loadIndex = useCallback(async (background = false) => {
    if (!background) {
      setIsLoadingIndex(true);
    }
    setError(null);

    try {
      const index = await nativeApi.getMistakeIndex();
      setRawEntries(index.entries);
      setScoredAttemptCount(index.scoredAttemptCount);
      hasLoadedIndexRef.current = true;
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : String(loadError));
      setRawEntries([]);
      setScoredAttemptCount(0);
    } finally {
      if (!background) {
        setIsLoadingIndex(false);
      }
    }
  }, []);

  useEffect(() => {
    if (goalsLoading) return;
    void loadIndex(hasLoadedIndexRef.current);
  }, [goalsLoading, goalsVersion, loadIndex]);

  useEffect(() => {
    function handleFocus() {
      if (goalsLoading) return;
      void loadIndex(true);
    }

    window.addEventListener("focus", handleFocus);
    return () => window.removeEventListener("focus", handleFocus);
  }, [goalsLoading, loadIndex]);

  const thresholds = useMemo(
    () => ({ minMistakes, minFlags, maxCorrectnessPercentage }),
    [minMistakes, minFlags, maxCorrectnessPercentage],
  );

  const qualifyingEntries = useMemo(
    () => buildQualifyingEntries(rawEntries, thresholds),
    [rawEntries, thresholds],
  );

  const hasScoredAttempts = scoredAttemptCount > 0;
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
    scoredAttemptCount,
    summary,
    emptyReason,
    quizzesWithMistakes,
    thresholds,
    isLoading: goalsLoading || isLoadingIndex,
    error,
    refetch: () => loadIndex(false),
  };
}
