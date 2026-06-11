import { Link } from "@tanstack/react-router";
import {
  type ColumnDef,
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  type PaginationState,
  type SortingState,
  type Table as TanStackTable,
  useReactTable,
} from "@tanstack/react-table";
import { ChevronDown, Flag, Settings, Shuffle, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { PageShell } from "@/components/layout/PageShell";
import { QuestionReviewCard } from "@/components/quiz/QuestionReviewCard";
import { Route } from "@/routes/_app/mistakes/index";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/quiz/EmptyState";
import { IconActionButton } from "@/components/ui/icon-action-button";
import { Switch } from "@/components/ui/switch";
import {
  DataTableColumnFilterHeader,
  DataTableColumnHeader,
  DataTableNumericCell,
  DataTableSortableHeader,
  DataTableTruncatedCell,
  dataTableCellClass,
  dataTableCellMutedClass,
  dataTableFixedCellClass,
  dataTableFixedLayoutClass,
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
import { useKnowledgeLibrary } from "@/hooks/useKnowledgeLibrary";
import { useGoals } from "@/hooks/useGoals";
import { useMistakeLog } from "@/hooks/useMistakeLog";
import { useQuizLibrary } from "@/hooks/useQuizLibrary";
import { formatShortDate } from "@/lib/formatDate";
import { getQuestionNumber } from "@/lib/linkedQuestionLabel";
import {
  QUESTION_TYPE_LABELS,
  shuffleArrayKeepingKeyedItemAtIndex,
} from "@/lib/questionOrder";
import { MISTAKE_LOG_PAGE_SIZE_OPTIONS } from "@/lib/dataTablePagination";
import { detectEmptyReason } from "@/lib/mistakeLog";
import { buildMistakeAnswerRecord } from "@/lib/mistakeLogReview";
import { questionLinkKey } from "@/lib/knowledgeLinks";
import {
  reviewQuestionFlaggedClass,
  reviewQuestionIncorrectClass,
} from "@/lib/reviewQuestionStatus";
import { cn } from "@/lib/utils";
import type { MistakeEntry } from "@/types/mistakeLog";
import type { QuizQuestion, QuizSource } from "@/types/quiz";

type QuestionTypeFilter = "all" | QuizQuestion["type"];

function syncTablePageForEntry(table: TanStackTable<MistakeEntry>, entry: MistakeEntry) {
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

const MISTAKE_COLUMN_WIDTHS: Record<string, string> = {
  quizTitle: "w-[22%]",
  question: "w-[8%]",
  questionType: "w-[14%]",
  notes: "w-[8%]",
  flaggedCount: "w-[8%]",
  mistakeCount: "w-[10%]",
  correctnessPercentage: "w-[12%]",
  lastMistakenAt: "w-[18%]",
};

function mistakeColumnWidth(columnId: string) {
  return MISTAKE_COLUMN_WIDTHS[columnId] ?? "";
}

const DEFAULT_MISTAKE_SORTING: SortingState = [
  { id: "flaggedCount", desc: true },
  { id: "mistakeCount", desc: true },
];

const QUESTION_TYPE_FILTER_OPTIONS: { value: QuestionTypeFilter; label: string }[] = [
  { value: "all", label: "All types" },
  { value: "single_choice", label: QUESTION_TYPE_LABELS.single_choice },
  { value: "multiple_choice", label: QUESTION_TYPE_LABELS.multiple_choice },
  { value: "true_false", label: QUESTION_TYPE_LABELS.true_false },
];

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

function MistakeStatusBadge({
  count,
  variant,
}: {
  count: number;
  variant: "mistakes" | "flags";
}) {
  if (count <= 0) return null;

  const isMistakes = variant === "mistakes";

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-xs font-semibold tabular-nums",
        isMistakes
          ? reviewQuestionIncorrectClass
          : cn("bg-amber-50 text-amber-800", reviewQuestionFlaggedClass),
      )}
    >
      {isMistakes ? (
        <X className="size-3.5 shrink-0" aria-hidden="true" />
      ) : (
        <Flag className="size-3.5 shrink-0" aria-hidden="true" />
      )}
      {count}
    </span>
  );
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
        Settings
      </Link>
    </section>
  );
}

