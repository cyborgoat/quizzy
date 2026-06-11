import type { Table } from "@tanstack/react-table";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  getPaginationItems,
  PAGE_JUMP_THRESHOLD,
  PAGE_SIZE_OPTIONS,
} from "@/lib/dataTablePagination";

export function DataTablePaginationFooter<TData>({
  table,
  pageSizeOptions = PAGE_SIZE_OPTIONS,
}: {
  table: Table<TData>;
  pageSizeOptions?: readonly number[];
}) {
  const pageCount = table.getPageCount();
  const pageIndex = table.getState().pagination.pageIndex;
  const pageSize = table.getState().pagination.pageSize;
  const [isEditingPageJump, setIsEditingPageJump] = useState(false);
  const [pageJumpDraft, setPageJumpDraft] = useState("");
  const pageJumpValue = isEditingPageJump ? pageJumpDraft : String(pageIndex + 1);

  function commitPageJump(value = pageJumpValue) {
    const parsed = Number(value);
    if (!Number.isFinite(parsed)) {
      setIsEditingPageJump(false);
      return;
    }

    const nextPage = Math.min(Math.max(1, Math.trunc(parsed)), pageCount);
    table.setPageIndex(nextPage - 1);
    setIsEditingPageJump(false);
  }

  return (
    <div className="shrink-0 px-2 py-1.5 sm:px-3">
      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-1.5">
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
              {getPaginationItems(pageIndex + 1, pageCount).map((item, index) => (
                <PaginationItem key={`${String(item)}-${index}`}>
                  {item === "ellipsis" ? (
                    <PaginationEllipsis />
                  ) : (
                    <PaginationLink
                      isActive={item === pageIndex + 1}
                      onClick={() => table.setPageIndex(item - 1)}
                    >
                      {item}
                    </PaginationLink>
                  )}
                </PaginationItem>
              ))}
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
          <div className="flex items-center gap-3">
            {pageCount >= PAGE_JUMP_THRESHOLD && (
              <div className="flex items-center gap-1.5">
                <Label htmlFor="go-to-page" className="text-[11px] text-zinc-500">
                  Go to page
                </Label>
                <Input
                  id="go-to-page"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  className="h-6 w-12 border-0 bg-zinc-100 px-1.5 text-center text-[11px] shadow-none focus-visible:ring-1"
                  value={pageJumpValue}
                  onFocus={() => {
                    setIsEditingPageJump(true);
                    setPageJumpDraft(String(pageIndex + 1));
                  }}
                  onChange={(event) => {
                    const digitsOnly = event.target.value.replace(/\D+/g, "");
                    setPageJumpDraft(digitsOnly);
                  }}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      event.preventDefault();
                      commitPageJump(pageJumpDraft);
                    }
                  }}
                  onBlur={() => commitPageJump(pageJumpDraft)}
                  aria-label="Go to page"
                />
              </div>
            )}

            <div className="flex items-center gap-1.5">
              <Label htmlFor="rows-per-page" className="text-[11px] text-zinc-500">
                Rows per page
              </Label>
              <Select
                value={String(pageSize)}
                onValueChange={(value) => {
                  table.setPageSize(Number(value));
                  table.setPageIndex(0);
                }}
              >
                <SelectTrigger id="rows-per-page" className="h-6 w-14 border-0 bg-zinc-100 px-1.5 text-[11px] shadow-none focus:ring-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {pageSizeOptions.map((size) => (
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
  );
}
