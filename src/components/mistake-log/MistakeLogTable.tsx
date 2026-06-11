import { flexRender, type Table as TanStackTable } from "@tanstack/react-table";
import { ChevronDown } from "lucide-react";
import {
  dataTableCellClass,
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
import { mistakeColumnWidth } from "@/lib/mistakeLogDisplay";
import { questionLinkKey } from "@/lib/knowledgeLinks";
import { MISTAKE_LOG_PAGE_SIZE_OPTIONS } from "@/lib/dataTablePagination";
import { cn } from "@/lib/utils";
import type { MistakeEntry } from "@/types/mistakeLog";

export function MistakeLogTable({
  table,
  activeEntry,
  entryCount,
  expanded,
  onExpandedChange,
  onSelectEntry,
}: {
  table: TanStackTable<MistakeEntry>;
  activeEntry: MistakeEntry | null;
  entryCount: number;
  expanded: boolean;
  onExpandedChange: (expanded: boolean) => void;
  onSelectEntry: (entry: MistakeEntry) => void;
}) {
  return (
    <div className="overflow-hidden rounded-lg border border-zinc-200 bg-white">
      <button
        type="button"
        className="flex w-full items-center gap-2 border-b border-zinc-200/55 px-3 py-2 text-left transition-colors hover:bg-zinc-50"
        aria-expanded={expanded}
        onClick={() => onExpandedChange(!expanded)}
      >
        <ChevronDown
          className={cn(
            "size-4 shrink-0 text-zinc-500 transition-transform duration-200",
            expanded && "rotate-180",
          )}
        />
        <span className="text-sm font-semibold text-zinc-950">Mistake list</span>
        <span className="text-xs text-zinc-500">({entryCount})</span>
      </button>

      {expanded && (
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
                    activeEntry !== null &&
                    questionLinkKey(row.original.quizId, row.original.questionId) ===
                      questionLinkKey(activeEntry.quizId, activeEntry.questionId);

                  return (
                    <TableRow
                      key={row.id}
                      className={cn("cursor-pointer", isActive && "bg-zinc-50")}
                      data-state={isActive ? "selected" : undefined}
                      onClick={() => onSelectEntry(row.original)}
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
  );
}
