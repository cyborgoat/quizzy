import { confirm } from "@tauri-apps/plugin-dialog";
import { ArrowRight, ChevronDown, RotateCcw, Settings, Trash2 } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { useState, type MouseEvent } from "react";
import { GoalSettingsDialog } from "@/components/goals/GoalSettingsDialog";
import {
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  goalActionLinkPrimaryClass,
  goalListRowClass,
  goalListRowMetaClass,
  goalListSubtitleClass,
  goalListTitleClass,
  goalRowHoverActionClass,
} from "@/components/goals/goalListStyles";
import { IconActionButton } from "@/components/ui/icon-action-button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { useGoals } from "@/hooks/useGoals";
import type { AttemptSummary, Goal } from "@/types/goal";

function scoreTextClass(percentage: number, targetScore: number | undefined) {
  if (targetScore === undefined) return "text-zinc-600";
  return percentage >= targetScore ? "text-emerald-700" : "text-red-600";
}

function GoalCompactMeta({ goal }: { goal: Goal }) {
  const latestAttempt = goal.attempts.at(-1);
  const highestPercentage =
    goal.attempts.length > 0
      ? Math.max(...goal.attempts.map((attempt) => attempt.percentage))
      : undefined;

  if (
    goal.targetScore === undefined &&
    latestAttempt === undefined &&
    highestPercentage === undefined
  ) {
    return null;
  }

  return (
    <span className={goalListRowMetaClass}>
      {goal.targetScore !== undefined && `Target ${goal.targetScore}%`}
      {latestAttempt && (
        <>
          {goal.targetScore !== undefined && " · "}
          <span className={scoreTextClass(latestAttempt.percentage, goal.targetScore)}>
            Latest {latestAttempt.percentage}%
          </span>
        </>
      )}
      {highestPercentage !== undefined &&
        highestPercentage !== latestAttempt?.percentage && (
          <>
            {" · "}
            <span className={scoreTextClass(highestPercentage, goal.targetScore)}>
              High {highestPercentage}%
            </span>
          </>
        )}
    </span>
  );
}

const goalAttemptReviewClass =
  "inline-flex size-7 shrink-0 items-center justify-center rounded-md text-zinc-600 transition-colors hover:bg-zinc-100/60 hover:text-zinc-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 focus-visible:ring-offset-2";

function attemptPassed(
  attempt: AttemptSummary,
  targetScore: number | undefined,
) {
  if (targetScore !== undefined) return attempt.percentage >= targetScore;
  return attempt.incorrectCount === 0;
}

function AttemptResultBadge({
  passed,
}: {
  passed: boolean;
}) {
  return (
    <span
      className={cn(
        "rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide",
        passed ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-600",
      )}
    >
      {passed ? "Pass" : "Fail"}
    </span>
  );
}

function AttemptRow({
  attempt,
  goalId,
  targetScore,
}: {
  attempt: AttemptSummary;
  goalId: string;
  targetScore?: number;
}) {
  const { deleteAttempt } = useGoals();
  const date = new Date(attempt.takenAt).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  async function handleDelete(event: MouseEvent) {
    event.stopPropagation();
    const ok = await confirm(
      "Delete this attempt? This cannot be undone.",
      { title: "Delete attempt?", kind: "warning" },
    );
    if (ok) await deleteAttempt(goalId, attempt.id);
  }

  const passed = attemptPassed(attempt, targetScore);

  return (
    <div className="group flex items-center gap-2 rounded-md px-2 py-1.5 transition-colors hover:bg-zinc-50">
      <div className="flex min-w-0 flex-1 items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2">
          <p className="text-xs text-zinc-600">{date}</p>
          <AttemptResultBadge passed={passed} />
          <IconActionButton
            icon={Trash2}
            label={`Delete attempt from ${date}`}
            className="size-7 shrink-0 pointer-events-none text-zinc-500 opacity-0 transition-opacity hover:text-red-700 group-hover:pointer-events-auto group-hover:opacity-100 focus-visible:pointer-events-auto focus-visible:opacity-100"
            onClick={(event) => void handleDelete(event)}
          />
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <div className="flex items-center gap-2 text-xs text-zinc-500">
            <span>
              <span className="font-medium tabular-nums text-zinc-900">
                {attempt.percentage}%
              </span>{" "}
              correct
            </span>
            <span>
              <span className="font-medium tabular-nums text-zinc-900">
                {attempt.incorrectCount}
              </span>{" "}
              incorrect
            </span>
            <span>
              <span className="font-medium tabular-nums text-zinc-900">
                {attempt.total}
              </span>{" "}
              questions
            </span>
          </div>
          <Tooltip>
            <TooltipTrigger asChild>
              <Link
                to="/goals/$goalId/attempts/$attemptId"
                params={{ goalId, attemptId: attempt.id }}
                className={goalAttemptReviewClass}
                aria-label={`Review attempt from ${date}`}
                onClick={(event) => event.stopPropagation()}
              >
                <ArrowRight className="size-3.5" aria-hidden="true" />
              </Link>
            </TooltipTrigger>
            <TooltipContent side="left">Review attempt</TooltipContent>
          </Tooltip>
        </div>
      </div>
    </div>
  );
}

