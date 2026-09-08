import { confirm } from "@tauri-apps/plugin-dialog";
import { ClipboardList, Pencil, Play, RotateCcw, Target } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { useState, type MouseEvent } from "react";
import { CreateGoalDialog } from "@/components/goals/CreateGoalDialog";
import { GoalAttemptRow } from "@/components/goals/GoalAttemptRow";
import { GoalSettingsDialog } from "@/components/goals/GoalSettingsDialog";
import { QuizStatusBadge } from "@/components/quiz/QuizStatusBadge";
import { Button } from "@/components/ui/button";
import { buttonClassName } from "@/components/ui/button-styles";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useQuizStartDialog } from "@/hooks/useQuizStartDialog";
import { useGoals } from "@/hooks/useGoals";
import { quizProgressMetrics, quizProgressStatus } from "@/lib/quizProgress";
import type { Goal } from "@/types/goal";
import type { QuizSource } from "@/types/quiz";

export function QuizDetailsDialog({
  source,
  goal,
  onOpenChange,
}: {
  source: QuizSource | null;
  goal: Goal | undefined;
  onOpenChange: (open: boolean) => void;
}) {
  const { deleteAttempt, reopenGoal } = useGoals();
  const { openQuizStart } = useQuizStartDialog();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [isReopening, setIsReopening] = useState(false);

  if (!source) return null;

  const quiz = source.quiz;
  const status = quizProgressStatus(goal);
  const { attemptCount, highestScore } = quizProgressMetrics(goal);
  const attempts = goal ? [...goal.attempts].reverse() : [];

  async function handleDeleteAttempt(attemptId: string, event: MouseEvent) {
    event.preventDefault();
    event.stopPropagation();
    if (!goal) return;
    const approved = await confirm("Delete this attempt? This cannot be undone.", {
      title: "Delete attempt?",
      kind: "warning",
    });
    if (approved) await deleteAttempt(goal.id, attemptId);
  }

  function handleStart() {
    openQuizStart({ quizId: quiz.id });
    onOpenChange(false);
  }

  async function handleReopen() {
    if (!goal) return;
    setIsReopening(true);
    await reopenGoal(goal.id);
    setIsReopening(false);
  }

  return (
    <>
      <Dialog open onOpenChange={onOpenChange}>
        <DialogContent className="max-h-[calc(100vh-2rem)] max-w-2xl overflow-y-auto">
          <DialogHeader>
            <div className="mb-3">
              <QuizStatusBadge status={status} />
            </div>
            <DialogTitle>{quiz.title}</DialogTitle>
            <DialogDescription>
              {goal?.description.trim() || quiz.description || "No description provided."}
            </DialogDescription>
          </DialogHeader>

          <dl className="mt-5 grid grid-cols-2 gap-px overflow-hidden rounded-lg border border-zinc-200 bg-zinc-200 text-sm sm:grid-cols-4">
            {[
              ["Questions", quiz.questions.length],
              ["Attempts", attemptCount],
              ["Highest score", highestScore === undefined ? "—" : `${highestScore}%`],
              ["Target", goal?.targetScore === undefined ? "—" : `${goal.targetScore}%`],
            ].map(([label, value]) => (
              <div key={label} className="bg-white px-3 py-3">
                <dt className="text-xs text-zinc-500">{label}</dt>
                <dd className="mt-0.5 font-semibold tabular-nums text-zinc-950">{value}</dd>
              </div>
            ))}
          </dl>

          <div className="mt-4 flex flex-wrap items-center gap-2">
            <Button
              className="bg-zinc-900 hover:bg-zinc-800"
              onClick={handleStart}
            >
              <Play className="size-4 fill-current" />
              {attemptCount > 0 ? "Retake quiz" : "Start quiz"}
            </Button>
            {goal ? (
              <>
                <Button variant="outline" onClick={() => setSettingsOpen(true)}>
                  <Pencil className="size-4" />
                  Goal settings
                </Button>
                {goal.completed && (
                  <Button
                    variant="outline"
                    disabled={isReopening}
                    onClick={() => void handleReopen()}
                  >
                    <RotateCcw className="size-4" />
                    {isReopening ? "Reopening…" : "Reopen goal"}
                  </Button>
                )}
                <Link
                  to="/mistakes"
                  search={{ quizId: quiz.id }}
                  className={buttonClassName({ variant: "ghost" })}
                >
                  <ClipboardList className="size-4" />
                  Mistakes
                </Link>
              </>
            ) : (
              <CreateGoalDialog
                quiz={quiz}
                trigger={
                  <Button variant="outline">
                    <Target className="size-4" />
                    Add goal
                  </Button>
                }
              />
            )}
          </div>

          <section className="mt-6 border-t border-zinc-200 pt-4">
            <div className="flex items-center justify-between gap-3">
              <h3 className="text-sm font-semibold text-zinc-950">Attempt history</h3>
              <span className="text-xs tabular-nums text-zinc-500">{attemptCount}</span>
            </div>
            {attempts.length === 0 ? (
              <p className="mt-3 rounded-lg border border-dashed border-zinc-200 px-4 py-6 text-center text-sm text-zinc-500">
                No saved attempts yet. Add a goal before starting if you want results to be recorded.
              </p>
            ) : (
              <ul className="-mx-3 mt-2 divide-y divide-zinc-100">
                {attempts.map((attempt) => (
                  <li key={attempt.id}>
                    <GoalAttemptRow
                      quizId={quiz.id}
                      targetScore={goal?.targetScore}
                      attempt={attempt}
                      showQuizTitle={false}
                      onDelete={(event) => void handleDeleteAttempt(attempt.id, event)}
                    />
                  </li>
                ))}
              </ul>
            )}
          </section>
        </DialogContent>
      </Dialog>

      {goal && (
        <GoalSettingsDialog
          goal={goal}
          open={settingsOpen}
          onOpenChange={setSettingsOpen}
        />
      )}
    </>
  );
}
