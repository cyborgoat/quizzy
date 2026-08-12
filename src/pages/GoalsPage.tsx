import { Route } from "@/routes/_app/goals/index";
import { CheckCircle2, Plus, Target } from "lucide-react";
import { useMemo, useState } from "react";
import { CreateGoalDialog } from "@/components/goals/CreateGoalDialog";
import { GoalCard } from "@/components/goals/GoalCard";
import { GoalsPanelSection } from "@/components/goals/GoalsPanelSection";
import { GoalsRecentAttemptsSection } from "@/components/goals/GoalsRecentAttemptsSection";
import { PageHeader } from "@/components/layout/PageHeader";
import { PageShell } from "@/components/layout/PageShell";
import { EmptyState } from "@/components/quiz/EmptyState";
import { Accordion } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { IconActionButton } from "@/components/ui/icon-action-button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useGoals } from "@/hooks/useGoals";
import { useQuizStartFromSearch } from "@/hooks/useQuizStartFromSearch";
import { useQuizLibrary } from "@/hooks/useQuizLibrary";
import { collectRecentAttempts } from "@/lib/recentAttempts";

export function GoalsPage() {
  const { goals } = useGoals();
  const { quizzes, isLoading: quizzesLoading } = useQuizLibrary();
  const { expand: expandParam, startQuiz, from } = Route.useSearch();
  useQuizStartFromSearch({
    startQuiz,
    from,
    defaultMode: "scored",
    clearSearch: expandParam ? { expand: expandParam } : {},
    clearTo: "/goals",
  });
  const [showForm, setShowForm] = useState(false);
  const [expandedGoalId, setExpandedGoalId] = useState<string | null>(null);
  const defaultExpandedGoalId =
    expandParam && goals.some((goal) => goal.id === expandParam) ? expandParam : "";

  const activeGoals = goals.filter((g) => !g.completed);
  const completedGoals = goals.filter((g) => g.completed);
  const recentAttempts = useMemo(() => collectRecentAttempts(goals), [goals]);
  const availableQuizzes = quizzes.filter(
    (quiz) => !goals.some((goal) => goal.quizId === quiz.quiz.id),
  );
  const canAddGoal = !quizzesLoading && availableQuizzes.length > 0;
  const addGoalDisabledReason = quizzesLoading
    ? "Loading quizzes…"
    : quizzes.length === 0
      ? "Add quizzes to your library first"
      : "Every quiz in your library already has a goal";

  const accordionValue =
    expandedGoalId !== null ? expandedGoalId : defaultExpandedGoalId;

  const accordionProps = {
    type: "single" as const,
    collapsible: true,
    value: accordionValue,
    onValueChange: (value: string) => setExpandedGoalId(value),
  };

  return (
    <PageShell className="space-y-3">
      <PageHeader
        className="mb-5"
        title="Goals"
        description="Set quiz goals to track your progress and stay motivated."
        actions={
          !showForm ? (
            canAddGoal ? (
            <IconActionButton
              icon={Plus}
              label="New goal"
              variant="default"
              onClick={() => setShowForm(true)}
            />
            ) : (
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="inline-flex shrink-0">
                    <Button size="icon" variant="default" disabled aria-label="New goal">
                      <Plus className="size-4" aria-hidden="true" />
                    </Button>
                  </span>
                </TooltipTrigger>
                <TooltipContent side="bottom">{addGoalDisabledReason}</TooltipContent>
              </Tooltip>
            )
          ) : undefined
        }
      />

      <CreateGoalDialog
        open={showForm}
        onOpenChange={setShowForm}
        availableQuizzes={availableQuizzes.map((source) => source.quiz)}
      />

      {goals.length === 0 ? (
        <EmptyState
          title="No goals yet"
          description="Set a goal for a quiz to track your progress and keep yourself accountable."
          actionLabel="New goal"
          onAction={() => setShowForm(true)}
        />
      ) : (
        <>
          {activeGoals.length > 0 && (
            <GoalsPanelSection icon={Target} title="Active goals" count={activeGoals.length}>
              <Accordion {...accordionProps}>
                {activeGoals.map((goal) => (
                  <GoalCard key={goal.id} goal={goal} />
                ))}
              </Accordion>
            </GoalsPanelSection>
          )}

          {completedGoals.length > 0 && (
            <GoalsPanelSection
              icon={CheckCircle2}
              title="Completed goals"
              count={completedGoals.length}
            >
              <Accordion {...accordionProps}>
                {completedGoals.map((goal) => (
                  <GoalCard key={goal.id} goal={goal} />
                ))}
              </Accordion>
            </GoalsPanelSection>
          )}

          {recentAttempts.length > 0 && (
            <GoalsRecentAttemptsSection attempts={recentAttempts} />
          )}
        </>
      )}
    </PageShell>
  );
}
