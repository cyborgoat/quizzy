import { useNavigate } from "@tanstack/react-router";
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
import { ChevronDown, FolderOpen, Plus, RefreshCw, Search } from "lucide-react";
import { useCallback, useDeferredValue, useEffect, useMemo, useState } from "react";
import { PageShell } from "@/components/layout/PageShell";
import { Route } from "@/routes/_app/knowledge/index";
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
import { IconActionButton } from "@/components/ui/icon-action-button";
import { Input } from "@/components/ui/input";
import { EmptyState } from "@/components/quiz/EmptyState";
import { InvalidFileReportsAlert } from "@/components/quiz/InvalidFileReportsAlert";
import { WorkingDirectoryGate } from "@/components/quiz/WorkingDirectoryGate";
import { useKnowledgeLibrary } from "@/hooks/useKnowledgeLibrary";
import { useLibraryRefresh } from "@/hooks/useLibraryRefresh";
import { MISTAKE_LOG_PAGE_SIZE_OPTIONS } from "@/lib/dataTablePagination";
import { formatShortDate } from "@/lib/formatDate";
import { buildKnowledgeDraft, stashKnowledgeDraft } from "@/lib/knowledgeDraft";
import { searchKnowledgeItems } from "@/lib/knowledgeSearch";
import { collectKnowledgeTags } from "@/lib/knowledgeTags";
import { cn } from "@/lib/utils";
import type { KnowledgeItem } from "@/types/knowledge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

function formatTagsLabel(tags: string[]) {
  if (tags.length === 0) return "—";
  return tags.join(", ");
}

const KNOWLEDGE_COLUMN_WIDTHS: Record<string, string> = {
  title: "w-[36%]",
  tags: "w-[26%]",
  links: "w-[14%]",
  updatedAt: "w-[24%]",
};

function knowledgeColumnWidth(columnId: string) {
  return KNOWLEDGE_COLUMN_WIDTHS[columnId] ?? "";
}

const coreRowModel = getCoreRowModel();
const sortedRowModel = getSortedRowModel();
const paginationRowModel = getPaginationRowModel();

