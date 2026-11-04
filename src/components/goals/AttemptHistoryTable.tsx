import { Link } from "@tanstack/react-router";
import {
  type ColumnDef,
  flexRender,
  type PaginationState,
  type SortingState,
  useTable,
} from "@tanstack/react-table";
import { RotateCcw, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import { AttemptResultBadge } from "@/components/goals/AttemptResultBadge";
import { Badge } from "@/components/ui/badge";
import {
  DataTableColumnHeader,
  DataTableColumnFilterHeader,
  DataTableSortableHeader,
  DataTableTruncatedCell,
  dataTableCellClass,
  dataTableHeadClass,
} from "@/components/ui/data-table";
import { DataTablePaginationFooter } from "@/components/ui/data-table-pagination";
import { IconActionButton } from "@/components/ui/icon-action-button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  TableWorkspace,
  tableWorkspaceHeaderClass,
  tableWorkspaceScrollClass,
} from "@/components/ui/table-workspace";
import { formatShortDate } from "@/lib/formatDate";
import type { AttemptHistoryEntry } from "@/lib/recentAttempts";
import { appTableFeatures, type AppTableFeatures } from "@/lib/tableFeatures";
import { cn } from "@/lib/utils";
import { attemptPassed } from "@/types/goal";

const widths: Record<string, string> = {
  quizTitle: "w-[32%]",
  takenAt: "w-[23%]",
  score: "w-[14%]",
  mistakes: "w-[10%]",
  result: "w-[9%]",
  actions: "w-20",
};

