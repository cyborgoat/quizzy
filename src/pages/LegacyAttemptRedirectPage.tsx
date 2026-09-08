import { useEffect } from "react";
import { useNavigate } from "@tanstack/react-router";
import { PageShell } from "@/components/layout/PageShell";
import { InlineEmptyMessage } from "@/components/quiz/InlineEmptyMessage";
import { useGoals } from "@/hooks/useGoals";
import { Route } from "@/routes/_app/goals/$goalId/attempts/$attemptId";

export function LegacyAttemptRedirectPage() {
  const { goalId, attemptId } = Route.useParams();
  const { goals, isLoading } = useGoals();
  const navigate = useNavigate();
  const goal = goals.find((item) => item.id === goalId);

  useEffect(() => {
    if (isLoading) return;
    if (goal) {
      void navigate({
        to: "/quizzes/$quizId/attempts/$attemptId",
        params: { quizId: goal.quizId, attemptId },
        replace: true,
      });
    } else {
      void navigate({ to: "/", search: {}, replace: true });
    }
  }, [attemptId, goal, isLoading, navigate]);

  return (
    <PageShell>
      <InlineEmptyMessage>Opening attempt…</InlineEmptyMessage>
    </PageShell>
  );
}
