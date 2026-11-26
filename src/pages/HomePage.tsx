import { open } from "@tauri-apps/plugin-dialog";
import { FileUp, CircleHelp, FolderOpen, RefreshCw } from "lucide-react";
import { useDeferredValue, useMemo, useRef, useState } from "react";
import { useNavigate, useRouter } from "@tanstack/react-router";
import { toast } from "sonner";
import { PageShell } from "@/components/layout/PageShell";
import { ImportHelpDialog } from "@/components/quiz/ImportHelpDialog";
import { QuizDetailsDialog } from "@/components/quiz/QuizDetailsDialog";
import { Button } from "@/components/ui/button";
import { IconActionButton } from "@/components/ui/icon-action-button";
import { SearchField } from "@/components/ui/search-field";
import { FilterSortMenu } from "@/components/ui/filter-sort-menu";
import { FirstLaunchWizard } from "@/components/onboarding/FirstLaunchWizard";
import { EmptyState } from "@/components/quiz/EmptyState";
import { InvalidFileReportsAlert } from "@/components/quiz/InvalidFileReportsAlert";
import { QuizList } from "@/components/quiz/QuizList";
import { WorkingDirectoryGate } from "@/components/quiz/WorkingDirectoryGate";
import { useAppLocale } from "@/hooks/useAppLocale";
import { useGoals } from "@/hooks/useGoals";
import { useLibraryRefresh } from "@/hooks/useLibraryRefresh";
import { useQuizLibrary } from "@/hooks/useQuizLibrary";
import { useQuizLibrarySort } from "@/hooks/useQuizLibrarySort";
import { useI18n } from "@/lib/i18n";
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
  const { goals } = useGoals();
  const { onboardingCompleted, settingsReady } = useAppLocale();
  const { t } = useI18n();
  const navigate = useNavigate();
  const router = useRouter();
  const { details: detailsQuizId } = Route.useSearch();
  const libraryHeadingRef = useRef<HTMLHeadingElement>(null);
  const detailsTrigger = useRef<{ quizId: string; element: HTMLButtonElement } | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<QuizLibraryFilter>("all");
  const [favoritesOnly, setFavoritesOnly] = useState(false);
  const [sortOrder, setSortOrder] = useQuizLibrarySort();
  const sortOption = quizLibrarySortOption(sortOrder.field);
  const hasActiveFilters =
    statusFilter !== "all" || favoritesOnly || sortOrder.field !== "default";
  const [isImporting, setIsImporting] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const deferredSearchQuery = useDeferredValue(searchQuery);
  const isSearchPending = searchQuery !== deferredSearchQuery;
  const { isRefreshing, handleRefresh } = useLibraryRefresh(
    () => library.refresh(),
    t("home.libraryRefreshed"),
  );

  const filteredQuizzes = useMemo(() => {
    const searched = searchQuizSources(library.quizzes, deferredSearchQuery);
    const filtered = filterQuizSources(searched, goals, statusFilter);
    const favorites = favoritesOnly
      ? filtered.filter((source) => library.favoriteQuizIds.has(source.quiz.id))
      : filtered;
    return sortQuizSources(favorites, goals, sortOrder);
  }, [
    library.quizzes,
    deferredSearchQuery,
    goals,
    statusFilter,
    sortOrder,
    favoritesOnly,
    library.favoriteQuizIds,
  ]);

  const detailsSource = detailsQuizId
    ? (library.quizzes.find((source) => source.quiz.id === detailsQuizId) ??
      null)
    : null;
  const detailsGoal = detailsSource
    ? goals.find((goal) => goal.quizId === detailsSource.quiz.id)
    : undefined;

  async function handleImportQuiz() {
    try {
      const selected = await open({
        directory: false,
        multiple: false,
        title: t("home.importQuizFile"),
        filters: [{ name: t("home.importFilterName"), extensions: ["json"] }],
      });
      if (!selected || Array.isArray(selected)) return;

      setIsImporting(true);
      const fileName = await library.importQuizFile(selected);
      toast.success(t("home.imported", { fileName }));
    } catch (error) {
      toast.error(errorMessage(error));
    } finally {
      setIsImporting(false);
    }
  }

  if (settingsReady && !onboardingCompleted) {
    return (
      <PageShell>
        <FirstLaunchWizard />
      </PageShell>
    );
  }

  return (
    <PageShell>
      <WorkingDirectoryGate
        isLoading={library.isLoading}
        directoryPath={library.directoryPath}
        directoryAvailable={library.directoryAvailable}
        loadingMessage={t("home.loading")}
        noDirectoryTitle={t("home.welcomeTitle")}
        noDirectoryDescription={t("home.welcomeDescription")}
        unavailableTitle={t("home.unavailableTitle")}
        unavailableDescription={t("home.unavailableDescription")}
        onOpenSettings={() => navigate({ to: "/settings" })}
      >
        <>
          <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <h1
              ref={libraryHeadingRef}
              tabIndex={-1}
              className="text-lg font-semibold tracking-tight text-zinc-950 outline-none lg:text-xl"
            >
              {t("home.libraryTitle")}
            </h1>
            <div className="flex items-center gap-2">
              <IconActionButton
                icon={CircleHelp}
                label={t("home.howToImport")}
                variant="outline"
                onClick={() => setHelpOpen(true)}
              />
              <IconActionButton
                icon={FileUp}
                label={
                  isImporting ? t("home.importing") : t("home.importQuizFile")
                }
                variant="outline"
                onClick={() => void handleImportQuiz()}
                disabled={isImporting}
              />
              <IconActionButton
                icon={RefreshCw}
                label={t("home.refresh")}
                variant="outline"
                onClick={() => void handleRefresh()}
                disabled={isRefreshing}
              >
                <RefreshCw
                  className={`size-4 ${isRefreshing ? "animate-spin" : ""}`}
                />
              </IconActionButton>
              <IconActionButton
                icon={FolderOpen}
                label={t("home.openFolder")}
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
                placeholder={t("home.searchPlaceholder")}
                pending={isSearchPending}
                className="min-w-0 flex-1"
              />
              <FilterSortMenu
                label={t("home.filterSortLabel")}
                active={hasActiveFilters}
                sections={[
                  {
                    label: t("home.menu.status"),
                    value: statusFilter,
                    options: QUIZ_LIBRARY_FILTERS.map((option) => ({
                      value: option.value,
                      label: t(option.labelKey),
                    })),
                    onValueChange: (value) =>
                      setStatusFilter(value as QuizLibraryFilter),
                  },
                  {
                    label: t("home.menu.sortBy"),
                    value: sortOrder.field,
                    options: QUIZ_LIBRARY_SORT_GROUPS.flatMap((group) =>
                      group.options.map((option) => ({
                        value: option.value,
                        label: t(option.labelKey),
                        group: t(group.labelKey),
                      })),
                    ),
                    onValueChange: (value) =>
                      setSortOrder(
                        withSortField(value as QuizLibrarySortField),
                      ),
                  },
                  {
                    label: t("home.menu.order"),
                    value: sortOrder.direction,
                    disabled: sortOrder.field === "default",
                    options: (["asc", "desc"] as const).map((value) => ({
                      value,
                      label: t(sortOption.directionLabelKeys[value]),
                    })),
                    onValueChange: (value) =>
                      setSortOrder({
                        ...sortOrder,
                        direction: value as "asc" | "desc",
                      }),
                  },
                ]}
                toggles={[
                  {
                    label: t("home.menu.favoritesOnly"),
                    checked: favoritesOnly,
                    onCheckedChange: setFavoritesOnly,
                  },
                ]}
              />
            </div>
          )}

          <InvalidFileReportsAlert
            reports={library.invalidReports}
            kind="quiz"
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
                  onOpenDetails={(quizId, element) => {
                    detailsTrigger.current = { quizId, element };
                    void navigate({ to: "/", search: { details: quizId } });
                  }}
                />
              </div>
            ) : (
              <EmptyState
                title={
                  favoritesOnly
                    ? t("home.empty.noFavoritesTitle")
                    : statusFilter === "archived"
                      ? t("home.empty.noArchivedTitle")
                      : t("home.empty.noMatchTitle")
                }
                description={
                  favoritesOnly
                    ? t("home.empty.noFavoritesDescription")
                    : statusFilter === "archived"
                      ? t("home.empty.noArchivedDescription")
                      : t("home.empty.noMatchDescription")
                }
                actionLabel={t("home.empty.clearFilters")}
                actionVariant="outline"
                onAction={() => {
                  setSearchQuery("");
                  setStatusFilter("all");
                  setFavoritesOnly(false);
                }}
              />
            )
          ) : (
            <EmptyState
              title={t("home.empty.noQuizzesTitle")}
              description={t("home.empty.noQuizzesDescription")}
              action={
                <div className="mt-6 flex flex-wrap justify-center gap-2">
                  <Button onClick={() => setHelpOpen(true)}>
                    <CircleHelp className="size-4" />
                    {t("home.howToImport")}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => void library.openQuizFolder()}
                  >
                    <FolderOpen className="size-4" />
                    {t("home.openFolder")}
                  </Button>
                </div>
              }
            />
          )}
        </>
      </WorkingDirectoryGate>

      <ImportHelpDialog
        open={helpOpen}
        onOpenChange={setHelpOpen}
        canUseLibrary={library.directoryAvailable}
        onImport={() => {
          setHelpOpen(false);
          void handleImportQuiz();
        }}
        onOpenFolder={() => void library.openQuizFolder()}
      />

      {detailsSource && (
        <QuizDetailsDialog
          key={detailsSource.quiz.id}
          source={detailsSource}
          goal={detailsGoal}
          onClose={async () => {
            const { pathname, search } = router.state.location;
            if (pathname === "/" && search.details === detailsQuizId) {
              await navigate({ to: "/", search: {}, replace: true });
            }
          }}
          restoreFocus={() => {
            const trigger = detailsTrigger.current;
            if (trigger?.quizId === detailsSource.quiz.id && trigger.element.isConnected) {
              trigger.element.focus();
            } else {
              libraryHeadingRef.current?.focus();
            }
          }}
        />
      )}
    </PageShell>
  );
}
