import { useEffect } from "react";
import { useNavigate } from "@tanstack/react-router";
import { PageShell } from "@/components/layout/PageShell";
import { InlineEmptyMessage } from "@/components/quiz/InlineEmptyMessage";
import { useGoals } from "@/hooks/useGoals";
import { Route } from "@/routes/_app/goals/index";
import { useI18n } from "@/lib/i18n";

export function LegacyGoalsRedirectPage() {
  const { t } = useI18n();
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
      <InlineEmptyMessage>{t("redirect.openingDashboard")}</InlineEmptyMessage>
    </PageShell>
  );
}
