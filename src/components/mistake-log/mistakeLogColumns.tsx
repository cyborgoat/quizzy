import type { ColumnDef } from "@tanstack/react-table";
import {
  DataTableColumnFilterHeader,
  DataTableColumnHeader,
  DataTableNumericCell,
  DataTableSortableHeader,
  DataTableTruncatedCell,
  dataTableCellMutedClass,
} from "@/components/ui/data-table";
import {
  formatMistakeQuestionLabel,
  formatMistakeQuestionType,
  QUESTION_TYPE_FILTER_OPTIONS,
  type QuestionTypeFilter,
} from "@/lib/mistakeLogDisplay";
import { formatShortDate } from "@/lib/formatDate";
import type { KnowledgeItem } from "@/types/knowledge";
import type { MistakeEntry } from "@/types/mistakeLog";
import type { QuizSource } from "@/types/quiz";

export type MistakeLogColumnOptions = {
  quizzes: QuizSource[];
  quizzesWithMistakes: { quizId: string; quizTitle: string }[];
  isQuizScoped: boolean;
  effectiveQuizFilter: string;
  questionTypeFilter: QuestionTypeFilter;
  onQuizFilterChange: (value: string) => void;
  onQuestionTypeFilterChange: (value: QuestionTypeFilter) => void;
  getNotesForQuestion: (quizId: string, questionId: string) => KnowledgeItem[];
};

export function buildMistakeLogColumns({
  quizzes,
  quizzesWithMistakes,
  isQuizScoped,
  effectiveQuizFilter,
  questionTypeFilter,
  onQuizFilterChange,
  onQuestionTypeFilterChange,
  getNotesForQuestion,
}: MistakeLogColumnOptions): ColumnDef<MistakeEntry>[] {
  return [
    {
      accessorKey: "quizTitle",
      header: () =>
        isQuizScoped ? (
          <DataTableColumnHeader label="Quiz Name" />
        ) : (
          <DataTableColumnFilterHeader
            label="Quiz Name"
            filterValue={effectiveQuizFilter}
            menuLabel="Filter by quiz"
            options={[
              { value: "all", label: "All quizzes" },
              ...quizzesWithMistakes.map((quiz) => ({
                value: quiz.quizId,
                label: quiz.quizTitle,
              })),
            ]}
            onFilterChange={onQuizFilterChange}
          />
        ),
      cell: ({ row }) => <DataTableTruncatedCell value={row.original.quizTitle} />,
    },
    {
      id: "question",
      accessorFn: (row) => formatMistakeQuestionLabel(row, quizzes),
      header: () => <DataTableColumnHeader label="Question" />,
      cell: ({ row }) => {
        const label = formatMistakeQuestionLabel(row.original, quizzes);
        return <DataTableTruncatedCell value={label} />;
      },
    },
    {
      id: "questionType",
      accessorFn: (row) => formatMistakeQuestionType(row, quizzes),
      header: () => (
        <DataTableColumnFilterHeader
          label="Question type"
          filterValue={questionTypeFilter}
          menuLabel="Filter by question type"
          options={QUESTION_TYPE_FILTER_OPTIONS}
          onFilterChange={(value) => onQuestionTypeFilterChange(value as QuestionTypeFilter)}
        />
      ),
      cell: ({ row }) => {
        const typeLabel = formatMistakeQuestionType(row.original, quizzes);
        return <DataTableTruncatedCell value={typeLabel} variant="muted" />;
      },
    },
    {
      id: "notes",
      accessorFn: (row) => getNotesForQuestion(row.quizId, row.questionId).length,
      header: ({ column }) => <DataTableSortableHeader label="Notes" column={column} />,
      cell: ({ row }) => (
        <DataTableNumericCell value={row.getValue<number>("notes")} mutedWhenZero />
      ),
    },
    {
      accessorKey: "flaggedCount",
      header: ({ column }) => <DataTableSortableHeader label="Flags" column={column} />,
      cell: ({ row }) => <DataTableNumericCell value={row.original.flaggedCount} />,
    },
    {
      accessorKey: "mistakeCount",
      header: ({ column }) => <DataTableSortableHeader label="Mistakes" column={column} />,
      cell: ({ row }) => <DataTableNumericCell value={row.original.mistakeCount} />,
    },
    {
      accessorKey: "correctnessPercentage",
      header: ({ column }) => <DataTableSortableHeader label="Correctness" column={column} />,
      cell: ({ row }) => (
        <span className={dataTableCellMutedClass}>
          {row.original.correctnessPercentage}%
        </span>
      ),
    },
    {
      id: "lastMistakenAt",
      accessorFn: (row) => row.lastMistakenAt,
      sortingFn: (rowA, rowB) => {
        const aTime = rowA.original.lastMistakenAt
          ? Date.parse(rowA.original.lastMistakenAt)
          : 0;
        const bTime = rowB.original.lastMistakenAt
          ? Date.parse(rowB.original.lastMistakenAt)
          : 0;
        return aTime - bTime;
      },
      header: ({ column }) => <DataTableSortableHeader label="Last mistaken" column={column} />,
      cell: ({ row }) => (
        <span className={dataTableCellMutedClass}>
          {formatShortDate(row.original.lastMistakenAt)}
        </span>
      ),
    },
  ];
}
