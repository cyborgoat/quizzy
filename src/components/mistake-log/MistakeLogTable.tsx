import {
  flexRender,
  type ReactTable as TanStackTable,
} from "@tanstack/react-table";
import {
  dataTableCellClass,
  dataTableFixedCellClass,
  dataTableFixedLayoutClass,
  dataTableHeadClass,
} from "@/components/ui/data-table";
import { Button } from "@/components/ui/button";
import { DataTablePaginationFooter } from "@/components/ui/data-table-pagination";
import { tableWorkspaceHeaderClass, tableWorkspaceScrollClass } from "@/components/ui/table-workspace";
import { ChevronDown } from "lucide-react";
import { useId, useEffect, useRef } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { mistakeColumnWidth } from "@/lib/mistakeLogDisplay";
import { questionLinkKey } from "@/lib/knowledgeLinks";
import { MISTAKE_LOG_PAGE_SIZE_OPTIONS } from "@/lib/dataTablePagination";
import type { AppTableFeatures } from "@/lib/tableFeatures";
import { cn } from "@/lib/utils";
import type { MistakeEntry } from "@/types/mistakeLog";

export function MistakeLogTable({
  table,
  activeEntry,
  entryCount,
  expanded,
  onExpandedChange,
  onSelectEntry,
  emptyMessage,
  onClearFilters,
}: {
  table: TanStackTable<AppTableFeatures, MistakeEntry>;
  activeEntry: MistakeEntry | null;
  entryCount: number;
  expanded: boolean;
  onExpandedChange: (expanded: boolean) => void;
  onSelectEntry: (entry: MistakeEntry) => void;
  /** Shown in place of rows when the filters hide every mistake. */
  emptyMessage: string | null;
  onClearFilters: () => void;
}) {
  const contentId = useId();
  const listRef = useRef<HTMLDivElement>(null);
  const activeKey = activeEntry
    ? questionLinkKey(activeEntry.quizId, activeEntry.questionId)
    : null;
  const pageIndex = table.state.pagination.pageIndex;

  useEffect(() => {
    const container = listRef.current?.firstElementChild;
    const selected = container?.querySelector<HTMLElement>(
      '[data-state="selected"]',
    );
    if (!container || !selected) return;
    const bounds = container.getBoundingClientRect();
    const row = selected.getBoundingClientRect();
    const headerHeight =
      container.querySelector("thead")?.getBoundingClientRect().height ?? 0;
    if (row.top < bounds.top + headerHeight)
      container.scrollTop -= bounds.top + headerHeight - row.top;
    else if (row.bottom > bounds.bottom)
      container.scrollTop += row.bottom - bounds.bottom;
  }, [activeKey, pageIndex, expanded]);

  return (
    <section
      aria-label="Mistake list"
      className={cn(
        "flex shrink-0 flex-col border-b border-zinc-200",
        expanded && "h-[clamp(max(160px,11rem),30dvh,max(260px,11rem))]",
      )}
    >
      <h2 className="shrink-0">
        <button
          type="button"
          aria-expanded={expanded}
          aria-controls={contentId}
          onClick={() => onExpandedChange(!expanded)}
          className="flex w-full items-center gap-2 rounded-sm py-2 text-left text-xs font-semibold text-zinc-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500"
        >
          <ChevronDown
            className={cn(
              "size-3.5 transition-transform motion-reduce:transition-none",
              !expanded && "-rotate-90",
            )}
            aria-hidden="true"
          />
          Mistake list{" "}
          <span className="font-normal tabular-nums text-zinc-500">
            ({entryCount})
          </span>
        </button>
      </h2>
      <div
        id={contentId}
        hidden={!expanded}
        className={cn("min-h-0 flex-1 flex-col", expanded && "flex")}
      >
        <div ref={listRef} className="min-h-0 flex-1">
          <Table
            className={cn(dataTableFixedLayoutClass, "min-w-[60rem]")}
            containerClassName={tableWorkspaceScrollClass}
          >
            <TableHeader className={tableWorkspaceHeaderClass}>
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
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext(),
                          )}
                    </TableHead>
                  ))}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {emptyMessage && (
                <TableRow className="hover:bg-transparent">
                  <TableCell
                    colSpan={table.getAllLeafColumns().length}
                    className="px-3 py-8 text-center text-sm text-zinc-500"
                  >
                    <p>{emptyMessage}</p>
                    <Button
                      variant="outline"
                      size="sm"
                      className="mt-3"
                      onClick={onClearFilters}
                    >
                      Clear filters
                    </Button>
                  </TableCell>
                </TableRow>
              )}
              {table.getRowModel().rows.map((row) => {
                const isActive =
                  activeEntry !== null &&
                  questionLinkKey(
                    row.original.quizId,
                    row.original.questionId,
                  ) ===
                    questionLinkKey(activeEntry.quizId, activeEntry.questionId);

                return (
                  <TableRow
                    key={row.id}
                    className={cn(
                      "cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-zinc-500",
                      isActive &&
                        "bg-zinc-100 data-[state=selected]:bg-zinc-100",
                    )}
                    tabIndex={0}
                    aria-selected={isActive}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        onSelectEntry(row.original);
                      }
                    }}
                    data-state={isActive ? "selected" : undefined}
                    onClick={() => onSelectEntry(row.original)}
                  >
                    {row.getAllCells().map((cell) => (
                      <TableCell
                        key={cell.id}
                        className={cn(
                          dataTableCellClass,
                          dataTableFixedCellClass,
                          mistakeColumnWidth(cell.column.id),
                        )}
                      >
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext(),
                        )}
                      </TableCell>
                    ))}
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
        <div className="shrink-0 overflow-x-auto [&>div]:min-w-max">
          <DataTablePaginationFooter
            table={table}
            pageSizeOptions={MISTAKE_LOG_PAGE_SIZE_OPTIONS}
          />
        </div>
      </div>
    </section>
  );
}