export function GoalCard({ goal }: { goal: Goal }) {
  const { reopenGoal } = useGoals();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const attempts = [...goal.attempts].reverse();

  function openSettings(event: MouseEvent) {
    event.stopPropagation();
    setSettingsOpen(true);
  }

  async function handleReopen(event: MouseEvent) {
    event.stopPropagation();
    await reopenGoal(goal.id);
  }

  return (
    <AccordionItem
      value={goal.id}
      className={cn(
        "border-b border-zinc-100 last:border-b-0",
        goal.completed && "opacity-60",
      )}
    >
      <div className={goalListRowClass}>
        <AccordionTrigger className="min-w-0 flex-1 gap-1.5 px-0 py-0 hover:no-underline">
          <ChevronDown className="accordion-chevron size-3.5 shrink-0 text-zinc-400 transition-transform duration-200" />
          <div className="min-w-0 flex-1 text-left">
            <h3 className={goalListTitleClass}>{goal.quizTitle}</h3>
            {goal.description.trim() && (
              <p className={goalListSubtitleClass}>{goal.description.trim()}</p>
            )}
          </div>
        </AccordionTrigger>

        <div className="flex shrink-0 items-center gap-2">
          <span className="whitespace-nowrap text-xs text-zinc-400">
            {goal.attempts.length}×
          </span>
          <GoalCompactMeta goal={goal} />
          <IconActionButton
            icon={Settings}
            label="Settings"
            variant="ghost"
            className={goalRowHoverActionClass}
            onClick={openSettings}
          >
            <Settings className="size-3.5" aria-hidden="true" />
          </IconActionButton>
          <Link
            className={goalActionLinkPrimaryClass}
            to="/quiz/$quizId"
            params={{ quizId: goal.quizId }}
            search={{ from: "goals" }}
            onClick={(event) => event.stopPropagation()}
          >
            Start
          </Link>
          {goal.completed && (
            <IconActionButton
              icon={RotateCcw}
              label="Reopen"
              variant="ghost"
              className="size-7 text-zinc-500"
              onClick={(event) => void handleReopen(event)}
            >
              <RotateCcw className="size-3.5" aria-hidden="true" />
            </IconActionButton>
          )}
        </div>
      </div>

      <AccordionContent className="border-t border-zinc-100 px-3 pb-3 pt-2">
        {goal.completed && goal.completedAt && (
          <p className="text-xs text-zinc-400">
            Completed {new Date(goal.completedAt).toLocaleDateString()}
          </p>
        )}

        <div className={goal.completed && goal.completedAt ? "mt-2" : undefined}>
          <p className="text-xs font-medium text-zinc-500">Attempts</p>
          {goal.attempts.length === 0 ? (
            <p className="mt-1.5 rounded border border-dashed border-zinc-200 px-2.5 py-3 text-center text-xs text-zinc-500">
              No attempts yet. Take the quiz to track progress.
            </p>
          ) : (
            <div className="mt-1.5 divide-y divide-zinc-100 rounded border border-zinc-100">
              {attempts.map((attempt) => (
                <AttemptRow
                  key={attempt.id}
                  attempt={attempt}
                  goalId={goal.id}
                  targetScore={goal.targetScore}
                />
              ))}
            </div>
          )}
        </div>
      </AccordionContent>

      <GoalSettingsDialog
        goal={goal}
        open={settingsOpen}
        onOpenChange={setSettingsOpen}
      />
    </AccordionItem>
  );
}
