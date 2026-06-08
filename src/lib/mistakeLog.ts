import type { QuestionResult } from "@/types/goal";
import type { SubmittedAnswer } from "@/types/quiz";
import type {
  MistakeEntry,
  MistakeLogEmptyReason,
  MistakeLogSummary,
  MistakeLogThresholds,
} from "@/types/mistakeLog";

export type AttemptQuestionData = {
  quizId: string;
  quizTitle: string;
  takenAt: string;
  questionResults: QuestionResult[];
};

export function meetsThreshold(
  entry: Omit<MistakeEntry, "meetsThreshold">,
  thresholds: MistakeLogThresholds,
): boolean {
  if (entry.mistakeCount === 0) return false;
  return (
    entry.mistakeCount >= thresholds.minMistakes &&
    entry.correctnessPercentage <= thresholds.maxCorrectnessPercentage
  );
}

export function sortMistakeEntries(entries: MistakeEntry[]): MistakeEntry[] {
  return [...entries].sort((a, b) => {
    if (b.mistakeCount !== a.mistakeCount) return b.mistakeCount - a.mistakeCount;
    if (a.correctnessPercentage !== b.correctnessPercentage) {
      return a.correctnessPercentage - b.correctnessPercentage;
    }
    const aTime = a.lastMistakenAt ?? "";
    const bTime = b.lastMistakenAt ?? "";
    return bTime.localeCompare(aTime);
  });
}

export function aggregateQuestionResults(
  attempts: AttemptQuestionData[],
): Omit<MistakeEntry, "meetsThreshold">[] {
  const map = new Map<
    string,
    {
      quizId: string;
      quizTitle: string;
      questionId: string;
      prompt: string;
      mistakeCount: number;
      totalAttempts: number;
      lastMistakenAt: string | null;
      lastPromptAt: string;
      lastIncorrectAnswer?: SubmittedAnswer;
    }
  >();

  for (const attempt of attempts) {
    for (const result of attempt.questionResults) {
      const key = `${attempt.quizId}:${result.questionId}`;
      let row = map.get(key);
      if (!row) {
        row = {
          quizId: attempt.quizId,
          quizTitle: attempt.quizTitle,
          questionId: result.questionId,
          prompt: result.prompt,
          mistakeCount: 0,
          totalAttempts: 0,
          lastMistakenAt: null,
          lastPromptAt: attempt.takenAt,
        };
        map.set(key, row);
      }

      row.totalAttempts += 1;
      if (attempt.takenAt >= row.lastPromptAt) {
        row.prompt = result.prompt;
        row.lastPromptAt = attempt.takenAt;
      }
      if (!result.correct) {
        row.mistakeCount += 1;
        if (!row.lastMistakenAt || attempt.takenAt > row.lastMistakenAt) {
          row.lastMistakenAt = attempt.takenAt;
          row.lastIncorrectAnswer = result.answer;
        }
      }
    }
  }

  return Array.from(map.values()).map((row) => ({
    quizId: row.quizId,
    quizTitle: row.quizTitle,
    questionId: row.questionId,
    prompt: row.prompt,
    mistakeCount: row.mistakeCount,
    totalAttempts: row.totalAttempts,
    correctCount: row.totalAttempts - row.mistakeCount,
    correctnessPercentage:
      row.totalAttempts > 0
        ? Math.round(((row.totalAttempts - row.mistakeCount) / row.totalAttempts) * 100)
        : 0,
    lastMistakenAt: row.lastMistakenAt,
    lastIncorrectAnswer: row.lastIncorrectAnswer,
  }));
}

export function buildMistakeEntries(
  attempts: AttemptQuestionData[],
  thresholds: MistakeLogThresholds,
): MistakeEntry[] {
  const raw = aggregateQuestionResults(attempts);
  const qualifying = raw.filter((entry) => meetsThreshold(entry, thresholds));
  return sortMistakeEntries(qualifying);
}

export function summarizeMistakeEntries(entries: MistakeEntry[]): MistakeLogSummary {
  return {
    qualifyingCount: entries.length,
    totalMistakeEvents: entries.reduce((sum, entry) => sum + entry.mistakeCount, 0),
    quizCount: new Set(entries.map((entry) => entry.quizId)).size,
  };
}

export function detectEmptyReason(
  hasScoredAttempts: boolean,
  hasAnyMistakes: boolean,
  qualifyingCount: number,
): MistakeLogEmptyReason {
  if (!hasScoredAttempts) return "no_attempts";
  if (!hasAnyMistakes) return "no_mistakes";
  if (qualifyingCount === 0) return "thresholds_exclude_all";
  return null;
}

export function formatMistakeDate(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function entryKey(entry: Pick<MistakeEntry, "quizId" | "questionId">): string {
  return `${entry.quizId}:${entry.questionId}`;
}
