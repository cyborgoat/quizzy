import type { SortingState, Table as TanStackTable } from "@tanstack/react-table";
import { detectEmptyReason } from "@/lib/mistakeLog";
import { questionLinkKey } from "@/lib/knowledgeLinks";
import { getQuestionNumber } from "@/lib/linkedQuestionLabel";
import {
  QUESTION_TYPE_LABELS,
  shuffleArrayKeepingKeyedItemAtIndex,
} from "@/lib/questionOrder";
import type { Goal } from "@/types/goal";
import type { MistakeEntry, MistakeLogEmptyReason } from "@/types/mistakeLog";
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
    scopedQuizId?: string;
    isQuizScoped: boolean;
    quizFilter: string;
    questionTypeFilter: QuestionTypeFilter;
    quizzes: QuizSource[];
  },
) {
  let filtered = entries;

  const quizId = options.isQuizScoped
    ? options.scopedQuizId
    : options.quizFilter === "all"
      ? undefined
      : options.quizFilter;

  if (quizId) {
    filtered = filtered.filter((entry) => entry.quizId === quizId);
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

export function syncTablePageForEntry(table: TanStackTable<MistakeEntry>, entry: MistakeEntry) {
  const entryKey = questionLinkKey(entry.quizId, entry.questionId);
  const index = table.getSortedRowModel().rows.findIndex(
    (row) => questionLinkKey(row.original.quizId, row.original.questionId) === entryKey,
  );
  if (index < 0) return;

  const pageSize = table.getState().pagination.pageSize;
  const pageIndex = Math.floor(index / pageSize);
  if (pageIndex !== table.getState().pagination.pageIndex) {
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

export function resolveScopedEmptyReason(options: {
  filteredCount: number;
  isQuizScoped: boolean;
  scopedQuizId?: string;
  quizFilter: string;
  questionTypeFilter: QuestionTypeFilter;
  goals: Goal[];
  rawEntries: MistakeEntry[];
  globalEmptyReason: MistakeLogEmptyReason;
}): MistakeLogEmptyReason {
  if (options.filteredCount > 0) return null;

  if (!options.isQuizScoped && (options.quizFilter !== "all" || options.questionTypeFilter !== "all")) {
    return "no_mistakes";
  }

  if (options.isQuizScoped && options.scopedQuizId) {
    const scopedGoal = options.goals.find((goal) => goal.quizId === options.scopedQuizId);
    const hasQuizAttempts = (scopedGoal?.attempts.length ?? 0) > 0;
    const quizRaw = options.rawEntries.filter((entry) => entry.quizId === options.scopedQuizId);
    const hasQuizMistakes = quizRaw.some(
      (entry) => entry.mistakeCount > 0 || entry.flaggedCount > 0,
    );
    return detectEmptyReason(hasQuizAttempts, hasQuizMistakes, options.filteredCount);
  }

  return options.globalEmptyReason;
}
