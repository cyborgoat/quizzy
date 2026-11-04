import { useNavigate } from "@tanstack/react-router";
import {
  type ColumnDef,
  flexRender,
  type PaginationState,
  type SortingState,
  useTable,
} from "@tanstack/react-table";
import { FolderOpen, Plus, RefreshCw } from "lucide-react";
import { useCallback, useDeferredValue, useMemo, useState } from "react";
import { PageShell } from "@/components/layout/PageShell";
import { PageHeader } from "@/components/layout/PageHeader";
import { KnowledgeFavoriteButton } from "@/components/knowledge/KnowledgeFavoriteButton";
import { Route } from "@/routes/_app/knowledge/index";
import {
  DataTableColumnFilterHeader,
  DataTableColumnHeader,
  DataTableNumericCell,
  DataTableSortableHeader,
  DataTableTruncatedCell,
  dataTableCellClass,
  dataTableHeadClass,
  dataTableCellMutedClass,
  dataTableFixedCellClass,
  dataTableFixedLayoutClass,
} from "@/components/ui/data-table";
import { DataTablePaginationFooter } from "@/components/ui/data-table-pagination";
import { IconActionButton } from "@/components/ui/icon-action-button";
import { Label } from "@/components/ui/label";
import { SearchField } from "@/components/ui/search-field";
import {
  TableWorkspace,
  tableWorkspaceHeaderClass,
  tableWorkspaceScrollClass,
} from "@/components/ui/table-workspace";
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
  title: "w-[calc(36%_-_3rem)]",
  tags: "w-[26%]",
  links: "w-[14%]",
  updatedAt: "w-[24%]",
  favorite: "w-12 min-w-12 max-w-none overflow-visible",
};

const favoriteColumnHeadClass = "px-2 py-2";
const favoriteColumnCellClass =
  "max-w-none overflow-visible px-2 py-2 text-center align-middle";

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

  const allTags = useMemo(
    () => collectKnowledgeTags(library.items),
    [library.items],
  );

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
        cell: ({ row }) => (
          <DataTableTruncatedCell value={row.original.title} />
        ),
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
    <PageShell layout="workspace">
      <PageHeader
        title="Knowledge Base"
        description="Your notes, concepts, and linked quiz references."
        className="shrink-0 [@media(max-height:699px)]:[&>div>p:first-of-type]:hidden"
        actions={
          <>
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
              <RefreshCw
                className={cn("size-4", isRefreshing && "animate-spin")}
              />
            </IconActionButton>
            <IconActionButton
              icon={Plus}
              label="New note"
              variant="default"
              onClick={handleNewNote}
              disabled={!library.directoryAvailable}
            />
          </>
        }
      />

      <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-auto">
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
              className="max-h-[20dvh] shrink-0 overflow-auto"
            />

            {library.items.length > 0 && (
              <SearchField
                value={searchQuery}
                onChange={setSearchQuery}
                placeholder="Search notes"
                pending={isSearchPending}
                className="shrink-0 py-1"
              />
            )}

            {library.items.length === 0 ? (
              <EmptyState
                title="No knowledge notes yet"
                description="Create your first note to capture concepts and link them to quiz questions."
                actionLabel="New note"
                onAction={handleNewNote}
              />
            ) : (
              <TableWorkspace
                title="Notes"
                count={filteredItems.length}
                actions={
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
                }
                footer={
                  <DataTablePaginationFooter
                    table={table}
                    pageSizeOptions={MISTAKE_LOG_PAGE_SIZE_OPTIONS}
                  />
                }
                className={cn(
                  "transition-opacity motion-reduce:transition-none",
                  isSearchPending && "opacity-70",
                )}
              >
                <Table
                  key={`${filterResetKey}:${pagination.pageIndex}:${pagination.pageSize}`}
                  className={cn(dataTableFixedLayoutClass, "min-w-[36rem]")}
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
                              knowledgeColumnWidth(header.column.id),

                              header.column.id === "favorite" &&
                                favoriteColumnHeadClass,
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
                    {filteredItems.length === 0 && (
                      <TableRow className="hover:bg-transparent">
                        <TableCell
                          colSpan={columns.length}
                          className="px-3 py-8 text-center text-sm text-zinc-500"
                        >
                          {noMatchingNotesMessage(
                            showFavoritesOnly,
                            isSearchActive,
                            selectedTag,
                          )}
                        </TableCell>
                      </TableRow>
                    )}
                    {table.getRowModel().rows.map((row) => (
                      <TableRow
                        key={row.id}
                        className="cursor-pointer hover:bg-zinc-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-zinc-500"
                        tabIndex={0}
                        onKeyDown={(event) => {
                          if (
                            event.target === event.currentTarget &&
                            (event.key === "Enter" || event.key === " ")
                          ) {
                            event.preventDefault();
                            openNote(row.original);
                          }
                        }}
                        onClick={() => openNote(row.original)}
                      >
                        {row.getAllCells().map((cell) => (
                          <TableCell
                            key={cell.id}
                            className={cn(
                              dataTableCellClass,
                              dataTableFixedCellClass,
                              knowledgeColumnWidth(cell.column.id),

                              cell.column.id === "favorite" &&
                                favoriteColumnCellClass,
                            )}
                          >
                            {flexRender(
                              cell.column.columnDef.cell,
                              cell.getContext(),
                            )}
                          </TableCell>
                        ))}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableWorkspace>
            )}
          </>
        </WorkingDirectoryGate>
      </div>
    </PageShell>
  );
}
