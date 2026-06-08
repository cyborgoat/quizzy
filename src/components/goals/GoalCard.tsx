import { confirm } from "@tauri-apps/plugin-dialog";
import {
  CheckCircle2,
  ChevronDown,
  RotateCcw,
  Trash2,
} from "lucide-react";
import { Link } from "@tanstack/react-router";
import type { MouseEvent } from "react";
import {
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useGoals } from "@/hooks/useGoals";
import { anyAttemptMetTarget, type AttemptSummary, type Goal } from "@/types/goal";

function scoreBadgeClass(percentage: number, targetScore: number | undefined) {
  const base = "whitespace-nowrap";
  if (targetScore === undefined) return base;
  return percentage >= targetScore
    ? `${base} border-emerald-300 bg-emerald-50 text-emerald-700`
    : `${base} border-red-300 bg-red-50 text-red-600`;
}

function GoalMetaBadges({ goal }: { goal: Goal }) {
  const latestAttempt = goal.attempts.at(-1);
  const highestPercentage =
    goal.attempts.length > 0
      ? Math.max(...goal.attempts.map((attempt) => attempt.percentage))
      : undefined;

  return (
    <>
      {goal.targetScore !== undefined && (
        <Badge className="whitespace-nowrap">Target: {goal.targetScore}%</Badge>
      )}
      {latestAttempt && (
        <Badge className={scoreBadgeClass(latestAttempt.percentage, goal.targetScore)}>
          Latest: {latestAttempt.percentage}%
        </Badge>
      )}
      {highestPercentage !== undefined && (
        <Badge className={scoreBadgeClass(highestPercentage, goal.targetScore)}>
          Highest: {highestPercentage}%
        </Badge>
      )}
    </>
  );
}

function AttemptRow({
  attempt,
  goalId,
}: {
  attempt: AttemptSummary;
  goalId: string;
}) {
  const date = new Date(attempt.takenAt).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  return (
    <div className="flex items-center justify-between gap-2 rounded border border-zinc-100 bg-zinc-50 px-3 py-2">
      <div className="min-w-0">
        <p className="text-xs text-zinc-500">{date}</p>
        {attempt.incorrectCount > 0 && (
          <p className="text-xs text-red-600">{attempt.incorrectCount} incorrect</p>
        )}
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <span className="text-xs font-semibold text-zinc-900">
          {attempt.score}/{attempt.total} · {attempt.percentage}%
        </span>
        <Link
          to="/goals/$goalId/attempts/$attemptId"
          params={{ goalId, attemptId: attempt.id }}
          className="inline-flex h-7 shrink-0 items-center justify-center rounded-md border border-zinc-300 bg-white px-2.5 text-xs font-medium text-zinc-900 transition-colors hover:bg-zinc-100"
          onClick={(event) => event.stopPropagation()}
        >
          Review
        </Link>
      </div>
    </div>
  );
}

export function GoalCard({ goal }: { goal: Goal }) {
  const { completeGoal, reopenGoal, deleteGoal } = useGoals();

  const attempts = [...goal.attempts].reverse();

  async function handleComplete(event: MouseEvent) {
    event.stopPropagation();
    if (!anyAttemptMetTarget(goal)) {
      const ok = await confirm(
        `You haven't had any attempt that achieved the target score of ${goal.targetScore}%. Mark this goal as complete anyway?`,
        { title: "Target score not reached", kind: "warning" },
      );
      if (!ok) return;
    }
    await completeGoal(goal.id);
  }

  async function handleReopen(event: MouseEvent) {
    event.stopPropagation();
    await reopenGoal(goal.id);
  }

  async function handleDelete(event: MouseEvent) {
    event.stopPropagation();
    const ok = await confirm(
      `Delete the goal for "${goal.quizTitle}"? This cannot be undone.`,
      { title: "Delete goal?", kind: "warning" },
    );
    if (ok) await deleteGoal(goal.id);
  }

  return (
    <AccordionItem
      value={goal.id}
      className={`rounded-lg border border-zinc-200 bg-white ${goal.completed ? "opacity-60" : ""}`}
    >
      <div className="flex items-center gap-3 py-2.5 pl-4 pr-3">
        <AccordionTrigger className="min-w-0 flex-1 gap-2 px-0 py-0 hover:no-underline">
          <ChevronDown className="accordion-chevron size-4 shrink-0 text-zinc-500 transition-transform duration-200" />
          <h3 className="min-w-0 flex-1 truncate text-left text-sm font-semibold text-zinc-950">
            {goal.quizTitle}
          </h3>
        </AccordionTrigger>

        <div className="flex shrink-0 items-center gap-2">
          <GoalMetaBadges goal={goal} />
          <span className="whitespace-nowrap text-xs text-zinc-400">
            {goal.attempts.length} attempt{goal.attempts.length !== 1 ? "s" : ""}
          </span>
          <Link
            className="inline-flex h-7 shrink-0 items-center whitespace-nowrap rounded-md bg-zinc-900 px-2.5 text-xs font-medium text-white transition-colors hover:bg-zinc-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500 focus-visible:ring-offset-2"
            to="/quiz/$quizId"
            params={{ quizId: goal.quizId }}
            onClick={(event) => event.stopPropagation()}
          >
            Start
          </Link>
        </div>
      </div>

      <AccordionContent className="border-t border-zinc-100 pt-3">
        <p className="text-xs leading-5 text-zinc-600">{goal.description}</p>

        {goal.completed && goal.completedAt && (
          <p className="mt-2 text-xs text-zinc-400">
            Completed {new Date(goal.completedAt).toLocaleDateString()}
          </p>
        )}

        <div className="mt-4">
          <p className="text-xs font-medium text-zinc-500">Attempts</p>
          {goal.attempts.length === 0 ? (
            <p className="mt-2 rounded-md border border-dashed border-zinc-200 bg-zinc-50 px-3 py-4 text-center text-xs leading-5 text-zinc-500">
              No attempts yet. Start the quiz to track your progress toward this goal.
            </p>
          ) : (
            <div className="mt-2 space-y-1.5">
              {attempts.map((attempt) => (
                <AttemptRow key={attempt.id} attempt={attempt} goalId={goal.id} />
              ))}
            </div>
          )}
        </div>

        <div className="mt-4 flex items-center justify-between border-t border-zinc-100 pt-3">
          <Button
            type="button"
            size="sm"
            variant="ghost"
            className="gap-1.5 text-zinc-500 hover:text-red-700"
            onClick={(event) => void handleDelete(event)}
          >
            <Trash2 className="size-3.5" />
            Delete
          </Button>
          {goal.completed ? (
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={(event) => void handleReopen(event)}
              className="gap-1.5 text-zinc-500"
            >
              <RotateCcw className="size-3.5" />
              Reopen
            </Button>
          ) : (
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={(event) => void handleComplete(event)}
              className="gap-1.5"
            >
              <CheckCircle2 className="size-3.5" />
              Complete
            </Button>
          )}
        </div>
      </AccordionContent>
    </AccordionItem>
  );
}
