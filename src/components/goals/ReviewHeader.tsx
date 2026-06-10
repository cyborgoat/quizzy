import { ArrowLeft, Home, RotateCcw } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import type { ReviewGoalContext, ReviewPracticeContext } from "@/lib/quizReviewSummary";

export function ReviewHeader({
  quizTitle,
  goalContext,
  practiceContext,
}: {
  quizTitle: string;
  goalContext: ReviewGoalContext | null;
  practiceContext: ReviewPracticeContext | null;
}) {
  if (goalContext) {
    const { goal } = goalContext;

    return (
      <header className="space-y-4">
        <Link
          to="/goals"
          search={{ expand: goal.id }}
          className="inline-flex items-center gap-1.5 text-sm font-medium text-zinc-600 transition-colors hover:text-zinc-950"
        >
          <ArrowLeft className="size-4" />
          Back to goals
        </Link>

        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
              Attempt review
            </p>
            <h1 className="mt-1 text-2xl font-bold tracking-tight text-zinc-950">{quizTitle}</h1>
            {goal.description.trim() && (
              <p className="mt-1 text-sm leading-6 text-zinc-600">{goal.description.trim()}</p>
            )}
          </div>

          <Link
            to="/quiz/$quizId"
            params={{ quizId: goal.quizId }}
            search={{ from: "goals" }}
            className="inline-flex h-8 shrink-0 items-center justify-center gap-1.5 self-start rounded-md bg-zinc-900 px-3 text-sm font-medium text-white transition-colors hover:bg-zinc-800"
          >
            <RotateCcw className="size-4" />
            Retake quiz
          </Link>
        </div>
      </header>
    );
  }

  return (
    <header className="space-y-4">
      <Link
        to="/"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-zinc-600 transition-colors hover:text-zinc-950"
      >
        <Home className="size-4" />
        Return home
      </Link>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          {practiceContext && (
            <>
              <p className="text-[11px] font-medium uppercase tracking-wide text-zinc-500">
                {practiceContext.modeLabel}
              </p>
              <p className="mt-1 text-xs font-medium uppercase tracking-wide text-zinc-500">
                Quiz complete
              </p>
            </>
          )}
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-zinc-950">{quizTitle}</h1>
        </div>

        {practiceContext && (
          <Button
            className="shrink-0 self-start"
            onClick={practiceContext.onRestart}
          >
            <RotateCcw className="size-4" />
            Restart quiz
          </Button>
        )}
      </div>
    </header>
  );
}
