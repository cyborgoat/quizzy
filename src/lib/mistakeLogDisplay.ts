import type { ReactTable as TanStackTable, SortingState } from "@tanstack/react-table";
import type { AppTableFeatures } from "@/lib/tableFeatures";
import { questionLinkKey } from "@/lib/knowledgeLinks";
import { getQuestionNumber } from "@/lib/linkedQuestionLabel";
import {
  QUESTION_TYPE_LABELS,
  shuffleArrayKeepingKeyedItemAtIndex,
} from "@/lib/questionOrder";
import type { Goal } from "@/types/goal";
import type { MistakeEntry } from "@/types/mistakeLog";
import type { QuizQuestion, QuizSource } from "@/types/quiz";

export type QuestionTypeFilter = "all" | QuizQuestion["type"];

export const DEFAULT_MISTAKE_SORTING: SortingState = [
  { id: "flaggedCount", desc: true },
  { id: "mistakeCount", desc: true },
];

export const QUESTION_TYPE_FILTER_OPTIONS: { value: QuestionTypeFilter; label: string }[] = [
  { value: "all", label: "All types" },
  { value: "single_choice", label: QUESTION_TYPE_LABELS.single_choice },
  { value: "multiple_choice", label: QUESTION_TYPE_LABELS.multiple_choice },
  { value: "true_false", label: QUESTION_TYPE_LABELS.true_false },
];

export const MISTAKE_COLUMN_WIDTHS: Record<string, string> = {
  quizTitle: "w-[22%]",
  question: "w-[8%]",
  questionType: "w-[14%]",
  notes: "w-[8%]",
  flaggedCount: "w-[8%]",
  mistakeCount: "w-[10%]",
  correctnessPercentage: "w-[12%]",
  lastMistakenAt: "w-[18%]",
};

export function mistakeColumnWidth(columnId: string) {
  return MISTAKE_COLUMN_WIDTHS[columnId] ?? "";
}

export function formatMistakeQuestionLabel(entry: MistakeEntry, quizzes: QuizSource[]) {
  const quiz = quizzes.find((source) => source.quiz.id === entry.quizId);
  const number = quiz ? getQuestionNumber(quiz.quiz.questions, entry.questionId) : null;
  return number ? `Q${number}` : entry.questionId;
}

export function getMistakeQuestionType(
  entry: MistakeEntry,
  quizzes: QuizSource[],
): QuizQuestion["type"] | null {
  const quiz = quizzes.find((source) => source.quiz.id === entry.quizId);
  const question = quiz?.quiz.questions.find((item) => item.id === entry.questionId);
  return question?.type ?? null;
}

export function formatMistakeQuestionType(entry: MistakeEntry, quizzes: QuizSource[]) {
  const type = getMistakeQuestionType(entry, quizzes);
  if (!type) return "—";
  return QUESTION_TYPE_LABELS[type];
}

export function filterMistakeEntries(
  entries: MistakeEntry[],
  options: {
    quizFilter: string;
    questionTypeFilter: QuestionTypeFilter;
    quizzes: QuizSource[];
  },
) {
  let filtered = entries;

  if (options.quizFilter !== "all") {
    filtered = filtered.filter((entry) => entry.quizId === options.quizFilter);
  }

  if (options.questionTypeFilter !== "all") {
    filtered = filtered.filter(
      (entry) => getMistakeQuestionType(entry, options.quizzes) === options.questionTypeFilter,
    );
  }

  return filtered;
}

export function buildMistakeEntryOrderKey(entries: MistakeEntry[]) {
  return entries.map((entry) => questionLinkKey(entry.quizId, entry.questionId)).join("\0");
}

export function applyMistakeLogShuffle(
  entries: MistakeEntry[],
  options: {
    enabled: boolean;
    seed: number;
    pinnedIndex: number;
    pinnedKey: string | null;
  },
) {
  if (!options.enabled) return entries;

  let seed = options.seed;
  const random = () => {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    return seed / 0xffffffff;
  };

  return shuffleArrayKeepingKeyedItemAtIndex(
    entries,
    options.pinnedIndex,
    (entry) => questionLinkKey(entry.quizId, entry.questionId),
    options.pinnedKey,
    random,
  );
}

