import { confirm } from "@tauri-apps/plugin-dialog";
import { ArrowRight, CheckCircle2, Trash2 } from "lucide-react";
import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useGoals } from "@/hooks/useGoals";
import type { Goal } from "@/types/goal";

function isPastDeadline(deadline: string) {
  return new Date(deadline) < new Date();
}

export function GoalCard({ goal }: { goal: Goal }) {
  const { finishGoal, deleteGoal } = useGoals();

  async function handleFinish() {
    const ok = await confirm("Mark this goal as finished?", {
      title: "Finish goal",
      kind: "info",
    });
    if (ok) await finishGoal(goal.id);
  }

  async function handleDelete() {
    const ok = await confirm(
      `Delete the goal for "${goal.quizTitle}"? This cannot be undone.`,
      { title: "Delete goal?", kind: "warning" },
    );
    if (ok) await deleteGoal(goal.id);
  }

  return (
    <article className="flex flex-col rounded-lg border border-zinc-200 bg-white p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="truncate text-sm font-semibold text-zinc-950">{goal.quizTitle}</h3>
          {goal.completed && goal.completedAt && (
            <p className="mt-0.5 text-xs text-zinc-400">
              Finished {new Date(goal.completedAt).toLocaleDateString()}
            </p>
          )}
        </div>
        <Button
          size="icon"
          variant="ghost"
          className="size-7 shrink-0 text-zinc-500 hover:text-red-700"
          onClick={() => void handleDelete()}
          aria-label="Delete goal"
        >
          <Trash2 className="size-4" />
        </Button>
      </div>

      <p className="mt-2 flex-1 text-xs leading-5 text-zinc-600">{goal.description}</p>

      <div className="mt-3 flex flex-wrap gap-1.5">
        {goal.targetScore !== undefined && (
          <Badge>Target: {goal.targetScore}%</Badge>
        )}
        {goal.deadline && (
          <Badge
            className={isPastDeadline(goal.deadline) && !goal.completed ? "border-red-300 bg-red-50 text-red-600" : ""}
          >
            Due {new Date(goal.deadline).toLocaleDateString()}
          </Badge>
        )}
      </div>

      <div className="mt-4 flex items-center justify-between border-t border-zinc-100 pt-3">
        <Link
          className="inline-flex h-7 items-center gap-1.5 rounded-md px-2.5 text-xs font-medium text-zinc-700 hover:bg-zinc-100 hover:text-zinc-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500"
          to={`/quiz/${goal.quizId}`}
        >
          Start quiz <ArrowRight className="size-3.5" />
        </Link>
        {!goal.completed && (
          <Button
            size="sm"
            variant="outline"
            onClick={() => void handleFinish()}
            className="gap-1.5"
          >
            <CheckCircle2 className="size-3.5" />
            Finish
          </Button>
        )}
      </div>
    </article>
  );
}
