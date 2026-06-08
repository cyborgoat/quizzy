import { ArrowRight, Download, RefreshCw, Target } from "lucide-react";
import { useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { PageShell } from "@/components/layout/PageShell";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/quiz/EmptyState";
import { QuizList } from "@/components/quiz/QuizList";
import { useGoals } from "@/hooks/useGoals";
import { useQuizLibrary } from "@/hooks/useQuizLibrary";
import { useUserProfile } from "@/hooks/useUserProfile";
import { latestAttempt, type Goal } from "@/types/goal";

export function HomePage() {
  const library = useQuizLibrary();
  const { userName } = useUserProfile();
  const { goals } = useGoals();
  const navigate = useNavigate();
  const activeGoals = goals.filter((g) => !g.completed);
  const [isRefreshing, setIsRefreshing] = useState(false);

  async function handleRefresh() {
    setIsRefreshing(true);
    await Promise.all([library.refresh(), new Promise((r) => setTimeout(r, 500))]);
    setIsRefreshing(false);
    toast.success("Library refreshed.");
  }

  return (
    <PageShell>
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight text-zinc-950 xl:text-3xl">
          Hello, {userName || "there"}
        </h1>
        <p className="mt-1 text-sm text-zinc-500 lg:text-base">
          Ready to practice? Pick a quiz below and get started.
        </p>
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

      {library.isLoading && !library.directoryPath ? (
        <p className="py-20 text-center text-sm text-zinc-500">Loading Quizzy…</p>
      ) : !library.directoryAvailable ? (
        <EmptyState
          title={library.directoryPath ? "Working directory unavailable" : "No quiz directory set"}
          description={
            library.directoryPath
              ? "Quizzy could not access the configured directory. You can update it in Settings."
              : "Choose a working directory in Settings to get started."
          }
          actionLabel="Open Settings"
          onAction={() => navigate({ to: "/settings" })}
        />
      ) : (
        <>
          <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-medium text-zinc-500">Local quiz library</p>
              <h2 className="mt-0.5 text-lg font-semibold tracking-tight text-zinc-950 lg:text-xl">
                Choose a quiz
              </h2>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => void handleRefresh()} disabled={isRefreshing}>
                <RefreshCw className={`size-4 ${isRefreshing ? "animate-spin" : ""}`} />
                Refresh
              </Button>
              <Button size="sm" onClick={() => void library.importQuizzes()}>
                <Download className="size-4" />
                Import JSON
              </Button>
            </div>
          </div>

          {library.invalidReports.length > 0 && (
            <Alert variant="destructive" className="mb-6">
              <AlertTitle>
                {library.invalidReports.length} invalid quiz file(s) were skipped
              </AlertTitle>
              <AlertDescription>
                <ul className="mt-2 space-y-2">
                  {library.invalidReports.map((report) => (
                    <li key={report.fileName}>
                      <strong>{report.fileName}:</strong> {report.issues.join(" ")}
                    </li>
                  ))}
                </ul>
              </AlertDescription>
            </Alert>
          )}

          {library.quizzes.length > 0 ? (
            <QuizList quizzes={library.quizzes} onDelete={(quiz) => void library.deleteQuiz(quiz)} />
          ) : (
            <EmptyState
              title="No valid quizzes yet"
              description="Import one or more quiz JSON files into this working directory."
              actionLabel="Import JSON files"
              onAction={() => void library.importQuizzes()}
            />
          )}
        </>
      )}
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
