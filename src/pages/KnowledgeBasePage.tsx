import { useNavigate } from "@tanstack/react-router";
import {
  type ColumnDef,
  flexRender,
  type PaginationState,
  type SortingState,
  useTable,
} from "@tanstack/react-table";
import { FolderOpen, Plus, RefreshCw, Search } from "lucide-react";
import { useCallback, useDeferredValue, useMemo, useState } from "react";
import { PageShell } from "@/components/layout/PageShell";
import { KnowledgeFavoriteButton } from "@/components/knowledge/KnowledgeFavoriteButton";
import { Route } from "@/routes/_app/knowledge/index";
import {
  DataTableColumnFilterHeader,
  DataTableColumnHeader,
  DataTableNumericCell,
  DataTableSortableHeader,
  DataTableTruncatedCell,
  dataTableCellMutedClass,
  dataTableFixedCellClass,
  dataTableFixedLayoutClass,
} from "@/components/ui/data-table";
import { DataTablePaginationFooter } from "@/components/ui/data-table-pagination";
import { IconActionButton } from "@/components/ui/icon-action-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
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
import { appTableFeatures, type AppTableFeatures } from "@/lib/tableFeatures";
import {
  mutedCountTextClassName,
  pageDescriptionClassName,
  pageTitleClassName,
  panelHeadingClassName,
} from "@/components/ui/typography";
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
  favorite: "w-10",
};

const favoriteColumnHeadClass = "px-2 py-2 pl-2 pr-0";
const favoriteColumnCellClass = "px-2 py-2 pl-2 pr-0 text-center align-middle";
const knowledgeTableInsetClass = "px-4";
const knowledgeTableHeadClass = "h-auto px-4 py-2 text-left align-middle";
const knowledgeTableCellClass = "px-4 py-2 text-left align-middle";
const knowledgeTableEdgeStartClass = "pl-0";

function knowledgeColumnWidth(columnId: string) {
  return KNOWLEDGE_COLUMN_WIDTHS[columnId] ?? "";
}

function noMatchingNotesMessage(
  showFavoritesOnly: boolean,
  isSearchActive: boolean,
  selectedTag: string,
) {
  if (showFavoritesOnly) {
    if (isSearchActive && selectedTag !== "all") {
      return "No favorite notes match your search and tag filter.";
    }
    if (isSearchActive) {
      return "No favorite notes match your search.";
    }
    if (selectedTag !== "all") {
      return "No favorite notes match the selected tag.";
    }
    return "No favorite notes yet. Star notes from the list or detail page.";
  }

  if (isSearchActive && selectedTag !== "all") {
    return "No notes match your search and tag filter.";
  }
  if (isSearchActive) {
    return "No notes match your search.";
  }
  if (selectedTag !== "all") {
    return "No notes match the selected tag.";
  }

  return "No matching notes.";
}

export function KnowledgeBasePage() {
  const { tag: tagFilter } = Route.useSearch();
  const navigate = useNavigate();
  const library = useKnowledgeLibrary();
  const { toggleFavorite } = library;
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
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
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

  const filteredItems = useMemo(() => {
    const searched = searchKnowledgeItems(library.items, deferredSearchQuery, {
      tagFilter: selectedTag,
    });
    if (!showFavoritesOnly) return searched;
    return searched.filter((item) => item.favorite);
  }, [library.items, deferredSearchQuery, selectedTag, showFavoritesOnly]);

  const filterResetKey = `${deferredSearchQuery}::${selectedTag}::${showFavoritesOnly}`;
  const [prevFilterResetKey, setPrevFilterResetKey] = useState(filterResetKey);
  if (filterResetKey !== prevFilterResetKey) {
    setPrevFilterResetKey(filterResetKey);
    setPagination((prev) => ({ ...prev, pageIndex: 0 }));
  }

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

  const columns = useMemo<ColumnDef<AppTableFeatures, KnowledgeItem>[]>(
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
      {
        id: "favorite",
        accessorKey: "favorite",
        header: () => <span className="sr-only">Favorite</span>,
        cell: ({ row }) => (
          <div className="flex justify-center">
            <KnowledgeFavoriteButton
              favorite={row.original.favorite}
              onToggle={() => void toggleFavorite(row.original)}
            />
          </div>
        ),
        enableSorting: false,
      },
    ],
    [handleTagFilterChange, selectedTag, tagFilterOptions, toggleFavorite],
  );

  const table = useTable({
    features: appTableFeatures,
    data: filteredItems,
    columns,
    state: { sorting: isSearchActive ? [] : sorting, pagination },
    onSortingChange: setSorting,
    onPaginationChange: setPagination,
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
          <h1 className={pageTitleClassName}>
            Knowledge Base
          </h1>
          <p className={pageDescriptionClassName}>
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
          ) : (
            <div
              className={cn(
                "overflow-hidden rounded-lg border border-zinc-200 bg-white transition-opacity",
                isSearchPending && "opacity-70",
              )}
            >
              <div className={knowledgeTableInsetClass}>
                <div className="flex items-center justify-between gap-3 border-b border-zinc-200/55 py-2">
                  <div className="flex items-center gap-2">
                    <span className={panelHeadingClassName}>Notes</span>
                    <span className={mutedCountTextClassName}>({filteredItems.length})</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Label
                      htmlFor="knowledge-show-favorites"
                      className="cursor-pointer text-xs font-normal text-zinc-600"
                    >
                      Show favorites
                    </Label>
                    <Switch
                      id="knowledge-show-favorites"
                      checked={showFavoritesOnly}
                      onCheckedChange={setShowFavoritesOnly}
                      aria-label="Show favorites only"
                    />
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <Table className={dataTableFixedLayoutClass}>
                    <TableHeader>
                      {table.getHeaderGroups().map((headerGroup) => (
                        <TableRow key={headerGroup.id}>
                          {headerGroup.headers.map((header) => (
                            <TableHead
                              key={header.id}
                              className={cn(
                                knowledgeTableHeadClass,
                                dataTableFixedCellClass,
                                knowledgeColumnWidth(header.column.id),
                                header.column.id === "title" && knowledgeTableEdgeStartClass,
                                header.column.id === "favorite" && favoriteColumnHeadClass,
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
                          {row.getAllCells().map((cell) => (
                            <TableCell
                              key={cell.id}
                              className={cn(
                                knowledgeTableCellClass,
                                dataTableFixedCellClass,
                                knowledgeColumnWidth(cell.column.id),
                                cell.column.id === "title" && knowledgeTableEdgeStartClass,
                                cell.column.id === "favorite" && favoriteColumnCellClass,
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
                {filteredItems.length > 0 ? (
                  <DataTablePaginationFooter
                    table={table}
                    pageSizeOptions={MISTAKE_LOG_PAGE_SIZE_OPTIONS}
                  />
                ) : (
                  <div className="border-t border-zinc-200/55 py-8 text-center">
                    <p className="text-sm text-zinc-500">
                      {noMatchingNotesMessage(showFavoritesOnly, isSearchActive, selectedTag)}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </>
      </WorkingDirectoryGate>
    </PageShell>
  );
}
