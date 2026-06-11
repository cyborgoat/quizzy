import { ArrowRight, FolderOpen, RefreshCw, Search, Target } from "lucide-react";
import { useMemo, useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { PageShell } from "@/components/layout/PageShell";
import { IconActionButton } from "@/components/ui/icon-action-button";
import { Input } from "@/components/ui/input";
import { EmptyState } from "@/components/quiz/EmptyState";
import { InvalidFileReportsAlert } from "@/components/quiz/InvalidFileReportsAlert";
import { QuizList } from "@/components/quiz/QuizList";
import { WorkingDirectoryGate } from "@/components/quiz/WorkingDirectoryGate";
import { useGoals } from "@/hooks/useGoals";
import { useLibraryRefresh } from "@/hooks/useLibraryRefresh";
import { useQuizLibrary } from "@/hooks/useQuizLibrary";
import { useUserProfile } from "@/hooks/useUserProfile";
import { latestAttempt, type Goal } from "@/types/goal";

export function HomePage() {
  const library = useQuizLibrary();
  const { userName } = useUserProfile();
  const { goals } = useGoals();
  const navigate = useNavigate();
  const activeGoals = goals.filter((g) => !g.completed);
  const [searchQuery, setSearchQuery] = useState("");
  const { isRefreshing, handleRefresh } = useLibraryRefresh(
    () => library.refresh(),
    "Library refreshed.",
  );

  const normalizedQuery = searchQuery.trim().toLowerCase();
  const filteredQuizzes = useMemo(() => {
    if (!normalizedQuery) return library.quizzes;

    return library.quizzes.filter((source) => {
      const title = source.quiz.title.toLowerCase();
      const description = (source.quiz.description ?? "").toLowerCase();
      const tags = source.quiz.tags.join(" ").toLowerCase();

      return (
        title.includes(normalizedQuery) ||
        description.includes(normalizedQuery) ||
        tags.includes(normalizedQuery)
      );
    });
  }, [library.quizzes, normalizedQuery]);

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

      {activeGoals.length > 0 && (
        <div className="mb-6 rounded-lg border border-zinc-200 bg-white p-4">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-sm font-semibold text-zinc-950">
              <Target className="size-4 shrink-0 text-zinc-500" />
              Your goals
            </div>
            <Link
              to="/goals"
              className="inline-flex items-center gap-1 text-xs font-medium text-zinc-500 hover:text-zinc-900"
            >
              View all <ArrowRight className="size-3.5" />
            </Link>
          </div>
          <ul className="mt-3 space-y-2">
            {activeGoals.slice(0, 3).map((goal) => (
              <HomeGoalSummary key={goal.id} goal={goal} />
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
              <QuizList quizzes={filteredQuizzes} />
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

function HomeGoalSummary({ goal }: { goal: Goal }) {
  const latest = latestAttempt(goal);
  const description = goal.description.trim();

  return (
    <li className="flex items-start gap-2 text-xs">
      <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-zinc-400" />
      <div className="min-w-0">
        <p className="truncate">
          <span className="font-medium text-zinc-950">{goal.quizTitle}</span>
          {goal.targetScore !== undefined && (
            <span className="text-zinc-500">{` · Target: ${goal.targetScore}%`}</span>
          )}
          {latest && (
            <span className="text-zinc-500">
              {` · Latest: ${latest.percentage}% (${latest.score}/${latest.total})`}
            </span>
          )}
        </p>
        {description && (
          <p className="mt-0.5 truncate text-zinc-500">{description}</p>
        )}
      </div>
    </li>
  );
}
