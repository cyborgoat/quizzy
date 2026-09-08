import { Route } from "@/routes/_app/quizzes/$quizId/attempts/$attemptId";
import { useEffect, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { AttemptReviewView } from "@/components/goals/AttemptReviewView";
import { PageShell } from "@/components/layout/PageShell";
import { ErrorState } from "@/components/quiz/ErrorState";
import { InlineEmptyMessage } from "@/components/quiz/InlineEmptyMessage";
import { LoadingState } from "@/components/quiz/LoadingState";
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

  const navigate = useNavigate();

  if (loading) {
    return (
      <PageShell className="space-y-5">
        <InlineEmptyMessage>Loading attempt…</InlineEmptyMessage>
      </PageShell>
    );
  }

  if (error || !attempt) {
    return (
      <PageShell className="space-y-5">
        <ErrorState
          title="Attempt unavailable"
          description={error ?? "Attempt details are unavailable."}
          actionLabel="Quiz dashboard"
          onAction={() => navigate({ to: "/", search: { details: goal.quizId } })}
        />
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
  const { quizId, attemptId } = Route.useParams();
  const navigate = useNavigate();
  const { goals, isLoading } = useGoals();

  if (isLoading) {
    return (
      <PageShell>
        <LoadingState message="Loading attempt…" />
      </PageShell>
    );
  }

  const goal = goals.find((item) => item.quizId === quizId);
  const attemptSummary = goal?.attempts.find((item) => item.id === attemptId);

  if (!quizId || !attemptId) {
    return (
      <PageShell>
        <ErrorState
          title="Invalid review link"
          description="This attempt review link is missing required information."
          actionLabel="Quiz dashboard"
          onAction={() => navigate({ to: "/", search: {} })}
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
          actionLabel="Quiz dashboard"
          onAction={() => navigate({ to: "/", search: {} })}
        />
      </PageShell>
    );
  }

  return (
    <AttemptReviewLoader key={`${quizId}-${attemptId}`} goal={goal} attemptId={attemptId} />
  );
}