export function syncTablePageForEntry(
  table: TanStackTable<AppTableFeatures, MistakeEntry>,
  entry: MistakeEntry,
) {
  const entryKey = questionLinkKey(entry.quizId, entry.questionId);
  const index = table.getSortedRowModel().rows.findIndex(
    (row) => questionLinkKey(row.original.quizId, row.original.questionId) === entryKey,
  );
  if (index < 0) return;

  const pageSize = table.state.pagination.pageSize;
  const pageIndex = Math.floor(index / pageSize);
  if (pageIndex !== table.state.pagination.pageIndex) {
    table.setPageIndex(pageIndex);
  }
}

export function findMistakeEntryIndex(entries: MistakeEntry[], entry: MistakeEntry) {
  return entries.findIndex(
    (candidate) =>
      questionLinkKey(candidate.quizId, candidate.questionId) ===
      questionLinkKey(entry.quizId, entry.questionId),
  );
}

export function findMistakeEntryByKey(entries: MistakeEntry[], entryKey: string | null) {
  if (!entryKey) return null;
  return entries.find(
    (entry) => questionLinkKey(entry.quizId, entry.questionId) === entryKey,
  ) ?? null;
}

export function resolveActiveMistakeEntry(
  entries: MistakeEntry[],
  selectedEntryKey: string | null,
) {
  if (entries.length === 0) return null;
  return findMistakeEntryByKey(entries, selectedEntryKey) ?? entries[0];
}

export function getMistakeQuestionContext(
  entry: MistakeEntry | null,
  quizzes: QuizSource[],
): { question: QuizQuestion | null; questionIndex: number } {
  if (!entry) return { question: null, questionIndex: 0 };

  const source = quizzes.find((item) => item.quiz.id === entry.quizId);
  const questionIndex =
    source?.quiz.questions.findIndex((question) => question.id === entry.questionId) ?? -1;
  const question = questionIndex >= 0 ? source!.quiz.questions[questionIndex]! : null;

  return { question, questionIndex: questionIndex >= 0 ? questionIndex : 0 };
}

/**
 * Quiz filter options: every quiz with qualifying mistakes, plus the selected
 * quiz even when it has none, so a linked filter stays visible and clearable.
 */
export function buildMistakeQuizFilterOptions(options: {
  quizzesWithMistakes: { quizId: string; quizTitle: string }[];
  quizFilter: string;
  quizzes: QuizSource[];
  goals: Goal[];
}) {
  const quizOptions = options.quizzesWithMistakes.map((quiz) => ({
    value: quiz.quizId,
    label: quiz.quizTitle,
  }));

  if (
    options.quizFilter !== "all" &&
    !quizOptions.some((option) => option.value === options.quizFilter)
  ) {
    quizOptions.push({
      value: options.quizFilter,
      label: resolveMistakeQuizTitle(options.quizFilter, options.quizzes, options.goals),
    });
    quizOptions.sort((a, b) => a.label.localeCompare(b.label));
  }

  return [{ value: "all", label: "All quizzes" }, ...quizOptions];
}

function resolveMistakeQuizTitle(quizId: string, quizzes: QuizSource[], goals: Goal[]) {
  return (
    quizzes.find((source) => source.quiz.id === quizId)?.quiz.title ??
    goals.find((goal) => goal.quizId === quizId)?.quizTitle ??
    quizId
  );
}

/** Message for a table whose filters hide every qualifying mistake. */
export function describeFilteredEmptyMistakes(options: {
  quizFilter: string;
  qualifyingEntries: MistakeEntry[];
  rawEntries: MistakeEntry[];
  goals: Goal[];
  quizzes: QuizSource[];
}): string {
  const fallback = "No mistakes match the current filters.";
  if (options.quizFilter === "all") return fallback;

  const quizId = options.quizFilter;
  // The quiz has qualifying mistakes, so another filter is hiding them.
  if (options.qualifyingEntries.some((entry) => entry.quizId === quizId)) return fallback;

  const title = resolveMistakeQuizTitle(quizId, options.quizzes, options.goals);
  const goal = options.goals.find((item) => item.quizId === quizId);
  if (!goal?.attempts.length) return `${title} has no scored attempts yet.`;

  const hasMistakes = options.rawEntries.some(
    (entry) => entry.quizId === quizId && (entry.mistakeCount > 0 || entry.flaggedCount > 0),
  );
  return hasMistakes
    ? `None of the mistakes in ${title} meet your current thresholds.`
    : `${title} has no mistakes or flagged questions.`;
}