export function KnowledgeBasePage() {
  const { tag: tagFilter } = Route.useSearch();
  const navigate = useNavigate();
  const library = useKnowledgeLibrary();
  const [searchQuery, setSearchQuery] = useState("");
  const deferredSearchQuery = useDeferredValue(searchQuery);
  const selectedTag = tagFilter ?? "all";
  const [sorting, setSorting] = useState<SortingState>([
    { id: "updatedAt", desc: true },
  ]);
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 10,
  });
  const [isNotesListExpanded, setIsNotesListExpanded] = useState(true);
  const { isRefreshing, handleRefresh } = useLibraryRefresh(
    () => library.refresh(),
    "Knowledge base refreshed.",
  );

  const allTags = useMemo(() => collectKnowledgeTags(library.items), [library.items]);

  const tagFilterOptions = useMemo(
    () => [
      { value: "all", label: "All tags" },
      ...allTags.map((tag) => ({ value: tag, label: tag })),
    ],
    [allTags],
  );

  const isSearchActive = deferredSearchQuery.trim().length > 0;
  const isSearchPending = searchQuery !== deferredSearchQuery;

  const filteredItems = useMemo(
    () =>
      searchKnowledgeItems(library.items, deferredSearchQuery, {
        tagFilter: selectedTag,
      }),
    [library.items, deferredSearchQuery, selectedTag],
  );

  useEffect(() => {
    setPagination((prev) => ({ ...prev, pageIndex: 0 }));
  }, [deferredSearchQuery, selectedTag]);

  const handleTagFilterChange = useCallback(
    (value: string) => {
      void navigate({
        to: "/knowledge",
        search: value === "all" ? {} : { tag: value },
        replace: true,
      });
    },
    [navigate],
  );

  const columns = useMemo<ColumnDef<KnowledgeItem>[]>(
    () => [
      {
        accessorKey: "title",
        header: () => <DataTableColumnHeader label="Title" />,
        cell: ({ row }) => <DataTableTruncatedCell value={row.original.title} />,
      },
      {
        accessorKey: "tags",
        header: () => (
          <DataTableColumnFilterHeader
            label="Tags"
            filterValue={selectedTag}
            menuLabel="Filter by tag"
            options={tagFilterOptions}
            onFilterChange={handleTagFilterChange}
          />
        ),
        cell: ({ row }) => {
          const tagsLabel = formatTagsLabel(row.original.tags);
          return <DataTableTruncatedCell value={tagsLabel} variant="muted" />;
        },
      },
      {
        id: "links",
        accessorFn: (row) => row.linkedQuizQuestions.length,
        header: ({ column }) => (
          <DataTableSortableHeader label="Links" column={column} />
        ),
        cell: ({ row }) => (
          <DataTableNumericCell
            value={row.original.linkedQuizQuestions.length}
            mutedWhenZero
          />
        ),
      },
      {
        accessorKey: "updatedAt",
        header: ({ column }) => (
          <DataTableSortableHeader label="Updated" column={column} />
        ),
        cell: ({ row }) => (
          <span className={dataTableCellMutedClass}>
            {formatShortDate(row.original.updatedAt)}
          </span>
        ),
      },
    ],
    [handleTagFilterChange, selectedTag, tagFilterOptions],
  );

  const table = useReactTable({
    data: filteredItems,
    columns,
    state: { sorting: isSearchActive ? [] : sorting, pagination },
    onSortingChange: setSorting,
    onPaginationChange: setPagination,
    getCoreRowModel: coreRowModel,
    getSortedRowModel: sortedRowModel,
    getPaginationRowModel: paginationRowModel,
    manualSorting: isSearchActive,
  });

  function handleNewNote() {
    const draft = buildKnowledgeDraft();
    stashKnowledgeDraft(draft);
    navigate({
      to: "/knowledge/$knowledgeId",
      params: { knowledgeId: draft.id },
      search: { edit: "1" },
    });
  }

  function openNote(item: KnowledgeItem) {
    navigate({
      to: "/knowledge/$knowledgeId",
      params: { knowledgeId: item.id },
    });
  }

  return (
    <PageShell className="space-y-3 overflow-x-clip">
      <div className="flex min-w-0 flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <h1 className="text-xl font-bold tracking-tight text-zinc-950 lg:text-2xl">
            Knowledge Base
          </h1>
          <p className="mt-0.5 text-sm text-zinc-500">
            Markdown notes in your knowledge-base folder. Link them to quiz questions and review
            them from the Mistake Log.
          </p>
        </div>
        <div className="flex shrink-0 flex-wrap items-center gap-1">
          <IconActionButton
            icon={FolderOpen}
            label="Open folder"
            variant="outline"
            onClick={() => void library.openKnowledgeFolder()}
            disabled={!library.directoryAvailable}
          />
          <IconActionButton
            icon={RefreshCw}
            label="Refresh"
            variant="outline"
            onClick={() => void handleRefresh()}
            disabled={isRefreshing}
          >
            <RefreshCw className={cn("size-4", isRefreshing && "animate-spin")} />
          </IconActionButton>
          <IconActionButton
            icon={Plus}
            label="New note"
            variant="default"
            onClick={handleNewNote}
            disabled={!library.directoryAvailable}
          />
        </div>
      </div>

      <WorkingDirectoryGate
        isLoading={library.isLoading}
        directoryPath={library.directoryPath}
        directoryAvailable={library.directoryAvailable}
        loadingMessage="Loading knowledge base…"
        noDirectoryTitle="No working directory set"
        noDirectoryDescription="Choose a working directory in Settings to store knowledge notes."
        unavailableTitle="Working directory unavailable"
        unavailableDescription="Quizzy could not access the configured directory. You can update it in Settings."
        onOpenSettings={() => navigate({ to: "/settings" })}
      >
        <>
          <InvalidFileReportsAlert
            reports={library.invalidReports}
            entityLabel="knowledge"
          />

          {library.items.length > 0 && (
            <div className="flex items-center gap-2 rounded-lg border border-zinc-200 bg-white px-3 py-2">
              <Search className="size-4 shrink-0 text-zinc-400" aria-hidden="true" />
              <Input
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Search notes"
                aria-label="Search notes"
                className="h-7 border-0 bg-transparent px-0 text-sm shadow-none focus-visible:ring-0"
              />
            </div>
          )}

          {library.items.length === 0 ? (
            <EmptyState
              title="No knowledge notes yet"
              description="Create your first note to capture concepts and link them to quiz questions."
              actionLabel="New note"
              onAction={handleNewNote}
            />
          ) : filteredItems.length === 0 ? (
            <EmptyState
              title="No notes match your filters"
              description="Try another search term or clear the tag filter."
              actionLabel="Clear"
              actionVariant="outline"
              onAction={() => {
                setSearchQuery("");
                void navigate({ to: "/knowledge", search: {}, replace: true });
              }}
            />
          ) : (
            <div
              className={cn(
                "overflow-hidden rounded-lg border border-zinc-200 bg-white transition-opacity",
                isSearchPending && "opacity-70",
              )}
            >
              <button
                type="button"
                className="flex w-full items-center gap-2 border-b border-zinc-200/55 px-3 py-2 text-left transition-colors hover:bg-zinc-50"
                aria-expanded={isNotesListExpanded}
                onClick={() => setIsNotesListExpanded((expanded) => !expanded)}
              >
                <ChevronDown
                  className={cn(
                    "size-4 shrink-0 text-zinc-500 transition-transform duration-200",
                    isNotesListExpanded && "rotate-180",
                  )}
                />
                <span className="text-sm font-semibold text-zinc-950">Notes</span>
                <span className="text-xs text-zinc-500">({filteredItems.length})</span>
              </button>

              {isNotesListExpanded && (
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
                                  knowledgeColumnWidth(header.column.id),
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
                        {table.getRowModel().rows.map((row) => (
                          <TableRow
                            key={row.id}
                            className="cursor-pointer"
                            onClick={() => openNote(row.original)}
                          >
                            {row.getVisibleCells().map((cell) => (
                              <TableCell
                                key={cell.id}
                                className={cn(
                                  dataTableCellClass,
                                  dataTableFixedCellClass,
                                  knowledgeColumnWidth(cell.column.id),
                                )}
                              >
                                {flexRender(cell.column.columnDef.cell, cell.getContext())}
                              </TableCell>
                            ))}
                          </TableRow>
                        ))}
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
          )}
        </>
      </WorkingDirectoryGate>
    </PageShell>
  );
}
