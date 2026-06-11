import { questionLinkKey } from "@/lib/knowledgeLinks";
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
  if (entry.flaggedCount >= thresholds.minFlags) return true;
  if (entry.mistakeCount === 0) return false;
  return (
    entry.mistakeCount >= thresholds.minMistakes &&
    entry.correctnessPercentage <= thresholds.maxCorrectnessPercentage
  );
}

export function sortMistakeEntries(entries: MistakeEntry[]): MistakeEntry[] {
  return [...entries].sort((a, b) => {
    if (b.flaggedCount !== a.flaggedCount) return b.flaggedCount - a.flaggedCount;
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
      flaggedCount: number;
      totalAttempts: number;
      lastMistakenAt: string | null;
      lastFlaggedAt: string | null;
      lastPromptAt: string;
      lastIncorrectAnswer?: SubmittedAnswer;
      lastIncorrectOptions?: string[];
    }
  >();

  for (const attempt of attempts) {
    for (const result of attempt.questionResults) {
      const key = questionLinkKey(attempt.quizId, result.questionId);
      let row = map.get(key);
      if (!row) {
        row = {
          quizId: attempt.quizId,
          quizTitle: attempt.quizTitle,
          questionId: result.questionId,
          prompt: result.prompt,
          mistakeCount: 0,
          flaggedCount: 0,
          totalAttempts: 0,
          lastMistakenAt: null,
          lastFlaggedAt: null,
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
          row.lastIncorrectOptions = result.options;
        }
      }

      if (result.flagged) {
        row.flaggedCount += 1;
        if (!row.lastFlaggedAt || attempt.takenAt > row.lastFlaggedAt) {
          row.lastFlaggedAt = attempt.takenAt;
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
    flaggedCount: row.flaggedCount,
    totalAttempts: row.totalAttempts,
    correctCount: row.totalAttempts - row.mistakeCount,
    correctnessPercentage:
      row.totalAttempts > 0
        ? Math.round(((row.totalAttempts - row.mistakeCount) / row.totalAttempts) * 100)
        : 0,
    lastMistakenAt: row.lastMistakenAt,
    lastFlaggedAt: row.lastFlaggedAt,
    lastIncorrectAnswer: row.lastIncorrectAnswer,
    lastIncorrectOptions: row.lastIncorrectOptions,
  }));
}

export function buildQualifyingEntries(
  entries: Omit<MistakeEntry, "meetsThreshold">[],
  thresholds: MistakeLogThresholds,
): MistakeEntry[] {
  const qualifying = entries.filter((entry) => meetsThreshold(entry, thresholds));
  return sortMistakeEntries(qualifying);
}

export function buildMistakeEntries(
  attempts: AttemptQuestionData[],
  thresholds: MistakeLogThresholds,
): MistakeEntry[] {
  return buildQualifyingEntries(aggregateQuestionResults(attempts), thresholds);
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

