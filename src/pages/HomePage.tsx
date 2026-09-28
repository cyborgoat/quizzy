import { open } from "@tauri-apps/plugin-dialog";
import {
  ArrowDownWideNarrow,
  ArrowUpNarrowWide,
  FileUp,
  FolderOpen,
  RefreshCw,
} from "lucide-react";
import { useDeferredValue, useMemo, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { PageShell } from "@/components/layout/PageShell";
import { QuizDetailsDialog } from "@/components/quiz/QuizDetailsDialog";
import { IconActionButton } from "@/components/ui/icon-action-button";
import { SearchField } from "@/components/ui/search-field";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { pageDescriptionClassName, pageTitleClassName } from "@/components/ui/typography";
import { EmptyState } from "@/components/quiz/EmptyState";
import { InvalidFileReportsAlert } from "@/components/quiz/InvalidFileReportsAlert";
import { QuizList } from "@/components/quiz/QuizList";
import { WorkingDirectoryGate } from "@/components/quiz/WorkingDirectoryGate";
import { useGoals } from "@/hooks/useGoals";
import { useLibraryRefresh } from "@/hooks/useLibraryRefresh";
import { useQuizLibrary } from "@/hooks/useQuizLibrary";
import { useQuizLibrarySort } from "@/hooks/useQuizLibrarySort";
import { useUserProfile } from "@/hooks/useUserProfile";
import { errorMessage } from "@/lib/native";
import {
  filterQuizSources,
  QUIZ_LIBRARY_FILTERS,
  QUIZ_LIBRARY_SORT_GROUPS,
  quizLibrarySortOption,
  sortQuizSources,
  withSortField,
  type QuizLibraryFilter,
  type QuizLibrarySortField,
} from "@/lib/quizProgress";
import { searchQuizSources } from "@/lib/quizSearch";
import { cn } from "@/lib/utils";
import { Route } from "@/routes/_app/index";

export function HomePage() {
  const library = useQuizLibrary();
  const { userName } = useUserProfile();
  const { goals } = useGoals();
  const navigate = useNavigate();
  const { details: detailsQuizId } = Route.useSearch();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<QuizLibraryFilter>("all");
  const [sortOrder, setSortOrder] = useQuizLibrarySort();
  const sortOption = quizLibrarySortOption(sortOrder.field);
  const nextSortDirection = sortOrder.direction === "asc" ? "desc" : "asc";
  const [isImporting, setIsImporting] = useState(false);
  const deferredSearchQuery = useDeferredValue(searchQuery);
  const isSearchPending = searchQuery !== deferredSearchQuery;
  const { isRefreshing, handleRefresh } = useLibraryRefresh(
    () => library.refresh(),
    "Library refreshed.",
  );

  const filteredQuizzes = useMemo(() => {
    const searched = searchQuizSources(library.quizzes, deferredSearchQuery);
    const filtered = filterQuizSources(searched, goals, statusFilter);
    return sortQuizSources(filtered, goals, sortOrder);
  }, [library.quizzes, deferredSearchQuery, goals, statusFilter, sortOrder]);

  const detailsSource = detailsQuizId
    ? library.quizzes.find((source) => source.quiz.id === detailsQuizId) ?? null
    : null;
  const detailsGoal = detailsSource
    ? goals.find((goal) => goal.quizId === detailsSource.quiz.id)
    : undefined;

  async function handleImportQuiz() {
    try {
      const selected = await open({
        directory: false,
        multiple: false,
        title: "Import quiz file",
        filters: [{ name: "Quiz JSON", extensions: ["json"] }],
      });
      if (!selected || Array.isArray(selected)) return;

      setIsImporting(true);
      const fileName = await library.importQuizFile(selected);
      toast.success(`${fileName} imported.`);
    } catch (error) {
      toast.error(errorMessage(error));
    } finally {
      setIsImporting(false);
    }
  }

  return (
    <PageShell>
      <div className="mb-8 flex items-center gap-4 lg:gap-5">
        <img
          src="/quizzy-logo.png"
          alt="Quizzy logo"
          className="size-14 shrink-0 rounded-xl border border-zinc-200 bg-white shadow-sm lg:size-16"
        />
        <div>
          <h1 className={pageTitleClassName}>
            Hello, {userName || "there"}
          </h1>
          <p className={pageDescriptionClassName}>
            Ready to practice? Pick a quiz below and get started.
          </p>
        </div>
      </div>

      <WorkingDirectoryGate
        isLoading={library.isLoading}
        directoryPath={library.directoryPath}
        directoryAvailable={library.directoryAvailable}
        loadingMessage="Loading Quizzy…"
        noDirectoryTitle="No quiz directory set"
        noDirectoryDescription="Choose a working directory in Settings to get started."
        unavailableTitle="Working directory unavailable"
        unavailableDescription="Quizzy could not access the configured directory. You can update it in Settings."
        onOpenSettings={() => navigate({ to: "/settings" })}
      >
        <>
          <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <h2 className="text-lg font-semibold tracking-tight text-zinc-950 lg:text-xl">
              Quiz Library
            </h2>
            <div className="flex items-center gap-2">
              <IconActionButton
                icon={FileUp}
                label={isImporting ? "Importing quiz file…" : "Import quiz file"}
                variant="outline"
                onClick={() => void handleImportQuiz()}
                disabled={isImporting}
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
                icon={FolderOpen}
                label="Open folder"
                variant="outline"
                onClick={() => void library.openQuizFolder()}
              />
            </div>
          </div>

          {library.quizzes.length > 0 && (
            <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center">
              <SearchField
                value={searchQuery}
                onChange={setSearchQuery}
                placeholder="Search quizzes"
                pending={isSearchPending}
                className="min-w-0 flex-1"
              />
              <Select
                value={statusFilter}
                onValueChange={(value) => setStatusFilter(value as QuizLibraryFilter)}
              >
                <SelectTrigger className="sm:w-48" aria-label="Filter quizzes">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {QUIZ_LIBRARY_FILTERS.map((filter) => (
                    <SelectItem key={filter.value} value={filter.value}>
                      {filter.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div className="flex items-center gap-2">
                <Select
                  value={sortOrder.field}
                  onValueChange={(value) =>
                    setSortOrder(withSortField(value as QuizLibrarySortField))
                  }
                >
                  <SelectTrigger className="min-w-0 flex-1 sm:w-44" aria-label="Sort quizzes by">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {QUIZ_LIBRARY_SORT_GROUPS.map((group, index) => (
                      <SelectGroup key={group.label}>
                        {index > 0 && <SelectSeparator />}
                        <SelectLabel className="text-xs font-medium text-zinc-500">
                          {group.label}
                        </SelectLabel>
                        {group.options.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    ))}
                  </SelectContent>
                </Select>
                <IconActionButton
                  icon={
                    sortOrder.direction === "asc" ? ArrowUpNarrowWide : ArrowDownWideNarrow
                  }
                  label={
                    sortOrder.field === "default"
                      ? "Choose a sort field to change direction"
                      : `${sortOption.directionLabels[sortOrder.direction]} · switch to ${sortOption.directionLabels[nextSortDirection].toLowerCase()}`
                  }
                  variant="outline"
                  className="size-9 shrink-0"
                  disabled={sortOrder.field === "default"}
                  onClick={() =>
                    setSortOrder({ ...sortOrder, direction: nextSortDirection })
                  }
                />
              </div>
            </div>
          )}

          <InvalidFileReportsAlert
            reports={library.invalidReports}
            entityLabel="quiz"
            className="mb-6"
          />

          {library.quizzes.length > 0 ? (
            filteredQuizzes.length > 0 ? (
              <div
                className={cn(
                  "transition-opacity",
                  isSearchPending && "opacity-70",
                )}
              >
                <QuizList
                  quizzes={filteredQuizzes}
                  onOpenDetails={(quizId) =>
                    navigate({ to: "/", search: { details: quizId } })
                  }
                />
              </div>
            ) : (
              <EmptyState
                title={
                  statusFilter === "archived"
                    ? "No archived quizzes"
                    : "No quizzes match your search"
                }
                description={
                  statusFilter === "archived"
                    ? "Archive a quiz from its details to find it here."
                    : "Try another keyword or status filter."
                }
                actionLabel="Clear filters"
                actionVariant="outline"
                onAction={() => {
                  setSearchQuery("");
                  setStatusFilter("all");
                }}
              />
            )
          ) : (
            <EmptyState
              title="No valid quizzes yet"
              description="Add one or more quiz JSON files to the configured quiz folder."
              actionLabel="Open folder"
              actionIcon={<FolderOpen className="size-4" />}
              actionVariant="outline"
              onAction={() => void library.openQuizFolder()}
            />
          )}
        </>
      </WorkingDirectoryGate>

      <QuizDetailsDialog
        source={detailsSource}
        goal={detailsGoal}
        onOpenChange={(open) => {
          if (!open) navigate({ to: "/", search: {} });
        }}
      />
    </PageShell>
  );
}
