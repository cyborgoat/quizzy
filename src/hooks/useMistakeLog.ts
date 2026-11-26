import { useCallback, useEffect, useMemo, useState } from "react";
import { useGoals } from "@/hooks/useGoals";
import { useMistakeLogSettings } from "@/hooks/useMistakeLogSettings";
import {
  buildQualifyingEntries,
  detectEmptyReason,
  summarizeMistakeEntries,
} from "@/lib/mistakeLog";
import { useWorkingDirectory } from "@/hooks/useWorkingDirectory";
import type { LibrarySession } from "@/contexts/working-directory-context";
import { errorMessage, nativeApi, type MistakeIndex } from "@/lib/native";
import type { MistakeEntry, MistakeLogEmptyReason, MistakeLogSummary } from "@/types/mistakeLog";

const EMPTY_ENTRIES: MistakeEntry[] = [];

export function useMistakeLog() {
  const { isLoading: goalsLoading, goalsVersion } = useGoals();
  const { minMistakes, minFlags, maxCorrectnessPercentage } = useMistakeLogSettings();
  const { session } = useWorkingDirectory();
  const [snapshot, setSnapshot] = useState<{
    session: LibrarySession;
    index?: MistakeIndex;
    error?: string;
  } | null>(null);
  const [loadingSession, setLoadingSession] = useState<LibrarySession | null>(null);
  const current = snapshot?.session === session ? snapshot : null;
  const rawEntries = current?.index?.entries ?? EMPTY_ENTRIES;
  const scoredAttemptCount = current?.index?.scoredAttemptCount ?? 0;

  const loadIndex = useCallback(() => {
    if (!session?.isCurrent()) return;
    return nativeApi.getMistakeIndex(session.path).then(
      (index) => {
        if (session.isCurrent()) setSnapshot({ session, index });
      },
      (loadError) => {
        if (session.isCurrent()) setSnapshot({ session, error: errorMessage(loadError) });
      },
    );
  }, [session]);

  useEffect(() => {
    if (!goalsLoading) void loadIndex();
  }, [goalsLoading, goalsVersion, loadIndex]);

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
    isLoading: Boolean(session) && (goalsLoading || !current || loadingSession === session),
    error: current?.error ?? null,
    refetch: async () => {
      if (!session?.isCurrent()) return;
      setLoadingSession(session);
      try {
        await loadIndex();
      } finally {
        if (session.isCurrent()) setLoadingSession(null);
      }
    },
  };
}
