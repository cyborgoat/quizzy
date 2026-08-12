import { flexRender, type ReactTable as TanStackTable } from "@tanstack/react-table";
import {
  dataTableCellClass,
  dataTableFixedCellClass,
  dataTableFixedLayoutClass,
  dataTableHeadClass,
} from "@/components/ui/data-table";
import { DataTablePaginationFooter } from "@/components/ui/data-table-pagination";
import { CollapsibleSectionPanel } from "@/components/ui/section-panel";
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
}: {
  table: TanStackTable<AppTableFeatures, MistakeEntry>;
  activeEntry: MistakeEntry | null;
  entryCount: number;
  expanded: boolean;
  onExpandedChange: (expanded: boolean) => void;
  onSelectEntry: (entry: MistakeEntry) => void;
}) {
  return (
    <CollapsibleSectionPanel
      title="Mistake list"
      count={entryCount}
      expanded={expanded}
      onExpandedChange={onExpandedChange}
    >
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
                      {row.getAllCells().map((cell) => (
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
    </CollapsibleSectionPanel>
  );
}
