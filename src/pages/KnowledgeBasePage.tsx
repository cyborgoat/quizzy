import { Link, useNavigate } from "@tanstack/react-router";
import {
  type ColumnDef,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  type SortingState,
  useReactTable,
} from "@tanstack/react-table";
import { FolderOpen, Plus, RefreshCw, Search } from "lucide-react";
import { useMemo, useState } from "react";
import { PageShell } from "@/components/layout/PageShell";
import { Route } from "@/routes/_app/knowledge/index";
import { Badge } from "@/components/ui/badge";
import {
  DataTableSortableHeader,
  dataTableCellMutedClass,
  dataTableCellTextClass,
} from "@/components/ui/data-table";
import { IconActionButton } from "@/components/ui/icon-action-button";
import { EmptyState } from "@/components/quiz/EmptyState";
import { InvalidFileReportsAlert } from "@/components/quiz/InvalidFileReportsAlert";
import { WorkingDirectoryGate } from "@/components/quiz/WorkingDirectoryGate";
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useKnowledgeLibrary } from "@/hooks/useKnowledgeLibrary";
import { useLibraryRefresh } from "@/hooks/useLibraryRefresh";
import { formatShortDate } from "@/lib/formatDate";
import { buildKnowledgeDraft, stashKnowledgeDraft } from "@/lib/knowledgeDraft";
import type { KnowledgeItem } from "@/types/knowledge";

export function KnowledgeBasePage() {
  const { tag: tagFilter } = Route.useSearch();
  const navigate = useNavigate();
  const library = useKnowledgeLibrary();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTag, setSelectedTag] = useState(tagFilter ?? "all");
  const [sorting, setSorting] = useState<SortingState>([
    { id: "updatedAt", desc: true },
  ]);
  const { isRefreshing, handleRefresh } = useLibraryRefresh(
    () => library.refresh(),
    "Knowledge base refreshed.",
  );

  const allTags = useMemo(() => {
    const tags = new Set<string>();
    for (const item of library.items) {
      for (const tag of item.tags) tags.add(tag);
    }
    return [...tags].sort();
  }, [library.items]);

  const filteredItems = useMemo(() => {
    const normalized = searchQuery.trim().toLowerCase();
    return library.items.filter((item) => {
      if (selectedTag !== "all" && !item.tags.includes(selectedTag)) return false;
      if (!normalized) return true;
      const haystack = `${item.title} ${item.tags.join(" ")} ${item.content}`.toLowerCase();
      return haystack.includes(normalized);
    });
  }, [library.items, searchQuery, selectedTag]);

  const columns = useMemo<ColumnDef<KnowledgeItem>[]>(
    () => [
      {
        accessorKey: "title",
        header: "Title",
        cell: ({ row }) => (
          <div className="min-w-0 max-w-full">
            <span className={`${dataTableCellTextClass} truncate font-medium`}>
              {row.original.title}
            </span>
            <span className={`${dataTableCellMutedClass} mt-0.5 truncate text-zinc-500`}>
              {row.original.fileName}
            </span>
          </div>
        ),
      },
      {
        accessorKey: "tags",
        header: "Tags",
        cell: ({ row }) => (
          <div className="flex min-w-0 max-w-full flex-wrap gap-1">
            {row.original.tags.length === 0 ? (
              <span className="text-xs text-zinc-400">—</span>
            ) : (
              row.original.tags.map((tag) => (
                <Badge key={tag} className="max-w-full truncate">
                  {tag}
                </Badge>
              ))
            )}
          </div>
        ),
      },
      {
        id: "links",
        accessorFn: (row) => row.linkedQuizQuestions.length,
        header: "Links",
        cell: ({ row }) => (
          <span className={dataTableCellMutedClass}>
            {row.original.linkedQuizQuestions.length} Q
            {row.original.linkedQuizQuestions.length === 1 ? "" : "s"}
          </span>
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
    [],
  );

  const table = useReactTable({
    data: filteredItems,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
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

  return (
    <PageShell className="overflow-x-clip">
      <div className="min-w-0 w-full max-w-full">
      <div className="mb-4 flex min-w-0 flex-col gap-3 sm:flex-row sm:items-end sm:justify-between lg:mb-5">
        <div className="min-w-0 flex-1">
          <h1 className="text-2xl font-bold tracking-tight text-zinc-950 xl:text-3xl">
            Knowledge Base
          </h1>
          <p className="mt-1 text-sm wrap-break-word text-zinc-500 lg:text-base">
            Markdown notes live in the knowledge-base folder inside your working directory. Link them
            to quiz questions and review them from the Mistake Log.
          </p>
        </div>
        <div className="flex shrink-0 flex-wrap items-center gap-2">
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
            <RefreshCw className={`size-4 ${isRefreshing ? "animate-spin" : ""}`} />
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
            className="mb-4 min-w-0 lg:mb-5"
          />

          <div className="mb-4 flex min-w-0 flex-col gap-3 rounded-lg border border-zinc-200 bg-white p-3 sm:flex-row sm:items-end lg:mb-5 lg:p-4">
            <div className="min-w-0 flex-1">
              <Label htmlFor="knowledge-search">Search</Label>
              <div className="mt-1.5 flex items-center gap-2 rounded-md border border-zinc-200 px-3">
                <Search className="size-4 text-zinc-400" />
                <Input
                  id="knowledge-search"
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  placeholder="Search notes"
                  className="h-8 border-0 px-0 shadow-none focus-visible:ring-0"
                />
              </div>
            </div>
            <div className="min-w-0 sm:w-48">
              <Label htmlFor="knowledge-tag-filter">Tag</Label>
              <Select value={selectedTag} onValueChange={setSelectedTag}>
                <SelectTrigger id="knowledge-tag-filter" className="mt-1.5">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All tags</SelectItem>
                  {allTags.map((tag) => (
                    <SelectItem key={tag} value={tag}>
                      {tag}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

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
              actionLabel="Clear filters"
              actionVariant="outline"
              onAction={() => {
                setSearchQuery("");
                setSelectedTag("all");
              }}
            />
          ) : (
            <div className="min-w-0 w-full max-w-full overflow-x-auto rounded-lg border border-zinc-200 bg-white">
              <Table className="table-fixed w-full min-w-0">
                <TableHeader>
                  {table.getHeaderGroups().map((headerGroup) => (
                    <TableRow key={headerGroup.id}>
                      {headerGroup.headers.map((header) => (
                        <TableHead
                          key={header.id}
                          className={
                            header.column.id === "title"
                              ? "w-[38%]"
                              : header.column.id === "tags"
                                ? "w-[28%]"
                                : header.column.id === "links"
                                  ? "w-[14%]"
                                  : "w-[20%]"
                          }
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
                  {table.getRowModel().rows.map((row) => (
                    <TableRow key={row.id} className="cursor-pointer">
                      {row.getVisibleCells().map((cell) => (
                        <TableCell key={cell.id} className="min-w-0 max-w-0">
                          <Link
                            to="/knowledge/$knowledgeId"
                            params={{ knowledgeId: row.original.id }}
                            className="block min-w-0"
                          >
                            {flexRender(cell.column.columnDef.cell, cell.getContext())}
                          </Link>
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </>
      </WorkingDirectoryGate>

      </div>
    </PageShell>
  );
}
