import { useEffect } from "react";
import { useNavigate } from "@tanstack/react-router";
import { PageShell } from "@/components/layout/PageShell";
import { InlineEmptyMessage } from "@/components/quiz/InlineEmptyMessage";
import { useGoals } from "@/hooks/useGoals";
import { Route } from "@/routes/_app/goals/index";

export function LegacyGoalsRedirectPage() {
  const { expand } = Route.useSearch();
  const { goals, isLoading } = useGoals();
  const navigate = useNavigate();
  const quizId = expand ? goals.find((goal) => goal.id === expand)?.quizId : undefined;

  useEffect(() => {
    if (expand && isLoading) return;
    void navigate({
      to: "/",
      search: quizId ? { details: quizId } : {},
      replace: true,
    });
  }, [expand, isLoading, navigate, quizId]);

  return (
    <PageShell>
      <InlineEmptyMessage>Opening quiz dashboard…</InlineEmptyMessage>
    </PageShell>
  );
}
