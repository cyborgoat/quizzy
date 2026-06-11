import { Route } from "@/routes/_app/goals/index";
import { Plus, X } from "lucide-react";
import { useMemo, useState } from "react";
import { GoalCard } from "@/components/goals/GoalCard";
import { RecentAttemptsCard } from "@/components/goals/RecentAttemptsCard";
import { GoalDetailsFields } from "@/components/goals/GoalDetailsFields";
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
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useGoals } from "@/hooks/useGoals";
import { useQuizLibrary } from "@/hooks/useQuizLibrary";
import {
  collectRecentAttempts,
  RECENT_ATTEMPTS_INITIAL_COUNT,
} from "@/lib/recentAttempts";
import {
  detailsFormToGoalInput,
  type GoalDetailsFormValues,
} from "@/types/goal";

const DEFAULT_FORM: GoalDetailsFormValues & { quizId: string } = {
  quizId: "",
  description: "",
  targetScore: "",
};

export function GoalsPage() {
  const { goals, addGoal } = useGoals();
  const { quizzes, isLoading: quizzesLoading } = useQuizLibrary();
  const { expand: expandParam } = Route.useSearch();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(DEFAULT_FORM);
  const [isCreating, setIsCreating] = useState(false);
  const [expandedGoalId, setExpandedGoalId] = useState<string | null>(null);
  const defaultExpandedGoalId =
    expandParam && goals.some((goal) => goal.id === expandParam) ? expandParam : "";

  const activeGoals = goals.filter((g) => !g.completed);
  const completedGoals = goals.filter((g) => g.completed);
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
  const recentAttempts = useMemo(
    () => collectRecentAttempts(goals, RECENT_ATTEMPTS_INITIAL_COUNT),
    [goals],
  );

  function handleField(field: keyof typeof DEFAULT_FORM, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleCreate() {
    if (!form.quizId) return;
    const quiz = quizzes.find((q) => q.quiz.id === form.quizId);
    if (!quiz) return;
    setIsCreating(true);
    const created = await addGoal({
      quizId: form.quizId,
      quizTitle: quiz.quiz.title,
      ...detailsFormToGoalInput(form),
    });
    setIsCreating(false);
    if (!created) return;
    setForm(DEFAULT_FORM);
    setShowForm(false);
  }

  const accordionProps = {
    type: "single" as const,
    collapsible: true,
    value: accordionValue,
    onValueChange: (value: string) => setExpandedGoalId(value),
  };

  return (
    <PageShell>
      <div className="mb-8 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-950 xl:text-3xl">Goals</h1>
          <p className="mt-1 text-sm text-zinc-500 lg:text-base">
            Set quiz goals to track your progress and stay motivated.
          </p>
        </div>
        {!showForm &&
          (canAddGoal ? (
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
          ))}
      </div>

      {showForm && (
        <div className="mb-8 rounded-lg border border-zinc-200 bg-white p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-base font-semibold text-zinc-950">New goal</h2>
            <IconActionButton
              icon={X}
              label="Cancel"
              className="size-7 text-zinc-500"
              disabled={isCreating}
              onClick={() => {
                setShowForm(false);
                setForm(DEFAULT_FORM);
              }}
            />
          </div>

          <div className="space-y-3">
            <div>
              <Label htmlFor="new-goal-quiz">
                Quiz <span className="text-red-500">*</span>
              </Label>
              <Select
                value={form.quizId || undefined}
                onValueChange={(value) => handleField("quizId", value)}
                disabled={isCreating}
              >
                <SelectTrigger id="new-goal-quiz" className="mt-1.5 sm:max-w-xs">
                  <SelectValue placeholder="Select a quiz…" />
                </SelectTrigger>
                <SelectContent>
                  {availableQuizzes.map((q) => (
                    <SelectItem key={q.quiz.id} value={q.quiz.id}>
                      {q.quiz.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <GoalDetailsFields
              idPrefix="new-goal"
              values={form}
              onChange={handleField}
              disabled={isCreating}
            />
          </div>

          <div className="mt-5 flex gap-2">
            <Button
              onClick={() => void handleCreate()}
              disabled={!form.quizId || isCreating}
            >
              {isCreating ? "Creating..." : "Create goal"}
            </Button>
            <IconActionButton
              icon={X}
              label="Cancel"
              variant="outline"
              disabled={isCreating}
              onClick={() => {
                setShowForm(false);
                setForm(DEFAULT_FORM);
              }}
            />
          </div>
        </div>
      )}

      {goals.length === 0 ? (
        <EmptyState
          title="No goals yet"
          description="Set a goal for a quiz to track your progress and keep yourself accountable."
          actionLabel="New goal"
          onAction={() => setShowForm(true)}
        />
      ) : (
        <div className="space-y-8">
          {activeGoals.length > 0 && (
            <section>
              <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-zinc-500">
                Active · {activeGoals.length}
              </h2>
              <div className="overflow-hidden rounded-lg border border-zinc-200 bg-white">
                <Accordion {...accordionProps}>
                  {activeGoals.map((goal) => (
                    <GoalCard key={goal.id} goal={goal} />
                  ))}
                </Accordion>
              </div>
            </section>
          )}

          {completedGoals.length > 0 && (
            <section>
              <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-zinc-500">
                Complete · {completedGoals.length}
              </h2>
              <div className="overflow-hidden rounded-lg border border-zinc-200 bg-white">
                <Accordion {...accordionProps}>
                  {completedGoals.map((goal) => (
                    <GoalCard key={goal.id} goal={goal} />
                  ))}
                </Accordion>
              </div>
            </section>
          )}

          {recentAttempts.length > 0 && (
            <section>
              <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-zinc-500">
                Recent · {recentAttempts.length}
              </h2>
              <RecentAttemptsCard attempts={recentAttempts} />
            </section>
          )}
        </div>
      )}
    </PageShell>
  );
}
