import { Route } from "@/routes/_app/goals/$goalId/attempts/$attemptId";
import { useEffect, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { AttemptHistoryCard } from "@/components/goals/AttemptHistoryPanel";
import { AttemptReviewContent } from "@/components/goals/AttemptReviewContent";
import { AttemptReviewHeader } from "@/components/goals/AttemptReviewHeader";
import { AttemptScoreSummary } from "@/components/goals/AttemptScoreSummary";
import { ErrorState } from "@/components/quiz/ErrorState";
import { useGoals } from "@/hooks/useGoals";
import { errorMessage } from "@/lib/native";
import type { Goal, GoalAttempt } from "@/types/goal";

function AttemptReviewLoader({
  goal,
  attemptId,
}: {
  goal: Goal;
  attemptId: string;
}) {
  const { loadGoalAttempt } = useGoals();
  const [attempt, setAttempt] = useState<GoalAttempt | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    void loadGoalAttempt(goal.id, attemptId)
      .then((loaded) => {
        if (!cancelled) setAttempt(loaded);
      })
      .catch((loadError) => {
        if (!cancelled) setError(errorMessage(loadError));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [goal.id, attemptId, loadGoalAttempt]);

  const hasMultipleAttempts = goal.attempts.length > 1;

  return (
    <main className="mx-auto w-full max-w-5xl space-y-6 px-4 py-6 sm:px-6 lg:px-8">
      <AttemptReviewHeader goal={goal} />

      <div
        className={
          hasMultipleAttempts
            ? "grid gap-4 lg:grid-cols-[minmax(0,1fr)_280px] lg:items-stretch"
            : undefined
        }
      >
        {attempt && !loading && !error && (
          <AttemptScoreSummary attempt={attempt} goal={goal} />
        )}

        {hasMultipleAttempts && (
          <AttemptHistoryCard
            goalId={goal.id}
            attempts={goal.attempts}
            currentAttemptId={attemptId}
          />
        )}
      </div>

      <section>
        <h2 className="mb-4 text-xs font-semibold uppercase tracking-wide text-zinc-500">
          Answer review
        </h2>
        <AttemptReviewContent
          attempt={attempt}
          quizId={goal.quizId}
          loading={loading}
          error={error}
        />
      </section>
    </main>
  );
}

export function AttemptReviewPage() {
  const { goalId, attemptId } = Route.useParams();
  const navigate = useNavigate();
  const { goals } = useGoals();

  const goal = goals.find((item) => item.id === goalId);
  const attemptSummary = goal?.attempts.find((item) => item.id === attemptId);

  if (!goalId || !attemptId) {
    return (
      <main className="mx-auto w-full max-w-5xl px-4 py-6 sm:px-6 lg:px-8">
        <ErrorState
          title="Invalid review link"
          description="This attempt review link is missing required information."
          actionLabel="Back to goals"
          onAction={() => navigate({ to: "/goals" })}
        />
      </main>
    );
  }

  if (!goal || !attemptSummary) {
    return (
      <main className="mx-auto w-full max-w-5xl px-4 py-6 sm:px-6 lg:px-8">
        <ErrorState
          title="Goal or attempt not found"
          description="This goal or attempt may have been deleted or is no longer available."
          actionLabel="Back to goals"
          onAction={() => navigate({ to: "/goals" })}
        />
      </main>
    );
  }

  return (
    <AttemptReviewLoader key={`${goalId}-${attemptId}`} goal={goal} attemptId={attemptId} />
  );
}
