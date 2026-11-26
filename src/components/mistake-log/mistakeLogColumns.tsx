import type { ColumnDef } from "@tanstack/react-table";
import type { AppTableFeatures } from "@/lib/tableFeatures";
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
import type { TFunction } from "@/lib/i18n";

export type MistakeLogColumnOptions = {
  quizzes: QuizSource[];
  quizFilterOptions: { value: string; label: string }[];
  quizFilter: string;
  questionTypeFilter: QuestionTypeFilter;
  onQuizFilterChange: (value: string) => void;
  onQuestionTypeFilterChange: (value: QuestionTypeFilter) => void;
  getNotesForQuestion: (quizId: string, questionId: string) => KnowledgeItem[];
  t: TFunction;
};

export function buildMistakeLogColumns({
  quizzes,
  quizFilterOptions,
  quizFilter,
  questionTypeFilter,
  onQuizFilterChange,
  onQuestionTypeFilterChange,
  getNotesForQuestion,
  t,
}: MistakeLogColumnOptions): ColumnDef<AppTableFeatures, MistakeEntry>[] {
  return [
    {
      accessorKey: "quizTitle",
      header: () => (
        <DataTableColumnFilterHeader
          label={t("mistakes.col.quiz")}
          filterValue={quizFilter}
          menuLabel={t("mistakes.col.filterByQuiz")}
          options={quizFilterOptions}
          onFilterChange={onQuizFilterChange}
        />
      ),
      cell: ({ row }) => <DataTableTruncatedCell value={row.original.quizTitle} />,
    },
    {
      id: "question",
      accessorFn: (row) => formatMistakeQuestionLabel(row, quizzes),
      header: () => <DataTableColumnHeader label={t("mistakes.col.question")} />,
      cell: ({ row }) => {
        const label = formatMistakeQuestionLabel(row.original, quizzes);
        return <DataTableTruncatedCell value={label} />;
      },
    },
    {
      id: "questionType",
      accessorFn: (row) => formatMistakeQuestionType(row, quizzes, t),
      header: () => (
        <DataTableColumnFilterHeader
          label={t("mistakes.col.type")}
          filterValue={questionTypeFilter}
          menuLabel={t("mistakes.col.filterByType")}
          options={QUESTION_TYPE_FILTER_OPTIONS.map((option) => ({
            value: option.value,
            label: t(option.labelKey),
          }))}
          onFilterChange={(value) => onQuestionTypeFilterChange(value as QuestionTypeFilter)}
        />
      ),
      cell: ({ row }) => {
        const typeLabel = formatMistakeQuestionType(row.original, quizzes, t);
        return <DataTableTruncatedCell value={typeLabel} variant="muted" />;
      },
    },
    {
      id: "notes",
      accessorFn: (row) => getNotesForQuestion(row.quizId, row.questionId).length,
      header: ({ column }) => <DataTableSortableHeader label={t("mistakes.col.notes")} column={column} />,
      cell: ({ row }) => (
        <DataTableNumericCell value={row.getValue<number>("notes")} mutedWhenZero />
      ),
    },
    {
      accessorKey: "flaggedCount",
      header: ({ column }) => <DataTableSortableHeader label={t("mistakes.col.flags")} column={column} />,
      cell: ({ row }) => <DataTableNumericCell value={row.original.flaggedCount} />,
    },
    {
      accessorKey: "mistakeCount",
      header: ({ column }) => <DataTableSortableHeader label={t("mistakes.col.mistakes")} column={column} />,
      cell: ({ row }) => <DataTableNumericCell value={row.original.mistakeCount} />,
    },
    {
      accessorKey: "correctnessPercentage",
      header: ({ column }) => <DataTableSortableHeader label={t("mistakes.col.correctness")} column={column} />,
      cell: ({ row }) => (
        <span className={dataTableCellMutedClass}>
          {row.original.correctnessPercentage}%
        </span>
      ),
    },
    {
      id: "lastMistakenAt",
      accessorFn: (row) => row.lastMistakenAt,
      sortFn: (rowA, rowB) => {
        const aTime = rowA.original.lastMistakenAt
          ? Date.parse(rowA.original.lastMistakenAt)
          : 0;
        const bTime = rowB.original.lastMistakenAt
          ? Date.parse(rowB.original.lastMistakenAt)
          : 0;
        return aTime - bTime;
      },
      header: ({ column }) => <DataTableSortableHeader label={t("mistakes.col.lastMistaken")} column={column} />,
      cell: ({ row }) => (
        <span className={dataTableCellMutedClass}>
          {formatShortDate(row.original.lastMistakenAt)}
        </span>
      ),
    },
  ];
}
