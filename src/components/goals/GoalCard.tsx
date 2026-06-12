import { confirm } from "@tauri-apps/plugin-dialog";
import { ChevronDown, RotateCcw, Settings } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { useState, type MouseEvent } from "react";
import { GoalAttemptRow } from "@/components/goals/GoalAttemptRow";
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
  goalListTriggerClass,
  goalRowHoverActionClass,
} from "@/components/goals/goalListStyles";
import { IconActionButton } from "@/components/ui/icon-action-button";
import { cn } from "@/lib/utils";
import { useGoals } from "@/hooks/useGoals";
import type { Goal } from "@/types/goal";

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

export function GoalCard({ goal }: { goal: Goal }) {
  const { reopenGoal, deleteAttempt } = useGoals();
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

  async function handleDeleteAttempt(attemptId: string, event: MouseEvent) {
    event.preventDefault();
    event.stopPropagation();
    const ok = await confirm(
      "Delete this attempt? This cannot be undone.",
      { title: "Delete attempt?", kind: "warning" },
    );
    if (ok) await deleteAttempt(goal.id, attemptId);
  }

  return (
    <AccordionItem
      value={goal.id}
      className={cn(
        "border-b border-zinc-100 last:border-b-0",
        goal.completed && "opacity-60",
      )}
    >
      <div className={cn(goalListRowClass, "group")}>
        <AccordionTrigger className={cn(goalListTriggerClass, "col-start-1 row-start-1")}>
          <ChevronDown className="accordion-chevron size-3.5 shrink-0 text-zinc-400 transition-transform duration-200" />
          <div className="min-w-0 flex-1 text-left">
            <h3 className={goalListTitleClass}>{goal.quizTitle}</h3>
            {goal.description.trim() && (
              <p className={goalListSubtitleClass}>{goal.description.trim()}</p>
            )}
          </div>
          <span className="whitespace-nowrap text-xs text-zinc-400">
            {goal.attempts.length}×
          </span>
          <GoalCompactMeta goal={goal} />
        </AccordionTrigger>

        <div
          className="col-start-2 row-start-1 flex shrink-0 items-center gap-2 pr-3"
          onPointerDown={(event) => event.stopPropagation()}
          onClick={(event) => event.stopPropagation()}
        >
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
            onPointerDown={(event) => event.stopPropagation()}
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
            <ul className="-mx-3 mt-1.5 divide-y divide-zinc-100">
              {attempts.map((attempt) => (
                <li key={attempt.id}>
                  <GoalAttemptRow
                    goalId={goal.id}
                    targetScore={goal.targetScore}
                    attempt={attempt}
                    showQuizTitle={false}
                    onDelete={(event) => void handleDeleteAttempt(attempt.id, event)}
                  />
                </li>
              ))}
            </ul>
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
