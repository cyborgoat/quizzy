import { ArrowRight, FolderOpen, History, RefreshCw, Search } from "lucide-react";
import { useDeferredValue, useMemo, useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { AttemptResultBadge } from "@/components/goals/AttemptResultBadge";
import { PageShell } from "@/components/layout/PageShell";
import { Route } from "@/routes/_app/index";
import { IconActionButton } from "@/components/ui/icon-action-button";
import { Input } from "@/components/ui/input";
import { EmptyState } from "@/components/quiz/EmptyState";
import { InvalidFileReportsAlert } from "@/components/quiz/InvalidFileReportsAlert";
import { QuizList } from "@/components/quiz/QuizList";
import { WorkingDirectoryGate } from "@/components/quiz/WorkingDirectoryGate";
import { useGoals } from "@/hooks/useGoals";
import { useLibraryRefresh } from "@/hooks/useLibraryRefresh";
import { useQuizStartFromSearch } from "@/hooks/useQuizStartFromSearch";
import { useQuizLibrary } from "@/hooks/useQuizLibrary";
import { useUserProfile } from "@/hooks/useUserProfile";
import { formatShortDate } from "@/lib/formatDate";
import {
  collectRecentAttempts,
  HOME_RECENT_ATTEMPTS_PREVIEW_COUNT,
  type RecentAttemptEntry,
} from "@/lib/recentAttempts";
import { searchQuizSources } from "@/lib/quizSearch";
import { cn } from "@/lib/utils";
import { attemptPassed } from "@/types/goal";

export function HomePage() {
  const { startQuiz, from } = Route.useSearch();
  const library = useQuizLibrary();
  const { userName } = useUserProfile();
  const { goals } = useGoals();
  const navigate = useNavigate();
  useQuizStartFromSearch({
    startQuiz,
    from,
    defaultMode: "practice",
    clearSearch: {},
    clearTo: "/",
  });
  const [searchQuery, setSearchQuery] = useState("");
  const deferredSearchQuery = useDeferredValue(searchQuery);
  const isSearchPending = searchQuery !== deferredSearchQuery;
  const { isRefreshing, handleRefresh } = useLibraryRefresh(
    () => library.refresh(),
    "Library refreshed.",
  );

  const filteredQuizzes = useMemo(
    () => searchQuizSources(library.quizzes, deferredSearchQuery),
    [library.quizzes, deferredSearchQuery],
  );

  const recentAttempts = useMemo(
    () => collectRecentAttempts(goals).slice(0, HOME_RECENT_ATTEMPTS_PREVIEW_COUNT),
    [goals],
  );

  return (
    <PageShell>
      <div className="mb-8 flex items-center gap-4 lg:gap-5">
        <img
          src="/quizzy-logo.png"
          alt="Quizzy logo"
          className="size-14 shrink-0 rounded-xl border border-zinc-200 bg-white shadow-sm lg:size-16"
        />
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-950 xl:text-3xl">
            Hello, {userName || "there"}
          </h1>
          <p className="mt-1 text-sm text-zinc-500 lg:text-base">
            Ready to practice? Pick a quiz below and get started.
          </p>
        </div>
      </div>

      {recentAttempts.length > 0 && (
        <div className="mb-6 rounded-lg border border-zinc-200 bg-white p-4">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-sm font-semibold text-zinc-950">
              <History className="size-4 shrink-0 text-zinc-500" />
              Recent attempts
            </div>
            <Link
              to="/goals"
              className="inline-flex items-center gap-1 text-xs font-medium text-zinc-500 hover:text-zinc-900"
            >
              View all <ArrowRight className="size-3.5" />
            </Link>
          </div>
          <ul className="mt-3 space-y-2">
            {recentAttempts.map((entry) => (
              <HomeRecentAttemptRow key={entry.attempt.id} {...entry} />
            ))}
          </ul>
        </div>
      )}

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
            <div>
              <p className="text-xs font-medium text-zinc-500">Local quiz library</p>
              <h2 className="mt-0.5 text-lg font-semibold tracking-tight text-zinc-950 lg:text-xl">
                Choose a quiz
              </h2>
            </div>
            <div className="flex items-center gap-2">
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
            <div className="mb-4 flex items-center gap-2 rounded-lg border border-zinc-200 bg-white px-3">
              <Search className="size-4 text-zinc-400" aria-hidden="true" />
              <Input
                id="quiz-search"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Search quizzes"
                className="h-8 border-0 px-0 shadow-none focus-visible:ring-0"
                aria-label="Search quizzes"
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
                <QuizList quizzes={filteredQuizzes} />
              </div>
            ) : (
              <EmptyState
                title="No quizzes match your search"
                description="Try another keyword or clear the search to see all quizzes."
                actionLabel="Clear"
                actionVariant="outline"
                onAction={() => setSearchQuery("")}
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
    </PageShell>
  );
}

function HomeRecentAttemptRow({
  goalId,
  quizTitle,
  targetScore,
  attempt,
}: RecentAttemptEntry) {
  const dateLabel = formatShortDate(attempt.takenAt);
  const passed = attemptPassed(attempt, targetScore);

  return (
    <li>
      <Link
        to="/goals/$goalId/attempts/$attemptId"
        params={{ goalId, attemptId: attempt.id }}
        className="flex items-center gap-2 rounded-md px-1 py-0.5 text-xs text-zinc-950 transition-colors hover:bg-zinc-50 hover:text-zinc-950"
      >
        <p className="min-w-0 flex-1 truncate">
          <span className="font-medium">{quizTitle}</span>
          <span className="text-zinc-500">
            {` · ${dateLabel} · ${attempt.percentage}% (${attempt.score}/${attempt.total})`}
          </span>
        </p>
        <AttemptResultBadge passed={passed} className="shrink-0" />
      </Link>
    </li>
  );
}
