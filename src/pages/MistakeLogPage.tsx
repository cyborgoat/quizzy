import { Link } from "@tanstack/react-router";
import {
  type ColumnDef,
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  type PaginationState,
  type SortingState,
  useReactTable,
} from "@tanstack/react-table";
import { ChevronDown, Settings } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { MistakeLogQuestionReviewCard } from "@/components/mistakes/MistakeLogQuestionReviewCard";
import { PageShell } from "@/components/layout/PageShell";
import { Route } from "@/routes/_app/mistakes/index";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { EmptyState } from "@/components/quiz/EmptyState";
import {
  DataTableColumnHeader,
  DataTableNumericCell,
  DataTableSortableHeader,
  dataTableCellClass,
  dataTableCellMutedClass,
  dataTableCellTextClass,
  dataTableHeadClass,
} from "@/components/ui/data-table";
import { DataTablePaginationFooter } from "@/components/ui/data-table-pagination";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useKnowledgeIndex } from "@/hooks/useKnowledgeIndex";
import { useMistakeLog } from "@/hooks/useMistakeLog";
import { useQuizLibrary } from "@/hooks/useQuizLibrary";
import { formatShortDate } from "@/lib/formatDate";
import { getKnowledgeForQuestion } from "@/lib/knowledgeIndex";
import { getQuestionNumber } from "@/lib/linkedQuestionLabel";
import { QUESTION_TYPE_LABELS } from "@/lib/questionOrder";
import { MISTAKE_LOG_PAGE_SIZE_OPTIONS } from "@/lib/dataTablePagination";
import { detectEmptyReason } from "@/lib/mistakeLog";
import { mistakeEntryKey, syncTablePageForEntry } from "@/lib/mistakeLogReview";
import { cn } from "@/lib/utils";
import type { MistakeEntry } from "@/types/mistakeLog";
import type { QuizQuestion, QuizSource } from "@/types/quiz";

type QuestionTypeFilter = "all" | QuizQuestion["type"];

const QUESTION_TYPE_FILTER_OPTIONS: { value: QuestionTypeFilter; label: string }[] = [
  { value: "all", label: "All types" },
  { value: "single_choice", label: QUESTION_TYPE_LABELS.single_choice },
  { value: "multiple_choice", label: QUESTION_TYPE_LABELS.multiple_choice },
  { value: "true_false", label: QUESTION_TYPE_LABELS.true_false },
];