export function MistakeLogPage() {
  const { quizId: scopedQuizId } = Route.useSearch();
  const { goals } = useGoals();
  const {
    qualifyingEntries,
    rawEntries,
    emptyReason,
    quizzesWithMistakes,
    thresholds,
    isLoading,
    error,
    refetch,
  } = useMistakeLog();
  const { quizzes } = useQuizLibrary();
  const { getNotesForQuestion } = useKnowledgeLibrary();
  const [quizFilter, setQuizFilter] = useState<string>("all");
  const [questionTypeFilter, setQuestionTypeFilter] = useState<QuestionTypeFilter>("all");
  const [sorting, setSorting] = useState<SortingState>(DEFAULT_MISTAKE_SORTING);
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 5,
  });
  const [selectedEntryKey, setSelectedEntryKey] = useState<string | null>(null);
  const [isMistakeListExpanded, setIsMistakeListExpanded] = useState(true);
  const [studyMode, setStudyMode] = useState(true);
  const [shuffleEnabled, setShuffleEnabled] = useState(false);
  const [shuffleSeed, setShuffleSeed] = useState(0);
  const [shufflePinnedIndex, setShufflePinnedIndex] = useState(0);
  const [shufflePinnedKey, setShufflePinnedKey] = useState<string | null>(null);

  const isQuizScoped = Boolean(scopedQuizId);
  const effectiveQuizFilter =
    quizFilter === "all" ||
    quizzesWithMistakes.some((quiz) => quiz.quizId === quizFilter)
      ? quizFilter
      : "all";
  const scopedQuizTitle =
    scopedQuizId &&
    (quizzes.find((source) => source.quiz.id === scopedQuizId)?.quiz.title ??
      qualifyingEntries.find((entry) => entry.quizId === scopedQuizId)?.quizTitle);

  const filteredEntries = useMemo(() => {
    let entries = qualifyingEntries;

    const quizId =
      isQuizScoped ? scopedQuizId : effectiveQuizFilter === "all" ? undefined : effectiveQuizFilter;
    if (quizId) {
      entries = entries.filter((entry) => entry.quizId === quizId);
    }

    if (questionTypeFilter !== "all") {
      entries = entries.filter(
        (entry) => getMistakeQuestionType(entry, quizzes) === questionTypeFilter,
      );
    }

    return entries;
  }, [qualifyingEntries, isQuizScoped, scopedQuizId, effectiveQuizFilter, questionTypeFilter, quizzes]);

  useEffect(() => {
    setPagination((prev) => ({ ...prev, pageIndex: 0 }));
  }, [effectiveQuizFilter, questionTypeFilter, isQuizScoped, scopedQuizId]);

  const shuffleOrderKey = useMemo(
    () =>
      filteredEntries
        .map((entry) => questionLinkKey(entry.quizId, entry.questionId))
        .join("\0"),
    [filteredEntries],
  );

  const displayEntries = useMemo(() => {
    if (!shuffleEnabled) return filteredEntries;
    let seed = shuffleSeed;
    const random = () => {
      seed = (seed * 1664525 + 1013904223) >>> 0;
      return seed / 0xffffffff;
    };
    return shuffleArrayKeepingKeyedItemAtIndex(
      filteredEntries,
      shufflePinnedIndex,
      (entry) => questionLinkKey(entry.quizId, entry.questionId),
      shufflePinnedKey,
      random,
    );
  }, [
    filteredEntries,
    shuffleEnabled,
    shuffleSeed,
    shufflePinnedIndex,
    shufflePinnedKey,
  ]);

  const columns = useMemo<ColumnDef<MistakeEntry>[]>(
    () => {
      const defs: ColumnDef<MistakeEntry>[] = [
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
              onFilterChange={setQuizFilter}
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
          return (
            <DataTableTruncatedCell
              value={label}
              showTooltip={label === row.original.questionId}
            />
          );
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
            onFilterChange={(value) => setQuestionTypeFilter(value as QuestionTypeFilter)}
          />
        ),
        cell: ({ row }) => {
          const typeLabel = formatMistakeQuestionType(row.original, quizzes);
          return (
            <DataTableTruncatedCell
              value={typeLabel}
              variant="muted"
              showTooltip={typeLabel !== "—"}
            />
          );
        },
      },
      {
        id: "notes",
        accessorFn: (row) => getNotesForQuestion(row.quizId, row.questionId).length,
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
        cell: ({ row }) =>
          studyMode ? (
            <span className={dataTableCellMutedClass}>—</span>
          ) : (
            <DataTableNumericCell value={row.original.flaggedCount} />
          ),
      },
      {
        accessorKey: "mistakeCount",
        header: ({ column }) => (
          <DataTableSortableHeader label="Mistakes" column={column} />
        ),
        cell: ({ row }) =>
          studyMode ? (
            <span className={dataTableCellMutedClass}>—</span>
          ) : (
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
    ];

      return defs;
    },
    [effectiveQuizFilter, getNotesForQuestion, isQuizScoped, questionTypeFilter, quizzes, quizzesWithMistakes, studyMode],
  );

  const table = useReactTable({
    data: displayEntries,
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

  const sortedEntries = table.getSortedRowModel().rows.map((row) => row.original);

  const effectiveEntry = useMemo(() => {
    if (sortedEntries.length === 0) return null;
    if (selectedEntryKey) {
      const selected = sortedEntries.find(
        (entry) => questionLinkKey(entry.quizId, entry.questionId) === selectedEntryKey,
      );
      if (selected) return selected;
    }
    return sortedEntries[0];
  }, [sortedEntries, selectedEntryKey]);

  const activePosition = useMemo(() => {
    if (!effectiveEntry) return -1;
    return sortedEntries.findIndex(
      (entry) =>
        questionLinkKey(entry.quizId, entry.questionId) ===
        questionLinkKey(effectiveEntry.quizId, effectiveEntry.questionId),
    );
  }, [sortedEntries, effectiveEntry]);

  const shuffleSelectionRef = useRef({
    entry: effectiveEntry,
    position: activePosition,
  });
  shuffleSelectionRef.current = {
    entry: effectiveEntry,
    position: activePosition,
  };

  const prevShuffleEnabledRef = useRef(shuffleEnabled);
  const shuffleOrderKeyRef = useRef(shuffleOrderKey);

  useEffect(() => {
    if (!shuffleEnabled) {
      setSorting(DEFAULT_MISTAKE_SORTING);
      prevShuffleEnabledRef.current = false;
      shuffleOrderKeyRef.current = shuffleOrderKey;
      return;
    }

    setSorting([]);

    const justEnabled = !prevShuffleEnabledRef.current;
    const orderChanged = shuffleOrderKeyRef.current !== shuffleOrderKey;
    if (orderChanged && !justEnabled) {
      const { entry, position } = shuffleSelectionRef.current;
      if (entry) {
        const key = questionLinkKey(entry.quizId, entry.questionId);
        setSelectedEntryKey(key);
        setShufflePinnedKey(key);
        setShufflePinnedIndex(position >= 0 ? position : 0);
      }
    }

    prevShuffleEnabledRef.current = true;
    shuffleOrderKeyRef.current = shuffleOrderKey;
    setShuffleSeed((seed) => seed + 1);
  }, [shuffleEnabled, shuffleOrderKey]);

  function toggleShuffle() {
    if (!shuffleEnabled && effectiveEntry) {
      const key = questionLinkKey(effectiveEntry.quizId, effectiveEntry.questionId);
      setSelectedEntryKey(key);
      setShufflePinnedKey(key);
      setShufflePinnedIndex(activePosition >= 0 ? activePosition : 0);
    }
    setShuffleEnabled((enabled) => !enabled);
  }

  function selectEntry(entry: MistakeEntry) {
    setSelectedEntryKey(questionLinkKey(entry.quizId, entry.questionId));
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

    if (!isQuizScoped && (effectiveQuizFilter !== "all" || questionTypeFilter !== "all")) {
      return "no_mistakes" as const;
    }

    if (isQuizScoped && scopedQuizId) {
      const scopedGoal = goals.find((goal) => goal.quizId === scopedQuizId);
      const hasQuizAttempts = (scopedGoal?.attempts.length ?? 0) > 0;
      const quizRaw = rawEntries.filter((entry) => entry.quizId === scopedQuizId);
      const hasQuizMistakes = quizRaw.some(
        (entry) => entry.mistakeCount > 0 || entry.flaggedCount > 0,
      );
      return detectEmptyReason(hasQuizAttempts, hasQuizMistakes, filteredEntries.length);
    }

    return emptyReason;
  }, [
    filteredEntries.length,
    isQuizScoped,
    effectiveQuizFilter,
    questionTypeFilter,
    scopedQuizId,
    goals,
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
                  <Table className={dataTableFixedLayoutClass}>
                    <TableHeader>
                      {table.getHeaderGroups().map((headerGroup) => (
                        <TableRow key={headerGroup.id}>
                          {headerGroup.headers.map((header) => (
                            <TableHead
                              key={header.id}
                              className={cn(
                                dataTableHeadClass,
                                dataTableFixedCellClass,
                                mistakeColumnWidth(header.column.id),
                              )}
                            >
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
                          questionLinkKey(row.original.quizId, row.original.questionId) ===
                          questionLinkKey(effectiveEntry.quizId, effectiveEntry.questionId);

                        return (
                          <TableRow
                            key={row.id}
                            className={cn("cursor-pointer", isActive && "bg-zinc-50")}
                            data-state={isActive ? "selected" : undefined}
                            onClick={() => selectEntry(row.original)}
                          >
                            {row.getVisibleCells().map((cell) => (
                              <TableCell
                                key={cell.id}
                                className={cn(
                                  dataTableCellClass,
                                  dataTableFixedCellClass,
                                  mistakeColumnWidth(cell.column.id),
                                )}
                              >
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
            <QuestionReviewCard
              header={
                <>
                  <h2 className="text-sm font-semibold text-zinc-950">Review mistake</h2>
                  <div className="mt-1 flex min-h-5 items-center gap-x-2 text-xs text-zinc-500">
                    <span className="truncate">{effectiveEntry.quizTitle}</span>
                    <span
                      className={cn(
                        "flex shrink-0 items-center gap-x-2",
                        studyMode && "invisible",
                      )}
                      aria-hidden={studyMode}
                    >
                      <span className="text-zinc-300" aria-hidden="true">
                        ·
                      </span>
                      <span>
                        Last mistaken {formatShortDate(effectiveEntry.lastMistakenAt)}
                      </span>
                      <MistakeStatusBadge
                        count={effectiveEntry.mistakeCount}
                        variant="mistakes"
                      />
                      <MistakeStatusBadge
                        count={effectiveEntry.flaggedCount}
                        variant="flags"
                      />
                    </span>
                  </div>
                </>
              }
              headerActions={
                <>
                  <IconActionButton
                    icon={Shuffle}
                    label={shuffleEnabled ? "Sorted order" : "Shuffle order"}
                    variant={shuffleEnabled ? "default" : "outline"}
                    onClick={toggleShuffle}
                  />
                  <div className="flex items-center gap-2">
                    <label
                      htmlFor="mistake-log-study-mode"
                      className="text-xs font-medium text-zinc-600"
                    >
                      Study mode
                    </label>
                    <Switch
                      id="mistake-log-study-mode"
                      checked={studyMode}
                      onCheckedChange={setStudyMode}
                      aria-labelledby="mistake-log-study-mode"
                    />
                  </div>
                </>
              }
              question={activeQuestionContext.question}
              questionIndex={activeQuestionContext.questionIndex}
              record={buildMistakeAnswerRecord(effectiveEntry, activeQuestionContext.question)}
              quizId={effectiveEntry.quizId}
              concealAnswers={studyMode}
              position={activePosition + 1}
              total={sortedEntries.length}
              onPrevious={goToPreviousMistake}
              onNext={goToNextMistake}
              disablePrevious={activePosition <= 0}
              disableNext={
                activePosition < 0 || activePosition >= sortedEntries.length - 1
              }
              panelKey={`${effectiveEntry.quizId}:${effectiveEntry.questionId}:${studyMode ? "study" : "review"}`}
              unavailablePrompt={effectiveEntry.prompt}
            />
          )}
        </>
      )}
    </PageShell>
  );
}
