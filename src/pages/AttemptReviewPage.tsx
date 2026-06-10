import { Route } from "@/routes/_app/goals/$goalId/attempts/$attemptId";
import { useEffect, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { AttemptReviewView } from "@/components/goals/AttemptReviewView";
import { PageShell } from "@/components/layout/PageShell";
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

  if (loading) {
    return (
      <PageShell className="space-y-5">
        <p className="rounded-md border border-dashed border-zinc-200 px-4 py-8 text-center text-sm text-zinc-500">
          Loading attempt…
        </p>
      </PageShell>
    );
  }

  if (error || !attempt) {
    return (
      <PageShell className="space-y-5">
        <p className="rounded-md border border-dashed border-red-200 bg-red-50 px-4 py-8 text-center text-sm text-red-600">
          {error ?? "Attempt details are unavailable."}
        </p>
      </PageShell>
    );
  }

  return (
    <PageShell className="space-y-5">
      <AttemptReviewView goal={goal} attempt={attempt} attemptId={attemptId} />
    </PageShell>
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
      <PageShell>
        <ErrorState
          title="Invalid review link"
          description="This attempt review link is missing required information."
          actionLabel="Back to goals"
          onAction={() => navigate({ to: "/goals" })}
        />
      </PageShell>
    );
  }

  if (!goal || !attemptSummary) {
    return (
      <PageShell>
        <ErrorState
          title="Goal or attempt not found"
          description="This goal or attempt may have been deleted or is no longer available."
          actionLabel="Back to goals"
          onAction={() => navigate({ to: "/goals" })}
        />
      </PageShell>
    );
  }

  return (
    <AttemptReviewLoader key={`${goalId}-${attemptId}`} goal={goal} attemptId={attemptId} />
  );
}