export function AttemptHistoryTable({
  entries,
  quizFilter,
  quizOptions,
  onQuizFilterChange,
  deletingAttemptId,
  onDelete,
  onRetake,
}: {
  entries: AttemptHistoryEntry[];
  quizFilter: string;
  quizOptions: { value: string; label: string }[];
  onQuizFilterChange: (value: string) => void;
  deletingAttemptId: string | null;
  onDelete: (entry: AttemptHistoryEntry) => void;
  onRetake: (entry: AttemptHistoryEntry) => void;
}) {
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 20,
  });
  const [sorting, setSorting] = useState<SortingState>([
    { id: "takenAt", desc: true },
  ]);
  const columns = useMemo<ColumnDef<AppTableFeatures, AttemptHistoryEntry>[]>(
    () => [
      {
        accessorKey: "quizTitle",
        header: () => (
          <DataTableColumnFilterHeader
            label="Quiz"
            menuLabel="Filter by quiz"
            filterValue={quizFilter}
            options={quizOptions}
            onFilterChange={(value) => {
              onQuizFilterChange(value);
              setPagination((current) => ({ ...current, pageIndex: 0 }));
            }}
          />
        ),
      },
      {
        id: "takenAt",
        accessorFn: (entry) => Date.parse(entry.attempt.takenAt),
        header: ({ column }) => (
          <DataTableSortableHeader label="Taken" column={column} />
        ),
      },
      {
        id: "score",
        accessorFn: (entry) => entry.attempt.percentage,
        header: ({ column }) => (
          <DataTableSortableHeader label="Score" column={column} />
        ),
      },
      {
        id: "mistakes",
        accessorFn: (entry) => entry.attempt.incorrectCount,
        header: ({ column }) => (
          <DataTableSortableHeader label="Mistakes" column={column} />
        ),
      },
      { id: "result", header: () => <DataTableColumnHeader label="Result" /> },
      { id: "actions", header: () => <span className="sr-only">Actions</span> },
    ],
    [quizFilter, quizOptions, onQuizFilterChange],
  );
  const table = useTable({
    features: appTableFeatures,
    data: entries,
    columns,
    state: { pagination, sorting },
    onSortingChange: (updater) => {
      setSorting(updater);
      setPagination((current) => ({ ...current, pageIndex: 0 }));
    },
    onPaginationChange: setPagination,
  });

  return (
    <TableWorkspace
      title="Saved attempts"
      count={entries.length}
      footer={<DataTablePaginationFooter table={table} />}
    >
      <Table
        key={`${pagination.pageIndex}:${pagination.pageSize}:${JSON.stringify(sorting)}`}
        className="w-full min-w-[50rem] table-fixed"
        containerClassName={tableWorkspaceScrollClass}
      >
        <TableHeader className={tableWorkspaceHeaderClass}>
          {table.getHeaderGroups().map((group) => (
            <TableRow key={group.id}>
              {group.headers.map((header) => (
                <TableHead
                  key={header.id}
                  className={cn(dataTableHeadClass, widths[header.id])}
                >
                  {flexRender(
                    header.column.columnDef.header,
                    header.getContext(),
                  )}
                </TableHead>
              ))}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {entries.length === 0 && (
            <TableRow>
              <TableCell
                colSpan={columns.length}
                className="py-8 text-center text-sm text-zinc-500"
              >
                No attempts match the selected quiz.
              </TableCell>
            </TableRow>
          )}
          {table.getRowModel().rows.map(({ original: entry }) => (
            <TableRow
              key={`${entry.goalId}:${entry.attempt.id}`}
              className="hover:bg-zinc-50"
            >
              <TableCell className={dataTableCellClass}>
                <Link
                  to="/quizzes/$quizId/attempts/$attemptId"
                  params={{ quizId: entry.quizId, attemptId: entry.attempt.id }}
                  className="block min-w-0 rounded-sm font-medium hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500"
                >
                  <DataTableTruncatedCell value={entry.quizTitle} />
                </Link>
                {(entry.archived || !entry.quizAvailable) && (
                  <div className="mt-1 flex gap-1">
                    {entry.archived && (
                      <Badge className="px-1.5 py-0 text-[10px] font-normal">
                        Archived
                      </Badge>
                    )}
                    {!entry.quizAvailable && (
                      <Badge className="px-1.5 py-0 text-[10px] font-normal">
                        Unavailable
                      </Badge>
                    )}
                  </div>
                )}
              </TableCell>
              <TableCell
                className={cn(dataTableCellClass, "tabular-nums text-zinc-500")}
              >
                <time
                  dateTime={entry.attempt.takenAt}
                  title={new Date(entry.attempt.takenAt).toLocaleString()}
                >
                  <span className="block">
                    {formatShortDate(entry.attempt.takenAt)}
                  </span>
                  <span className="text-[11px]">
                    {new Date(entry.attempt.takenAt).toLocaleTimeString(
                      undefined,
                      { hour: "numeric", minute: "2-digit" },
                    )}
                  </span>
                </time>
              </TableCell>
              <TableCell className={cn(dataTableCellClass, "tabular-nums")}>
                <span className="block font-medium text-zinc-950">
                  {entry.attempt.percentage}%
                </span>
                <span className="text-[11px] text-zinc-500">
                  {entry.attempt.score}/{entry.attempt.total}
                </span>
              </TableCell>
              <TableCell
                className={cn(dataTableCellClass, "tabular-nums text-zinc-600")}
              >
                {entry.attempt.incorrectCount}
              </TableCell>
              <TableCell className={dataTableCellClass}>
                <AttemptResultBadge
                  passed={attemptPassed(entry.attempt, entry.targetScore)}
                />
              </TableCell>
              <TableCell className={dataTableCellClass}>
                <div className="flex items-center justify-end gap-1">
                  {!entry.archived && entry.quizAvailable && (
                    <IconActionButton
                      icon={RotateCcw}
                      label="Retake quiz"
                      className="shrink-0 text-zinc-500"
                      onClick={() => onRetake(entry)}
                    />
                  )}
                  <IconActionButton
                    icon={Trash2}
                    label={
                      deletingAttemptId === entry.attempt.id
                        ? "Deleting attempt…"
                        : "Delete attempt"
                    }
                    disabled={deletingAttemptId !== null}
                    className="shrink-0 text-zinc-500 hover:bg-red-50 hover:text-red-700 focus-visible:bg-red-50 focus-visible:text-red-700"
                    onClick={() => onDelete(entry)}
                  />
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableWorkspace>
  );
}