function MistakeLogColumnFilterHeader({
  label,
  filterValue,
  menuLabel,
  options,
  onFilterChange,
}: {
  label: string;
  filterValue: string;
  menuLabel: string;
  options: { value: string; label: string }[];
  onFilterChange: (value: string) => void;
}) {
  const isFiltered = filterValue !== "all";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className={cn(
            "h-auto w-full justify-start gap-1 rounded-none p-0 text-left text-xs font-medium hover:bg-transparent",
            isFiltered ? "text-zinc-950" : "text-zinc-600 hover:text-zinc-950",
          )}
        >
          {label}
          <ChevronDown className="size-3 shrink-0 opacity-60" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="max-h-64 overflow-y-auto">
        <DropdownMenuLabel>{menuLabel}</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuRadioGroup value={filterValue} onValueChange={onFilterChange}>
          {options.map((option) => (
            <DropdownMenuRadioItem key={option.value} value={option.value}>
              {option.label}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function formatMistakeQuestionLabel(entry: MistakeEntry, quizzes: QuizSource[]) {
  const quiz = quizzes.find((source) => source.quiz.id === entry.quizId);
  const number = quiz ? getQuestionNumber(quiz.quiz.questions, entry.questionId) : null;
  return number ? `Q${number}` : entry.questionId;
}

function getMistakeQuestionType(
  entry: MistakeEntry,
  quizzes: QuizSource[],
): QuizQuestion["type"] | null {
  const quiz = quizzes.find((source) => source.quiz.id === entry.quizId);
  const question = quiz?.quiz.questions.find((item) => item.id === entry.questionId);
  return question?.type ?? null;
}

function formatMistakeQuestionType(entry: MistakeEntry, quizzes: QuizSource[]) {
  const type = getMistakeQuestionType(entry, quizzes);
  if (!type) return "—";
  return QUESTION_TYPE_LABELS[type];
}

function EmptyMistakeLog({
  reason,
  thresholds,
  scopedQuizTitle,
}: {
  reason: "no_attempts" | "no_mistakes" | "thresholds_exclude_all";
  thresholds: { minMistakes: number; minFlags: number; maxCorrectnessPercentage: number };
  scopedQuizTitle?: string;
}) {
  const scopePrefix = scopedQuizTitle ? `${scopedQuizTitle}: ` : "";

  if (reason === "no_attempts") {
    return (
      <EmptyState
        title={`${scopePrefix}No mistakes recorded yet`}
        description="Complete a scored quiz to build your Mistake Log."
      />
    );
  }

  if (reason === "no_mistakes") {
    return (
      <EmptyState
        title={`${scopePrefix}No mistakes or flags found`}
        description="No mistakes or flagged questions found in your scored attempts."
      />
    );
  }

  return (
    <section className="rounded-2xl border border-dashed border-zinc-300 bg-white px-6 py-14 text-center">
      <h2 className="text-xl font-semibold text-zinc-950">
        {scopePrefix}No mistakes meet your current thresholds
      </h2>
      <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-zinc-600">
        Showing questions with at least {thresholds.minMistakes} mistake(s) and correctness at or
        below {thresholds.maxCorrectnessPercentage}%, or with at least {thresholds.minFlags} flag(s).
      </p>
      <Link
        to="/settings"
        className="mt-6 inline-flex h-8 items-center justify-center rounded-md bg-zinc-900 px-3 text-sm font-medium text-white hover:bg-zinc-800"
      >
        Open Settings
      </Link>
    </section>
  );
}

export function MistakeLogPage() {
  const { quizId: scopedQuizId } = Route.useSearch();
  const {
    qualifyingEntries,
    rawEntries,
    attemptData,
    emptyReason,
    quizzesWithMistakes,
    thresholds,
    isLoading,
    error,
    refetch,
  } = useMistakeLog();
  const { quizzes } = useQuizLibrary();
  const knowledgeIndex = useKnowledgeIndex();
  const [quizFilter, setQuizFilter] = useState<string>("all");
  const [questionTypeFilter, setQuestionTypeFilter] = useState<QuestionTypeFilter>("all");
  const [sorting, setSorting] = useState<SortingState>([
    { id: "flaggedCount", desc: true },
    { id: "mistakeCount", desc: true },
  ]);
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 5,
  });
  const [activeEntry, setActiveEntry] = useState<MistakeEntry | null>(null);
  const [isMistakeListExpanded, setIsMistakeListExpanded] = useState(true);

  const isQuizScoped = Boolean(scopedQuizId);
  const scopedQuizTitle =
    scopedQuizId &&
    (quizzes.find((source) => source.quiz.id === scopedQuizId)?.quiz.title ??
      qualifyingEntries.find((entry) => entry.quizId === scopedQuizId)?.quizTitle);

  useEffect(() => {
    if (quizFilter === "all") return;
    const stillExists = quizzesWithMistakes.some((quiz) => quiz.quizId === quizFilter);
    if (!stillExists) {
      setQuizFilter("all");
    }
  }, [quizFilter, quizzesWithMistakes]);

  const filteredEntries = useMemo(() => {
    let entries = qualifyingEntries;

    const quizId = isQuizScoped ? scopedQuizId : quizFilter === "all" ? undefined : quizFilter;
    if (quizId) {
      entries = entries.filter((entry) => entry.quizId === quizId);
    }

    if (questionTypeFilter !== "all") {
      entries = entries.filter(
        (entry) => getMistakeQuestionType(entry, quizzes) === questionTypeFilter,
      );
    }

    return entries;
  }, [qualifyingEntries, isQuizScoped, scopedQuizId, quizFilter, questionTypeFilter, quizzes]);

  useEffect(() => {
    setPagination((prev) => ({ ...prev, pageIndex: 0 }));
  }, [quizFilter, questionTypeFilter, isQuizScoped, scopedQuizId]);

  const columns = useMemo<ColumnDef<MistakeEntry>[]>(
    () => [
      {
        accessorKey: "quizTitle",
        header: () =>
          isQuizScoped ? (
            <DataTableColumnHeader label="Quiz Name" />
          ) : (
            <MistakeLogColumnFilterHeader
              label="Quiz Name"
              filterValue={quizFilter}
              menuLabel="Filter by quiz"
              options={[
                { value: "all", label: "All quizzes" },
                ...quizzesWithMistakes.map((quiz) => ({
                  value: quiz.quizId,
                  label: quiz.quizTitle,
                })),
              ]}
              onFilterChange={setQuizFilter}
            />
          ),
        cell: ({ row }) => (
          <span className={`${dataTableCellTextClass} min-w-0`}>{row.original.quizTitle}</span>
        ),
      },
      {
        id: "question",
        accessorFn: (row) => formatMistakeQuestionLabel(row, quizzes),
        header: () => <DataTableColumnHeader label="Question" />,
        cell: ({ row }) => (
          <span className={`${dataTableCellTextClass} min-w-0 font-medium`}>
            {formatMistakeQuestionLabel(row.original, quizzes)}
          </span>
        ),
      },
      {
        id: "questionType",
        accessorFn: (row) => formatMistakeQuestionType(row, quizzes),
        header: () => (
          <MistakeLogColumnFilterHeader
            label="Question type"
            filterValue={questionTypeFilter}
            menuLabel="Filter by question type"
            options={QUESTION_TYPE_FILTER_OPTIONS}
            onFilterChange={(value) => setQuestionTypeFilter(value as QuestionTypeFilter)}
          />
        ),
        cell: ({ row }) => (
          <span className={dataTableCellMutedClass}>
            {formatMistakeQuestionType(row.original, quizzes)}
          </span>
        ),
      },
      {
        id: "notes",
        accessorFn: (row) =>
          getKnowledgeForQuestion(knowledgeIndex, row.quizId, row.questionId).length,
        header: ({ column }) => (
          <DataTableSortableHeader label="Notes" column={column} />
        ),
        cell: ({ row }) => (
          <DataTableNumericCell value={row.getValue<number>("notes")} mutedWhenZero />
        ),
      },
      {
        accessorKey: "flaggedCount",
        header: ({ column }) => (
          <DataTableSortableHeader label="Flags" column={column} />
        ),
        cell: ({ row }) => (
          <DataTableNumericCell value={row.original.flaggedCount} />
        ),
      },
      {
        accessorKey: "mistakeCount",
        header: ({ column }) => (
          <DataTableSortableHeader label="Mistakes" column={column} />
        ),
        cell: ({ row }) => (
          <DataTableNumericCell value={row.original.mistakeCount} />
        ),
      },
      {
        accessorKey: "correctnessPercentage",
        header: ({ column }) => (
          <DataTableSortableHeader label="Correctness" column={column} />
        ),
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
        header: ({ column }) => (
          <DataTableSortableHeader label="Last mistaken" column={column} />
        ),
        cell: ({ row }) => (
          <span className={dataTableCellMutedClass}>
            {formatShortDate(row.original.lastMistakenAt)}
          </span>
        ),
      },
    ],
    [isQuizScoped, knowledgeIndex, questionTypeFilter, quizFilter, quizzes, quizzesWithMistakes],
  );

  const table = useReactTable({
    data: filteredEntries,
    columns,
    state: { sorting, pagination },
    onSortingChange: (updater) => {
      const nextSorting = typeof updater === "function" ? updater(sorting) : updater;
      setSorting(nextSorting);
    },
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  });

  const sortedEntries = useMemo(
    () => table.getSortedRowModel().rows.map((row) => row.original),
    [filteredEntries, sorting],
  );

  const effectiveEntry = useMemo(() => {
    if (sortedEntries.length === 0) return null;
    if (
      activeEntry &&
      sortedEntries.some((entry) => mistakeEntryKey(entry) === mistakeEntryKey(activeEntry))
    ) {
      return activeEntry;
    }
    return sortedEntries[0];
  }, [sortedEntries, activeEntry]);

  useEffect(() => {
    setActiveEntry(null);
  }, [quizFilter, questionTypeFilter, scopedQuizId, isQuizScoped, sorting]);

  useEffect(() => {
    if (!effectiveEntry) return;
    syncTablePageForEntry(table, effectiveEntry);
  }, [effectiveEntry, filteredEntries, sorting, pagination.pageSize, table]);

  const activePosition = useMemo(() => {
    if (!effectiveEntry) return -1;
    return sortedEntries.findIndex(
      (entry) => mistakeEntryKey(entry) === mistakeEntryKey(effectiveEntry),
    );
  }, [sortedEntries, effectiveEntry]);

  function selectEntry(entry: MistakeEntry) {
    setActiveEntry(entry);
    syncTablePageForEntry(table, entry);
  }

  function goToPreviousMistake() {
    if (activePosition <= 0) return;
    selectEntry(sortedEntries[activePosition - 1]);
  }

  function goToNextMistake() {
    if (activePosition < 0 || activePosition >= sortedEntries.length - 1) return;
    selectEntry(sortedEntries[activePosition + 1]);
  }

  const scopedEmptyReason = useMemo(() => {
    if (filteredEntries.length > 0) return null;

    if (!isQuizScoped && (quizFilter !== "all" || questionTypeFilter !== "all")) {
      return "no_mistakes" as const;
    }

    if (isQuizScoped && scopedQuizId) {
      const quizAttempts = attemptData.filter((attempt) => attempt.quizId === scopedQuizId);
      const quizRaw = rawEntries.filter((entry) => entry.quizId === scopedQuizId);
      const hasQuizMistakes = quizRaw.some(
        (entry) => entry.mistakeCount > 0 || entry.flaggedCount > 0,
      );
      return detectEmptyReason(quizAttempts.length > 0, hasQuizMistakes, filteredEntries.length);
    }

    return emptyReason;
  }, [
    filteredEntries.length,
    isQuizScoped,
    quizFilter,
    questionTypeFilter,
    scopedQuizId,
    attemptData,
    rawEntries,
    emptyReason,
  ]);

  const activeQuestionContext = useMemo(() => {
    if (!effectiveEntry) return { question: null, questionIndex: 0 };
    const source = quizzes.find((item) => item.quiz.id === effectiveEntry.quizId);
    const questionIndex =
      source?.quiz.questions.findIndex(
        (question) => question.id === effectiveEntry.questionId,
      ) ?? -1;
    const question =
      questionIndex >= 0 ? source!.quiz.questions[questionIndex]! : null;
    return { question, questionIndex: questionIndex >= 0 ? questionIndex : 0 };
  }, [effectiveEntry, quizzes]);

  return (
    <PageShell className="space-y-3">
      <div>
        <h1 className="text-xl font-bold tracking-tight text-zinc-950 lg:text-2xl">Mistake Log</h1>
        <p className="mt-0.5 text-sm text-zinc-500">
          Threshold-filtered mistakes plus flagged questions from scored attempts. Click a question
          to review the answer and explanation.
        </p>
        <p className="mt-1 text-xs text-zinc-500">
          Thresholds: ≥{thresholds.minMistakes} mistake(s), ≥{thresholds.minFlags} flag(s), ≤
          {thresholds.maxCorrectnessPercentage}% correctness. Adjust in{" "}
          <Link to="/settings" className="font-medium text-zinc-700 underline-offset-2 hover:underline">
            <Settings className="mr-0.5 inline size-3" />
            Settings
          </Link>
          .
        </p>
        {isQuizScoped && scopedQuizTitle && (
          <p className="mt-1 text-sm font-medium text-zinc-700">{scopedQuizTitle}</p>
        )}
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertTitle>Unable to load mistake data</AlertTitle>
          <AlertDescription>
            <div className="flex flex-wrap items-center gap-3">
              <span>{error}</span>
              <Button variant="outline" size="sm" onClick={() => void refetch()}>
                Retry
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {isLoading ? (
        <p className="py-12 text-center text-sm text-zinc-500">Loading mistake data…</p>
      ) : scopedEmptyReason ? (
        <EmptyMistakeLog
          reason={scopedEmptyReason}
          thresholds={thresholds}
          scopedQuizTitle={isQuizScoped ? (scopedQuizTitle ?? undefined) : undefined}
        />
      ) : (
        <>
          <div className="overflow-hidden rounded-lg border border-zinc-200 bg-white">
            <button
              type="button"
              className="flex w-full items-center gap-2 border-b border-zinc-200/55 px-3 py-2 text-left transition-colors hover:bg-zinc-50"
              aria-expanded={isMistakeListExpanded}
              onClick={() => setIsMistakeListExpanded((expanded) => !expanded)}
            >
              <ChevronDown
                className={cn(
                  "size-4 shrink-0 text-zinc-500 transition-transform duration-200",
                  isMistakeListExpanded && "rotate-180",
                )}
              />
              <span className="text-sm font-semibold text-zinc-950">Mistake list</span>
              <span className="text-xs text-zinc-500">({sortedEntries.length})</span>
            </button>

            {isMistakeListExpanded && (
              <>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      {table.getHeaderGroups().map((headerGroup) => (
                        <TableRow key={headerGroup.id}>
                          {headerGroup.headers.map((header) => (
                            <TableHead key={header.id} className={dataTableHeadClass}>
                              {header.isPlaceholder
                                ? null
                                : flexRender(header.column.columnDef.header, header.getContext())}
                            </TableHead>
                          ))}
                        </TableRow>
                      ))}
                    </TableHeader>
                    <TableBody>
                      {table.getRowModel().rows.map((row) => {
                        const isActive =
                          effectiveEntry !== null &&
                          mistakeEntryKey(row.original) === mistakeEntryKey(effectiveEntry);

                        return (
                          <TableRow
                            key={row.id}
                            className={cn("cursor-pointer", isActive && "bg-zinc-50")}
                            data-state={isActive ? "selected" : undefined}
                            onClick={() => selectEntry(row.original)}
                          >
                            {row.getVisibleCells().map((cell) => (
                              <TableCell key={cell.id} className={dataTableCellClass}>
                                {flexRender(cell.column.columnDef.cell, cell.getContext())}
                              </TableCell>
                            ))}
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
                <DataTablePaginationFooter
                  table={table}
                  pageSizeOptions={MISTAKE_LOG_PAGE_SIZE_OPTIONS}
                />
              </>
            )}
          </div>

          {effectiveEntry && (
            <MistakeLogQuestionReviewCard
              entry={effectiveEntry}
              question={activeQuestionContext.question}
              questionIndex={activeQuestionContext.questionIndex}
              position={activePosition + 1}
              total={sortedEntries.length}
              onPrevious={goToPreviousMistake}
              onNext={goToNextMistake}
              disablePrevious={activePosition <= 0}
              disableNext={activePosition < 0 || activePosition >= sortedEntries.length - 1}
            />
          )}
        </>
      )}
    </PageShell>
  );
}
