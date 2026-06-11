import type { Table } from "@tanstack/react-table";
import { remapAnswerToFileQuestion } from "@/lib/quizReview";
import type { MistakeEntry } from "@/types/mistakeLog";
import type { AnswerRecord, QuizQuestion } from "@/types/quiz";

export function mistakeEntryKey(entry: Pick<MistakeEntry, "quizId" | "questionId">) {
  return `${entry.quizId}:${entry.questionId}`;
}

export function syncTablePageForEntry(table: Table<MistakeEntry>, entry: MistakeEntry) {
  const sortedRows = table.getSortedRowModel().rows;
  const index = sortedRows.findIndex(
    (row) => mistakeEntryKey(row.original) === mistakeEntryKey(entry),
  );
  if (index < 0) return;

  const pageSize = table.getState().pagination.pageSize;
  const pageIndex = Math.floor(index / pageSize);
  if (pageIndex !== table.getState().pagination.pageIndex) {
    table.setPageIndex(pageIndex);
  }
}

export function buildMistakeAnswerRecord(
  entry: MistakeEntry,
  question: QuizQuestion | null,
): AnswerRecord {
  return {
    questionId: entry.questionId,
    answer:
      question && entry.lastIncorrectAnswer
        ? remapAnswerToFileQuestion(
            question,
            entry.lastIncorrectAnswer,
            entry.lastIncorrectOptions,
          )
        : entry.lastIncorrectAnswer,
    isCorrect: entry.mistakeCount === 0,
    flagged: entry.flaggedCount > 0,
  };
}
