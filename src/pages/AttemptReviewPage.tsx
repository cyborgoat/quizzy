import { Route } from "@/routes/_app/quizzes/$quizId/attempts/$attemptId";
import { useEffect, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { AttemptReviewView } from "@/components/goals/AttemptReviewView";
import { PageShell } from "@/components/layout/PageShell";
import { ErrorState, ErrorStateAction } from "@/components/quiz/ErrorState";
import { InlineEmptyMessage } from "@/components/quiz/InlineEmptyMessage";
import { LoadingState } from "@/components/quiz/LoadingState";
import { useGoals } from "@/hooks/useGoals";
import { errorMessage } from "@/lib/native";
import type { Goal, GoalAttempt } from "@/types/goal";
import { useI18n } from "@/lib/i18n";

function AttemptReviewLoader({
  goal,
  attemptId,
}: {
  goal: Goal;
  attemptId: string;
}) {
  const { loadGoalAttempt } = useGoals();
  const { t } = useI18n();

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
        <InlineEmptyMessage>{t("review.loadingAttempt")}</InlineEmptyMessage>
      </PageShell>
    );
  }

  if (error || !attempt) {
    return (
      <PageShell className="space-y-5">
        <ErrorState
          title={t("review.attemptUnavailableTitle")}
          description={error ?? t("review.attemptUnavailableDescription")}
          actions={
            <ErrorStateAction
              onClick={() => navigate({ to: "/", search: { details: goal.quizId } })}
            >
              {t("review.quizDashboard")}
            </ErrorStateAction>
          }
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
  const { t } = useI18n();
  const { quizId, attemptId } = Route.useParams();
  const navigate = useNavigate();
  const { goals, isLoading } = useGoals();

  if (isLoading) {
    return (
      <PageShell>
        <LoadingState message={t("review.loadingAttempt")} />
      </PageShell>
    );
  }

  const goal = goals.find((item) => item.quizId === quizId);
  const attemptSummary = goal?.attempts.find((item) => item.id === attemptId);

  if (!quizId || !attemptId) {
    return (
      <PageShell>
        <ErrorState
          title={t("review.invalidLinkTitle")}
          description={t("review.invalidLinkDescription")}
          actions={
            <ErrorStateAction onClick={() => navigate({ to: "/", search: {} })}>
              {t("review.quizDashboard")}
            </ErrorStateAction>
          }
        />
      </PageShell>
    );
  }

  if (!goal || !attemptSummary) {
    return (
      <PageShell>
        <ErrorState
          title={t("review.notFoundTitle")}
          description={t("review.notFoundDescription")}
          actions={
            <ErrorStateAction onClick={() => navigate({ to: "/", search: {} })}>
              {t("review.quizDashboard")}
            </ErrorStateAction>
          }
        />
      </PageShell>
    );
  }

  return (
    <AttemptReviewLoader key={`${quizId}-${attemptId}`} goal={goal} attemptId={attemptId} />
  );
}
