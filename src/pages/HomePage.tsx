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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  pageDescriptionClassName,
  pageTitleClassName,
} from "@/components/ui/typography";
import { EmptyState } from "@/components/quiz/EmptyState";
import { InvalidFileReportsAlert } from "@/components/quiz/InvalidFileReportsAlert";
import { QuizList } from "@/components/quiz/QuizList";
import { WorkingDirectoryGate } from "@/components/quiz/WorkingDirectoryGate";
import { useAppLocale } from "@/hooks/useAppLocale";
import { useGoals } from "@/hooks/useGoals";
import { useLibraryRefresh } from "@/hooks/useLibraryRefresh";
import { usePickWorkingDirectory } from "@/hooks/usePickWorkingDirectory";
import { useQuizLibrary } from "@/hooks/useQuizLibrary";
import { useQuizLibrarySort } from "@/hooks/useQuizLibrarySort";
import { useUserProfile } from "@/hooks/useUserProfile";
import { useI18n } from "@/lib/i18n";
import { APP_LOCALES, localeDisplayName, type AppLocale } from "@/lib/locale";
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
  const { locale, setAppLocale } = useAppLocale();
  const { t } = useI18n();
  const { pickWorkingDirectory, isPicking } = usePickWorkingDirectory();
  const navigate = useNavigate();
  const router = useRouter();
  const [isSavingLocale, setIsSavingLocale] = useState(false);
  const { details: detailsQuizId } = Route.useSearch();
  const headingRef = useRef<HTMLHeadingElement>(null);
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
    "Library refreshed.",
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

  async function handleAddSamples() {
    try {
      const { added, skipped } = await library.addSampleQuizzes();
      if (added.length > 0) {
        toast.success(t("toast.welcomeAdded"));
      } else if (skipped.length > 0) {
        toast.info(t("toast.welcomeExists"));
      }
    } catch (error) {
      toast.error(errorMessage(error));
    }
  }

  async function handleLocaleChange(next: AppLocale) {
    if (next === locale || isSavingLocale) return;
    setIsSavingLocale(true);
    try {
      await setAppLocale(next);
    } finally {
      setIsSavingLocale(false);
    }
  }

  async function handleChooseDirectory() {
    await setAppLocale(locale);
    await pickWorkingDirectory();
  }

  return (
    <PageShell>
      <div className="mb-8 flex items-center gap-4 lg:gap-5">
        <img
          src="/quizzy-logo.svg"
          alt="Quizzy logo"
          className="size-14 shrink-0 rounded-xl border border-zinc-200 bg-white shadow-sm lg:size-16"
        />
        <div>
          <h1 ref={headingRef} tabIndex={-1} className={pageTitleClassName}>
            {t("home.greeting", { name: userName || t("home.greetingFallback") })}
          </h1>
          <p className={pageDescriptionClassName}>
            {t("home.subtitle")}
          </p>
        </div>
      </div>

      <WorkingDirectoryGate
        isLoading={library.isLoading}
        directoryPath={library.directoryPath}
        directoryAvailable={library.directoryAvailable}
        loadingMessage="Loading Quizzy…"
        noDirectoryTitle={t("home.welcomeTitle")}
        noDirectoryDescription={t("home.welcomeDescription")}
        unavailableTitle={t("home.unavailableTitle")}
        unavailableDescription={t("home.unavailableDescription")}
        onOpenSettings={() => navigate({ to: "/settings" })}
        chooseDirectoryBusy={isPicking || isSavingLocale}
        action={
          <div className="mx-auto mt-6 flex w-full max-w-sm flex-col items-stretch gap-4">
            <div className="space-y-2 text-left">
              <label htmlFor="home-app-locale" className="block text-sm font-medium text-zinc-800">
                {t("home.languageLabel")}
              </label>
              <Select
                value={locale}
                disabled={isSavingLocale || isPicking}
                onValueChange={(value) => void handleLocaleChange(value as AppLocale)}
              >
                <SelectTrigger id="home-app-locale" className="bg-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {APP_LOCALES.map((id) => (
                    <SelectItem key={id} value={id}>
                      {localeDisplayName(id)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs leading-5 text-zinc-500">{t("home.languageHint")}</p>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-3">
              <Button disabled={isPicking || isSavingLocale} onClick={() => void handleChooseDirectory()}>
                {isPicking ? t("home.choosingDirectory") : t("home.chooseDirectory")}
              </Button>
              <Button variant="outline" onClick={() => navigate({ to: "/settings" })}>
                {t("home.openSettings")}
              </Button>
            </div>
          </div>
        }
      >
        <>
          <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <h2 className="text-lg font-semibold tracking-tight text-zinc-950 lg:text-xl">
              Quiz Library
            </h2>
            <div className="flex items-center gap-2">
              <IconActionButton
                icon={CircleHelp}
                label="How to import"
                variant="outline"
                onClick={() => setHelpOpen(true)}
              />
              <IconActionButton
                icon={FileUp}
                label={
                  isImporting ? "Importing quiz file…" : "Import quiz file"
                }
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
                <RefreshCw
                  className={`size-4 ${isRefreshing ? "animate-spin" : ""}`}
                />
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
              <FilterSortMenu
                label="Filter and sort quizzes"
                active={hasActiveFilters}
                sections={[
                  {
                    label: "Status",
                    value: statusFilter,
                    options: QUIZ_LIBRARY_FILTERS,
                    onValueChange: (value) =>
                      setStatusFilter(value as QuizLibraryFilter),
                  },
                  {
                    label: "Sort by",
                    value: sortOrder.field,
                    options: QUIZ_LIBRARY_SORT_GROUPS.flatMap((group) =>
                      group.options.map((option) => ({
                        ...option,
                        group: group.label,
                      })),
                    ),
                    onValueChange: (value) =>
                      setSortOrder(
                        withSortField(value as QuizLibrarySortField),
                      ),
                  },
                  {
                    label: "Order",
                    value: sortOrder.direction,
                    disabled: sortOrder.field === "default",
                    options: (["asc", "desc"] as const).map((value) => ({
                      value,
                      label: sortOption.directionLabels[value],
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
                    label: "Favorites only",
                    checked: favoritesOnly,
                    onCheckedChange: setFavoritesOnly,
                  },
                ]}
              />
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
                    ? "No favorite quizzes match"
                    : statusFilter === "archived"
                      ? "No archived quizzes"
                      : "No quizzes match your search"
                }
                description={
                  favoritesOnly
                    ? "Star a quiz card to save it here, or try another search or status filter."
                    : statusFilter === "archived"
                      ? "Archive a quiz from its details to find it here."
                      : "Try another keyword or status filter."
                }
                actionLabel="Clear filters"
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
              title="No valid quizzes yet"
              description="Add one or more quiz JSON files to the configured quiz folder."
              action={
                <div className="mt-6 flex flex-wrap justify-center gap-2">
                  <Button onClick={() => setHelpOpen(true)}>
                    <CircleHelp className="size-4" />
                    How to import
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => void library.openQuizFolder()}
                  >
                    <FolderOpen className="size-4" />
                    Open folder
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
        onAddSamples={handleAddSamples}
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
              headingRef.current?.focus();
            }
          }}
        />
      )}
    </PageShell>
  );
}
