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
import { ArrowUpDown, Settings } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { MistakeReviewDrawer } from "@/components/mistakes/MistakeReviewDrawer";
import { PageShell } from "@/components/layout/PageShell";
import { Route } from "@/routes/_app/mistakes/index";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/quiz/EmptyState";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useMistakeLog } from "@/hooks/useMistakeLog";
import { useQuizLibrary } from "@/hooks/useQuizLibrary";
import { detectEmptyReason, formatMistakeDate } from "@/lib/mistakeLog";
import type { MistakeEntry } from "@/types/mistakeLog";

const PAGE_SIZE_OPTIONS = [10, 20, 50];
const PAGE_JUMP_THRESHOLD = 15;

function getPaginationItems(currentPage: number, totalPages: number): Array<number | "ellipsis"> {
  // Keep pagination predictable: full list for small sets, sliding window for larger sets.
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, index) => index + 1);
  }

  if (currentPage <= 4) {
    return [1, 2, 3, 4, 5, "ellipsis", totalPages];
  }

  if (currentPage >= totalPages - 3) {
    return [1, "ellipsis", totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages];
  }

  return [1, "ellipsis", currentPage - 1, currentPage, currentPage + 1, "ellipsis", totalPages];
}

function SummaryCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-lg border border-zinc-200 bg-white px-3 py-2.5 sm:px-4">
      <p className="text-xs text-zinc-500">{label}</p>
      <p className="mt-1 text-xl font-semibold tabular-nums text-zinc-950 xl:text-2xl">{value}</p>
    </div>
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
    summary,
    emptyReason,
    quizzesWithMistakes,
    thresholds,
    isLoading,
    error,
    refetch,
  } = useMistakeLog();
  const { quizzes } = useQuizLibrary();
  const [quizFilter, setQuizFilter] = useState<string>("all");
  const [sorting, setSorting] = useState<SortingState>([
    { id: "flaggedCount", desc: true },
    { id: "mistakeCount", desc: true },
  ]);
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 10,
  });
  const [pageJumpValue, setPageJumpValue] = useState("1");
  const [activeEntry, setActiveEntry] = useState<MistakeEntry | null>(null);

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
    const quizId = isQuizScoped ? scopedQuizId : quizFilter === "all" ? undefined : quizFilter;
    if (!quizId) return qualifyingEntries;
    return qualifyingEntries.filter((entry) => entry.quizId === quizId);
  }, [qualifyingEntries, isQuizScoped, scopedQuizId, quizFilter]);

  useEffect(() => {
    setPagination((prev) => ({ ...prev, pageIndex: 0 }));
  }, [quizFilter, isQuizScoped, scopedQuizId]);

  useEffect(() => {
    setPageJumpValue(String(pagination.pageIndex + 1));
  }, [pagination.pageIndex]);

  const columns = useMemo<ColumnDef<MistakeEntry>[]>(
    () => [
      {
        accessorKey: "prompt",
        header: "Question",
        cell: ({ row }) => (
          <div className="min-w-0">
            <p className="text-xs font-medium leading-5 text-zinc-950 sm:text-sm">
              {row.original.prompt}
            </p>
            {!isQuizScoped && (
              <p className="mt-0.5 text-[11px] text-zinc-500 sm:text-xs">{row.original.quizTitle}</p>
            )}
          </div>
        ),
      },
      {
        accessorKey: "flaggedCount",
        header: ({ column }) => (
          <Button
            variant="ghost"
            size="sm"
            className="h-7 px-1.5 text-[11px] text-zinc-600"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Flags
            <ArrowUpDown className="size-3" />
          </Button>
        ),
        cell: ({ row }) => (
          <span className="text-[11px] font-semibold tabular-nums text-zinc-950 sm:text-xs">
            {row.original.flaggedCount}
          </span>
        ),
      },
      {
        accessorKey: "mistakeCount",
        header: ({ column }) => (
          <Button
            variant="ghost"
            size="sm"
            className="h-7 px-1.5 text-[11px] text-zinc-600"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Mistakes
            <ArrowUpDown className="size-3" />
          </Button>
        ),
        cell: ({ row }) => (
          <span className="text-[11px] font-semibold tabular-nums text-zinc-950 sm:text-xs">
            {row.original.mistakeCount}
          </span>
        ),
      },
      {
        accessorKey: "correctnessPercentage",
        header: ({ column }) => (
          <Button
            variant="ghost"
            size="sm"
            className="h-7 px-1.5 text-[11px] text-zinc-600"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Correctness
            <ArrowUpDown className="size-3" />
          </Button>
        ),
        cell: ({ row }) => (
          <span className="text-[11px] tabular-nums text-zinc-600 sm:text-xs">
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
          <Button
            variant="ghost"
            size="sm"
            className="h-7 px-1.5 text-[11px] text-zinc-600"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Last mistaken
            <ArrowUpDown className="size-3" />
          </Button>
        ),
        cell: ({ row }) => (
          <span className="text-[11px] text-zinc-600 sm:text-xs">
            {formatMistakeDate(row.original.lastMistakenAt)}
          </span>
        ),
      },
    ],
    [isQuizScoped],
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

  const scopedSummary = useMemo(() => {
    if (filteredEntries.length === qualifyingEntries.length) return summary;
    return {
      qualifyingCount: filteredEntries.length,
      totalMistakeEvents: filteredEntries.reduce((sum, entry) => sum + entry.mistakeCount, 0),
      quizCount: new Set(filteredEntries.map((entry) => entry.quizId)).size,
    };
  }, [filteredEntries, qualifyingEntries.length, summary]);

  const scopedEmptyReason = useMemo(() => {
    if (filteredEntries.length > 0) return null;

    if (!isQuizScoped && quizFilter !== "all") {
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
    scopedQuizId,
    attemptData,
    rawEntries,
    emptyReason,
  ]);

  const activeQuestion = useMemo(() => {
    if (!activeEntry) return null;
    const source = quizzes.find((item) => item.quiz.id === activeEntry.quizId);
    return source?.quiz.questions.find((question) => question.id === activeEntry.questionId) ?? null;
  }, [activeEntry, quizzes]);

  const pageCount = table.getPageCount();

  const commitPageJump = () => {
    const parsed = Number(pageJumpValue);
    if (!Number.isFinite(parsed)) {
      setPageJumpValue(String(pagination.pageIndex + 1));
      return;
    }

    const nextPage = Math.min(Math.max(1, Math.trunc(parsed)), pageCount);
    table.setPageIndex(nextPage - 1);
    setPageJumpValue(String(nextPage));
  };

  return (
    <PageShell className="flex h-[calc(100svh-(var(--app-page-py)*2))] flex-col overflow-hidden">
      <div className="mb-4 shrink-0 lg:mb-5">
        <h1 className="text-2xl font-bold tracking-tight text-zinc-950 xl:text-3xl">Mistake Log</h1>
        <p className="mt-1 text-sm text-zinc-500 lg:text-base">
          Threshold-filtered mistakes plus flagged questions from scored attempts. Click a question
          to review the answer and explanation.
        </p>
        {isQuizScoped && scopedQuizTitle && (
          <p className="mt-2 text-sm font-medium text-zinc-700">{scopedQuizTitle}</p>
        )}
      </div>

      {error && (
        <Alert variant="destructive" className="mb-4 shrink-0 lg:mb-5">
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

      <div className="mb-4 grid shrink-0 gap-2 sm:grid-cols-3 lg:mb-5 lg:gap-3">
        <SummaryCard label="Qualifying mistakes" value={scopedSummary.qualifyingCount} />
        <SummaryCard label="Total mistake events" value={scopedSummary.totalMistakeEvents} />
        <SummaryCard label="Quizzes represented" value={scopedSummary.quizCount} />
      </div>

      <div className="mb-4 flex shrink-0 flex-wrap items-center gap-3 rounded-lg border border-zinc-200 bg-white p-3 lg:mb-5 lg:p-4">
        {!isQuizScoped && (
          <div className="min-w-0 flex-1">
            <Label htmlFor="quiz-filter">Quiz</Label>
            <Select value={quizFilter} onValueChange={setQuizFilter}>
              <SelectTrigger id="quiz-filter" className="mt-1.5 max-w-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All quizzes</SelectItem>
                {quizzesWithMistakes.map((quiz) => (
                  <SelectItem key={quiz.quizId} value={quiz.quizId}>
                    {quiz.quizTitle}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
        <div className="text-xs text-zinc-500">
          Thresholds: ≥{thresholds.minMistakes} mistake(s), ≥{thresholds.minFlags} flag(s), ≤
          {thresholds.maxCorrectnessPercentage}% correctness{" "}
          <Link to="/settings" className="font-medium text-zinc-700 underline-offset-2 hover:underline">
            <Settings className="mr-0.5 inline size-3" />
            Settings
          </Link>
        </div>
      </div>

      {isLoading ? (
        <div className="grid min-h-0 flex-1 place-items-center">
          <p className="text-sm text-zinc-500">Loading mistake data…</p>
        </div>
      ) : scopedEmptyReason ? (
        <div className="min-h-0 flex-1 overflow-auto">
          <EmptyMistakeLog
            reason={scopedEmptyReason}
            thresholds={thresholds}
            scopedQuizTitle={isQuizScoped ? (scopedQuizTitle ?? undefined) : undefined}
          />
        </div>
      ) : (
        <div className="min-h-0 flex flex-1 flex-col overflow-hidden rounded-lg border border-zinc-200 bg-white">
          <div className="min-h-0 flex-1 overflow-auto">
            <Table>
              <TableHeader className="sticky top-0 z-10 bg-white/95 backdrop-blur supports-backdrop-filter:bg-white/75">
                {table.getHeaderGroups().map((headerGroup) => (
                  <TableRow key={headerGroup.id}>
                    {headerGroup.headers.map((header) => (
                      <TableHead key={header.id}>
                        {header.isPlaceholder
                          ? null
                          : flexRender(header.column.columnDef.header, header.getContext())}
                      </TableHead>
                    ))}
                  </TableRow>
                ))}
              </TableHeader>
              <TableBody>
                {table.getRowModel().rows.map((row) => (
                  <TableRow
                    key={row.id}
                    className="cursor-pointer"
                    onClick={() => setActiveEntry(row.original)}
                  >
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id}>
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          <div className="shrink-0 border-t border-zinc-200/55 px-2 py-2 sm:px-3 sm:py-3">
            <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
              <div aria-hidden="true" />

              {pageCount > 1 ? (
                <Pagination className="mx-0 w-auto justify-center">
                  <PaginationContent>
                    <PaginationItem>
                      <PaginationPrevious
                        onClick={() => table.previousPage()}
                        disabled={!table.getCanPreviousPage()}
                      />
                    </PaginationItem>
                    {getPaginationItems(table.getState().pagination.pageIndex + 1, pageCount).map(
                      (item, index) => (
                        <PaginationItem key={`${String(item)}-${index}`}>
                          {item === "ellipsis" ? (
                            <PaginationEllipsis />
                          ) : (
                            <PaginationLink
                              isActive={item === table.getState().pagination.pageIndex + 1}
                              onClick={() => table.setPageIndex(item - 1)}
                            >
                              {item}
                            </PaginationLink>
                          )}
                        </PaginationItem>
                      ),
                    )}
                    <PaginationItem>
                      <PaginationNext
                        onClick={() => table.nextPage()}
                        disabled={!table.getCanNextPage()}
                      />
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
              ) : (
                <div aria-hidden="true" />
              )}

              <div className="justify-self-end">
                <div className="flex items-center gap-4">
                  {pageCount >= PAGE_JUMP_THRESHOLD && (
                    <div className="flex items-center gap-2">
                      <Label htmlFor="go-to-page" className="text-xs text-zinc-600">
                        Go to page
                      </Label>
                      <Input
                        id="go-to-page"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        className="h-7 w-14 px-2 text-center text-xs"
                        value={pageJumpValue}
                        onChange={(event) => {
                          const digitsOnly = event.target.value.replace(/\D+/g, "");
                          setPageJumpValue(digitsOnly);
                        }}
                        onKeyDown={(event) => {
                          if (event.key === "Enter") {
                            event.preventDefault();
                            commitPageJump();
                          }
                        }}
                        onBlur={commitPageJump}
                        aria-label="Go to page"
                      />
                    </div>
                  )}

                  <div className="flex items-center gap-2">
                    <Label htmlFor="rows-per-page" className="text-xs text-zinc-600">
                      Rows per page
                    </Label>
                    <Select
                      value={String(table.getState().pagination.pageSize)}
                      onValueChange={(value) => {
                        table.setPageSize(Number(value));
                        table.setPageIndex(0);
                      }}
                    >
                      <SelectTrigger id="rows-per-page" className="h-7 w-20 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {PAGE_SIZE_OPTIONS.map((size) => (
                          <SelectItem key={size} value={String(size)}>
                            {size}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <MistakeReviewDrawer
        entry={activeEntry}
        question={activeQuestion}
        open={activeEntry !== null}
        onOpenChange={(open) => {
          if (!open) setActiveEntry(null);
        }}
      />
    </PageShell>
  );
}
